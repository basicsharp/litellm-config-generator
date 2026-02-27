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

export const LiteLLMParamValueSchema = z.union([EnvVarValueSchema, z.number(), z.boolean()]);

export const LiteLLMParamsSchema = z.record(z.string(), LiteLLMParamValueSchema);

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
