import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaAttemptRepository } from '../../infrastructure/persistence/prisma-attempt.repository.js';
import { PrismaProblemRepository } from '../../infrastructure/persistence/prisma-problem.repository.js';
import { Attempt } from '../../domain/entities/attempt.entity.js';
import { CreateAttemptDto } from './dto/create-attempt.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly attemptRepo: PrismaAttemptRepository,
    private readonly problemRepo: PrismaProblemRepository,
  ) {}

  public async startAttempt(dto: CreateAttemptDto): Promise<Attempt> {
    const userId = dto.userId || 'learner-demo';

    // 1. Verify problem exists
    const problem = await this.problemRepo.findById(dto.problemId);
    if (!problem) {
      throw new NotFoundException(
        `Problem with ID "${dto.problemId}" does not exist.`,
      );
    }

    // 2. Guard against duplicate IN_PROGRESS attempts
    const existingActive = await this.attemptRepo.findActiveAttempt(
      userId,
      dto.problemId,
    );
    if (existingActive) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `An active attempt is already in progress for problem "${problem.title}".`,
        existingAttemptId: existingActive.id,
      });
    }

    // 3. Create fresh attempt
    const newAttempt = new Attempt(
      randomUUID(),
      dto.problemId,
      userId,
      'IN_PROGRESS',
      new Date(),
    );

    return this.attemptRepo.create(newAttempt);
  }

  public async getAttemptById(id: string): Promise<Attempt> {
    const attempt = await this.attemptRepo.findById(id);
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID "${id}" not found.`);
    }
    return attempt;
  }
}

