import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Rubric,
  RubricCriterion,
} from '../../domain/entities/rubric.entity.js';
import { SubmissionFormat } from '../../domain/entities/submission.entity.js';
import { IRubricRepository } from '../../domain/repositories/rubric.repository.interface.js';

@Injectable()
export class PrismaRubricRepository implements IRubricRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async getDefaultRubric(): Promise<Rubric> {
    const rec = await this.prisma.rubric.findFirst({
      where: { isDefault: true },
      include: { criteria: true },
      orderBy: { version: 'desc' },
    });

    if (!rec) {
      throw new Error('No default Rubric found in database.');
    }

    return this.toDomain(rec);
  }

  public async findByVersion(version: number): Promise<Rubric | null> {
    const rec = await this.prisma.rubric.findUnique({
      where: { version },
      include: { criteria: true },
    });

    return rec ? this.toDomain(rec) : null;
  }

  private toDomain(raw: any): Rubric {
    const criteria = (raw.criteria || []).map(
      (c: any) =>
        new RubricCriterion(
          c.id,
          c.rubricId,
          c.criterionKey,
          c.name,
          c.description,
          c.weight,
          Array.isArray(c.appliesToFormat)
            ? (c.appliesToFormat as SubmissionFormat[])
            : ['TEXT', 'CODE'],
        ),
    );

    return new Rubric(
      raw.id,
      raw.version,
      raw.title,
      raw.description,
      raw.isDefault,
      criteria,
      raw.createdAt,
    );
  }
}

