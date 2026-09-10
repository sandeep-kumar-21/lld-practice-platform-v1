import {
  CriterionResult,
  EvaluatorType,
} from '../../domain/entities/evaluation.entity.js';
import { Rubric } from '../../domain/entities/rubric.entity.js';
import {
  Submission,
  SubmissionFormat,
} from '../../domain/entities/submission.entity.js';
import {
  EvaluationResult,
  IEvaluator,
} from '../../domain/evaluators/evaluator.interface.js';
import { MockLlmEvaluator } from '../../domain/evaluators/mock-llm.evaluator.js';
import { RuleBasedEvaluator } from '../../domain/evaluators/rule-based.evaluator.js';
import {
  ContentAdapterRegistry,
  defaultContentAdapterRegistry,
} from '../../domain/adapters/content-adapter.registry.js';
import { OpenRouterLlmClient } from './openrouter-client.js';

export class MalformedLlmResponseException extends Error {
  constructor(message: string, public readonly rawResponse?: string) {
    super(`Malformed LLM evaluation response: ${message}`);
    this.name = 'MalformedLlmResponseException';
    Object.setPrototypeOf(this, MalformedLlmResponseException.prototype);
  }
}

export interface LlmClient {
  generateCompletion(prompt: string): Promise<string>;
}

export class LlmEvaluator implements IEvaluator {
  public readonly type: EvaluatorType = 'LLM';
  private readonly ruleBasedEvaluator = new RuleBasedEvaluator();
  private readonly fallbackEvaluator = new MockLlmEvaluator();
  private readonly activeClient?: LlmClient;

  constructor(
    client?: LlmClient,
    private readonly apiKey: string = process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.LLM_API_KEY ||
      '',
    private readonly provider: string = process.env.LLM_PROVIDER || 'rule_based',
    private readonly model: string = process.env.LLM_MODEL || 'poolside/laguna-s-2.1:free',
    private readonly adapterRegistry: ContentAdapterRegistry = defaultContentAdapterRegistry,
  ) {
    if (client) {
      this.activeClient = client;
    } else if (this.provider === 'openrouter' && this.apiKey) {
      const timeout = Number(process.env.EVALUATION_TIMEOUT_MS) || 35000;
      this.activeClient = new OpenRouterLlmClient(this.apiKey, this.model, timeout);
    }
  }

  public supports(format: SubmissionFormat | string): boolean {
    return this.adapterRegistry.has(format);
  }

  public async evaluate(
    submission: Submission,
    rubric: Rubric,
  ): Promise<EvaluationResult> {
    if (this.provider === 'mock') {
      return this.fallbackEvaluator.evaluate(submission, rubric);
    }

    // If rule_based provider selected, execute deep static analysis & architectural heuristics
    if (this.provider === 'rule_based' || this.provider === 'rules') {
      return this.ruleBasedEvaluator.evaluate(submission, rubric);
    }

    // If no API key, or client could not be initialized, gracefully fallback
    if (!this.apiKey || !this.activeClient) {
      return this.ruleBasedEvaluator.evaluate(submission, rubric);
    }

    const adapter = this.adapterRegistry.getRequired(submission.format);
    const normalized = adapter.normalize(submission.content);
    const applicableCriteria = rubric.getCriteriaForFormat(submission.format);

    const prompt = this.buildPrompt(
      submission,
      normalized.rawTextRepresentation,
      applicableCriteria,
    );

    let rawOutput: string;
    try {
      rawOutput = await this.activeClient.generateCompletion(prompt);
    } catch (err: any) {
      throw new Error(`LLM network invocation failed: ${err.message}`);
    }

    const parsedResults = this.parseAndValidateResponse(rawOutput, applicableCriteria);

    const totalWeight = applicableCriteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = parsedResults.reduce((sum, res) => {
      const crit = applicableCriteria.find((c) => c.criterionKey === res.criterionKey);
      const weight = crit ? crit.weight : 1 / parsedResults.length;
      return sum + res.score * weight;
    }, 0);

    const overallScore =
      totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 10) / 10
        : 3.5;

    return {
      evaluatorType: this.type,
      overallScore,
      overallSummary: `AI Evaluation (${this.provider}): Assessed ${parsedResults.length} criteria against rubric. Weighted score: ${overallScore}/5.`,
      criterionResults: parsedResults,
    };
  }

  public parseAndValidateResponse(
    raw: string,
    criteria: { criterionKey: string; name: string }[],
  ): CriterionResult[] {
    let cleanJson = raw.trim();
    // Strip markdown code block wrappers if present
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      throw new MalformedLlmResponseException(
        'Response is not valid JSON.',
        raw,
      );
    }

    if (!Array.isArray(parsed)) {
      throw new MalformedLlmResponseException(
        'Expected an array of criterion results.',
        raw,
      );
    }

    const results: CriterionResult[] = [];
    for (const item of parsed) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.criterionId !== 'string' ||
        typeof item.score !== 'number' ||
        typeof item.evidence !== 'string' ||
        typeof item.concern !== 'string' ||
        typeof item.suggestion !== 'string'
      ) {
        throw new MalformedLlmResponseException(
          'One or more criterion evaluation objects missing required fields (criterionId, score, evidence, concern, suggestion).',
          raw,
        );
      }

      if (item.score < 0 || item.score > 5) {
        throw new MalformedLlmResponseException(
          `Criterion score out of bounds: ${item.score}. Must be between 0 and 5.`,
          raw,
        );
      }

      const matchingCriterion = criteria.find(
        (c) => c.criterionKey === item.criterionId,
      );
      const name = matchingCriterion ? matchingCriterion.name : item.criterionId;
      const confidence = ['LOW', 'MEDIUM', 'HIGH'].includes(item.confidence)
        ? item.confidence
        : 'HIGH';

      results.push(
        new CriterionResult(
          item.criterionId,
          name,
          Math.round(item.score * 10) / 10,
          item.evidence,
          item.concern,
          item.suggestion,
          confidence,
        ),
      );
    }

    return results;
  }

  private buildPrompt(
    submission: Submission,
    submissionText: string,
    criteria: { criterionKey: string; name: string; description: string }[],
  ): string {
    return `
You are an expert Low-Level Design (LLD) evaluator.
Evaluate the following learner submission against the provided fixed rubric.

### Learner Submission (${submission.format}):
${submissionText}

### Mandatory Learner Design Rationale:
"${submission.designRationale}"

### Rubric Criteria:
${criteria.map((c) => `- ID: "${c.criterionKey}" | Name: "${c.name}" | Description: ${c.description}`).join('\n')}

### Evaluation Instructions:
- For "evidence": CITE CONCRETE EXCERPTS, class names, method signatures, or design decisions directly from the learner submission or rationale. If an expected element is completely absent, state explicitly: "Not identified in the provided design."
- For "concern": Explain the architectural consequence, coupling risk, concurrency flaw, or SRP violation.
- For "suggestion": Provide an actionable, concrete refactoring recommendation (e.g. which pattern, interface, or separation of concern to introduce).
- For "score": Assign 0.0 to 5.0 (0.0-2.4: Weak/Missing, 2.5-3.4: Adequate, 3.5-5.0: Strong/Exemplary).

### Output Contract:
Return ONLY a valid JSON array of objects conforming to this exact shape, with no conversational preamble or markdown code fences:
[
  {
    "criterionId": "CRITERION_KEY",
    "score": 4.5,
    "evidence": "Direct quote or specific citation of classes/methods from candidate solution",
    "concern": "Specific architectural weakness or risk",
    "suggestion": "Actionable, concrete refactoring recommendation",
    "confidence": "HIGH"
  }
]
`.trim();
  }
}

