import { createHash } from 'crypto';
import { SubmissionStateMachine } from '../state-machine/submission-state-machine.js';

export type SubmissionFormat = 'TEXT' | 'CODE' | 'DIAGRAM' | string;

export type SubmissionStatus =
  | 'PENDING'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'COMPLETED_PARTIAL'
  | 'FAILED';

export interface TextSubmissionContent {
  requirementsAndAssumptions: string;
  classesAndResponsibilities: string;
  relationshipsAndPatterns: string;
  tradeoffsAndExtensibility: string;
}

export interface CodeSubmissionContent {
  language: string;
  code: string;
}

export interface DiagramSubmissionContent {
  diagramSyntax: 'MERMAID' | 'PLANTUML' | string;
  diagramCode: string;
}

export type SubmissionContent =
  | TextSubmissionContent
  | CodeSubmissionContent
  | DiagramSubmissionContent
  | Record<string, unknown>;

export class Submission {
  private _status: SubmissionStatus;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly attemptId: string,
    public readonly format: SubmissionFormat,
    public readonly content: SubmissionContent,
    public readonly version: number,
    status: SubmissionStatus,
    public readonly designRationale: string,
    public readonly createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.validateRationale();
    this._status = status;
    this._updatedAt = updatedAt;
  }

  public get status(): SubmissionStatus {
    return this._status;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  private validateRationale(): void {
    if (!this.designRationale || this.designRationale.trim().length === 0) {
      throw new Error('Design rationale is mandatory for every submission.');
    }
  }

  /**
   * Enforces legal state machine transitions at the entity boundary.
   * Throws InvalidStateTransitionException if transition is illegal.
   */
  public transitionTo(newStatus: SubmissionStatus): void {
    SubmissionStateMachine.assertCanTransition(this._status, newStatus);
    this._status = newStatus;
    this._updatedAt = new Date();
  }

  /**
   * Legacy status updater preserving compatibility.
   */
  public updateStatus(newStatus: SubmissionStatus): void {
    this.transitionTo(newStatus);
  }

  /**
   * Deterministic SHA-256 fingerprint of the submission's core content and rationale.
   * Used for idempotency and duplicate submission detection.
   */
  public computeContentSignature(): string {
    const raw = `${this.attemptId}:${this.format}:${JSON.stringify(this.content)}:${this.designRationale.trim()}`;
    return createHash('sha256').update(raw).digest('hex');
  }
}
