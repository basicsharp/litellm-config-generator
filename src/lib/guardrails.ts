import type { GuardrailEntry } from '@/lib/schemas';

export const BUILT_IN_GUARDRAILS = [
  'litellm_content_filter',
  'detect_prompt_injection',
  'hide-secrets',
] as const;

export const EXTERNAL_TIER1_GUARDRAILS = [
  'aim',
  'aporia',
  'azure/prompt_shield',
  'azure/text_moderations',
  'bedrock',
  'guardrails_ai',
  'lakera_v2',
  'model_armor',
  'openai_moderation',
  'presidio',
] as const;

export const EXTERNAL_TIER2_GUARDRAILS = [
  'activefence',
  'api7',
  'authzed',
  'cohere_safety',
  'llama_guard',
  'nemo_guardrails',
  'pangea',
  'protectai',
  'rebuff',
  'safeinput',
  'safebase',
  'tavily',
  'uptrain',
  'vertex_guardrails',
  'wiseguard',
] as const;

export const CUSTOM_GUARDRAILS = ['generic_guardrail_api'] as const;

export const GUARDRAIL_MODES: GuardrailEntry['mode'] = [
  'pre_call',
  'post_call',
  'during_call',
  'logging_only',
  'pre_mcp_call',
];

const PROVIDER_SPECIFIC_KEYS: Array<keyof GuardrailEntry> = [
  'language',
  'presidio_language',
  'filter_scope',
  'output_parse_pii',
  'pii_entities_config',
  'score_thresholds',
  'score_threshold',
  'guardrailIdentifier',
  'guardrailVersion',
  'aws_region_name',
  'aws_role_name',
  'mask_request_content',
  'mask_response_content',
  'disable_exception_on_block',
  'severity_threshold',
  'severity_threshold_hate',
  'severity_threshold_self_harm',
  'severity_threshold_sexual',
  'severity_threshold_violence',
  'categories',
  'blocklistNames',
  'haltOnBlocklistHit',
  'outputType',
  'patterns',
  'blocked_words',
  'unreachable_fallback',
  'additional_provider_specific_params',
];

export function clearProviderSpecificFields(
  entry: GuardrailEntry,
  guardrail: string
): GuardrailEntry {
  const next: GuardrailEntry = {
    ...entry,
    guardrail,
  };

  for (const key of PROVIDER_SPECIFIC_KEYS) {
    delete next[key];
  }

  return next;
}
