import { Module } from '@nestjs/common';
import { EvaluationQueueService } from './evaluation.queue.js';
import { EvaluationProcessor } from './evaluation.processor.js';
import { PrismaSubmissionRepository } from '../persistence/prisma-submission.repository.js';
import { PrismaEvaluationRepository } from '../persistence/prisma-evaluation.repository.js';
import { PrismaRubricRepository } from '../persistence/prisma-rubric.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  providers: [
    PrismaService,
    PrismaSubmissionRepository,
    PrismaEvaluationRepository,
    PrismaRubricRepository,
    EvaluationQueueService,
    EvaluationProcessor,
  ],
  exports: [EvaluationQueueService],
})
export class QueueModule {}

