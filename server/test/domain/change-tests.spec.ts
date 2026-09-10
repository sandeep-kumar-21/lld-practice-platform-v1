import { describe, it, expect } from 'vitest';
import {
  ContentAdapterRegistry,
  defaultContentAdapterRegistry,
} from '../../src/domain/adapters/content-adapter.registry.js';
import { DiagramSubmissionAdapter } from '../../src/domain/adapters/diagram-submission.adapter.js';
import { DeterministicEvaluator } from '../../src/domain/evaluators/deterministic.evaluator.js';
import { RuleBasedEvaluator } from '../../src/domain/evaluators/rule-based.evaluator.js';
import { EvaluationPipeline } from '../../src/domain/evaluators/evaluation-pipeline.js';
import { Rubric, RubricCriterion } from '../../src/domain/entities/rubric.entity.js';
import { Submission } from '../../src/domain/entities/submission.entity.js';

describe('Assignment Change Tests (A & B)', () => {
  const sampleRubric = new Rubric(
    'rubric-1',
    1,
    'Standard LLD Rubric',
    'Standard 8-criteria rubric',
    true,
    [
      new RubricCriterion(
        'c1',
        'rubric-1',
        'CLASS_RESPONSIBILITIES',
        'Class & Interface Responsibilities',
        'Single responsibility principle',
        0.2,
        ['TEXT', 'CODE'],
      ),
      new RubricCriterion(
        'c2',
        'rubric-1',
        'EXPLANATION_QUALITY',
        'Quality of Explanation & Reasoning',
        'Design trade-off rationale',
        0.15,
        ['TEXT', 'CODE'],
      ),
    ],
  );

  describe('Change Test A: Extensible Submission Formats (Diagram Support)', () => {
    it('should normalize and validate Mermaid diagram submission without modifying evaluator code', async () => {
      const registry = new ContentAdapterRegistry();
      expect(registry.has('DIAGRAM')).toBe(true);

      const adapter = registry.getRequired('DIAGRAM');
      expect(adapter).toBeInstanceOf(DiagramSubmissionAdapter);

      const diagramPayload = {
        diagramSyntax: 'MERMAID',
        diagramCode: `
class ParkingLot {
  +List~Floor~ floors
  +parkVehicle(Vehicle v)
}
class Floor {
  +int floorNumber
  +List~Spot~ spots
}
ParkingLot --> Floor
        `,
      };

      const normalized = adapter.normalize(diagramPayload);
      expect(normalized.format).toBe('DIAGRAM');
      expect(normalized.metadata.detectedClassCount).toBe(2);
      expect(normalized.metadata.detectedRelationCount).toBe(1);

      const check = adapter.validateStructure(normalized);
      expect(check.isValid).toBe(true);
      expect(check.score).toBeGreaterThanOrEqual(4.0);

      // Verify DeterministicEvaluator seamlessly evaluates the DIAGRAM submission
      const evaluator = new DeterministicEvaluator(registry);
      const submission = new Submission(
        'sub-diag-1',
        'att-1',
        'DIAGRAM',
        diagramPayload,
        1,
        'PENDING',
        'Decoupled ParkingLot aggregate root from individual Floor allocation strategies.',
      );

      const result = await evaluator.evaluate(submission, sampleRubric);
      expect(result.evaluatorType).toBe('DETERMINISTIC');
      expect(result.overallScore).toBeGreaterThanOrEqual(3.5);
      expect(result.criterionResults.length).toBe(2);
    });
  });

  describe('Change Test B: Pluggable Evaluator Pipeline (Rule-Based & Custom Evaluators)', () => {
    it('should allow adding a RuleBasedEvaluator into the pipeline without altering core practice flow', async () => {
      const deterministic = new DeterministicEvaluator(defaultContentAdapterRegistry);
      const ruleBased = new RuleBasedEvaluator();
      const pipeline = new EvaluationPipeline(deterministic, ruleBased);

      pipeline.addEvaluator(ruleBased);

      const submission = new Submission(
        'sub-code-1',
        'att-1',
        'CODE',
        {
          language: 'typescript',
          code: 'export class ParkingLot { park() {} }',
        },
        1,
        'PENDING',
        'Used Strategy pattern for vehicle parking slot assignment.',
      );

      const result = await pipeline.execute(submission, sampleRubric);
      expect(result.evaluatorType).toBe('RULE_BASED');
      expect(result.overallScore).toBeGreaterThanOrEqual(3.5);
      expect(result.criterionResults).toHaveLength(2);
    });

    it('should degrade gracefully to deterministic evaluation if judgment evaluator fails', async () => {
      const failingEvaluator = {
        type: 'LLM' as const,
        supports: () => true,
        evaluate: async () => {
          throw new Error('LLM Gateway 503 Overloaded');
        },
      };

      const pipeline = new EvaluationPipeline(
        new DeterministicEvaluator(defaultContentAdapterRegistry),
        failingEvaluator,
      );

      const submission = new Submission(
        'sub-text-1',
        'att-1',
        'TEXT',
        {
          requirementsAndAssumptions: 'Multi-floor parking lot.',
          classesAndResponsibilities: 'ParkingLot, Spot, Vehicle.',
          relationshipsAndPatterns: 'Strategy pattern for slots.',
          tradeoffsAndExtensibility: 'Atomic integers for counts.',
        },
        1,
        'PENDING',
        'Detailed rationale with trade-off analysis comparing mutexes vs atomic counters.',
      );

      const result = await pipeline.execute(submission, sampleRubric, {
        enableFallbackOnFailure: true,
      });

      expect(result.isDegraded).toBe(true);
      expect(result.evaluatorType).toBe('DETERMINISTIC');
      expect(result.overallSummary).toContain('Graceful Degradation');
      expect(result.overallScore).toBeGreaterThanOrEqual(3.0);
    });
  });
});

