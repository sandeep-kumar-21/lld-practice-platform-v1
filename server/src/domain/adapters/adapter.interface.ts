import { SubmissionFormat } from '../entities/submission.entity.js';

export interface DeterministicCheckIssue {
  field: string;
  message: string;
  severity: 'WARNING' | 'ERROR';
}

export interface DeterministicCheckResult {
  isValid: boolean;
  score: number; // 0 - 5
  issues: DeterministicCheckIssue[];
  extractedSummary: string;
}

export interface NormalizedSubmissionContent {
  format: SubmissionFormat | 'DIAGRAM';
  rawTextRepresentation: string;
  metadata: Record<string, unknown>;
  sectionCount: number;
  wordCount: number;
}

export interface ISubmissionContentAdapter {
  readonly format: SubmissionFormat | string;
  normalize(raw: unknown): NormalizedSubmissionContent;
  validateStructure(content: NormalizedSubmissionContent): DeterministicCheckResult;
}

