import { Injectable } from '@nestjs/common';
import { PrismaAttemptRepository } from '../../infrastructure/persistence/prisma-attempt.repository.js';

export interface CriterionAnalytics {
  criterionKey: string;
  criterionName: string;
  averageScore: number;
  evaluationCount: number;
  lowestScore: number;
  highestScore: number;
  status: 'STRONG' | 'ADEQUATE' | 'WEAK';
  advice: string;
}

export interface UserAttemptsSummary {
  userId: string;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  overallAverageScore: number;
  recurringWeaknesses: CriterionAnalytics[];
  strengths: CriterionAnalytics[];
  attempts: any[];
}

@Injectable()
export class UsersService {
  constructor(private readonly attemptRepo: PrismaAttemptRepository) {}

  public async getUserAttempts(userId: string): Promise<UserAttemptsSummary> {
    const attempts = await this.attemptRepo.findAttemptsByUser(userId);

    const criterionScoresMap = new Map<
      string,
      { name: string; scores: number[] }
    >();

    let totalScoreSum = 0;
    let scoredAttemptsCount = 0;

    const formattedAttempts = attempts.map((attempt: any) => {
      const submissions = attempt.submissions || [];
      const evaluatedSubmissions = submissions.filter(
        (s: any) => s.evaluation && s.evaluation.status === 'COMPLETED',
      );

      const latestEvaluated = evaluatedSubmissions[0]; // ordered desc
      const bestScore = evaluatedSubmissions.reduce(
        (max: number, s: any) => Math.max(max, s.evaluation.overallScore),
        0,
      );

      if (latestEvaluated) {
        totalScoreSum += latestEvaluated.evaluation.overallScore;
        scoredAttemptsCount++;

        // Aggregate criteria scores
        const resultsList: any[] = latestEvaluated.evaluation.criterionResults || [];
        for (const res of resultsList) {
          const key = String(res.criterionKey);
          let entry = criterionScoresMap.get(key);
          if (!entry) {
            entry = { name: String(res.criterionName), scores: [] };
            criterionScoresMap.set(key, entry);
          }
          entry.scores.push(Number(res.score));
        }
      }

      return {
        id: attempt.id,
        problemId: attempt.problemId,
        problemTitle: attempt.problem?.title || 'Unknown Problem',
        problemSlug: attempt.problem?.slug || '',
        difficulty: attempt.problem?.difficulty || 'MEDIUM',
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        submissionCount: submissions.length,
        latestScore: latestEvaluated ? latestEvaluated.evaluation.overallScore : null,
        bestScore: bestScore > 0 ? bestScore : null,
        latestSubmissionId: submissions[0]?.id || null,
      };
    });

    // Compute recurring weaknesses
    const allAnalytics: CriterionAnalytics[] = [];
    criterionScoresMap.forEach((val, key) => {
      const count = val.scores.length;
      const sum = val.scores.reduce((a, b) => a + b, 0);
      const avg = Math.round((sum / count) * 10) / 10;
      const min = Math.min(...val.scores);
      const max = Math.max(...val.scores);

      let status: 'STRONG' | 'ADEQUATE' | 'WEAK' = 'ADEQUATE';
      let advice = 'Demonstrates balanced understanding.';

      if (avg < 3.4) {
        status = 'WEAK';
        advice = this.getWeaknessAdvice(key);
      } else if (avg >= 4.2) {
        status = 'STRONG';
        advice = 'Consistently high performance in this architectural pillar.';
      }

      allAnalytics.push({
        criterionKey: key,
        criterionName: val.name,
        averageScore: avg,
        evaluationCount: count,
        lowestScore: min,
        highestScore: max,
        status,
        advice,
      });
    });

    const recurringWeaknesses = allAnalytics
      .filter((a) => a.status === 'WEAK')
      .sort((a, b) => a.averageScore - b.averageScore);

    const strengths = allAnalytics
      .filter((a) => a.status === 'STRONG')
      .sort((a, b) => b.averageScore - a.averageScore);

    return {
      userId,
      totalAttempts: attempts.length,
      completedAttempts: attempts.filter((a) => a.status === 'SUBMITTED').length,
      inProgressAttempts: attempts.filter((a) => a.status === 'IN_PROGRESS').length,
      overallAverageScore:
        scoredAttemptsCount > 0
          ? Math.round((totalScoreSum / scoredAttemptsCount) * 10) / 10
          : 0,
      recurringWeaknesses,
      strengths,
      attempts: formattedAttempts,
    };
  }

  private getWeaknessAdvice(criterionKey: string): string {
    switch (criterionKey) {
      case 'EXTENSIBILITY':
        return 'Consistently low on Extensibility. Focus on applying the Open-Closed Principle and Strategy pattern instead of hardcoded switch statements.';
      case 'COUPLING_COHESION':
        return 'Struggles with Coupling & Cohesion. Rely on dependency injection and domain interfaces rather than direct concrete class dependencies.';
      case 'CLASS_RESPONSIBILITIES':
        return 'Single Responsibility Principle issues detected. Break down coordinator classes into smaller, focused single-purpose service components.';
      case 'ABSTRACTION_AND_PATTERNS':
        return 'Lacks appropriate design pattern usage. Practice identifying when State, Strategy, Observer, or Factory patterns simplify domain workflows.';
      case 'EXPLANATION_QUALITY':
        return 'Design rationale is consistently brief. Always explain the core trade-off considered (e.g. latency vs memory, consistency vs availability).';
      default:
        return 'Focus on addressing the suggestions provided in previous attempt rubric evaluations.';
    }
  }
}

