import {
  DeterministicCheckIssue,
  DeterministicCheckResult,
  ISubmissionContentAdapter,
  NormalizedSubmissionContent,
} from './adapter.interface.js';
import { DiagramSubmissionContent } from '../entities/submission.entity.js';

/**
 * Concrete implementation proving Change Test A:
 * Allows class diagram submissions (e.g. Mermaid or PlantUML) without altering
 * the core IEvaluator interface or submission flow.
 */
export class DiagramSubmissionAdapter implements ISubmissionContentAdapter {
  public readonly format = 'DIAGRAM';

  public normalize(raw: unknown): NormalizedSubmissionContent {
    const data = (raw || {}) as Partial<DiagramSubmissionContent>;
    const syntax = data.diagramSyntax || 'MERMAID';
    const diagramCode = data.diagramCode?.trim() || '';

    const representation = `
\`\`\`${syntax.toLowerCase()}
${diagramCode}
\`\`\`
`.trim();

    const classMatches = diagramCode.match(/\bclass\s+([A-Za-z0-9_]+)/g) || [];
    const relationMatches =
      diagramCode.match(/(-->|<--|--|\.\.|\*--|o--)/g) || [];

    return {
      format: 'DIAGRAM',
      rawTextRepresentation: representation,
      metadata: {
        diagramSyntax: syntax,
        detectedClassCount: classMatches.length,
        detectedRelationCount: relationMatches.length,
      },
      sectionCount: classMatches.length,
      wordCount: diagramCode.split(/\s+/).filter(Boolean).length,
    };
  }

  public validateStructure(
    content: NormalizedSubmissionContent,
  ): DeterministicCheckResult {
    const issues: DeterministicCheckIssue[] = [];
    const meta = content.metadata as {
      diagramSyntax: string;
      detectedClassCount: number;
      detectedRelationCount: number;
    };

    if (content.wordCount < 5) {
      issues.push({
        field: 'diagramCode',
        message: 'Diagram specification is empty or incomplete.',
        severity: 'ERROR',
      });
    }

    if (meta.detectedClassCount < 2) {
      issues.push({
        field: 'diagramCode',
        message: 'A minimal LLD class diagram should represent at least 2 interacting entities.',
        severity: 'WARNING',
      });
    }

    let score = 5;
    const errors = issues.filter((i) => i.severity === 'ERROR').length;
    const warnings = issues.filter((i) => i.severity === 'WARNING').length;

    score -= errors * 2.0;
    score -= warnings * 0.75;
    score = Math.max(1, Math.min(5, Math.round(score * 10) / 10));

    return {
      isValid: errors === 0,
      score,
      issues,
      extractedSummary: `${meta.diagramSyntax} diagram specifies ${meta.detectedClassCount} classes and ${meta.detectedRelationCount} relationships.`,
    };
  }
}

