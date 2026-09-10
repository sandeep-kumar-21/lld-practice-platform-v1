import { EvaluationResult, IEvaluator } from './evaluator.interface.js';
import { DeterministicEvaluator } from './deterministic.evaluator.js';
import { LlmEvaluator } from '../../infrastructure/llm/llm-evaluator.js';
import { Rubric } from '../entities/rubric.entity.js';
import { Submission } from '../entities/submission.entity.js';

export interface PipelineExecutionOptions {
  enableFallbackOnFailure?: boolean;
}

/**
 * EvaluationPipeline (Pipeline / Chain of Responsibility Pattern)
 * Orchestrates multi-phase evaluation:
 *   Phase 1: Deterministic structural & completeness analysis (fast pre-flight).
 *   Phase 2: Judgment & architectural analysis (LLM or pluggable RuleBased evaluators).
 *   Phase 3: Graceful degradation fallback if judgment phase is temporarily unavailable.
 *
 * Directly fulfills Change Test B: New evaluators (e.g. RuleBased, Human Review, Static Linters)
 * can be added or substituted without modifying queue processors or HTTP controllers.
 */
export class EvaluationPipeline {
  private readonly deterministicEvaluator: IEvaluator;
  private readonly judgmentEvaluator: IEvaluator;
  private readonly secondaryEvaluators: IEvaluator[] = [];

  constructor(
    deterministicEvaluator?: IEvaluator,
    judgmentEvaluator?: IEvaluator,
    secondaryEvaluators: IEvaluator[] = [],
  ) {
    this.deterministicEvaluator =
      deterministicEvaluator || new DeterministicEvaluator();
    this.judgmentEvaluator = judgmentEvaluator || new LlmEvaluator();
    this.secondaryEvaluators = secondaryEvaluators;
  }

  public addEvaluator(evaluator: IEvaluator): void {
    this.secondaryEvaluators.push(evaluator);
  }

  /**
   * Executes the evaluation pipeline.
   * Throws if primary evaluator fails and enableFallbackOnFailure is false.
   * Degrades gracefully to deterministic results if fallback is enabled.
   */
  public async execute(
    submission: Submission,
    rubric: Rubric,
    options: PipelineExecutionOptions = { enableFallbackOnFailure: true },
  ): Promise<EvaluationResult> {
    // Phase 1: Fast deterministic pre-flight check
    const deterministicResult = await this.deterministicEvaluator.evaluate(
      submission,
      rubric,
    );

    // Phase 2: Execute any secondary rule-based / linter evaluators
    for (const sec of this.secondaryEvaluators) {
      if (sec.supports(submission.format)) {
        await sec.evaluate(submission, rubric);
      }
    }

    // Phase 3: Primary judgment evaluation (LLM)
    try {
      if (this.judgmentEvaluator.supports(submission.format)) {
        const judgmentResult = await this.judgmentEvaluator.evaluate(
          submission,
          rubric,
        );
        return judgmentResult;
      }
      return deterministicResult;
    } catch (err: any) {
      if (!options.enableFallbackOnFailure) {
        throw err;
      }

      // Graceful degradation: return deterministic result marked as degraded
      return {
        ...deterministicResult,
        isDegraded: true,
        overallSummary: `Graceful Degradation: AI evaluation encountered a temporary issue (${err.message}). Showing deterministic structural checks.`,
      };
    }
  }

  public getDeterministicEvaluator(): IEvaluator {
    return this.deterministicEvaluator;
  }

  public getJudgmentEvaluator(): IEvaluator {
    return this.judgmentEvaluator;
  }
}

