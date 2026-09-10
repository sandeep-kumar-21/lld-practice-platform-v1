import { Submission } from './submission.entity.js';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';

export class Attempt {
  private _status: AttemptStatus;
  private _completedAt?: Date | null;
  private _submissions: Submission[] = [];

  constructor(
    public readonly id: string,
    public readonly problemId: string,
    public readonly userId: string,
    status: AttemptStatus = 'IN_PROGRESS',
    public readonly startedAt: Date = new Date(),
    completedAt?: Date | null,
    submissions: Submission[] = [],
  ) {
    this._status = status;
    this._completedAt = completedAt;
    this._submissions = [...submissions];
  }

  public get status(): AttemptStatus {
    return this._status;
  }

  public get completedAt(): Date | null | undefined {
    return this._completedAt;
  }

  public get submissions(): readonly Submission[] {
    return this._submissions;
  }

  /**
   * Appends a new revision submission to this practice attempt.
   * Enforces status invariant (only IN_PROGRESS accepts submissions)
   * and version sequencing invariant.
   */
  public addSubmission(submission: Submission): void {
    if (this._status !== 'IN_PROGRESS') {
      throw new Error(
        `Cannot add submission to attempt with status "${this._status}". Attempt must be IN_PROGRESS.`,
      );
    }

    if (submission.attemptId !== this.id) {
      throw new Error(
        `Submission attemptId (${submission.attemptId}) does not match Attempt id (${this.id}).`,
      );
    }

    this._submissions.push(submission);
  }

  public get latestSubmission(): Submission | undefined {
    if (this._submissions.length === 0) return undefined;
    return [...this._submissions].sort((a, b) => b.version - a.version)[0];
  }

  public get nextVersion(): number {
    return this._submissions.length + 1;
  }

  public markSubmitted(): void {
    if (this._status === 'ABANDONED') {
      throw new Error('Cannot submit an abandoned attempt.');
    }
    this._status = 'SUBMITTED';
    this._completedAt = new Date();
  }

  public markAbandoned(): void {
    this._status = 'ABANDONED';
    this._completedAt = new Date();
  }
}
