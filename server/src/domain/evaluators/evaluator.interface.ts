import { CriterionResult, EvaluatorType } from '../entities/evaluation.entity.js';
import { Rubric } from '../entities/rubric.entity.js';
import { Submission, SubmissionFormat } from '../entities/submission.entity.js';

export interface EvaluationResult {
  evaluatorType: EvaluatorType;
  overallScore: number; // 0 - 5
  overallSummary: string;
  criterionResults: CriterionResult[];
  isDegraded?: boolean;
}

export interface IEvaluator {
  readonly type: EvaluatorType;
  supports(format: SubmissionFormat | string): boolean;
  evaluate(submission: Submission, rubric: Rubric): Promise<EvaluationResult>;
}

