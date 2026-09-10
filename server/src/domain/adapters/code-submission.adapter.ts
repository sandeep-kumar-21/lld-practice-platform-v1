import {
  DeterministicCheckIssue,
  DeterministicCheckResult,
  ISubmissionContentAdapter,
  NormalizedSubmissionContent,
} from './adapter.interface.js';
import { CodeSubmissionContent } from '../entities/submission.entity.js';

export class CodeSubmissionAdapter implements ISubmissionContentAdapter {
  public readonly format = 'CODE';

  public normalize(raw: unknown): NormalizedSubmissionContent {
    const codeData = (raw || {}) as Partial<CodeSubmissionContent>;
    const code = codeData.code?.trim() || '';
    const language = codeData.language?.trim() || 'typescript';

    const representation = `
\`\`\`${language}
${code}
\`\`\`
`.trim();

    const lines = code.split('\n');
    const wordCount = code.split(/\s+/).filter(Boolean).length;
    const hasInterfaces = /\b(interface|abstract class|trait|protocol)\b/i.test(code);
    const hasClasses = /\b(class|struct)\b/i.test(code);
    const hasMethods = /\b(function|def|public|private|protected)\b/i.test(code);

    return {
      format: 'CODE',
      rawTextRepresentation: representation,
      metadata: {
        language,
        lineCount: lines.length,
        hasInterfaces,
        hasClasses,
        hasMethods,
      },
      sectionCount: (hasInterfaces ? 1 : 0) + (hasClasses ? 1 : 0) + (hasMethods ? 1 : 0),
      wordCount,
    };
  }

  public validateStructure(
    content: NormalizedSubmissionContent,
  ): DeterministicCheckResult {
    const issues: DeterministicCheckIssue[] = [];
    const meta = content.metadata as {
      language: string;
      lineCount: number;
      hasInterfaces: boolean;
      hasClasses: boolean;
      hasMethods: boolean;
    };

    if (content.wordCount < 10) {
      issues.push({
        field: 'code',
        message: 'Code implementation is too short or empty.',
        severity: 'ERROR',
      });
    }

    if (!meta.hasClasses && !meta.hasInterfaces) {
      issues.push({
        field: 'code',
        message: 'No class or interface abstractions identified in solution.',
        severity: 'ERROR',
      });
    }

    if (!meta.hasInterfaces) {
      issues.push({
        field: 'code',
        message: 'No interface or abstract class declarations found for decoupling.',
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
      extractedSummary: `Code solution in ${meta.language} contains ${meta.lineCount} lines (${content.wordCount} tokens).`,
    };
  }
}

