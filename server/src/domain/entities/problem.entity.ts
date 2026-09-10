export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ExpectedFormat = 'TEXT' | 'CODE' | 'BOTH';

export class Problem {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly title: string,
    public readonly description: string,
    public readonly difficulty: ProblemDifficulty,
    public readonly tags: string[],
    public readonly functionalRequirements: string[],
    public readonly nonFunctionalRequirements: string[],
    public readonly constraints: string[],
    public readonly expectedFormat: ExpectedFormat = 'BOTH',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}

