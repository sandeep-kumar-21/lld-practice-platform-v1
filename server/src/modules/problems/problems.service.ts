import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaProblemRepository } from '../../infrastructure/persistence/prisma-problem.repository.js';
import { Problem } from '../../domain/entities/problem.entity.js';
import { GetProblemsFilterDto } from './dto/get-problems-filter.dto.js';

@Injectable()
export class ProblemsService {
  constructor(private readonly problemRepo: PrismaProblemRepository) {}

  public async getProblems(filter?: GetProblemsFilterDto): Promise<Problem[]> {
    return this.problemRepo.findAll(filter);
  }

  public async getProblemBySlug(slug: string): Promise<Problem> {
    const problem = await this.problemRepo.findBySlug(slug);
    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found.`);
    }
    return problem;
  }
}

