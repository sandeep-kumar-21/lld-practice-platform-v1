import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller.js';
import { AttemptsService } from './attempts.service.js';
import { PrismaAttemptRepository } from '../../infrastructure/persistence/prisma-attempt.repository.js';
import { PrismaProblemRepository } from '../../infrastructure/persistence/prisma-problem.repository.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

@Module({
  controllers: [AttemptsController],
  providers: [
    PrismaService,
    PrismaAttemptRepository,
    PrismaProblemRepository,
    AttemptsService,
  ],
  exports: [AttemptsService, PrismaAttemptRepository],
})
export class AttemptsModule {}

