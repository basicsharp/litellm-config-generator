import catalogData from '../../public/catalog.json';

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

type CatalogJson = {
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

const catalog = catalogData as CatalogJson;

export function getProviders(): CatalogProvider[] {
  return Object.entries(catalog.providers)
    .map(([id, value]) => ({ id, label: value.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getModelsForProvider(providerId: string): CatalogModel[] {
  return catalog.providers[providerId]?.models ?? [];
}

export function getFieldsForProvider(providerId: string): {
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
