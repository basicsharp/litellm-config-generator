import { zodResolver } from '@hookform/resolvers/zod';

import {
  GuardrailEntrySchema,
  ModelEntrySchema,
  type GuardrailEntry,
  type ModelEntry,
} from '@/lib/schemas';

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `model-${Date.now()}`;
}

export function defaultModelEntry(providerId = 'openai'): ModelEntry {
  return {
    id: makeId(),
    model_name: '',
    provider: providerId,
    model: '',
    litellm_params: {},
  };
}

export function defaultGuardrailEntry(
  guardrailProvider = 'litellm_content_filter'
): GuardrailEntry {
  return {
    id: makeId(),
    guardrail_name: '',
    guardrail: guardrailProvider,
    mode: ['pre_call'],
    default_on: false,
    _extra: {},
  };
}

export const modelEntryResolver = zodResolver(ModelEntrySchema);
export const guardrailEntryResolver = zodResolver(GuardrailEntrySchema);
