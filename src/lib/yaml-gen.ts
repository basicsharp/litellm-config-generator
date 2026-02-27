import yaml from 'js-yaml';

import type { EnvVarValue, LiteLLMParams, ModelEntry } from '@/lib/schemas';

type YamlPrimitive = string | number | boolean;

function isEnvVarValue(value: unknown): value is EnvVarValue {
  return typeof value === 'object' && value !== null && 'mode' in value;
}

function serializeParamValue(value: LiteLLMParams[string]): YamlPrimitive | undefined {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (!isEnvVarValue(value)) {
    return undefined;
  }
  if (value.mode === 'env') {
    const varName = value.varName.trim();
    return varName ? `os.environ/${varName}` : undefined;
  }
  const literal = value.value.trim();
  return literal ? literal : undefined;
}

function withOptionalNumber(
  target: Record<string, YamlPrimitive>,
  key: string,
  value: number | undefined
): void {
  if (typeof value === 'number') {
    target[key] = value;
  }
}

function buildModelValue(provider: string, model: string): string {
  if (!model || model.includes('/') || provider === 'openai' || provider === 'unknown') {
    return model;
  }
  return `${provider}/${model}`;
}

export function configToYaml(models: ModelEntry[]): string {
  const model_list = models.map((entry) => {
    const litellm_params: Record<string, YamlPrimitive> = {
      model: buildModelValue(entry.provider, entry.model),
    };

    for (const [key, value] of Object.entries(entry.litellm_params)) {
      const serialized = serializeParamValue(value);
      if (serialized === undefined) {
        continue;
      }
      litellm_params[key] = serialized;
    }

    withOptionalNumber(litellm_params, 'rpm', entry.rpm);
    withOptionalNumber(litellm_params, 'tpm', entry.tpm);
    withOptionalNumber(litellm_params, 'timeout', entry.timeout);
    withOptionalNumber(litellm_params, 'stream_timeout', entry.stream_timeout);
    withOptionalNumber(litellm_params, 'max_retries', entry.max_retries);

    return {
      model_name: entry.model_name,
      litellm_params,
    };
  });

  return yaml.dump(
    { model_list },
    { noRefs: true, lineWidth: 100, styles: { '!!bool': 'camelcase' } }
  );
}
