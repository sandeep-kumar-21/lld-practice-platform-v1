import { Submission, SubmissionStatus } from '../entities/submission.entity.js';

export interface ISubmissionRepository {
  create(submission: Submission): Promise<Submission>;
  findById(id: string): Promise<Submission | null>;
  findByAttemptId(attemptId: string): Promise<Submission[]>;
  updateStatus(id: string, status: SubmissionStatus): Promise<Submission>;
  findPreviousSubmission(
    attemptId: string,
    currentVersion: number,
  ): Promise<Submission | null>;
}

