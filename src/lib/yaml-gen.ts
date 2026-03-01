import yaml from 'js-yaml';

import type { EnvVarValue, GuardrailEntry, LiteLLMParams, ModelEntry } from '@/lib/schemas';

type ConfigToYamlOptions = {
  catalogRef?: string;
};

type YamlPrimitive = string | number | boolean;
type YamlValue = YamlPrimitive | string[];

type SerializedGuardrailEntry = {
  guardrail_name: string;
  litellm_params: Record<string, unknown>;
  guardrail_info?: {
    params: Array<{ name: string; type: string; description?: string }>;
  };
};

function isEnvVarValue(value: unknown): value is EnvVarValue {
  return typeof value === 'object' && value !== null && 'mode' in value;
}

function serializeParamValue(value: LiteLLMParams[string]): YamlValue | undefined {
  if (Array.isArray(value)) {
    const normalized = value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    );
    return normalized.length > 0 ? normalized : undefined;
  }
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

function serializeEnvVarValue(value: EnvVarValue | undefined): string | undefined {
  if (!value) {
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
  target: Record<string, YamlValue>,
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

function serializeGuardrailEntry(entry: GuardrailEntry): SerializedGuardrailEntry {
  const litellm_params: Record<string, unknown> = {
    guardrail: entry.guardrail,
    mode: entry.mode,
  };

  if (entry.default_on) {
    litellm_params.default_on = true;
  }

  const serializedApiKey = serializeEnvVarValue(entry.api_key);
  if (serializedApiKey) {
    litellm_params.api_key = serializedApiKey;
  }

  const trimmedApiBase = entry.api_base?.trim();
  if (trimmedApiBase) {
    litellm_params.api_base = trimmedApiBase;
  }

  if (entry.guardrail === 'presidio') {
    if (entry.language) {
      litellm_params.language = entry.language;
    }
    if (entry.presidio_language) {
      litellm_params.presidio_language = entry.presidio_language;
    }
    if (entry.filter_scope) {
      litellm_params.filter_scope = entry.filter_scope;
    }
    if (typeof entry.output_parse_pii === 'boolean') {
      litellm_params.output_parse_pii = entry.output_parse_pii;
    }
    if (entry.pii_entities_config && Object.keys(entry.pii_entities_config).length > 0) {
      litellm_params.pii_entities_config = entry.pii_entities_config;
    }
    if (entry.score_thresholds && Object.keys(entry.score_thresholds).length > 0) {
      litellm_params.score_thresholds = entry.score_thresholds;
    }
    if (typeof entry.score_threshold === 'number') {
      litellm_params.score_threshold = entry.score_threshold;
    }
  }

  if (entry.guardrail === 'bedrock') {
    if (entry.guardrailIdentifier) {
      litellm_params.guardrailIdentifier = entry.guardrailIdentifier;
    }
    if (entry.guardrailVersion) {
      litellm_params.guardrailVersion = entry.guardrailVersion;
    }
    const awsRegion = serializeEnvVarValue(entry.aws_region_name);
    if (awsRegion) {
      litellm_params.aws_region_name = awsRegion;
    }
    const awsRole = serializeEnvVarValue(entry.aws_role_name);
    if (awsRole) {
      litellm_params.aws_role_name = awsRole;
    }
    if (typeof entry.mask_request_content === 'boolean') {
      litellm_params.mask_request_content = entry.mask_request_content;
    }
    if (typeof entry.mask_response_content === 'boolean') {
      litellm_params.mask_response_content = entry.mask_response_content;
    }
    if (typeof entry.disable_exception_on_block === 'boolean') {
      litellm_params.disable_exception_on_block = entry.disable_exception_on_block;
    }
  }

  if (entry.guardrail === 'azure/text_moderations') {
    if (typeof entry.severity_threshold === 'number') {
      litellm_params.severity_threshold = entry.severity_threshold;
    }
    if (typeof entry.severity_threshold_hate === 'number') {
      litellm_params.severity_threshold_hate = entry.severity_threshold_hate;
    }
    if (typeof entry.severity_threshold_self_harm === 'number') {
      litellm_params.severity_threshold_self_harm = entry.severity_threshold_self_harm;
    }
    if (typeof entry.severity_threshold_sexual === 'number') {
      litellm_params.severity_threshold_sexual = entry.severity_threshold_sexual;
    }
    if (typeof entry.severity_threshold_violence === 'number') {
      litellm_params.severity_threshold_violence = entry.severity_threshold_violence;
    }
    if (entry.categories?.length) {
      litellm_params.categories = entry.categories;
    }
    if (entry.blocklistNames?.length) {
      litellm_params.blocklistNames = entry.blocklistNames;
    }
    if (typeof entry.haltOnBlocklistHit === 'boolean') {
      litellm_params.haltOnBlocklistHit = entry.haltOnBlocklistHit;
    }
    if (entry.outputType) {
      litellm_params.outputType = entry.outputType;
    }
  }

  if (entry.guardrail === 'litellm_content_filter') {
    if (entry.categories?.length) {
      litellm_params.categories = entry.categories;
    }
    if (entry.patterns?.length) {
      litellm_params.patterns = entry.patterns;
    }
    if (entry.blocked_words?.length) {
      litellm_params.blocked_words = entry.blocked_words;
    }
  }

  if (entry.guardrail === 'generic_guardrail_api') {
    if (entry.unreachable_fallback) {
      litellm_params.unreachable_fallback = entry.unreachable_fallback;
    }
    if (
      entry.additional_provider_specific_params &&
      Object.keys(entry.additional_provider_specific_params).length > 0
    ) {
      litellm_params.additional_provider_specific_params =
        entry.additional_provider_specific_params;
    }
  }

  if (entry._extra && Object.keys(entry._extra).length > 0) {
    for (const [key, value] of Object.entries(entry._extra)) {
      litellm_params[key] = value;
    }
  }

  const serialized: SerializedGuardrailEntry = {
    guardrail_name: entry.guardrail_name,
    litellm_params,
  };

  if (entry.guardrail_info?.params?.length) {
    serialized.guardrail_info = {
      params: entry.guardrail_info.params.map((param) => ({
        name: param.name,
        type: param.type,
        description: param.description,
      })),
    };
  }

  return serialized;
}

function resolveConfigArgs(
  guardrailsOrOptions: GuardrailEntry[] | ConfigToYamlOptions | undefined,
  maybeOptions: ConfigToYamlOptions | undefined
): { guardrails: GuardrailEntry[]; options: ConfigToYamlOptions | undefined } {
  if (Array.isArray(guardrailsOrOptions)) {
    return { guardrails: guardrailsOrOptions, options: maybeOptions };
  }
  return { guardrails: [], options: guardrailsOrOptions };
}

export function configToYaml(
  models: ModelEntry[],
  guardrailsOrOptions?: GuardrailEntry[] | ConfigToYamlOptions,
  maybeOptions?: ConfigToYamlOptions
): string {
  const { guardrails, options } = resolveConfigArgs(guardrailsOrOptions, maybeOptions);
  const model_list = models.map((entry) => {
    const litellm_params: Record<string, YamlValue> = {
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

    const legacyGuardrails = (entry as ModelEntry & { guardrails?: string[] }).guardrails;
    if (
      !litellm_params.guardrails &&
      Array.isArray(legacyGuardrails) &&
      legacyGuardrails.length > 0
    ) {
      litellm_params.guardrails = legacyGuardrails;
    }

    return {
      model_name: entry.model_name,
      litellm_params,
    };
  });

  const document: {
    model_list: typeof model_list;
    guardrails?: SerializedGuardrailEntry[];
  } = {
    model_list,
  };

  if (guardrails.length > 0) {
    document.guardrails = guardrails.map((entry) => serializeGuardrailEntry(entry));
  }

  const body = yaml.dump(document, {
    noRefs: true,
    lineWidth: 100,
    styles: { '!!bool': 'camelcase' },
  });

  const catalogRef = options?.catalogRef?.trim();
  if (!catalogRef) {
    return body;
  }

  return `# litellm:${catalogRef}\n${body}`;
}
