import { SubmissionFormat } from './submission.entity.js';

export class RubricCriterion {
  constructor(
    public readonly id: string,
    public readonly rubricId: string,
    public readonly criterionKey: string,
    public readonly name: string,
    public readonly description: string,
    public readonly weight: number,
    public readonly appliesToFormat: SubmissionFormat[],
  ) {}

  public appliesTo(format: SubmissionFormat): boolean {
    return this.appliesToFormat.includes(format);
  }
}

export class Rubric {
  constructor(
    public readonly id: string,
    public readonly version: number,
    public readonly title: string,
    public readonly description: string,
    public readonly isDefault: boolean,
    public readonly criteria: RubricCriterion[],
    public readonly createdAt: Date = new Date(),
  ) {}

  public getCriteriaForFormat(format: SubmissionFormat | string): RubricCriterion[] {
    const matched = this.criteria.filter((c) => c.appliesTo(format as SubmissionFormat));
    return matched.length > 0 ? matched : this.criteria;
  }
}

