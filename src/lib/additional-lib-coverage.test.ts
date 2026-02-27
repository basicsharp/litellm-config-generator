import { describe, expect, it } from 'vitest';

import { getFieldsForProvider, getModelsForProvider, getProviders } from '@/lib/catalog';
import { defaultModelEntry } from '@/lib/form-utils';
import { configToYaml } from '@/lib/yaml-gen';
import { yamlToConfig } from '@/lib/yaml-parse';

describe('additional lib coverage', () => {
  it('returns provider catalog data', () => {
    const providers = getProviders();
    expect(providers.length).toBeGreaterThan(0);

    const firstProvider = providers[0];
    expect(firstProvider).toBeDefined();

    const models = getModelsForProvider(firstProvider.id);
    expect(Array.isArray(models)).toBe(true);

    const fields = getFieldsForProvider(firstProvider.id);
    expect(fields).toHaveProperty('base');
    expect(fields).toHaveProperty('extra');
  });

  it('handles unknown provider safely', () => {
    expect(getModelsForProvider('missing-provider')).toEqual([]);
    expect(getFieldsForProvider('missing-provider')).toEqual({ base: [], extra: [] });
  });

  it('creates default entry shape', () => {
    const entry = defaultModelEntry('anthropic');

    expect(entry.provider).toBe('anthropic');
    expect(entry.model_name).toBe('');
    expect(entry.model).toBe('');
    expect(entry.id.length).toBeGreaterThan(0);
  });

  it('falls back to timestamp id when crypto.randomUUID is unavailable', () => {
    const originalCrypto = globalThis.crypto;

    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true,
    });

    const entry = defaultModelEntry('openai');
    expect(entry.id.startsWith('model-')).toBe(true);

    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('parses yaml model list and env values', () => {
    const yaml = `model_list:
  - model_name: GPT Mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
      rpm: 10
      stream_timeout: 11
  - model_name: Bedrock sonnet
    litellm_params:
      model: bedrock/anthropic.claude-3-5-sonnet
      secret: literal-value
      tpm: 30
      max_retries: 5
`;

    const result = yamlToConfig(yaml);

    expect(result.errors).toEqual([]);
    expect(result.models).toHaveLength(2);
    expect(result.models[0]?.provider).toBe('openai');
    expect(result.models[0]?.model).toBe('gpt-4o-mini');
    expect(result.models[0]?.litellm_params.api_key).toEqual({
      mode: 'env',
      varName: 'OPENAI_API_KEY',
    });
    expect(result.models[0]?.rpm).toBe(10);
    expect(result.models[0]?.stream_timeout).toBe(11);
    expect(result.models[1]?.provider).toBe('bedrock');
    expect(result.models[1]?.litellm_params.secret).toEqual({
      mode: 'literal',
      value: 'literal-value',
    });
    expect(result.models[1]?.tpm).toBe(30);
    expect(result.models[1]?.max_retries).toBe(5);
  });

  it('handles malformed yaml and invalid structures', () => {
    expect(yamlToConfig('model_list: [').errors[0]).toContain('Invalid YAML');
    expect(yamlToConfig('foo: bar').errors).toEqual(['model_list was not found in YAML input.']);
    expect(yamlToConfig('model_list: {}').errors).toEqual(['model_list must be an array.']);
  });

  it('reports missing fields in entries', () => {
    const result = yamlToConfig(`model_list:
  - litellm_params: {}
  - litellm_params:
      model: openai/gpt-4o-mini
  - model_name: x
    litellm_params: "invalid"
  - model_name: y
    litellm_params:
      model: ""
`);

    expect(result.errors.join(' ')).toContain('model_list[0].litellm_params.model is required.');
    expect(result.errors.join(' ')).toContain('model_list[2].litellm_params must be an object.');
    expect(result.errors.join(' ')).toContain('model_list[3].litellm_params.model is required.');
  });

  it('serializes yaml with env/literal/number/boolean and skips invalid params', () => {
    const output = configToYaml([
      {
        id: 'm1',
        model_name: 'alias-1',
        provider: 'openai',
        model: 'openai/gpt-4o-mini',
        litellm_params: {
          api_key: { mode: 'env', varName: 'OPENAI_API_KEY' },
          endpoint: { mode: 'literal', value: 'https://example.com' },
          should_keep: true,
          timeout_ms: 120,
          empty_env: { mode: 'env', varName: '   ' },
          empty_literal: { mode: 'literal', value: '   ' },
        },
        rpm: 10,
        tpm: 20,
        timeout: 30,
        stream_timeout: 40,
        max_retries: 2,
      },
    ]);

    expect(output).toContain('model_name: alias-1');
    expect(output).toContain('api_key: os.environ/OPENAI_API_KEY');
    expect(output).toContain('endpoint: https://example.com');
    expect(output).toContain('should_keep: True');
    expect(output).toContain('timeout_ms: 120');
    expect(output).toContain('rpm: 10');
    expect(output).toContain('tpm: 20');
    expect(output).toContain('timeout: 30');
    expect(output).toContain('stream_timeout: 40');
    expect(output).toContain('max_retries: 2');
    expect(output).not.toContain('empty_env');
    expect(output).not.toContain('empty_literal');
  });

  it('prefixes model with provider for non-openai providers', () => {
    const output = configToYaml([
      {
        id: 'm2',
        model_name: 'vertex-alias',
        provider: 'vertex_ai',
        model: 'gemini-3-pro-preview',
        litellm_params: {},
      },
    ]);

    expect(output).toContain('model: vertex_ai/gemini-3-pro-preview');
  });
});
