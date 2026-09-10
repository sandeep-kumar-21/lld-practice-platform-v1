import {
  DeterministicCheckIssue,
  DeterministicCheckResult,
  ISubmissionContentAdapter,
  NormalizedSubmissionContent,
} from './adapter.interface.js';
import { TextSubmissionContent } from '../entities/submission.entity.js';

export class TextSubmissionAdapter implements ISubmissionContentAdapter {
  public readonly format = 'TEXT';

  public normalize(raw: unknown): NormalizedSubmissionContent {
    const textData = (raw || {}) as Partial<TextSubmissionContent>;
    const reqs = textData.requirementsAndAssumptions?.trim() || '';
    const classes = textData.classesAndResponsibilities?.trim() || '';
    const relationships = textData.relationshipsAndPatterns?.trim() || '';
    const tradeoffs = textData.tradeoffsAndExtensibility?.trim() || '';

    const representation = `
### 1. Requirements & Assumptions
${reqs}

### 2. Classes & Responsibilities
${classes}

### 3. Key Relationships & Design Patterns
${relationships}

### 4. Trade-offs & Extensibility
${tradeoffs}
`.trim();

    const sections = [reqs, classes, relationships, tradeoffs].filter(
      (s) => s.length > 0,
    );
    const wordCount = representation.split(/\s+/).filter(Boolean).length;

    return {
      format: 'TEXT',
      rawTextRepresentation: representation,
      metadata: {
        hasRequirements: reqs.length > 0,
        hasClasses: classes.length > 0,
        hasRelationships: relationships.length > 0,
        hasTradeoffs: tradeoffs.length > 0,
      },
      sectionCount: sections.length,
      wordCount,
    };
  }

  public validateStructure(
    content: NormalizedSubmissionContent,
  ): DeterministicCheckResult {
    const issues: DeterministicCheckIssue[] = [];
    const meta = content.metadata as {
      hasRequirements: boolean;
      hasClasses: boolean;
      hasRelationships: boolean;
      hasTradeoffs: boolean;
    };

    if (!meta.hasRequirements) {
      issues.push({
        field: 'requirementsAndAssumptions',
        message: 'Missing Requirements & Assumptions section.',
        severity: 'ERROR',
      });
    }
    if (!meta.hasClasses) {
      issues.push({
        field: 'classesAndResponsibilities',
        message: 'Missing Classes & Responsibilities section.',
        severity: 'ERROR',
      });
    }
    if (!meta.hasRelationships) {
      issues.push({
        field: 'relationshipsAndPatterns',
        message: 'Missing Relationships & Patterns section.',
        severity: 'WARNING',
      });
    }
    if (!meta.hasTradeoffs) {
      issues.push({
        field: 'tradeoffsAndExtensibility',
        message: 'Missing Trade-offs & Extensibility section.',
        severity: 'WARNING',
      });
    }

    let score = 5;
    const errors = issues.filter((i) => i.severity === 'ERROR').length;
    const warnings = issues.filter((i) => i.severity === 'WARNING').length;

    score -= errors * 1.5;
    score -= warnings * 0.75;
    if (content.wordCount < 60) score -= 1.0;
    score = Math.max(1, Math.min(5, Math.round(score * 10) / 10));

    return {
      isValid: errors === 0,
      score,
      issues,
      extractedSummary: `Text submission contains ${content.sectionCount}/4 core design sections (${content.wordCount} words).`,
    };
  }
}

