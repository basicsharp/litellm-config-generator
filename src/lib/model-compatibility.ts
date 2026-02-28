import type { CatalogData } from '@/lib/catalog';
import { normalizeProviderId } from '@/lib/normalize-provider';
import type { ModelEntry } from '@/lib/schemas';

export type UnavailableModel = {
  modelName: string;
  provider: string;
  model: string;
};

function buildCandidateIds(providerId: string, modelId: string): string[] {
  const trimmedModel = modelId.trim();
  const candidates = new Set<string>([trimmedModel]);

  if (!trimmedModel.includes('/')) {
    candidates.add(`${providerId}/${trimmedModel}`);
    return Array.from(candidates);
  }

  const [prefix, ...rest] = trimmedModel.split('/');
  if (prefix === providerId && rest.length > 0) {
    candidates.add(rest.join('/'));
  }

  return Array.from(candidates);
}

export function findUnavailableModels(
  models: ModelEntry[],
  catalog: CatalogData
): UnavailableModel[] {
  const unavailable: UnavailableModel[] = [];

  for (const modelEntry of models) {
    const providerId = normalizeProviderId(modelEntry.provider) ?? modelEntry.provider;
    const providerCatalog = catalog.providers[providerId];

    if (!providerCatalog) {
      unavailable.push({
        modelName: modelEntry.model_name,
        provider: modelEntry.provider,
        model: modelEntry.model,
      });
      continue;
    }

    const catalogModelIds = new Set(providerCatalog.models.map((model) => model.id));
    const candidates = buildCandidateIds(providerId, modelEntry.model);
    const isAvailable = candidates.some((candidate) => catalogModelIds.has(candidate));

    if (!isAvailable) {
      unavailable.push({
        modelName: modelEntry.model_name,
        provider: modelEntry.provider,
        model: modelEntry.model,
      });
    }
  }

  return unavailable;
}
