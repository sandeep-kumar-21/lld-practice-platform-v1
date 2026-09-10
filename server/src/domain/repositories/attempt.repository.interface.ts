import { Attempt, AttemptStatus } from '../entities/attempt.entity.js';

export interface IAttemptRepository {
  create(attempt: Attempt): Promise<Attempt>;
  findById(id: string): Promise<Attempt | null>;
  findActiveAttempt(userId: string, problemId: string): Promise<Attempt | null>;
  findAttemptsByUser(userId: string): Promise<Attempt[]>;
  updateStatus(id: string, status: AttemptStatus): Promise<Attempt>;
}

