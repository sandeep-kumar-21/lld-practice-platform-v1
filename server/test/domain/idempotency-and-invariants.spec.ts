import { describe, it, expect } from 'vitest';
import { Submission } from '../../src/domain/entities/submission.entity.js';
import { Attempt } from '../../src/domain/entities/attempt.entity.js';
import { InvalidStateTransitionException } from '../../src/domain/state-machine/submission-state-machine.js';

describe('Domain Invariants & Idempotency', () => {
  it('should enforce state machine transitions on the Submission entity', () => {
    const submission = new Submission(
      'sub-1',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'Valid requirements',
        classesAndResponsibilities: 'Valid classes',
        relationshipsAndPatterns: 'Valid patterns',
        tradeoffsAndExtensibility: 'Valid trade-offs',
      },
      1,
      'PENDING',
      'Valid design rationale explaining core abstractions and concurrency decisions.',
    );

    expect(submission.status).toBe('PENDING');

    // Legal transition PENDING -> EVALUATING
    submission.transitionTo('EVALUATING');
    expect(submission.status).toBe('EVALUATING');

    // Legal transition EVALUATING -> COMPLETED
    submission.transitionTo('COMPLETED');
    expect(submission.status).toBe('COMPLETED');

    // Illegal transition: COMPLETED is a terminal state
    expect(() => submission.transitionTo('PENDING')).toThrow(
      InvalidStateTransitionException,
    );
  });

  it('should reject illegal direct jumps (e.g. PENDING -> COMPLETED)', () => {
    const submission = new Submission(
      'sub-2',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'Requirements',
        classesAndResponsibilities: 'Classes',
        relationshipsAndPatterns: 'Patterns',
        tradeoffsAndExtensibility: 'Tradeoffs',
      },
      1,
      'PENDING',
      'Valid rationale explaining architecture and trade-offs.',
    );

    expect(() => submission.transitionTo('COMPLETED')).toThrow(
      InvalidStateTransitionException,
    );
  });

  it('should enforce attempt invariants when adding submissions', () => {
    const attempt = new Attempt(
      'att-1',
      'prob-1',
      'user-1',
      'IN_PROGRESS',
      new Date(),
      null,
    );

    const sub1 = new Submission(
      'sub-1',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'R',
        classesAndResponsibilities: 'C',
        relationshipsAndPatterns: 'P',
        tradeoffsAndExtensibility: 'T',
      },
      1,
      'PENDING',
      'Valid rationale for initial iteration.',
    );

    attempt.addSubmission(sub1);
    expect(attempt.submissions).toHaveLength(1);
    expect(attempt.latestSubmission?.id).toBe('sub-1');
    expect(attempt.nextVersion).toBe(2);

    // If attempt is submitted or abandoned, rejects further submissions
    attempt.markSubmitted();
    expect(attempt.status).toBe('SUBMITTED');

    const sub2 = new Submission(
      'sub-2',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'R2',
        classesAndResponsibilities: 'C2',
        relationshipsAndPatterns: 'P2',
        tradeoffsAndExtensibility: 'T2',
      },
      2,
      'PENDING',
      'Valid rationale for second iteration.',
    );

    expect(() => attempt.addSubmission(sub2)).toThrow(/must be IN_PROGRESS/);
  });

  it('should compute deterministic content signature for idempotency deduplication', () => {
    const subA = new Submission(
      'sub-a',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'Req A',
        classesAndResponsibilities: 'Class A',
        relationshipsAndPatterns: 'Pattern A',
        tradeoffsAndExtensibility: 'Tradeoff A',
      },
      1,
      'PENDING',
      'Same rationale for testing idempotency hashing.',
    );

    const subB = new Submission(
      'sub-b',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'Req A',
        classesAndResponsibilities: 'Class A',
        relationshipsAndPatterns: 'Pattern A',
        tradeoffsAndExtensibility: 'Tradeoff A',
      },
      2,
      'PENDING',
      'Same rationale for testing idempotency hashing.',
    );

    const subC = new Submission(
      'sub-c',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'Different Req',
        classesAndResponsibilities: 'Class A',
        relationshipsAndPatterns: 'Pattern A',
        tradeoffsAndExtensibility: 'Tradeoff A',
      },
      3,
      'PENDING',
      'Same rationale for testing idempotency hashing.',
    );

    expect(subA.computeContentSignature()).toBe(subB.computeContentSignature());
    expect(subA.computeContentSignature()).not.toBe(subC.computeContentSignature());
  });
});

