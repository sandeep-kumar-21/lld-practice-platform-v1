import { CriterionResult } from '../entities/evaluation.entity.js';
import { RubricCriterion } from '../entities/rubric.entity.js';

export type CriterionScoreDelta = 'IMPROVED' | 'SAME' | 'REGRESSED';

export interface CriterionComparison {
  criterionKey: string;
  criterionName: string;
  currentScore: number;
  previousScore: number;
  scoreDifference: number;
  delta: CriterionScoreDelta;
  summary: string;
}

export interface VersionComparisonResult {
  hasPreviousVersion: boolean;
  currentOverallScore: number;
  previousOverallScore?: number;
  overallScoreDifference?: number;
  overallDelta?: CriterionScoreDelta;
  comparisons: CriterionComparison[];
  improvedCount: number;
  sameCount: number;
  regressedCount: number;
}

export class WeightedScoreCalculator {
  /**
   * Computes the normalized weighted average score across all applicable rubric criteria.
   *
   * Formula:
   * S_overall = Sum(score_i * (weight_i / Sum(weight_k)))
   * Rounded to 1 decimal place (scale 0.0 - 5.0).
   */
  public static calculate(
    criterionResults: CriterionResult[],
    criteria: RubricCriterion[],
  ): number {
    if (criterionResults.length === 0 || criteria.length === 0) {
      return 0;
    }

    const weightMap = new Map<string, number>();
    let totalApplicableWeight = 0;

    for (const c of criteria) {
      weightMap.set(c.criterionKey, c.weight);
      totalApplicableWeight += c.weight;
    }

    if (totalApplicableWeight <= 0) {
      totalApplicableWeight = 1.0;
    }

    let weightedScoreSum = 0;
    let countedWeight = 0;

    for (const res of criterionResults) {
      const weight = weightMap.get(res.criterionKey) ?? 1 / criterionResults.length;
      weightedScoreSum += res.score * weight;
      countedWeight += weight;
    }

    const normalizedTotal =
      countedWeight > 0 ? weightedScoreSum / countedWeight : 0;

    return Math.round(normalizedTotal * 10) / 10;
  }

  /**
   * Compares the evaluation of the current submission against the previous submission on the same attempt.
   * Identifies per-criterion deltas (IMPROVED | SAME | REGRESSED) with a significance threshold of 0.2 points.
   */
  public static compareVersions(
    currentResults: CriterionResult[],
    currentOverallScore: number,
    previousResults?: CriterionResult[] | null,
    previousOverallScore?: number | null,
  ): VersionComparisonResult {
    if (
      !previousResults ||
      previousResults.length === 0 ||
      previousOverallScore === undefined ||
      previousOverallScore === null
    ) {
      return {
        hasPreviousVersion: false,
        currentOverallScore,
        comparisons: [],
        improvedCount: 0,
        sameCount: 0,
        regressedCount: 0,
      };
    }

    const prevMap = new Map<string, CriterionResult>();
    for (const p of previousResults) {
      prevMap.set(p.criterionKey, p);
    }

    const comparisons: CriterionComparison[] = [];
    let improvedCount = 0;
    let sameCount = 0;
    let regressedCount = 0;
    const SIGNIFICANCE_THRESHOLD = 0.2;

    for (const curr of currentResults) {
      const prev = prevMap.get(curr.criterionKey);
      const prevScore = prev ? prev.score : 0;
      const diff = Math.round((curr.score - prevScore) * 10) / 10;

      let delta: CriterionScoreDelta = 'SAME';
      let summary = `Score remained consistent at ${curr.score}/5.`;

      if (diff >= SIGNIFICANCE_THRESHOLD) {
        delta = 'IMPROVED';
        summary = `Improved by +${diff} points (from ${prevScore} to ${curr.score}).`;
        improvedCount++;
      } else if (diff <= -SIGNIFICANCE_THRESHOLD) {
        delta = 'REGRESSED';
        summary = `Regressed by ${diff} points (from ${prevScore} to ${curr.score}).`;
        regressedCount++;
      } else {
        sameCount++;
      }

      comparisons.push({
        criterionKey: curr.criterionKey,
        criterionName: curr.criterionName,
        currentScore: curr.score,
        previousScore: prevScore,
        scoreDifference: diff,
        delta,
        summary,
      });
    }

    const overallDiff =
      Math.round((currentOverallScore - previousOverallScore) * 10) / 10;
    let overallDelta: CriterionScoreDelta = 'SAME';
    if (overallDiff >= SIGNIFICANCE_THRESHOLD) {
      overallDelta = 'IMPROVED';
    } else if (overallDiff <= -SIGNIFICANCE_THRESHOLD) {
      overallDelta = 'REGRESSED';
    }

    return {
      hasPreviousVersion: true,
      currentOverallScore,
      previousOverallScore,
      overallScoreDifference: overallDiff,
      overallDelta,
      comparisons,
      improvedCount,
      sameCount,
      regressedCount,
    };
  }
}

