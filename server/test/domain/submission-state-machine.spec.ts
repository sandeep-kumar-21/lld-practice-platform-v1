import { describe, it, expect } from 'vitest';
import {
  SubmissionStateMachine,
  InvalidStateTransitionException,
} from '../../src/domain/state-machine/submission-state-machine.js';

describe('SubmissionStateMachine', () => {
  it('should permit legal transitions', () => {
    expect(SubmissionStateMachine.canTransition('PENDING', 'EVALUATING')).toBe(
      true,
    );
    expect(SubmissionStateMachine.canTransition('EVALUATING', 'COMPLETED')).toBe(
      true,
    );
    expect(
      SubmissionStateMachine.canTransition('EVALUATING', 'COMPLETED_PARTIAL'),
    ).toBe(true);
    expect(SubmissionStateMachine.canTransition('EVALUATING', 'FAILED')).toBe(
      true,
    );
    expect(SubmissionStateMachine.canTransition('FAILED', 'EVALUATING')).toBe(
      true,
    );
    expect(
      SubmissionStateMachine.canTransition('COMPLETED_PARTIAL', 'EVALUATING'),
    ).toBe(true);
  });

  it('should reject illegal transitions', () => {
    expect(SubmissionStateMachine.canTransition('PENDING', 'COMPLETED')).toBe(
      false,
    );
    expect(SubmissionStateMachine.canTransition('PENDING', 'FAILED')).toBe(
      false,
    );
    expect(SubmissionStateMachine.canTransition('COMPLETED', 'EVALUATING')).toBe(
      false,
    );
    expect(SubmissionStateMachine.canTransition('COMPLETED', 'PENDING')).toBe(
      false,
    );
  });

  it('should throw InvalidStateTransitionException on assertCanTransition for illegal moves', () => {
    expect(() =>
      SubmissionStateMachine.assertCanTransition('PENDING', 'COMPLETED'),
    ).toThrow(InvalidStateTransitionException);
  });

  it('should return allowed next states for any given status', () => {
    expect(SubmissionStateMachine.getAllowedNextStates('PENDING')).toEqual([
      'EVALUATING',
    ]);
    expect(SubmissionStateMachine.getAllowedNextStates('EVALUATING')).toEqual([
      'EVALUATING',
      'COMPLETED',
      'COMPLETED_PARTIAL',
      'FAILED',
    ]);
    expect(SubmissionStateMachine.getAllowedNextStates('COMPLETED')).toEqual([]);
  });
});

