# ADR-004: Evaluation Rubric Management — Versioned, Immutable Database Rubrics

## Status
Accepted

## Context
LLD evaluation accuracy relies on consistent grading standards. If rubric definitions or weights change over time, past submissions must preserve their original scoring context to maintain historical validity and version-to-version improvement tracking.

## Decision
We persisted rubrics as versioned database entities (`Rubric` and `RubricCriterion` in Prisma/MySQL) with immutable revision numbers (`version: 1`).
- When a rubric is updated, a new version is created rather than mutating existing rows.
- Each `Evaluation` stores the explicit criterion scores and weights evaluated at that point in time.

## Alternatives Considered
- *Hardcoded JSON rubric in code*: Lacks dynamic database queries, prevents administrative updates without redeployment.
- *Unversioned mutable database table*: Overwrites past criteria, corrupting historical learner score comparisons.

## Consequences
- Historical evaluations remain 100% reproducible and tamper-proof.
- New rubrics can be tested against beta problem cohorts without affecting active evaluations.

