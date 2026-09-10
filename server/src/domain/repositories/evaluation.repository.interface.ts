import { Evaluation } from '../entities/evaluation.entity.js';

export interface IEvaluationRepository {
  create(evaluation: Evaluation): Promise<Evaluation>;
  findBySubmissionId(submissionId: string): Promise<Evaluation | null>;
  update(evaluation: Evaluation): Promise<Evaluation>;
}

