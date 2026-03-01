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

describe('guardrail yaml serialization and parsing', () => {
  it('omits guardrails key when guardrails is empty', () => {
    const output = configToYaml([baseModel], []);
    expect(output).toContain('model_list:');
    expect(output).not.toContain('guardrails:');
  });

  it('serializes provider-specific fields and omits default_on false', () => {
    const guardrails: GuardrailEntry[] = [
      {
        id: 'p',
        guardrail_name: 'presidio',
        guardrail: 'presidio',
        mode: ['pre_call', 'post_call'],
        default_on: false,
        language: 'en',
        presidio_language: 'en',
        filter_scope: 'both',
        output_parse_pii: true,
        pii_entities_config: { CREDIT_CARD: 'MASK' },
        score_thresholds: { ALL: 0.7 },
        score_threshold: 0.8,
        _extra: { custom_key: 'custom_value' },
      },
      {
        id: 'b',
        guardrail_name: 'bedrock',
        guardrail: 'bedrock',
        mode: ['pre_call'],
        default_on: true,
        api_key: { mode: 'env', varName: 'BR_KEY' },
        guardrailIdentifier: 'id',
        guardrailVersion: 'DRAFT',
        aws_region_name: { mode: 'env', varName: 'AWS_REGION' },
        aws_role_name: { mode: 'env', varName: 'AWS_ROLE' },
        mask_request_content: true,
        mask_response_content: true,
        disable_exception_on_block: true,
        _extra: {},
      },
      {
        id: 'a',
        guardrail_name: 'azure',
        guardrail: 'azure/text_moderations',
        mode: ['pre_call'],
        severity_threshold: 4,
        severity_threshold_hate: 3,
        severity_threshold_self_harm: 2,
        severity_threshold_sexual: 1,
        severity_threshold_violence: 5,
        categories: ['Hate', 'Sexual'],
        blocklistNames: ['my-list'],
        haltOnBlocklistHit: true,
        outputType: 'summary',
        _extra: {},
      },
      {
        id: 'c',
        guardrail_name: 'content',
        guardrail: 'litellm_content_filter',
        mode: ['pre_call'],
        categories: [{ category: 'harmful_violence', action: 'block', enabled: true }],
        patterns: [{ type: 'name', name: 'email', action: 'block' }],
        blocked_words: [{ keyword: 'secret', action: 'block' }],
        _extra: {},
      },
      {
        id: 'g',
        guardrail_name: 'generic',
        guardrail: 'generic_guardrail_api',
        mode: ['pre_call'],
        unreachable_fallback: 'fail_open',
        additional_provider_specific_params: { threshold: '0.8' },
        guardrail_info: {
          params: [{ name: 'x', type: 'string', description: 'desc' }],
        },
        _extra: {},
      },
    ];

    const output = configToYaml([baseModel], guardrails);
    expect(output).toContain('guardrails:');
    expect(output).toContain('mode:');
    expect(output).toContain('- pre_call');
    expect(output).not.toContain('default_on: false');
    expect(output).toContain('default_on: True');
    expect(output).toContain('api_key: os.environ/BR_KEY');
    expect(output).toContain('custom_key: custom_value');
    expect(output).toContain('guardrail_info:');
  });

  it('parses guardrail providers and captures _extra fields', () => {
    const parsed = yamlToConfig(`model_list:
  - model_name: alias
    litellm_params:
      model: openai/gpt-4o-mini
guardrails:
  - guardrail_name: presidio-guard
    guardrail_info:
      params:
        - name: threshold
          type: number
          description: risk
    litellm_params:
      guardrail: presidio
      mode: pre_call
      api_key: os.environ/P_KEY
      language: en
      output_parse_pii: true
      score_threshold: 0.7
      custom_extra: keep-me
  - guardrail_name: bedrock-guard
    litellm_params:
      guardrail: bedrock
      mode: [pre_call, post_call]
      guardrailIdentifier: abc
      guardrailVersion: DRAFT
      aws_region_name: os.environ/AWS_REGION
      aws_role_name: os.environ/AWS_ROLE
      mask_request_content: true
      mask_response_content: false
      disable_exception_on_block: true
  - guardrail_name: azure-shield
    litellm_params:
      guardrail: azure/prompt_shield
      mode: pre_call
  - guardrail_name: azure-moderation
    litellm_params:
      guardrail: azure/text_moderations
      mode: pre_call
      severity_threshold: 4
      severity_threshold_hate: 3
      severity_threshold_self_harm: 2
      severity_threshold_sexual: 1
      severity_threshold_violence: 5
      categories: [Hate, Sexual]
      blocklistNames: [default]
      haltOnBlocklistHit: true
      outputType: summary
  - guardrail_name: content-filter
    litellm_params:
      guardrail: litellm_content_filter
      mode: pre_call
      categories:
        - category: harmful_violence
          action: block
          enabled: true
      patterns:
        - type: name
          name: email
          action: block
      blocked_words:
        - keyword: secret
          action: block
  - guardrail_name: generic
    litellm_params:
      guardrail: generic_guardrail_api
      mode: pre_call
      unreachable_fallback: fail_open
      additional_provider_specific_params:
        threshold: "0.8"
`);

    expect(parsed.errors).toEqual([]);
    expect(parsed.guardrails).toHaveLength(6);
    expect(parsed.guardrails[0]?.api_key).toEqual({ mode: 'env', varName: 'P_KEY' });
    expect(parsed.guardrails[0]?.guardrail_info?.params[0]?.name).toBe('threshold');
    expect(parsed.guardrails[0]?._extra.custom_extra).toBe('keep-me');
    expect(parsed.guardrails[1]?.guardrailIdentifier).toBe('abc');
    expect(parsed.guardrails[2]?.guardrail).toBe('azure/prompt_shield');
    expect(parsed.guardrails[3]?.categories).toEqual(['Hate', 'Sexual']);
    expect(parsed.guardrails[4]?.patterns?.[0]?.type).toBe('name');
    expect(parsed.guardrails[5]?.unreachable_fallback).toBe('fail_open');
  });

  it('collects errors for invalid guardrail entries while keeping valid ones', () => {
    const parsed = yamlToConfig(`model_list: []
guardrails:
  - guardrail_name: ""
    litellm_params:
      guardrail: presidio
      mode: pre_call
  - guardrail_name: valid
    litellm_params:
      guardrail: generic_guardrail_api
      mode: [pre_call]
`);

    expect(parsed.errors.join(' ')).toContain('guardrail_name is required');
    expect(parsed.guardrails).toHaveLength(1);
  });
});
