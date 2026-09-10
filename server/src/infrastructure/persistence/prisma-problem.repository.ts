import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ExpectedFormat,
  Problem,
  ProblemDifficulty,
} from '../../domain/entities/problem.entity.js';
import { IProblemRepository } from '../../domain/repositories/problem.repository.interface.js';

@Injectable()
export class PrismaProblemRepository implements IProblemRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(filter?: {
    difficulty?: string;
    tag?: string;
  }): Promise<Problem[]> {
    const where: any = {};
    if (filter?.difficulty) {
      where.difficulty = filter.difficulty.toUpperCase();
    }

    const records = await this.prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return records
      .filter((rec) => {
        if (!filter?.tag) return true;
        const tags = Array.isArray(rec.tags) ? (rec.tags as string[]) : [];
        return tags.some((t) => t.toLowerCase().includes(filter.tag!.toLowerCase()));
      })
      .map(this.toDomain);
  }

  public async findBySlug(slug: string): Promise<Problem | null> {
    const rec = await this.prisma.problem.findUnique({
      where: { slug },
    });
    return rec ? this.toDomain(rec) : null;
  }

  public async findById(id: string): Promise<Problem | null> {
    const rec = await this.prisma.problem.findUnique({
      where: { id },
    });
    return rec ? this.toDomain(rec) : null;
  }

  private toDomain(raw: any): Problem {
    return new Problem(
      raw.id,
      raw.slug,
      raw.title,
      raw.description,
      raw.difficulty as ProblemDifficulty,
      Array.isArray(raw.tags) ? raw.tags : [],
      Array.isArray(raw.functionalRequirements) ? raw.functionalRequirements : [],
      Array.isArray(raw.nonFunctionalRequirements) ? raw.nonFunctionalRequirements : [],
      Array.isArray(raw.constraints) ? raw.constraints : [],
      raw.expectedFormat as ExpectedFormat,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}

