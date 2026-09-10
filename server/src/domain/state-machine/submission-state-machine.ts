import { SubmissionStatus } from '../entities/submission.entity.js';

export class InvalidStateTransitionException extends Error {
  constructor(
    public readonly currentStatus: SubmissionStatus,
    public readonly targetStatus: SubmissionStatus,
    message?: string,
  ) {
    super(
      message ||
        `Illegal state transition from "${currentStatus}" to "${targetStatus}".`,
    );
    this.name = 'InvalidStateTransitionException';
    Object.setPrototypeOf(this, InvalidStateTransitionException.prototype);
  }
}

export class SubmissionStateMachine {
  private static readonly LEGAL_TRANSITIONS: Record<
    SubmissionStatus,
    readonly SubmissionStatus[]
  > = {
    PENDING: ['EVALUATING'],
    EVALUATING: ['EVALUATING', 'COMPLETED', 'COMPLETED_PARTIAL', 'FAILED'],
    COMPLETED: [], // Terminal state for this revision
    COMPLETED_PARTIAL: ['EVALUATING'], // Can be retried
    FAILED: ['EVALUATING'], // Retry re-enqueues evaluation
  };

  /**
   * Checks if a transition between two submission statuses is permitted.
   */
  public static canTransition(
    current: SubmissionStatus,
    next: SubmissionStatus,
  ): boolean {
    const allowed = this.LEGAL_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Asserts that a transition is legal; throws InvalidStateTransitionException otherwise.
   */
  public static assertCanTransition(
    current: SubmissionStatus,
    next: SubmissionStatus,
  ): void {
    if (!this.canTransition(current, next)) {
      throw new InvalidStateTransitionException(current, next);
    }
  }

  /**
   * Returns list of allowed next states from the given state.
   */
  public static getAllowedNextStates(
    current: SubmissionStatus,
  ): readonly SubmissionStatus[] {
    return this.LEGAL_TRANSITIONS[current] || [];
  }
}

