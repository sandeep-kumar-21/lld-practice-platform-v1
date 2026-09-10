import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaAttemptRepository } from '../../infrastructure/persistence/prisma-attempt.repository.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

@Module({
  controllers: [UsersController],
  providers: [PrismaService, PrismaAttemptRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}

