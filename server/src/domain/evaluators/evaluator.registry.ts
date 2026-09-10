import { EvaluatorType } from '../entities/evaluation.entity.js';
import { SubmissionFormat } from '../entities/submission.entity.js';
import { IEvaluator } from './evaluator.interface.js';

export class EvaluatorRegistry {
  private readonly evaluators: Map<EvaluatorType, IEvaluator> = new Map();

  public register(evaluator: IEvaluator): void {
    this.evaluators.set(evaluator.type, evaluator);
  }

  public get(type: EvaluatorType): IEvaluator | undefined {
    return this.evaluators.get(type);
  }

  public getRequired(type: EvaluatorType): IEvaluator {
    const evaluator = this.get(type);
    if (!evaluator) {
      throw new Error(`Evaluator of type "${type}" is not registered.`);
    }
    return evaluator;
  }

  public getSupportedEvaluators(
    format: SubmissionFormat | string,
  ): IEvaluator[] {
    return Array.from(this.evaluators.values()).filter((e) =>
      e.supports(format),
    );
  }

  public getAll(): IEvaluator[] {
    return Array.from(this.evaluators.values());
  }
}

