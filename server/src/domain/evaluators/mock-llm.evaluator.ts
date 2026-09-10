import { CriterionResult, EvaluatorType } from '../entities/evaluation.entity.js';
import { Rubric } from '../entities/rubric.entity.js';
import { Submission, SubmissionFormat } from '../entities/submission.entity.js';
import { EvaluationResult, IEvaluator } from './evaluator.interface.js';
import { TextSubmissionAdapter } from '../adapters/text-submission.adapter.js';
import { CodeSubmissionAdapter } from '../adapters/code-submission.adapter.js';

export class MockLlmEvaluator implements IEvaluator {
  public readonly type: EvaluatorType = 'MOCK_LLM';
  private readonly textAdapter = new TextSubmissionAdapter();
  private readonly codeAdapter = new CodeSubmissionAdapter();

  public supports(format: SubmissionFormat | string): boolean {
    return format === 'TEXT' || format === 'CODE' || format === 'DIAGRAM';
  }

  public async evaluate(
    submission: Submission,
    rubric: Rubric,
  ): Promise<EvaluationResult> {
    const adapter =
      submission.format === 'CODE' ? this.codeAdapter : this.textAdapter;
    const normalized = adapter.normalize(submission.content);
    const applicableCriteria = rubric.getCriteriaForFormat(submission.format);

    const hasGoodLength = normalized.wordCount >= 80;
    const hasSolidRationale = submission.designRationale.length >= 70;
    const textRep = normalized.rawTextRepresentation.toLowerCase();

    const mentionsPatterns =
      textRep.includes('strategy') ||
      textRep.includes('factory') ||
      textRep.includes('observer') ||
      textRep.includes('state') ||
      textRep.includes('singleton') ||
      textRep.includes('builder');

    const mentionsSolid =
      textRep.includes('interface') ||
      textRep.includes('srp') ||
      textRep.includes('solid') ||
      textRep.includes('open/closed') ||
      textRep.includes('decoupling');

    const criterionResults: CriterionResult[] = [];

    for (const criterion of applicableCriteria) {
      let score = 3.5;
      let evidence = '';
      let concern = '';
      let suggestion = '';

      switch (criterion.criterionKey) {
        case 'REQUIREMENT_UNDERSTANDING':
          score = hasGoodLength ? 4.2 : 3.0;
          evidence = `Addressed major problem entities and operations (${normalized.wordCount} tokens).`;
          concern = hasGoodLength
            ? 'Minor secondary constraints could be made more explicit.'
            : 'Omitted some edge cases in the functional scope.';
          suggestion =
            'Explicitly list assumptions for peak capacity and failure modes.';
          break;

        case 'CLASS_RESPONSIBILITIES':
          score = mentionsSolid ? 4.4 : 3.2;
          evidence =
            'Separation of entities from business logic and controllers is discernible.';
          concern = mentionsSolid
            ? 'Ensure domain entities do not leak persistence concerns.'
            : 'Risk of god-class or heavy orchestrator taking on too many tasks.';
          suggestion =
            'Enforce Single Responsibility Principle by decoupling dispatching from state management.';
          break;

        case 'COUPLING_COHESION':
          score = mentionsSolid ? 4.3 : 3.0;
          evidence = mentionsSolid
            ? 'Identified clear module boundaries and communication contracts.'
            : 'Concrete classes interact directly with each other.';
          concern = 'Direct dependencies between domain services and concrete implementations.';
          suggestion =
            'Introduce interfaces and apply Dependency Inversion Principle.';
          break;

        case 'ENCAPSULATION_INTERFACE_DESIGN':
          score = 3.8;
          evidence = 'Exposed public interfaces hide internal state representations.';
          concern = 'Potential mutation of internal collections if getters return mutable references.';
          suggestion =
            'Return immutable views or defensive copies from domain entities.';
          break;

        case 'ABSTRACTION_AND_PATTERNS':
          score = mentionsPatterns ? 4.5 : 2.8;
          evidence = mentionsPatterns
            ? 'Appropriately identified design patterns suited to the problem lifecycle.'
            : 'Relies primarily on procedural conditionals rather than polymorphic abstractions.';
          concern = mentionsPatterns
            ? 'Guard against pattern over-engineering for simple behaviors.'
            : 'Missing Strategy or State pattern where algorithms or behaviors vary.';
          suggestion =
            'Use Strategy pattern for swappable algorithms (e.g., pricing, scheduling).';
          break;

        case 'EXTENSIBILITY':
          score = mentionsPatterns && hasGoodLength ? 4.2 : 3.0;
          evidence =
            'New types or features can be added by implementing existing abstractions.';
          concern =
            'Adding new behaviors might require modifying switch statements or conditionals.';
          suggestion =
            'Leverage open-closed design via registries or factory maps.';
          break;

        case 'EDGE_CASES_TESTABILITY':
          score = 3.5;
          evidence = 'Interfaces facilitate mockability and isolated unit testing.';
          concern = 'Concurrency safeguards and race conditions need explicit locks or atomics.';
          suggestion =
            'Specify thread-safety strategies for concurrent state transitions.';
          break;

        case 'EXPLANATION_QUALITY':
          score = hasSolidRationale ? 4.5 : 2.5;
          evidence = `Design rationale explicitly stated: "${submission.designRationale.slice(0, 80)}..."`;
          concern = hasSolidRationale
            ? 'Could further elaborate on trade-offs accepted.'
            : 'Design rationale is too brief to evaluate decision quality.';
          suggestion =
            'Explain why you chose this particular abstraction over alternatives.';
          break;

        default:
          score = 3.5;
          evidence = 'General design principles evaluated.';
          concern = 'Room for enhancement.';
          suggestion = 'Refine domain models.';
          break;
      }

      criterionResults.push(
        new CriterionResult(
          criterion.criterionKey,
          criterion.name,
          Math.round(score * 10) / 10,
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
        : 3.5;

    return {
      evaluatorType: this.type,
      overallScore,
      overallSummary: `Mock LLM Evaluation: Solid low-level design demonstration with clear entity modeling (${normalized.wordCount} tokens, ${normalized.sectionCount} sections analyzed). Weighted score: ${overallScore}/5.`,
      criterionResults,
    };
  }
}

