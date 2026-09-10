import { CriterionResult, EvaluatorType } from '../entities/evaluation.entity.js';
import { Rubric } from '../entities/rubric.entity.js';
import { Submission, SubmissionFormat } from '../entities/submission.entity.js';
import { EvaluationResult, IEvaluator } from './evaluator.interface.js';
import {
  ContentAdapterRegistry,
  defaultContentAdapterRegistry,
} from '../adapters/content-adapter.registry.js';

/**
 * DeterministicEvaluator
 * Performs fast, deterministic structural and invariant evaluation on submissions.
 * Decoupled from concrete submission shapes via ContentAdapterRegistry (Dependency Inversion & Open-Closed).
 */
export class DeterministicEvaluator implements IEvaluator {
  public readonly type: EvaluatorType = 'DETERMINISTIC';

  constructor(
    private readonly adapterRegistry: ContentAdapterRegistry = defaultContentAdapterRegistry,
  ) {}

  public supports(format: SubmissionFormat | string): boolean {
    return this.adapterRegistry.has(format);
  }

  public async evaluate(
    submission: Submission,
    rubric: Rubric,
  ): Promise<EvaluationResult> {
    const adapter = this.adapterRegistry.getRequired(submission.format);
    const normalized = adapter.normalize(submission.content);
    const checkResult = adapter.validateStructure(normalized);

    const applicableCriteria = rubric.getCriteriaForFormat(submission.format);
    const criterionResults: CriterionResult[] = [];

    // Evaluate each rubric criterion using deterministic heuristics
    for (const criterion of applicableCriteria) {
      let score = checkResult.score;
      let evidence = checkResult.extractedSummary;
      let concern = 'No critical structural omissions detected.';
      let suggestion = 'Maintain clear documentation of invariants.';

      if (criterion.criterionKey === 'EXPLANATION_QUALITY') {
        const rationaleLength = submission.designRationale.length;
        if (rationaleLength >= 100) {
          score = 4.5;
          evidence = `Learner provided detailed design rationale (${rationaleLength} characters).`;
          concern = 'Ensure trade-offs compare alternative patterns.';
          suggestion = 'Elaborate on why chosen trade-off was preferred over alternatives.';
        } else if (rationaleLength >= 30) {
          score = 3.5;
          evidence = `Design rationale provided but relatively brief (${rationaleLength} chars).`;
          concern = 'Brief explanation may overlook secondary trade-offs.';
          suggestion = 'Expand on memory vs latency trade-offs.';
        } else {
          score = 2.0;
          evidence = 'Minimal design rationale provided.';
          concern = 'Lacks explanation of key decisions.';
          suggestion = 'Explain at least one core design pattern or abstraction decision.';
        }
      } else if (criterion.criterionKey === 'REQUIREMENT_UNDERSTANDING') {
        if (!checkResult.isValid) {
          score = Math.min(score, 2.5);
          concern = 'One or more required sections were incomplete or omitted.';
          suggestion = 'Review the problem statement functional requirements.';
        }
      }

      criterionResults.push(
        new CriterionResult(
          criterion.criterionKey,
          criterion.name,
          score,
          evidence,
          concern,
          suggestion,
          'HIGH',
        ),
      );
    }

    const totalWeight = applicableCriteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = criterionResults.reduce((sum, res) => {
      const crit = applicableCriteria.find((c) => c.criterionKey === res.criterionKey);
      const weight = crit ? crit.weight : 1 / criterionResults.length;
      return sum + res.score * weight;
    }, 0);

    const overallScore =
      totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 10) / 10
        : Math.round(checkResult.score * 10) / 10;

    return {
      evaluatorType: this.type,
      overallScore,
      overallSummary: `Deterministic Rule Checks: ${checkResult.extractedSummary}. Overall structural score: ${overallScore}/5.`,
      criterionResults,
    };
  }
}
