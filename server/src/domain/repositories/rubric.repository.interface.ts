import { Rubric } from '../entities/rubric.entity.js';

export interface IRubricRepository {
  getDefaultRubric(): Promise<Rubric>;
  findByVersion(version: number): Promise<Rubric | null>;
}

