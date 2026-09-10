import { Evaluation } from '../entities/evaluation.entity.js';
import { Submission } from '../entities/submission.entity.js';

export class SubmissionCreatedEvent {
  public static readonly EVENT_NAME = 'submission.created';
  constructor(
    public readonly submission: Submission,
    public readonly attemptId: string,
    public readonly problemId: string,
  ) {}
}

export class EvaluationStartedEvent {
  public static readonly EVENT_NAME = 'evaluation.started';
  constructor(
    public readonly submissionId: string,
    public readonly attemptId: string,
  ) {}
}

export class EvaluationCompletedEvent {
  public static readonly EVENT_NAME = 'evaluation.completed';
  constructor(
    public readonly submissionId: string,
    public readonly evaluation: Evaluation,
    public readonly attemptId: string,
  ) {}
}

export class EvaluationFailedEvent {
  public static readonly EVENT_NAME = 'evaluation.failed';
  constructor(
    public readonly submissionId: string,
    public readonly reason: string,
    public readonly isRetryable: boolean,
  ) {}
}

