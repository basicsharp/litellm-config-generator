import { describe, expect, it } from 'vitest';

import { configToYaml } from '@/lib/yaml-gen';
import { yamlToConfig } from '@/lib/yaml-parse';
import type { GuardrailEntry, ModelEntry } from '@/lib/schemas';

describe('yaml round-trip', () => {
  it('handles openai literal key', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'gpt-4o-alias',
        provider: 'openai',
        model: 'openai/gpt-4o',
        litellm_params: {
          api_key: { mode: 'literal', value: 'sk-test' },
        },
      },
    ];

    const yaml = configToYaml(models);
    const parsed = yamlToConfig(yaml);

    expect(parsed.errors).toEqual([]);
    expect(parsed.models[0]?.litellm_params.api_key).toEqual({ mode: 'literal', value: 'sk-test' });
  });

  it('handles azure env key', () => {
    const yaml = `model_list:\n  - model_name: azure-model\n    litellm_params:\n      model: azure/gpt-4\n      api_key: os.environ/AZURE_API_KEY\n`;
    const parsed = yamlToConfig(yaml);

    expect(parsed.errors).toEqual([]);
    expect(parsed.models[0]?.provider).toBe('azure');
    expect(parsed.models[0]?.litellm_params.api_key).toEqual({
      mode: 'env',
      varName: 'AZURE_API_KEY',
    });
  });

  it('preserves unknown provider model value', () => {
    const yaml = `model_list:\n  - model_name: cohere-command\n    litellm_params:\n      model: cohere/command-r-plus\n      api_key: os.environ/COHERE_KEY\n`;
    const parsed = yamlToConfig(yaml);

    expect(parsed.errors).toEqual([]);
    expect(parsed.models[0]?.provider).toBe('unknown');
    expect(parsed.models[0]?.model).toBe('cohere/command-r-plus');
  });

  it('writes and reads catalog ref header comment', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'alias',
        provider: 'openai',
        model: 'openai/gpt-4o-mini',
        litellm_params: {},
      },
    ];

    const yaml = configToYaml(models, { catalogRef: 'v1.81.14.rc.2' });
    expect(yaml.startsWith('# litellm:v1.81.14.rc.2\n')).toBe(true);

    const parsed = yamlToConfig(yaml);
    expect(parsed.catalogRef).toBe('v1.81.14.rc.2');
    expect(parsed.errors).toEqual([]);
  });

  it('does not parse catalog ref when comment is not the first line', () => {
    const yaml = `\n# litellm:v1.2.3\nmodel_list:\n  - model_name: x\n    litellm_params:\n      model: openai/gpt-4o-mini\n`;
    const parsed = yamlToConfig(yaml);
    expect(parsed.catalogRef).toBeNull();
  });

  it('serializes and parses guardrails across provider shapes', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'alias',
        provider: 'openai',
        model: 'openai/gpt-4o-mini',
        litellm_params: {},
      },
    ];

    const guardrails: GuardrailEntry[] = [
      {
        id: 'g1',
        guardrail_name: 'content-filter',
        guardrail: 'litellm_content_filter',
        mode: ['pre_call'],
        default_on: false,
        categories: [
          {
            category: 'harmful_violence',
            enabled: true,
            action: 'block',
            severity_threshold: 3,
          },
        ],
        patterns: [{ type: 'name', name: 'email', action: 'block' }],
        blocked_words: [{ keyword: 'secret', action: 'block' }],
        guardrail_info: {
          params: [{ name: 'threshold', type: 'number', description: 'risk threshold' }],
        },
        _extra: { custom_flag: true },
      },
      {
        id: 'g2',
        guardrail_name: 'bedrock-guard',
        guardrail: 'bedrock',
        mode: ['pre_call', 'post_call'],
        default_on: true,
        guardrailIdentifier: 'abc123',
        guardrailVersion: 'DRAFT',
        aws_region_name: { mode: 'env', varName: 'AWS_REGION' },
        aws_role_name: { mode: 'env', varName: 'AWS_ROLE' },
        _extra: {},
      },
      {
        id: 'g3',
        guardrail_name: 'generic-guard',
        guardrail: 'generic_guardrail_api',
        mode: ['pre_call'],
        unreachable_fallback: 'fail_open',
        additional_provider_specific_params: { threshold: '0.8', lang: 'en' },
        _extra: { passthrough: 'value' },
      },
    ];

    const yaml = configToYaml(models, guardrails);
    expect(yaml).toContain('guardrails:');
    expect(yaml).toContain('mode:');
    expect(yaml).toContain('- pre_call');

    const parsed = yamlToConfig(yaml);
    expect(parsed.errors).toEqual([]);
    expect(parsed.guardrails).toHaveLength(3);
    expect(parsed.guardrails[0]?.guardrail).toBe('litellm_content_filter');
    expect(parsed.guardrails[1]?.guardrailIdentifier).toBe('abc123');
    expect(parsed.guardrails[1]?.aws_region_name).toEqual({ mode: 'env', varName: 'AWS_REGION' });
    expect(parsed.guardrails[2]?._extra).toMatchObject({ passthrough: 'value' });
  });

  it('returns empty guardrails when key is missing and normalizes mode strings', () => {
    const withoutGuardrails = yamlToConfig(
      `model_list:\n  - model_name: m\n    litellm_params:\n      model: openai/gpt-4o-mini\n`
    );
    expect(withoutGuardrails.guardrails).toEqual([]);

    const withStringMode = yamlToConfig(`model_list: []
guardrails:
  - guardrail_name: test
    litellm_params:
      guardrail: presidio
      mode: pre_call
      api_key: os.environ/GUARDRAIL_KEY
      on_flagged: block
`);
    expect(withStringMode.errors).toEqual([]);
    expect(withStringMode.guardrails[0]?.mode).toEqual(['pre_call']);
    expect(withStringMode.guardrails[0]?.api_key).toEqual({
      mode: 'env',
      varName: 'GUARDRAIL_KEY',
    });
    expect(withStringMode.guardrails[0]?._extra).toMatchObject({ on_flagged: 'block' });
  });

  it('collects errors for invalid guardrail entries without aborting', () => {
    const parsed = yamlToConfig(`model_list: []
guardrails:
  - litellm_params:
      guardrail: presidio
      mode: pre_call
  - guardrail_name: valid
    litellm_params:
      guardrail: generic_guardrail_api
      mode: [pre_call]
`);

    expect(parsed.errors.join(' ')).toContain('guardrail_name is required');
    expect(parsed.guardrails).toHaveLength(1);
    expect(parsed.guardrails[0]?.guardrail_name).toBe('valid');
  });

  it('serializes and parses model-level guardrails', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'claude-sonnet-4',
        provider: 'anthropic',
        model: 'anthropic/claude-sonnet-4-20250514',
        litellm_params: { guardrails: ['azure-text-moderation'] },
      },
    ];

    const yaml = configToYaml(models);
    expect(yaml).toContain('guardrails:');
    expect(yaml).toContain('- azure-text-moderation');

    const parsed = yamlToConfig(yaml);
    expect(parsed.errors).toEqual([]);
    expect(parsed.models[0]?.litellm_params.guardrails).toEqual(['azure-text-moderation']);
  });
});
