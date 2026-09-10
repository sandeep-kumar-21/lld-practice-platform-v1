export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ExpectedFormat = 'TEXT' | 'CODE' | 'BOTH';

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  constraints: string[];
  expectedFormat: ExpectedFormat;
  createdAt: string;
  updatedAt: string;
}

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';

export interface Attempt {
  id: string;
  problemId: string;
  userId: string;
  status: AttemptStatus;
  startedAt: string;
  completedAt?: string | null;
  problem?: Problem;
  submissions?: Submission[];
}

export type SubmissionFormat = 'TEXT' | 'CODE' | 'DIAGRAM';

export type SubmissionStatus =
  | 'PENDING'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'COMPLETED_PARTIAL'
  | 'FAILED';

export interface TextContent {
  requirementsAndAssumptions: string;
  classesAndResponsibilities: string;
  relationshipsAndPatterns: string;
  tradeoffsAndExtensibility: string;
}

export interface CodeContent {
  language: string;
  code: string;
}

export interface CriterionResult {
  id?: string;
  criterionKey: string;
  criterionName: string;
  score: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Evaluation {
  id: string;
  submissionId: string;
  evaluatorType: string;
  status: string;
  overallScore: number;
  overallSummary: string;
  failureReason?: string | null;
  startedAt: string;
  completedAt?: string | null;
  criterionResults: CriterionResult[];
}

export type ScoreDelta = 'IMPROVED' | 'SAME' | 'REGRESSED';

export interface CriterionComparison {
  criterionKey: string;
  criterionName: string;
  currentScore: number;
  previousScore: number;
  scoreDifference: number;
  delta: ScoreDelta;
  summary: string;
}

export interface VersionComparison {
  hasPreviousVersion: boolean;
  currentOverallScore: number;
  previousOverallScore?: number;
  overallScoreDifference?: number;
  overallDelta?: ScoreDelta;
  comparisons: CriterionComparison[];
  improvedCount: number;
  sameCount: number;
  regressedCount: number;
}

export interface Submission {
  id: string;
  attemptId: string;
  format: SubmissionFormat;
  content: any;
  version: number;
  status: SubmissionStatus;
  designRationale: string;
  createdAt: string;
  updatedAt: string;
  evaluation?: Evaluation | null;
  versionComparison?: VersionComparison | null;
}

export interface CriterionAnalytics {
  criterionKey: string;
  criterionName: string;
  averageScore: number;
  evaluationCount: number;
  lowestScore: number;
  highestScore: number;
  status: 'STRONG' | 'ADEQUATE' | 'WEAK';
  advice: string;
}

export interface UserAttemptsSummary {
  userId: string;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  overallAverageScore: number;
  recurringWeaknesses: CriterionAnalytics[];
  strengths: CriterionAnalytics[];
  attempts: {
    id: string;
    problemId: string;
    problemTitle: string;
    problemSlug: string;
    difficulty: ProblemDifficulty;
    status: AttemptStatus;
    startedAt: string;
    completedAt?: string | null;
    submissionCount: number;
    latestScore?: number | null;
    bestScore?: number | null;
    latestSubmissionId?: string | null;
  }[];
}

