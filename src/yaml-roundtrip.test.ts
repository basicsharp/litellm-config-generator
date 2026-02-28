import { describe, expect, it } from 'vitest';

import { configToYaml } from '@/lib/yaml-gen';
import { yamlToConfig } from '@/lib/yaml-parse';
import type { ModelEntry } from '@/lib/schemas';

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
});
