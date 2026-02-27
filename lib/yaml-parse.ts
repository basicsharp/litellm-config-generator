import yaml from 'js-yaml';

import type { EnvVarValue, LiteLLMParams, ModelEntry } from '@/lib/schemas';

const KNOWN_PROVIDER_IDS = new Set([
  'openai',
  'azure',
  'anthropic',
  'bedrock',
  'vertex_ai',
  'gemini',
  'groq',
  'mistral',
  'ollama',
  'hosted_vllm',
]);

function parseEnvAwareValue(value: unknown): LiteLLMParams[string] | undefined {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  if (value.startsWith('os.environ/')) {
    const varName = value.slice('os.environ/'.length).trim();
    if (!varName) {
      return undefined;
    }
    const envValue: EnvVarValue = { mode: 'env', varName };
    return envValue;
  }
  const literalValue: EnvVarValue = { mode: 'literal', value };
  return literalValue;
}

function inferProviderAndModel(modelValue: string): { provider: string; model: string } {
  const [prefix, ...rest] = modelValue.split('/');
  if (!prefix || rest.length === 0) {
    return { provider: 'openai', model: modelValue };
  }
  if (KNOWN_PROVIDER_IDS.has(prefix)) {
    return { provider: prefix, model: rest.join('/') };
  }
  return { provider: 'unknown', model: modelValue };
}

function generateId(index: number): string {
  return `imported-${index + 1}`;
}

export function yamlToConfig(content: string): { models: ModelEntry[]; errors: string[] } {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { models: [], errors: [`Invalid YAML: ${message}`] };
  }

  if (!parsed || typeof parsed !== 'object' || !('model_list' in parsed)) {
    return { models: [], errors: ['model_list was not found in YAML input.'] };
  }

  const modelList = (parsed as { model_list?: unknown }).model_list;
  if (!Array.isArray(modelList)) {
    return { models: [], errors: ['model_list must be an array.'] };
  }

  const models: ModelEntry[] = [];
  modelList.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      errors.push(`model_list[${index}] must be an object.`);
      return;
    }

    const modelName = String((entry as { model_name?: unknown }).model_name ?? '').trim();
    const litellmParamsRaw = (entry as { litellm_params?: unknown }).litellm_params;
    if (!litellmParamsRaw || typeof litellmParamsRaw !== 'object') {
      errors.push(`model_list[${index}].litellm_params must be an object.`);
      return;
    }

    const rawParams = litellmParamsRaw as Record<string, unknown>;
    const rawModel = String(rawParams.model ?? '').trim();
    if (!rawModel) {
      errors.push(`model_list[${index}].litellm_params.model is required.`);
      return;
    }

    const { provider, model } = inferProviderAndModel(rawModel);
    const litellm_params: LiteLLMParams = {};

    let rpm: number | undefined;
    let tpm: number | undefined;
    let timeout: number | undefined;
    let stream_timeout: number | undefined;
    let max_retries: number | undefined;

    for (const [key, value] of Object.entries(rawParams)) {
      if (key === 'model') {
        continue;
      }
      if (key === 'rpm' && typeof value === 'number') {
        rpm = value;
        continue;
      }
      if (key === 'tpm' && typeof value === 'number') {
        tpm = value;
        continue;
      }
      if (key === 'timeout' && typeof value === 'number') {
        timeout = value;
        continue;
      }
      if (key === 'stream_timeout' && typeof value === 'number') {
        stream_timeout = value;
        continue;
      }
      if (key === 'max_retries' && typeof value === 'number') {
        max_retries = value;
        continue;
      }

      const parsedValue = parseEnvAwareValue(value);
      if (parsedValue !== undefined) {
        litellm_params[key] = parsedValue;
      }
    }

    models.push({
      id: generateId(index),
      model_name: modelName,
      provider,
      model,
      litellm_params,
      rpm,
      tpm,
      timeout,
      stream_timeout,
      max_retries,
    });
  });

  return { models, errors };
}
