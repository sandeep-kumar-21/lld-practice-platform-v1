import { describe, it, expect } from 'vitest';
import { CriterionResult } from '../../src/domain/entities/evaluation.entity.js';
import { RubricCriterion } from '../../src/domain/entities/rubric.entity.js';
import { WeightedScoreCalculator } from '../../src/domain/scoring/weighted-score-calculator.js';

describe('WeightedScoreCalculator', () => {
  const criteria: RubricCriterion[] = [
    new RubricCriterion('c1', 'r1', 'K1', 'Criterion 1', 'Desc 1', 0.25, ['TEXT']),
    new RubricCriterion('c2', 'r1', 'K2', 'Criterion 2', 'Desc 2', 0.25, ['TEXT']),
    new RubricCriterion('c3', 'r1', 'K3', 'Criterion 3', 'Desc 3', 0.5, ['TEXT']),
  ];

  it('should calculate normalized weighted average accurately', () => {
    const results: CriterionResult[] = [
      new CriterionResult('K1', 'Criterion 1', 4.0, 'ev', 'con', 'sug'),
      new CriterionResult('K2', 'Criterion 2', 3.0, 'ev', 'con', 'sug'),
      new CriterionResult('K3', 'Criterion 3', 5.0, 'ev', 'con', 'sug'),
    ];

    // (4.0 * 0.25) + (3.0 * 0.25) + (5.0 * 0.50) = 1.0 + 0.75 + 2.5 = 4.25 -> 4.3 rounded
    const score = WeightedScoreCalculator.calculate(results, criteria);
    expect(score).toBe(4.3);
  });

  it('should compute version deltas correctly between attempts', () => {
    const prevResults: CriterionResult[] = [
      new CriterionResult('K1', 'Criterion 1', 3.0, 'ev', 'con', 'sug'),
      new CriterionResult('K2', 'Criterion 2', 4.0, 'ev', 'con', 'sug'),
      new CriterionResult('K3', 'Criterion 3', 3.0, 'ev', 'con', 'sug'),
    ];
    const currResults: CriterionResult[] = [
      new CriterionResult('K1', 'Criterion 1', 4.0, 'ev', 'con', 'sug'), // +1.0 -> IMPROVED
      new CriterionResult('K2', 'Criterion 2', 4.1, 'ev', 'con', 'sug'), // +0.1 -> SAME (under 0.2 threshold)
      new CriterionResult('K3', 'Criterion 3', 2.0, 'ev', 'con', 'sug'), // -1.0 -> REGRESSED
    ];

    const comparison = WeightedScoreCalculator.compareVersions(
      currResults,
      3.8,
      prevResults,
      3.3,
    );

    expect(comparison.hasPreviousVersion).toBe(true);
    expect(comparison.improvedCount).toBe(1);
    expect(comparison.sameCount).toBe(1);
    expect(comparison.regressedCount).toBe(1);
    expect(comparison.overallDelta).toBe('IMPROVED');

    const k1 = comparison.comparisons.find((c) => c.criterionKey === 'K1');
    expect(k1?.delta).toBe('IMPROVED');
    expect(k1?.scoreDifference).toBe(1.0);

    const k3 = comparison.comparisons.find((c) => c.criterionKey === 'K3');
    expect(k3?.delta).toBe('REGRESSED');
    expect(k3?.scoreDifference).toBe(-1.0);
  });
});

