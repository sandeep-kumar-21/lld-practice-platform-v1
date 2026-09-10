import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller.js';
import { SubmissionsService } from './submissions.service.js';
import { PrismaSubmissionRepository } from '../../infrastructure/persistence/prisma-submission.repository.js';
import { PrismaAttemptRepository } from '../../infrastructure/persistence/prisma-attempt.repository.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { QueueModule } from '../../infrastructure/queue/queue.module.js';

@Module({
  imports: [QueueModule],
  controllers: [SubmissionsController],
  providers: [
    PrismaService,
    PrismaSubmissionRepository,
    PrismaAttemptRepository,
    SubmissionsService,
  ],
  exports: [SubmissionsService, PrismaSubmissionRepository],
})
export class SubmissionsModule {}

