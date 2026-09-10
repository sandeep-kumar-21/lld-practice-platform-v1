import OpenAI from 'openai';
import { LlmClient } from './llm-evaluator.js';

/**
 * OpenRouterLlmClient
 * Uses the OpenAI SDK targeting OpenRouter's API endpoint with
 * reasoning parameters enabled for google/gemma-4-31b-it:free,
 * with automatic fallback to active OpenRouter free models (Nemotron 3 Super, Nemotron 3 Ultra, Laguna).
 */
export class OpenRouterLlmClient implements LlmClient {
  private readonly client: OpenAI;
  private readonly candidateModels: string[];

  constructor(
    private readonly apiKey: string,
    private readonly model: string = process.env.LLM_MODEL || 'poolside/laguna-s-2.1:free',
    private readonly timeoutMs: number = 35000,
    private readonly baseURL: string = process.env.OPENROUTER_BASE_URL ||
      'https://openrouter.ai/api/v1',
  ) {
    this.client = new OpenAI({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LLD Practice Platform',
      },
    });

    // Primary model first, followed by resilient free fallbacks from OpenRouter
    const fallbackList = [
      this.model,
      'poolside/laguna-s-2.1:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'cohere/north-mini-code:free',
      'google/gemma-4-31b-it:free',
    ];
    this.candidateModels = Array.from(new Set(fallbackList));
  }

  public async generateCompletion(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required but was not provided.');
    }

    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () =>
          reject(
            new Error(
              `OpenRouter API request timed out after ${this.timeoutMs}ms.`,
            ),
          ),
        this.timeoutMs,
      );
    });

    const executionPromise = (async () => {
      let lastError: any = null;

      for (const targetModel of this.candidateModels) {
        try {
          const apiResponse = await this.client.chat.completions.create({
            model: targetModel,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.2,
            // OpenRouter reasoning configuration
            ...({ reasoning: { enabled: true } } as any),
          });

          const choice = apiResponse.choices?.[0];
          const content = choice?.message?.content;

          if (content) {
            return content;
          }
        } catch (err: any) {
          lastError = err;
          const isRateOrPoolLimit =
            err?.status === 429 ||
            err?.message?.includes('rate-limit') ||
            err?.message?.includes('temporarily rate-limited') ||
            err?.error?.metadata?.raw?.includes('rate-limited');

          // If rate-limited upstream on this free model, attempt the next free model in the cascade
          if (isRateOrPoolLimit) {
            continue;
          }
          throw err;
        }
      }

      throw new Error(
        `All OpenRouter candidate models exhausted. Last error: ${lastError?.message || lastError}`,
      );
    })();

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}

