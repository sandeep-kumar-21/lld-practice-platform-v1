import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller.js';
import { ProblemsService } from './problems.service.js';
import { PrismaProblemRepository } from '../../infrastructure/persistence/prisma-problem.repository.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

@Module({
  controllers: [ProblemsController],
  providers: [PrismaService, PrismaProblemRepository, ProblemsService],
  exports: [ProblemsService, PrismaProblemRepository],
})
export class ProblemsModule {}

