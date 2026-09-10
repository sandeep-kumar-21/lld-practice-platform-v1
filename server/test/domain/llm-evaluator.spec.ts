import { describe, it, expect } from 'vitest';
import {
  LlmEvaluator,
  MalformedLlmResponseException,
} from '../../src/infrastructure/llm/llm-evaluator.js';
import { Submission } from '../../src/domain/entities/submission.entity.js';
import { Rubric, RubricCriterion } from '../../src/domain/entities/rubric.entity.js';

describe('LlmEvaluator & JSON Validation Contract', () => {
  const criteria = [
    { criterionKey: 'SRP', name: 'Single Responsibility Principle' },
    { criterionKey: 'EXTENSIBILITY', name: 'Extensibility' },
  ];

  it('should parse and validate structured JSON successfully', () => {
    const evaluator = new LlmEvaluator();
    const validJson = JSON.stringify([
      {
        criterionId: 'SRP',
        score: 4.5,
        evidence: 'Separate repositories and services.',
        concern: 'God class potential in controller.',
        suggestion: 'Move logic to application use cases.',
        confidence: 'HIGH',
      },
    ]);

    const results = evaluator.parseAndValidateResponse(validJson, criteria);
    expect(results).toHaveLength(1);
    expect(results[0].criterionKey).toBe('SRP');
    expect(results[0].score).toBe(4.5);
  });

  it('should throw MalformedLlmResponseException on invalid JSON', () => {
    const evaluator = new LlmEvaluator();
    const badJson = 'I think this design is good! 4/5.';

    expect(() =>
      evaluator.parseAndValidateResponse(badJson, criteria),
    ).toThrow(MalformedLlmResponseException);
  });

  it('should throw MalformedLlmResponseException when required fields are missing', () => {
    const evaluator = new LlmEvaluator();
    const missingFieldsJson = JSON.stringify([
      {
        criterionId: 'SRP',
        score: 4.0,
        // missing evidence, concern, suggestion
      },
    ]);

    expect(() =>
      evaluator.parseAndValidateResponse(missingFieldsJson, criteria),
    ).toThrow(MalformedLlmResponseException);
  });

  it('should throw MalformedLlmResponseException when score is out of 0-5 bounds', () => {
    const evaluator = new LlmEvaluator();
    const outOfBoundsJson = JSON.stringify([
      {
        criterionId: 'SRP',
        score: 9.5, // invalid
        evidence: 'good',
        concern: 'none',
        suggestion: 'none',
      },
    ]);

    expect(() =>
      evaluator.parseAndValidateResponse(outOfBoundsJson, criteria),
    ).toThrow(MalformedLlmResponseException);
  });

  it('should seamlessly fallback to MockLlmEvaluator when no API key is provided', async () => {
    const evaluator = new LlmEvaluator(undefined, '', 'mock');
    const submission = new Submission(
      'sub-1',
      'att-1',
      'TEXT',
      {
        requirementsAndAssumptions: 'Multi-floor parking lot with gates.',
        classesAndResponsibilities: 'ParkingLot, Floor, Slot, Ticket, Gate.',
        relationshipsAndPatterns: 'Strategy pattern for parking fee.',
        tradeoffsAndExtensibility: 'In-memory locks vs distributed lock.',
      },
      1,
      'PENDING',
      'Used strategy pattern for pricing to easily swap hourly vs surge rates.',
    );

    const rubric = new Rubric('r-1', 1, 'Rubric 1', 'Test', true, [
      new RubricCriterion('c1', 'r1', 'REQUIREMENT_UNDERSTANDING', 'Reqs', 'Desc', 0.5, ['TEXT']),
      new RubricCriterion('c2', 'r1', 'EXPLANATION_QUALITY', 'Quality', 'Desc', 0.5, ['TEXT']),
    ]);

    const result = await evaluator.evaluate(submission, rubric);
    expect(result.evaluatorType).toBe('MOCK_LLM');
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.criterionResults).toHaveLength(2);
  });
});

