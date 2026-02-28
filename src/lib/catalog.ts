export type CatalogField = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'unknown';
  required: boolean;
  secret: boolean;
};

export type CatalogModel = {
  id: string;
  mode: string | null;
  maxTokens: number | null;
  inputCostPerToken: number | null;
  outputCostPerToken: number | null;
};

export type CatalogProvider = {
  id: string;
  label: string;
};

export type CatalogData = {
  meta: {
    generatedAt: string;
    litellmSubmodulePath: string;
    litellmRef: string;
    litellmCommit: string;
  };
  providers: Record<
    string,
    {
      label: string;
      models: CatalogModel[];
      fields: {
        base: CatalogField[];
        extra: CatalogField[];
      };
    }
  >;
};

export function getProviders(catalog: CatalogData): CatalogProvider[] {
  return Object.entries(catalog.providers)
    .map(([id, value]) => ({ id, label: value.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getModelsForProvider(catalog: CatalogData, providerId: string): CatalogModel[] {
  return catalog.providers[providerId]?.models ?? [];
}

export function getFieldsForProvider(
  catalog: CatalogData,
  providerId: string
): {
  base: CatalogField[];
  extra: CatalogField[];
} {
  const provider = catalog.providers[providerId];
  if (!provider) {
    return { base: [], extra: [] };
  }
  return {
    base: provider.fields.base,
    extra: provider.fields.extra,
  };
}
