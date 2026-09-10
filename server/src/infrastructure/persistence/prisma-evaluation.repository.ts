import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CriterionResult,
  Evaluation,
  EvaluationStatus,
  EvaluatorType,
} from '../../domain/entities/evaluation.entity.js';
import { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface.js';

@Injectable()
export class PrismaEvaluationRepository implements IEvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async create(evaluation: Evaluation): Promise<Evaluation> {
    const created = await this.prisma.evaluation.create({
      data: {
        id: evaluation.id,
        submissionId: evaluation.submissionId,
        evaluatorType: evaluation.evaluatorType,
        status: evaluation.status,
        overallScore: evaluation.overallScore,
        overallSummary: evaluation.overallSummary,
        failureReason: evaluation.failureReason,
        startedAt: evaluation.startedAt,
        completedAt: evaluation.completedAt,
        criterionResults: {
          create: evaluation.criterionResults.map((r) => ({
            criterionKey: r.criterionKey,
            criterionName: r.criterionName,
            score: r.score,
            evidence: r.evidence,
            concern: r.concern,
            suggestion: r.suggestion,
            confidence: r.confidence,
          })),
        },
      },
      include: {
        criterionResults: true,
      },
    });

    return this.toDomain(created);
  }

  public async findBySubmissionId(
    submissionId: string,
  ): Promise<Evaluation | null> {
    const rec = await this.prisma.evaluation.findUnique({
      where: { submissionId },
      include: {
        criterionResults: true,
      },
    });

    return rec ? this.toDomain(rec) : null;
  }

  public async update(evaluation: Evaluation): Promise<Evaluation> {
    // Delete existing criterion results and re-insert updated ones
    await this.prisma.criterionResult.deleteMany({
      where: { evaluationId: evaluation.id },
    });

    const updated = await this.prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        evaluatorType: evaluation.evaluatorType,
        status: evaluation.status,
        overallScore: evaluation.overallScore,
        overallSummary: evaluation.overallSummary,
        failureReason: evaluation.failureReason,
        completedAt: evaluation.completedAt,
        criterionResults: {
          create: evaluation.criterionResults.map((r) => ({
            criterionKey: r.criterionKey,
            criterionName: r.criterionName,
            score: r.score,
            evidence: r.evidence,
            concern: r.concern,
            suggestion: r.suggestion,
            confidence: r.confidence,
          })),
        },
      },
      include: {
        criterionResults: true,
      },
    });

    return this.toDomain(updated);
  }

  private toDomain(raw: any): Evaluation {
    const results = (raw.criterionResults || []).map(
      (r: any) =>
        new CriterionResult(
          r.criterionKey,
          r.criterionName,
          r.score,
          r.evidence,
          r.concern,
          r.suggestion,
          r.confidence,
          r.id,
        ),
    );

    return new Evaluation(
      raw.id,
      raw.submissionId,
      raw.evaluatorType as EvaluatorType,
      raw.status as EvaluationStatus,
      raw.overallScore,
      raw.overallSummary,
      results,
      raw.failureReason,
      raw.startedAt,
      raw.completedAt,
    );
  }
}

