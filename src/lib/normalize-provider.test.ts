import { describe, expect, it } from 'vitest';

import { normalizeProviderId } from './normalize-provider';

describe('normalizeProviderId', () => {
  it('maps all vertex_ai sub-providers to vertex_ai', () => {
    expect(normalizeProviderId('vertex_ai')).toBe('vertex_ai');
    expect(normalizeProviderId('vertex_ai-language-models')).toBe('vertex_ai');
    expect(normalizeProviderId('vertex_ai-anthropic_models')).toBe('vertex_ai');
    expect(normalizeProviderId('vertex_ai-mistral_models')).toBe('vertex_ai');
  });

  it('keeps non-vertex providers unchanged', () => {
    expect(normalizeProviderId('openai')).toBe('openai');
    expect(normalizeProviderId('gemini')).toBe('gemini');
    expect(normalizeProviderId('bedrock')).toBe('bedrock');
  });

  it('preserves undefined input', () => {
    expect(normalizeProviderId(undefined)).toBeUndefined();
  });
});
