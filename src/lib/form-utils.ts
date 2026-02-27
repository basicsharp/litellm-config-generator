import { zodResolver } from '@hookform/resolvers/zod';

import { ModelEntrySchema, type ModelEntry } from '@/lib/schemas';

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

export const modelEntryResolver = zodResolver(ModelEntrySchema);
