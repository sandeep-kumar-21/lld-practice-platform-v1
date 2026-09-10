export type EvaluatorType =
  | 'DETERMINISTIC'
  | 'LLM'
  | 'RULE_BASED'
  | 'HUMAN'
  | 'MOCK_LLM'
  | 'DETERMINISTIC_ONLY'
  | 'HYBRID';

export type EvaluationStatus = 'PENDING' | 'COMPLETED' | 'COMPLETED_PARTIAL' | 'FAILED';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export class CriterionResult {
  constructor(
    public readonly criterionKey: string,
    public readonly criterionName: string,
    public readonly score: number, // 0 - 5
    public readonly evidence: string,
    public readonly concern: string,
    public readonly suggestion: string,
    public readonly confidence: ConfidenceLevel = 'HIGH',
    public readonly id?: string,
  ) {}
}

export class Evaluation {
  constructor(
    public readonly id: string,
    public readonly submissionId: string,
    public evaluatorType: EvaluatorType,
    public status: EvaluationStatus,
    public overallScore: number, // Weighted score (0 - 5)
    public overallSummary: string,
    public criterionResults: CriterionResult[] = [],
    public failureReason?: string | null,
    public readonly startedAt: Date = new Date(),
    public completedAt?: Date | null,
  ) {}

  public complete(
    score: number,
    summary: string,
    results: CriterionResult[],
    type: EvaluatorType = this.evaluatorType,
  ): void {
    this.status = 'COMPLETED';
    this.overallScore = score;
    this.overallSummary = summary;
    this.criterionResults = results;
    this.evaluatorType = type;
    this.completedAt = new Date();
  }

  public completePartial(
    score: number,
    summary: string,
    deterministicResults: CriterionResult[],
    reason: string,
  ): void {
    this.status = 'COMPLETED_PARTIAL';
    this.overallScore = score;
    this.overallSummary = summary;
    this.criterionResults = deterministicResults;
    this.evaluatorType = 'DETERMINISTIC_ONLY';
    this.failureReason = reason;
    this.completedAt = new Date();
  }

  public fail(reason: string): void {
    this.status = 'FAILED';
    this.failureReason = reason;
    this.completedAt = new Date();
  }
}

