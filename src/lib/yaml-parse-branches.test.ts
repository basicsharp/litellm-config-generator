import { describe, expect, it } from 'vitest';

import { configToYaml } from '@/lib/yaml-gen';
import { yamlToConfig } from '@/lib/yaml-parse';
import type { GuardrailEntry, ModelEntry } from '@/lib/schemas';

const baseModel: ModelEntry = {
  id: 'm1',
  model_name: 'alias',
  provider: 'openai',
  model: 'openai/gpt-4o-mini',
  litellm_params: {},
};

describe('yaml parse and gen branch coverage', () => {
  it('parses BOM catalog header and model timeout fields', () => {
    const parsed = yamlToConfig(`\uFEFF# litellm:v1.2.3
model_list:
  - model_name: with-timeouts
    litellm_params:
      model: openai/gpt-4o-mini
      timeout: 12
      stream_timeout: 34
      rpm: 56
      tpm: 78
      max_retries: 2
`);

    expect(parsed.catalogRef).toBe('v1.2.3');
    expect(parsed.errors).toEqual([]);
    expect(parsed.models[0]?.timeout).toBe(12);
    expect(parsed.models[0]?.stream_timeout).toBe(34);
    expect(parsed.models[0]?.rpm).toBe(56);
    expect(parsed.models[0]?.tpm).toBe(78);
    expect(parsed.models[0]?.max_retries).toBe(2);
  });

  it('collects model entry shape errors and keeps parsing', () => {
    const parsed = yamlToConfig(`model_list:
  - not-an-object
  - model_name: invalid-params
    litellm_params: nope
  - model_name: missing-model
    litellm_params:
      model: ""
  - model_name: valid
    litellm_params:
      model: gpt-4o-mini
`);

    expect(parsed.errors.join(' ')).toContain('model_list[0] must be an object.');
    expect(parsed.errors.join(' ')).toContain('model_list[1].litellm_params must be an object.');
    expect(parsed.errors.join(' ')).toContain('model_list[2].litellm_params.model is required.');
    expect(parsed.models).toHaveLength(1);
    expect(parsed.models[0]?.provider).toBe('openai');
    expect(parsed.models[0]?.model).toBe('gpt-4o-mini');
  });

  it('handles malformed guardrails array items and mode normalization defaults', () => {
    const parsed = yamlToConfig(`model_list: []
guardrails:
  - plain-string
  - guardrail_name: missing-params
  - guardrail_name: missing-guardrail
    litellm_params:
      mode: [invalid_mode]
  - guardrail_name: invalid-string-mode
    litellm_params:
      guardrail: presidio
      mode: unsupported_mode
  - guardrail_name: invalid-array-mode
    litellm_params:
      guardrail: presidio
      mode: [invalid_mode]
  - guardrail_name: no-info
    guardrail_info:
      params: []
    litellm_params:
      guardrail: presidio
      mode: [pre_call]
`);

    expect(parsed.errors.join(' ')).toContain('guardrails[0] must be an object.');
    expect(parsed.errors.join(' ')).toContain('guardrails[1].litellm_params must be an object.');
    expect(parsed.errors.join(' ')).toContain(
      'guardrails[2].litellm_params.guardrail is required.'
    );
    expect(parsed.guardrails).toHaveLength(3);
    expect(parsed.guardrails[0]?.mode).toEqual(['pre_call']);
    expect(parsed.guardrails[1]?.mode).toEqual(['pre_call']);
    expect(parsed.guardrails[2]?.guardrail_info).toBeUndefined();
  });

  it('supports configToYaml options overload and trims empty env/literal fields', () => {
    const guardrail: GuardrailEntry = {
      id: 'g1',
      guardrail_name: 'bedrock',
      guardrail: 'bedrock',
      mode: ['pre_call'],
      api_base: '   ',
      api_key: { mode: 'literal', value: '   ' },
      aws_region_name: { mode: 'env', varName: '   ' },
      aws_role_name: { mode: 'literal', value: '   ' },
      _extra: {},
    };

    const outputWithLegacyOverload = configToYaml([baseModel], { catalogRef: '   ' });
    expect(outputWithLegacyOverload.startsWith('# litellm:')).toBe(false);

    const outputWithGuardrails = configToYaml([baseModel], [guardrail], {
      catalogRef: '  v2.0.0  ',
    });
    expect(outputWithGuardrails.startsWith('# litellm:v2.0.0')).toBe(true);
    expect(outputWithGuardrails).not.toContain('api_base:');
    expect(outputWithGuardrails).not.toContain('api_key:');
    expect(outputWithGuardrails).not.toContain('aws_region_name:');
    expect(outputWithGuardrails).not.toContain('aws_role_name:');
  });

  it('parses guardrail provider branches with partial and invalid nested values', () => {
    const parsed = yamlToConfig(`model_list: []
guardrails:
  - guardrail_name: presidio-partial
    guardrail_info: null
    litellm_params:
      guardrail: presidio
      mode: [pre_call]
      language: en
      pii_entities_config:
        CREDIT_CARD: MASK
        INVALID_POLICY: ALLOW
      score_thresholds:
        ALL: 0.5
        BAD: nope
      score_threshold: 0.9
      extra_a: keep
  - guardrail_name: bedrock-min
    litellm_params:
      guardrail: bedrock
      mode: [pre_call]
      api_key: os.environ/BR_KEY
      aws_region_name: us-east-1
      aws_role_name: os.environ/ROLE_NAME
      mask_request_content: false
      disable_exception_on_block: true
      extra_b: keep
  - guardrail_name: azure-min
    litellm_params:
      guardrail: azure/text_moderations
      mode: [pre_call]
      severity_threshold_hate: 2
      categories: [Hate, 1]
      blocklistNames: [my-list, 2]
      haltOnBlocklistHit: true
      outputType: summary
      extra_c: keep
  - guardrail_name: content-min
    litellm_params:
      guardrail: litellm_content_filter
      mode: [pre_call]
      categories: [bad, { category: harmful_violence, action: block }]
      patterns: [bad, { type: name, name: email, action: mask }]
      blocked_words: [bad, { keyword: secret, action: block }]
      extra_d: keep
  - guardrail_name: generic-min
    litellm_params:
      guardrail: generic_guardrail_api
      mode: [pre_call]
      unreachable_fallback: fail_closed
      additional_provider_specific_params:
        threshold: "0.8"
        bad_number: 2
      extra_e: keep
`);

    expect(parsed.errors).toEqual([]);
    expect(parsed.guardrails).toHaveLength(5);

    expect(parsed.guardrails[0]?.pii_entities_config).toEqual({ CREDIT_CARD: 'MASK' });
    expect(parsed.guardrails[0]?.score_thresholds).toEqual({ ALL: 0.5 });
    expect(parsed.guardrails[0]?._extra).toMatchObject({ extra_a: 'keep' });

    expect(parsed.guardrails[1]?.aws_region_name).toEqual({ mode: 'literal', value: 'us-east-1' });
    expect(parsed.guardrails[1]?.aws_role_name).toEqual({ mode: 'env', varName: 'ROLE_NAME' });

    expect(parsed.guardrails[2]?.categories).toEqual(['Hate']);
    expect(parsed.guardrails[2]?.blocklistNames).toEqual(['my-list']);

    expect(parsed.guardrails[3]?.patterns?.[0]).toMatchObject({ name: 'email', type: 'name' });
    expect(parsed.guardrails[3]?.blocked_words?.[0]).toMatchObject({ keyword: 'secret' });

    expect(parsed.guardrails[4]?.additional_provider_specific_params).toEqual({ threshold: '0.8' });
    expect(parsed.guardrails[4]?.unreachable_fallback).toBe('fail_closed');
  });

  it('serializes guardrail api_base and ignores non-env/non-primitive model params', () => {
    const weirdValue = {} as unknown as ModelEntry['litellm_params'][string];
    const modelWithWeirdParam: ModelEntry = {
      ...baseModel,
      id: 'm2',
      litellm_params: {
        weird: weirdValue,
      },
    };

    const guardrail: GuardrailEntry = {
      id: 'g2',
      guardrail_name: 'presidio',
      guardrail: 'presidio',
      mode: ['pre_call'],
      api_base: 'https://guardrail.example',
      _extra: {},
    };

    const yaml = configToYaml([modelWithWeirdParam], [guardrail]);
    expect(yaml).toContain('api_base: https://guardrail.example');
    expect(yaml).not.toContain('weird:');
  });

  it('parses presidio_language and filter_scope plus mixed mode arrays', () => {
    const parsed = yamlToConfig(`model_list: []
guardrails:
  - guardrail_name: presidio-full
    litellm_params:
      guardrail: presidio
      mode: [pre_call, invalid_mode, pre_mcp_call]
      language: de
      presidio_language: es
      filter_scope: both
      output_parse_pii: false
`);

    expect(parsed.errors).toEqual([]);
    expect(parsed.guardrails).toHaveLength(1);
    expect(parsed.guardrails[0]?.mode).toEqual(['pre_call', 'pre_mcp_call']);
    expect(parsed.guardrails[0]?.language).toBe('de');
    expect(parsed.guardrails[0]?.presidio_language).toBe('es');
    expect(parsed.guardrails[0]?.filter_scope).toBe('both');
    expect(parsed.guardrails[0]?.output_parse_pii).toBe(false);
  });

  it('handles non-object api_key, non-array mode, and invalid guardrail_info params entries', () => {
    const parsed = yamlToConfig(`model_list: []
guardrails:
  - guardrail_name: odd-shapes
    guardrail_info:
      params:
        - not-an-object
        - name: missing-type
        - name: valid
          type: string
          description: ok
    litellm_params:
      guardrail: presidio
      mode: {}
      api_key: 123
`);

    expect(parsed.errors).toEqual([]);
    expect(parsed.guardrails).toHaveLength(1);
    expect(parsed.guardrails[0]?.mode).toEqual(['pre_call']);
    expect(parsed.guardrails[0]?.api_key).toBeUndefined();
    expect(parsed.guardrails[0]?.guardrail_info).toEqual({
      params: [{ name: 'valid', type: 'string', description: 'ok' }],
    });
  });
});
