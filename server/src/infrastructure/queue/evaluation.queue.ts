import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export interface EvaluationJobPayload {
  submissionId: string;
  attemptId: string;
  format: string;
}

@Injectable()
export class EvaluationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(EvaluationQueueService.name);
  private readonly queue: Queue<EvaluationJobPayload>;
  private readonly connection: Redis;

  constructor() {
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

    const queueName = process.env.EVALUATION_QUEUE_NAME || 'evaluation';

    this.queue = new Queue<EvaluationJobPayload>(queueName, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: Number(process.env.EVALUATION_MAX_RETRIES) || 3,
        backoff: {
          type: 'exponential',
          delay: Number(process.env.EVALUATION_BACKOFF_DELAY_MS) || 15000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });

    this.logger.log(`Initialized BullMQ queue "${queueName}" on Redis ${host}:${port}`);
  }

  /**
   * Enqueues an evaluation job using the submission.id as the BullMQ jobId.
   * This guarantees natural idempotency against accidental duplicate requests.
   */
  public async enqueueEvaluation(
    submissionId: string,
    attemptId: string,
    format: string,
  ): Promise<void> {
    try {
      await this.queue.add(
        'evaluate-submission',
        { submissionId, attemptId, format },
        {
          jobId: submissionId, // Idempotent key
        },
      );
      this.logger.log(
        `Enqueued evaluation job for submission ${submissionId} (jobId: ${submissionId})`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to enqueue evaluation job for submission ${submissionId}: ${err.message}`,
      );
      throw err;
    }
  }

  public async getQueueStatus() {
    return {
      waiting: await this.queue.getWaitingCount(),
      active: await this.queue.getActiveCount(),
      completed: await this.queue.getCompletedCount(),
      failed: await this.queue.getFailedCount(),
    };
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}

