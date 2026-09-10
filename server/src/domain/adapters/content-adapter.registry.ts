import { ISubmissionContentAdapter } from './adapter.interface.js';
import { TextSubmissionAdapter } from './text-submission.adapter.js';
import { CodeSubmissionAdapter } from './code-submission.adapter.js';
import { DiagramSubmissionAdapter } from './diagram-submission.adapter.js';

export class UnsupportedSubmissionFormatException extends Error {
  constructor(format: string, supported: string[]) {
    super(
      `Unsupported submission format "${format}". Supported formats are: ${supported.join(', ')}.`,
    );
    this.name = 'UnsupportedSubmissionFormatException';
    Object.setPrototypeOf(this, UnsupportedSubmissionFormatException.prototype);
  }
}

/**
 * ContentAdapterRegistry (Registry Pattern)
 * Centralizes discovery and normalization of polymorphic submission formats.
 * Directly fulfills Change Test A by allowing new format adapters (e.g. diagrams, JSON specs)
 * to be registered without modifying core evaluators or submission pipelines.
 */
export class ContentAdapterRegistry {
  private readonly adapters: Map<string, ISubmissionContentAdapter> = new Map();

  constructor(registerDefaults: boolean = true) {
    if (registerDefaults) {
      this.register(new TextSubmissionAdapter());
      this.register(new CodeSubmissionAdapter());
      this.register(new DiagramSubmissionAdapter());
    }
  }

  public register(adapter: ISubmissionContentAdapter): void {
    const key = adapter.format.toUpperCase();
    this.adapters.set(key, adapter);
  }

  public get(format: string): ISubmissionContentAdapter | undefined {
    return this.adapters.get(format.toUpperCase());
  }

  public getRequired(format: string): ISubmissionContentAdapter {
    const adapter = this.get(format);
    if (!adapter) {
      throw new UnsupportedSubmissionFormatException(
        format,
        this.getSupportedFormats(),
      );
    }
    return adapter;
  }

  public getSupportedFormats(): string[] {
    return Array.from(this.adapters.keys());
  }

  public has(format: string): boolean {
    return this.adapters.has(format.toUpperCase());
  }
}

// Global default singleton instance for convenient application-wide access
export const defaultContentAdapterRegistry = new ContentAdapterRegistry();

