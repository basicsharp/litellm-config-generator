import yaml from 'js-yaml';

import type {
  EnvVarValue,
  GuardrailEntry,
  GuardrailInfo,
  GuardrailInfoParam,
  LiteLLMParams,
  ModelEntry,
} from '@/lib/schemas';

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

function parseEnvVarValue(value: unknown): EnvVarValue | undefined {
  const parsed = parseEnvAwareValue(value);
  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }
  if ('mode' in parsed && (parsed.mode === 'env' || parsed.mode === 'literal')) {
    return parsed;
  }
  return undefined;
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

function generateId(prefix: 'imported' | 'guardrail', index: number): string {
  return `${prefix}-${index + 1}`;
}

function parseCatalogRefHeader(content: string): string | null {
  const normalized = content.replace(/^\uFEFF/, '');
  const firstLine = normalized.split(/\r?\n/, 1)[0]?.trim() ?? '';
  const match = firstLine.match(/^#\s*litellm\s*:\s*(.+)$/i);
  const ref = match?.[1]?.trim();
  return ref ? ref : null;
}

function parseMode(value: unknown): GuardrailEntry['mode'] {
  const supportedModes = new Set([
    'pre_call',
    'post_call',
    'during_call',
    'logging_only',
    'pre_mcp_call',
  ]);
  if (typeof value === 'string') {
    return supportedModes.has(value) ? [value as GuardrailEntry['mode'][number]] : ['pre_call'];
  }
  if (!Array.isArray(value)) {
    return ['pre_call'];
  }
  const normalized = value
    .filter((item): item is string => typeof item === 'string' && supportedModes.has(item))
    .map((item) => item as GuardrailEntry['mode'][number]);
  return normalized.length > 0 ? normalized : ['pre_call'];
}

function parseGuardrailInfo(raw: unknown): GuardrailInfo | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const paramsRaw = (raw as { params?: unknown }).params;
  if (!Array.isArray(paramsRaw) || paramsRaw.length === 0) {
    return undefined;
  }
  const params: GuardrailInfoParam[] = [];
  for (const item of paramsRaw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const name = String((item as { name?: unknown }).name ?? '').trim();
    const type = String((item as { type?: unknown }).type ?? '').trim();
    const descriptionRaw = (item as { description?: unknown }).description;
    const description = typeof descriptionRaw === 'string' ? descriptionRaw : undefined;
    if (!name || !type) {
      continue;
    }
    params.push({ name, type, description });
  }
  return params.length > 0 ? { params } : undefined;
}

function parseGuardrailEntry(
  raw: unknown,
  index: number
): { entry?: GuardrailEntry; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { error: `guardrails[${index}] must be an object.` };
  }

  const guardrailName = String((raw as { guardrail_name?: unknown }).guardrail_name ?? '').trim();
  const litellmParamsRaw = (raw as { litellm_params?: unknown }).litellm_params;
  if (!guardrailName) {
    return { error: `guardrails[${index}].guardrail_name is required.` };
  }
  if (!litellmParamsRaw || typeof litellmParamsRaw !== 'object') {
    return { error: `guardrails[${index}].litellm_params must be an object.` };
  }

  const litellmParams = litellmParamsRaw as Record<string, unknown>;
  const guardrail = String(litellmParams.guardrail ?? '').trim();
  if (!guardrail) {
    return { error: `guardrails[${index}].litellm_params.guardrail is required.` };
  }

  const entry: GuardrailEntry = {
    id: generateId('guardrail', index),
    guardrail_name: guardrailName,
    guardrail,
    mode: parseMode(litellmParams.mode),
    default_on: litellmParams.default_on === true,
    api_key: parseEnvVarValue(litellmParams.api_key),
    api_base: typeof litellmParams.api_base === 'string' ? litellmParams.api_base : undefined,
    guardrail_info: parseGuardrailInfo((raw as { guardrail_info?: unknown }).guardrail_info),
    _extra: {},
  };

  const knownFields = new Set(['guardrail', 'mode', 'default_on', 'api_key', 'api_base']);

  if (guardrail === 'presidio') {
    if (typeof litellmParams.language === 'string') {
      entry.language = litellmParams.language as 'en' | 'es' | 'de';
      knownFields.add('language');
    }
    if (typeof litellmParams.presidio_language === 'string') {
      entry.presidio_language = litellmParams.presidio_language as 'en' | 'es' | 'de';
      knownFields.add('presidio_language');
    }
    if (typeof litellmParams.filter_scope === 'string') {
      entry.filter_scope = litellmParams.filter_scope as 'input' | 'output' | 'both';
      knownFields.add('filter_scope');
    }
    if (typeof litellmParams.output_parse_pii === 'boolean') {
      entry.output_parse_pii = litellmParams.output_parse_pii;
      knownFields.add('output_parse_pii');
    }
    if (
      litellmParams.pii_entities_config &&
      typeof litellmParams.pii_entities_config === 'object'
    ) {
      const map: Record<string, 'MASK' | 'BLOCK'> = {};
      for (const [key, value] of Object.entries(
        litellmParams.pii_entities_config as Record<string, unknown>
      )) {
        if (value === 'MASK' || value === 'BLOCK') {
          map[key] = value;
        }
      }
      entry.pii_entities_config = map;
      knownFields.add('pii_entities_config');
    }
    if (litellmParams.score_thresholds && typeof litellmParams.score_thresholds === 'object') {
      const map: Record<string, number> = {};
      for (const [key, value] of Object.entries(
        litellmParams.score_thresholds as Record<string, unknown>
      )) {
        if (typeof value === 'number') {
          map[key] = value;
        }
      }
      entry.score_thresholds = map;
      knownFields.add('score_thresholds');
    }
    if (typeof litellmParams.score_threshold === 'number') {
      entry.score_threshold = litellmParams.score_threshold;
      knownFields.add('score_threshold');
    }
  }

  if (guardrail === 'bedrock') {
    if (typeof litellmParams.guardrailIdentifier === 'string') {
      entry.guardrailIdentifier = litellmParams.guardrailIdentifier;
      knownFields.add('guardrailIdentifier');
    }
    if (typeof litellmParams.guardrailVersion === 'string') {
      entry.guardrailVersion = litellmParams.guardrailVersion;
      knownFields.add('guardrailVersion');
    }
    const awsRegion = parseEnvVarValue(litellmParams.aws_region_name);
    if (awsRegion) {
      entry.aws_region_name = awsRegion;
      knownFields.add('aws_region_name');
    }
    const awsRole = parseEnvVarValue(litellmParams.aws_role_name);
    if (awsRole) {
      entry.aws_role_name = awsRole;
      knownFields.add('aws_role_name');
    }
    if (typeof litellmParams.mask_request_content === 'boolean') {
      entry.mask_request_content = litellmParams.mask_request_content;
      knownFields.add('mask_request_content');
    }
    if (typeof litellmParams.mask_response_content === 'boolean') {
      entry.mask_response_content = litellmParams.mask_response_content;
      knownFields.add('mask_response_content');
    }
    if (typeof litellmParams.disable_exception_on_block === 'boolean') {
      entry.disable_exception_on_block = litellmParams.disable_exception_on_block;
      knownFields.add('disable_exception_on_block');
    }
  }

  if (guardrail === 'azure/text_moderations') {
    const numericKeys: Array<
      | 'severity_threshold'
      | 'severity_threshold_hate'
      | 'severity_threshold_self_harm'
      | 'severity_threshold_sexual'
      | 'severity_threshold_violence'
    > = [
      'severity_threshold',
      'severity_threshold_hate',
      'severity_threshold_self_harm',
      'severity_threshold_sexual',
      'severity_threshold_violence',
    ];
    for (const key of numericKeys) {
      if (typeof litellmParams[key] === 'number') {
        entry[key] = litellmParams[key] as number;
        knownFields.add(key);
      }
    }
    if (Array.isArray(litellmParams.categories)) {
      entry.categories = litellmParams.categories.filter(
        (item): item is string => typeof item === 'string'
      );
      knownFields.add('categories');
    }
    if (Array.isArray(litellmParams.blocklistNames)) {
      entry.blocklistNames = litellmParams.blocklistNames.filter(
        (item): item is string => typeof item === 'string'
      );
      knownFields.add('blocklistNames');
    }
    if (typeof litellmParams.haltOnBlocklistHit === 'boolean') {
      entry.haltOnBlocklistHit = litellmParams.haltOnBlocklistHit;
      knownFields.add('haltOnBlocklistHit');
    }
    if (typeof litellmParams.outputType === 'string') {
      entry.outputType = litellmParams.outputType;
      knownFields.add('outputType');
    }
  }

  if (guardrail === 'litellm_content_filter') {
    if (Array.isArray(litellmParams.categories)) {
      entry.categories = litellmParams.categories.filter(
        (
          item
        ): item is {
          category: string;
          enabled?: boolean;
          action?: string;
          severity_threshold?: number;
        } => typeof item === 'object' && item !== null && 'category' in item
      );
      knownFields.add('categories');
    }
    if (Array.isArray(litellmParams.patterns)) {
      entry.patterns = litellmParams.patterns.filter(
        (item): item is NonNullable<GuardrailEntry['patterns']>[number] =>
          typeof item === 'object' && item !== null
      );
      knownFields.add('patterns');
    }
    if (Array.isArray(litellmParams.blocked_words)) {
      entry.blocked_words = litellmParams.blocked_words.filter(
        (item): item is NonNullable<GuardrailEntry['blocked_words']>[number] =>
          typeof item === 'object' && item !== null
      );
      knownFields.add('blocked_words');
    }
  }

  if (guardrail === 'generic_guardrail_api') {
    if (
      litellmParams.unreachable_fallback === 'fail_closed' ||
      litellmParams.unreachable_fallback === 'fail_open'
    ) {
      entry.unreachable_fallback = litellmParams.unreachable_fallback;
      knownFields.add('unreachable_fallback');
    }
    if (
      litellmParams.additional_provider_specific_params &&
      typeof litellmParams.additional_provider_specific_params === 'object'
    ) {
      const parsed: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        litellmParams.additional_provider_specific_params as Record<string, unknown>
      )) {
        if (typeof value === 'string') {
          parsed[key] = value;
        }
      }
      entry.additional_provider_specific_params = parsed;
      knownFields.add('additional_provider_specific_params');
    }
  }

  for (const [key, value] of Object.entries(litellmParams)) {
    if (!knownFields.has(key)) {
      entry._extra[key] = value;
    }
  }

  return { entry };
}

export function yamlToConfig(content: string): {
  models: ModelEntry[];
  guardrails: GuardrailEntry[];
  errors: string[];
  catalogRef: string | null;
} {
  const errors: string[] = [];
  const catalogRef = parseCatalogRefHeader(content);

  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { models: [], guardrails: [], errors: [`Invalid YAML: ${message}`], catalogRef };
  }

  if (!parsed || typeof parsed !== 'object' || !('model_list' in parsed)) {
    return {
      models: [],
      guardrails: [],
      errors: ['model_list was not found in YAML input.'],
      catalogRef,
    };
  }

  const modelList = (parsed as { model_list?: unknown }).model_list;
  if (!Array.isArray(modelList)) {
    return { models: [], guardrails: [], errors: ['model_list must be an array.'], catalogRef };
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
    let modelGuardrails: string[] | undefined;

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
      if (key === 'guardrails' && Array.isArray(value)) {
        modelGuardrails = value.filter((item): item is string => typeof item === 'string');
        continue;
      }

      const parsedValue = parseEnvAwareValue(value);
      if (parsedValue !== undefined) {
        litellm_params[key] = parsedValue;
      }
    }

    models.push({
      id: generateId('imported', index),
      model_name: modelName,
      provider,
      model,
      litellm_params,
      guardrails: modelGuardrails,
      rpm,
      tpm,
      timeout,
      stream_timeout,
      max_retries,
    });
  });

  const guardrails: GuardrailEntry[] = [];
  const guardrailsRaw = (parsed as { guardrails?: unknown }).guardrails;
  if (Array.isArray(guardrailsRaw)) {
    guardrailsRaw.forEach((rawEntry, index) => {
      const { entry, error } = parseGuardrailEntry(rawEntry, index);
      if (error) {
        errors.push(error);
        return;
      }
      if (entry) {
        guardrails.push(entry);
      }
    });
  }

  return { models, guardrails, errors, catalogRef };
}
