import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaSubmissionRepository } from '../persistence/prisma-submission.repository.js';
import { PrismaEvaluationRepository } from '../persistence/prisma-evaluation.repository.js';
import { PrismaRubricRepository } from '../persistence/prisma-rubric.repository.js';
import { EvaluationPipeline } from '../../domain/evaluators/evaluation-pipeline.js';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import { EvaluationJobPayload } from './evaluation.queue.js';
import {
  EvaluationCompletedEvent,
  EvaluationFailedEvent,
  EvaluationStartedEvent,
} from '../../domain/events/submission.events.js';
import { SubmissionStateMachine } from '../../domain/state-machine/submission-state-machine.js';

@Injectable()
export class EvaluationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvaluationProcessor.name);
  private worker!: Worker<EvaluationJobPayload>;
  private readonly connection: Redis;
  private readonly pipeline: EvaluationPipeline;

  constructor(
    private readonly submissionRepo: PrismaSubmissionRepository,
    private readonly evaluationRepo: PrismaEvaluationRepository,
    private readonly rubricRepo: PrismaRubricRepository,
    private readonly eventEmitter: EventEmitter2,
    @Optional() pipeline?: EvaluationPipeline,
  ) {
    this.pipeline = pipeline || new EvaluationPipeline();

    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    this.connection = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  onModuleInit() {
    const queueName = process.env.EVALUATION_QUEUE_NAME || 'evaluation';

    this.worker = new Worker<EvaluationJobPayload>(
      queueName,
      async (job: Job<EvaluationJobPayload>) => {
        return this.processJob(job);
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );

    this.worker.on('failed', async (job, err) => {
      if (!job) return;
      this.logger.error(
        `Job ${job.id} failed attempt ${job.attemptsMade}/${job.opts.attempts}: ${err.message}`,
      );

      // Check if retries are completely exhausted
      const maxAttempts = job.opts.attempts || 3;
      if (job.attemptsMade >= maxAttempts) {
        this.logger.warn(
          `Job ${job.id} exhausted all ${maxAttempts} retries. Initiating Graceful Degradation to COMPLETED_PARTIAL.`,
        );
        await this.handleGracefulDegradation(job.data, err.message);
      }
    });

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully.`);
    });

    this.logger.log(`EvaluationProcessor worker started for queue "${queueName}"`);
  }

  public async processJob(job: Job<EvaluationJobPayload>): Promise<void> {
    const { submissionId, attemptId } = job.data;
    this.logger.log(`Processing evaluation for submission: ${submissionId}`);

    const submission = await this.submissionRepo.findById(submissionId);
    if (!submission) {
      throw new Error(`Submission with id ${submissionId} not found.`);
    }

    // 1. Guarded state transition: PENDING or FAILED -> EVALUATING
    SubmissionStateMachine.assertCanTransition(submission.status, 'EVALUATING');
    await this.submissionRepo.updateStatus(submissionId, 'EVALUATING');
    this.eventEmitter.emit(
      EvaluationStartedEvent.EVENT_NAME,
      new EvaluationStartedEvent(submissionId, attemptId),
    );

    const rubric = await this.rubricRepo.getDefaultRubric();

    // 2. Execute Evaluation Pipeline (Deterministic pre-flight + AI Judgment)
    let finalEvaluationResult;
    try {
      finalEvaluationResult = await this.pipeline.execute(submission, rubric, {
        enableFallbackOnFailure: false, // Let error propagate to trigger BullMQ backoff retry
      });
    } catch (pipelineError: any) {
      this.logger.warn(
        `Evaluation pipeline error for submission ${submissionId}: ${pipelineError.message}`,
      );
      throw pipelineError; // Triggers BullMQ retry
    }

    // 3. Persist completed Evaluation
    const evaluation = new Evaluation(
      `eval-${submissionId}`,
      submissionId,
      finalEvaluationResult.evaluatorType,
      'COMPLETED',
      finalEvaluationResult.overallScore,
      finalEvaluationResult.overallSummary,
      finalEvaluationResult.criterionResults,
    );
    evaluation.completedAt = new Date();

    const existingEval = await this.evaluationRepo.findBySubmissionId(submissionId);
    if (existingEval) {
      await this.evaluationRepo.update(evaluation);
    } else {
      await this.evaluationRepo.create(evaluation);
    }

    // 4. Update submission status to COMPLETED
    SubmissionStateMachine.assertCanTransition('EVALUATING', 'COMPLETED');
    await this.submissionRepo.updateStatus(submissionId, 'COMPLETED');

    this.eventEmitter.emit(
      EvaluationCompletedEvent.EVENT_NAME,
      new EvaluationCompletedEvent(submissionId, evaluation, attemptId),
    );

    this.logger.log(
      `Successfully completed evaluation for submission ${submissionId}. Score: ${evaluation.overallScore}/5`,
    );
  }

  /**
   * Graceful Degradation:
   * When retries are exhausted, produce a partial evaluation using deterministic checks
   * rather than returning a dead-end FAILED state to the learner.
   */
  public async handleGracefulDegradation(
    payload: EvaluationJobPayload,
    errorMessage: string,
  ): Promise<void> {
    const { submissionId } = payload;
    try {
      const submission = await this.submissionRepo.findById(submissionId);
      if (!submission) return;

      const rubric = await this.rubricRepo.getDefaultRubric();
      const detResult = await this.pipeline.getDeterministicEvaluator().evaluate(
        submission,
        rubric,
      );

      const partialEval = new Evaluation(
        `eval-${submissionId}`,
        submissionId,
        'DETERMINISTIC_ONLY',
        'COMPLETED_PARTIAL',
        detResult.overallScore,
        `AI Evaluation temporarily unavailable after retries (${errorMessage}). Showing deterministic rule-based checks. You may retry AI evaluation.`,
        detResult.criterionResults,
        errorMessage,
      );
      partialEval.completedAt = new Date();

      const existing = await this.evaluationRepo.findBySubmissionId(submissionId);
      if (existing) {
        await this.evaluationRepo.update(partialEval);
      } else {
        await this.evaluationRepo.create(partialEval);
      }

      await this.submissionRepo.updateStatus(submissionId, 'COMPLETED_PARTIAL');

      this.eventEmitter.emit(
        EvaluationFailedEvent.EVENT_NAME,
        new EvaluationFailedEvent(submissionId, errorMessage, false),
      );

      this.logger.warn(
        `Handled graceful degradation for submission ${submissionId} -> COMPLETED_PARTIAL`,
      );
    } catch (e: any) {
      this.logger.error(
        `Error during graceful degradation handling: ${e.message}`,
      );
      await this.submissionRepo.updateStatus(submissionId, 'FAILED');
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    await this.connection.quit();
  }
}
