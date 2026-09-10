import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaSubmissionRepository } from '../../infrastructure/persistence/prisma-submission.repository.js';
import { PrismaAttemptRepository } from '../../infrastructure/persistence/prisma-attempt.repository.js';
import { EvaluationQueueService } from '../../infrastructure/queue/evaluation.queue.js';
import {
  Submission,
  SubmissionFormat,
} from '../../domain/entities/submission.entity.js';
import { SubmissionCreatedEvent } from '../../domain/events/submission.events.js';
import { WeightedScoreCalculator } from '../../domain/scoring/weighted-score-calculator.js';
import { SubmissionStateMachine } from '../../domain/state-machine/submission-state-machine.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly submissionRepo: PrismaSubmissionRepository,
    private readonly attemptRepo: PrismaAttemptRepository,
    private readonly queueService: EvaluationQueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async createSubmission(
    attemptId: string,
    dto: CreateSubmissionDto,
  ): Promise<{ submissionId: string; status: string; version: number }> {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID "${attemptId}" not found.`);
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Cannot submit to an attempt that is "${attempt.status}". Only IN_PROGRESS attempts accept submissions.`,
      );
    }

    const version = attempt.nextVersion;
    const submissionId = randomUUID();

    const submission = new Submission(
      submissionId,
      attemptId,
      dto.format as SubmissionFormat,
      dto.content as any,
      version,
      'PENDING',
      dto.designRationale,
      new Date(),
    );

    // Idempotency & Duplicate Submission Guard:
    // If learner submits identical content while previous is PENDING/EVALUATING or within rapid 10s window, deduplicate.
    if (attempt.latestSubmission) {
      const candidateSig = submission.computeContentSignature();
      const latestSig = attempt.latestSubmission.computeContentSignature();
      const timeDiffMs =
        Date.now() - new Date(attempt.latestSubmission.createdAt).getTime();

      if (candidateSig === latestSig) {
        if (
          attempt.latestSubmission.status === 'PENDING' ||
          attempt.latestSubmission.status === 'EVALUATING' ||
          timeDiffMs < 10000
        ) {
          return {
            submissionId: attempt.latestSubmission.id,
            status: attempt.latestSubmission.status,
            version: attempt.latestSubmission.version,
          };
        }
      }
    }

    // 1. Persist immediately with status PENDING
    const saved = await this.submissionRepo.create(submission);

    // 2. Enqueue async evaluation job (Idempotent jobId = saved.id)
    await this.queueService.enqueueEvaluation(saved.id, attemptId, saved.format);

    // 3. Emit decoupled domain event
    this.eventEmitter.emit(
      SubmissionCreatedEvent.EVENT_NAME,
      new SubmissionCreatedEvent(saved, attemptId, attempt.problemId),
    );

    return {
      submissionId: saved.id,
      status: saved.status,
      version: saved.version,
    };
  }

  public async getSubmissionById(id: string) {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) {
      throw new NotFoundException(`Submission with ID "${id}" not found.`);
    }

    const raw = submission as any;
    const evaluation = raw.evaluation;

    let versionComparison = null;
    if (evaluation && evaluation.status !== 'PENDING') {
      // Find previous evaluated version on this attempt
      const previous = await this.submissionRepo.findPreviousSubmission(
        submission.attemptId,
        submission.version,
      );

      const prevRaw = previous as any;
      if (prevRaw && prevRaw.evaluation) {
        versionComparison = WeightedScoreCalculator.compareVersions(
          evaluation.criterionResults,
          evaluation.overallScore,
          prevRaw.evaluation.criterionResults,
          prevRaw.evaluation.overallScore,
        );
      }
    }

    return {
      id: submission.id,
      attemptId: submission.attemptId,
      format: submission.format,
      content: submission.content,
      version: submission.version,
      status: submission.status,
      designRationale: submission.designRationale,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      evaluation,
      versionComparison,
    };
  }

  public async retryEvaluation(id: string): Promise<{ message: string; submissionId: string }> {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) {
      throw new NotFoundException(`Submission with ID "${id}" not found.`);
    }

    if (submission.status === 'COMPLETED') {
      throw new BadRequestException(
        'Evaluation is already successfully completed. To evaluate new changes, submit a new revision.',
      );
    }

    // Guard transition: FAILED or COMPLETED_PARTIAL -> EVALUATING
    SubmissionStateMachine.assertCanTransition(submission.status, 'EVALUATING');

    // Re-enqueue job
    await this.queueService.enqueueEvaluation(
      submission.id,
      submission.attemptId,
      submission.format,
    );

    return {
      message: 'Evaluation job re-enqueued successfully.',
      submissionId: submission.id,
    };
  }
}

