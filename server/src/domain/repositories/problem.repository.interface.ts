import { Problem } from '../entities/problem.entity.js';

export interface IProblemRepository {
  findAll(filter?: { difficulty?: string; tag?: string }): Promise<Problem[]>;
  findBySlug(slug: string): Promise<Problem | null>;
  findById(id: string): Promise<Problem | null>;
}

