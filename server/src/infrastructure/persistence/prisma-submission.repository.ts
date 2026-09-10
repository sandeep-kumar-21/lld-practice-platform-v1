import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Submission,
  SubmissionFormat,
  SubmissionStatus,
} from '../../domain/entities/submission.entity.js';
import { ISubmissionRepository } from '../../domain/repositories/submission.repository.interface.js';

@Injectable()
export class PrismaSubmissionRepository implements ISubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async create(submission: Submission): Promise<Submission> {
    const created = await this.prisma.submission.create({
      data: {
        id: submission.id,
        attemptId: submission.attemptId,
        format: submission.format,
        content: submission.content as any,
        version: submission.version,
        status: submission.status,
        designRationale: submission.designRationale,
        createdAt: submission.createdAt,
      },
    });

    return this.toDomain(created);
  }

  public async findById(id: string): Promise<Submission | null> {
    const rec = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        attempt: {
          include: { problem: true },
        },
        evaluation: {
          include: {
            criterionResults: true,
          },
        },
      },
    });

    return rec ? this.toDomain(rec) : null;
  }

  public async findByAttemptId(attemptId: string): Promise<Submission[]> {
    const records = await this.prisma.submission.findMany({
      where: { attemptId },
      orderBy: { version: 'asc' },
      include: {
        evaluation: {
          include: {
            criterionResults: true,
          },
        },
      },
    });

    return records.map(this.toDomain);
  }

  public async updateStatus(
    id: string,
    status: SubmissionStatus,
  ): Promise<Submission> {
    const updated = await this.prisma.submission.update({
      where: { id },
      data: { status },
      include: {
        evaluation: {
          include: {
            criterionResults: true,
          },
        },
      },
    });

    return this.toDomain(updated);
  }

  public async findPreviousSubmission(
    attemptId: string,
    currentVersion: number,
  ): Promise<Submission | null> {
    const rec = await this.prisma.submission.findFirst({
      where: {
        attemptId,
        version: { lt: currentVersion },
        status: { in: ['COMPLETED', 'COMPLETED_PARTIAL'] },
      },
      orderBy: { version: 'desc' },
      include: {
        evaluation: {
          include: {
            criterionResults: true,
          },
        },
      },
    });

    return rec ? this.toDomain(rec) : null;
  }

  private toDomain(raw: any): Submission {
    const sub = new Submission(
      raw.id,
      raw.attemptId,
      raw.format as SubmissionFormat,
      raw.content,
      raw.version,
      raw.status as SubmissionStatus,
      raw.designRationale,
      raw.createdAt,
      raw.updatedAt,
    );

    if (raw.evaluation) {
      (sub as any).evaluation = raw.evaluation;
    }
    if (raw.attempt) {
      (sub as any).attempt = raw.attempt;
    }

    return sub;
  }
}

