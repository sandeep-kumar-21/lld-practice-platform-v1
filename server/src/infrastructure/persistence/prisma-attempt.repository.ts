import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Attempt,
  AttemptStatus,
} from '../../domain/entities/attempt.entity.js';
import {
  Submission,
  SubmissionFormat,
  SubmissionStatus,
} from '../../domain/entities/submission.entity.js';
import { IAttemptRepository } from '../../domain/repositories/attempt.repository.interface.js';

@Injectable()
export class PrismaAttemptRepository implements IAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async create(attempt: Attempt): Promise<Attempt> {
    const created = await this.prisma.attempt.create({
      data: {
        id: attempt.id,
        problemId: attempt.problemId,
        userId: attempt.userId,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      },
      include: {
        submissions: {
          orderBy: { version: 'asc' },
        },
      },
    });

    return this.toDomain(created);
  }

  public async findById(id: string): Promise<Attempt | null> {
    const rec = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        problem: true,
        submissions: {
          orderBy: { version: 'asc' },
          include: {
            evaluation: {
              include: {
                criterionResults: true,
              },
            },
          },
        },
      },
    });

    return rec ? this.toDomain(rec) : null;
  }

  public async findActiveAttempt(
    userId: string,
    problemId: string,
  ): Promise<Attempt | null> {
    const rec = await this.prisma.attempt.findFirst({
      where: {
        userId,
        problemId,
        status: 'IN_PROGRESS',
      },
      include: {
        submissions: {
          orderBy: { version: 'asc' },
        },
      },
    });

    return rec ? this.toDomain(rec) : null;
  }

  public async findAttemptsByUser(userId: string): Promise<Attempt[]> {
    const records = await this.prisma.attempt.findMany({
      where: { userId },
      include: {
        problem: true,
        submissions: {
          orderBy: { version: 'desc' },
          include: {
            evaluation: {
              include: {
                criterionResults: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return records.map(this.toDomain);
  }

  public async updateStatus(
    id: string,
    status: AttemptStatus,
  ): Promise<Attempt> {
    const updated = await this.prisma.attempt.update({
      where: { id },
      data: {
        status,
        completedAt:
          status === 'SUBMITTED' || status === 'ABANDONED'
            ? new Date()
            : undefined,
      },
      include: {
        submissions: {
          orderBy: { version: 'asc' },
        },
      },
    });

    return this.toDomain(updated);
  }

  private toDomain(raw: any): Attempt {
    const submissions = (raw.submissions || []).map((s: any) => {
      const sub = new Submission(
        s.id,
        s.attemptId,
        s.format as SubmissionFormat,
        s.content,
        s.version,
        s.status as SubmissionStatus,
        s.designRationale,
        s.createdAt,
        s.updatedAt,
      );
      if (s.evaluation) {
        (sub as any).evaluation = s.evaluation;
      }
      return sub;
    });

    const attempt = new Attempt(
      raw.id,
      raw.problemId,
      raw.userId,
      raw.status as AttemptStatus,
      raw.startedAt,
      raw.completedAt,
      submissions,
    );

    // Keep problem reference if eager loaded
    if (raw.problem) {
      (attempt as any).problem = raw.problem;
    }

    return attempt;
  }
}

