import { describe, it, expect } from 'vitest';
import { DeterministicEvaluator } from '../../src/domain/evaluators/deterministic.evaluator.js';
import { EvaluatorRegistry } from '../../src/domain/evaluators/evaluator.registry.js';
import { MockLlmEvaluator } from '../../src/domain/evaluators/mock-llm.evaluator.js';
import { RuleBasedEvaluator } from '../../src/domain/evaluators/rule-based.evaluator.js';

describe('EvaluatorRegistry (Change Test B verification)', () => {
  it('should register and retrieve evaluators by type', () => {
    const registry = new EvaluatorRegistry();
    const det = new DeterministicEvaluator();
    const mockLlm = new MockLlmEvaluator();

    registry.register(det);
    registry.register(mockLlm);

    expect(registry.get('DETERMINISTIC')).toBe(det);
    expect(registry.get('MOCK_LLM')).toBe(mockLlm);
  });

  it('Change Test B: should register new RuleBasedEvaluator without modifying existing system', () => {
    const registry = new EvaluatorRegistry();
    registry.register(new DeterministicEvaluator());

    const ruleBased = new RuleBasedEvaluator();
    registry.register(ruleBased);

    expect(registry.get('RULE_BASED')).toBe(ruleBased);
    expect(registry.getSupportedEvaluators('CODE')).toContain(ruleBased);
  });

  it('should throw error when requesting unregistered required evaluator', () => {
    const registry = new EvaluatorRegistry();
    expect(() => registry.getRequired('LLM')).toThrow(/not registered/);
  });
});

