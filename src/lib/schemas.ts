import { z } from 'zod';

export const EnvVarValueSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('literal'),
    value: z.string(),
  }),
  z.object({
    mode: z.literal('env'),
    varName: z.string(),
  }),
]);

export const LiteLLMParamValueSchema = z.union([
  EnvVarValueSchema,
  z.number(),
  z.boolean(),
  z.array(z.string().min(1)),
]);

export const LiteLLMParamsSchema = z.record(z.string(), LiteLLMParamValueSchema);

export const GuardrailModeSchema = z.enum([
  'pre_call',
  'post_call',
  'during_call',
  'logging_only',
  'pre_mcp_call',
]);

export const GuardrailInfoParamSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
});

export const GuardrailInfoSchema = z.object({
  params: z.array(GuardrailInfoParamSchema).default([]),
});

export const PresidioActionSchema = z.enum(['MASK', 'BLOCK']);

export const PiiEntitiesConfigSchema = z.record(z.string(), PresidioActionSchema);
export const PresidioScoreThresholdsSchema = z.record(z.string(), z.number());

export const ContentFilterCategorySchema = z.object({
  category: z.string().min(1),
  enabled: z.boolean().optional(),
  action: z.string().optional(),
  severity_threshold: z.number().optional(),
});

export const ContentFilterPatternSchema = z.object({
  type: z.string().min(1),
  name: z.string().optional(),
  regex: z.string().optional(),
  action: z.string().optional(),
});

export const BlockedWordSchema = z.object({
  keyword: z.string().min(1),
  action: z.string().optional(),
});

export const GuardrailBaseSchema = z.object({
  id: z.string().min(1),
  guardrail_name: z.string().min(1, 'Guardrail name is required'),
  guardrail: z.string().min(1, 'Guardrail provider is required'),
  mode: z.array(GuardrailModeSchema).min(1, 'At least one mode is required'),
  default_on: z.boolean().optional(),
  api_key: EnvVarValueSchema.optional(),
  api_base: z.string().optional(),
  guardrail_info: GuardrailInfoSchema.optional(),
  _extra: z.record(z.string(), z.unknown()).default({}),
});

export const PresidioParamsSchema = GuardrailBaseSchema.extend({
  guardrail: z.literal('presidio'),
  language: z.enum(['en', 'es', 'de']).optional(),
  presidio_language: z.enum(['en', 'es', 'de']).optional(),
  filter_scope: z.enum(['input', 'output', 'both']).optional(),
  output_parse_pii: z.boolean().optional(),
  pii_entities_config: PiiEntitiesConfigSchema.optional(),
  score_thresholds: PresidioScoreThresholdsSchema.optional(),
  score_threshold: z.number().optional(),
});

export const BedrockParamsSchema = GuardrailBaseSchema.extend({
  guardrail: z.literal('bedrock'),
  guardrailIdentifier: z.string().optional(),
  guardrailVersion: z.string().optional(),
  aws_region_name: EnvVarValueSchema.optional(),
  aws_role_name: EnvVarValueSchema.optional(),
  mask_request_content: z.boolean().optional(),
  mask_response_content: z.boolean().optional(),
  disable_exception_on_block: z.boolean().optional(),
});

export const AzureTextModerationsParamsSchema = GuardrailBaseSchema.extend({
  guardrail: z.literal('azure/text_moderations'),
  severity_threshold: z.number().optional(),
  severity_threshold_hate: z.number().optional(),
  severity_threshold_self_harm: z.number().optional(),
  severity_threshold_sexual: z.number().optional(),
  severity_threshold_violence: z.number().optional(),
  categories: z.array(z.string()).optional(),
  blocklistNames: z.array(z.string()).optional(),
  haltOnBlocklistHit: z.boolean().optional(),
  outputType: z.string().optional(),
});

export const AzurePromptShieldParamsSchema = GuardrailBaseSchema.extend({
  guardrail: z.literal('azure/prompt_shield'),
});

export const LiteLLMContentFilterParamsSchema = GuardrailBaseSchema.extend({
  guardrail: z.literal('litellm_content_filter'),
  categories: z.array(ContentFilterCategorySchema).optional(),
  patterns: z.array(ContentFilterPatternSchema).optional(),
  blocked_words: z.array(BlockedWordSchema).optional(),
});

export const GenericGuardrailParamsSchema = GuardrailBaseSchema.extend({
  guardrail: z.literal('generic_guardrail_api'),
  unreachable_fallback: z.enum(['fail_closed', 'fail_open']).optional(),
  additional_provider_specific_params: z.record(z.string(), z.string()).optional(),
});

const Tier1GuardrailSchema = z.discriminatedUnion('guardrail', [
  PresidioParamsSchema,
  BedrockParamsSchema,
  AzurePromptShieldParamsSchema,
  AzureTextModerationsParamsSchema,
  LiteLLMContentFilterParamsSchema,
  GenericGuardrailParamsSchema,
]);

const Tier1Providers = new Set([
  'presidio',
  'bedrock',
  'azure/prompt_shield',
  'azure/text_moderations',
  'litellm_content_filter',
  'generic_guardrail_api',
]);

const StandardGuardrailSchema = GuardrailBaseSchema.refine(
  (value) => !Tier1Providers.has(value.guardrail),
  { message: 'Tier 1 guardrails must use provider-specific schema' }
);

export const GuardrailEntrySchema = z.union([Tier1GuardrailSchema, StandardGuardrailSchema]);

export const ModelEntrySchema = z.object({
  id: z.string().min(1),
  model_name: z.string().min(1, 'Model alias is required'),
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model id is required'),
  litellm_params: LiteLLMParamsSchema,
  rpm: z.number().optional(),
  tpm: z.number().optional(),
  timeout: z.number().optional(),
  stream_timeout: z.number().optional(),
  max_retries: z.number().optional(),
});

export type EnvVarValue = z.infer<typeof EnvVarValueSchema>;
export type LiteLLMParams = z.infer<typeof LiteLLMParamsSchema>;
export type ModelEntry = z.infer<typeof ModelEntrySchema>;
export type GuardrailMode = z.infer<typeof GuardrailModeSchema>;
export type GuardrailInfoParam = z.infer<typeof GuardrailInfoParamSchema>;
export type GuardrailInfo = z.infer<typeof GuardrailInfoSchema>;
export type PiiEntitiesConfig = z.infer<typeof PiiEntitiesConfigSchema>;
export type PresidioScoreThresholds = z.infer<typeof PresidioScoreThresholdsSchema>;
export type ContentFilterCategory = z.infer<typeof ContentFilterCategorySchema>;
export type ContentFilterPattern = z.infer<typeof ContentFilterPatternSchema>;
export type BlockedWord = z.infer<typeof BlockedWordSchema>;
export type GuardrailEntry = z.infer<typeof GuardrailBaseSchema> & {
  language?: 'en' | 'es' | 'de';
  presidio_language?: 'en' | 'es' | 'de';
  filter_scope?: 'input' | 'output' | 'both';
  output_parse_pii?: boolean;
  pii_entities_config?: PiiEntitiesConfig;
  score_thresholds?: PresidioScoreThresholds;
  score_threshold?: number;
  guardrailIdentifier?: string;
  guardrailVersion?: string;
  aws_region_name?: EnvVarValue;
  aws_role_name?: EnvVarValue;
  mask_request_content?: boolean;
  mask_response_content?: boolean;
  disable_exception_on_block?: boolean;
  severity_threshold?: number;
  severity_threshold_hate?: number;
  severity_threshold_self_harm?: number;
  severity_threshold_sexual?: number;
  severity_threshold_violence?: number;
  categories?: string[] | ContentFilterCategory[];
  blocklistNames?: string[];
  haltOnBlocklistHit?: boolean;
  outputType?: string;
  patterns?: ContentFilterPattern[];
  blocked_words?: BlockedWord[];
  unreachable_fallback?: 'fail_closed' | 'fail_open';
  additional_provider_specific_params?: Record<string, string>;
};
