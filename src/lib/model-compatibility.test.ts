import { describe, expect, it } from 'vitest';
import { findUnavailableModels } from '@/lib/model-compatibility';
import type { CatalogData } from '@/lib/catalog';
import type { ModelEntry } from '@/lib/schemas';

const catalog: CatalogData = {
  meta: {
    generatedAt: '2026-01-01T00:00:00Z',
    litellmSubmodulePath: 'litellm',
    litellmRef: 'v1.81.14.rc.2',
    litellmCommit: 'aaaaaaa',
  },
  providers: {
    openai: {
      label: 'OpenAI',
      models: [
        {
          id: 'gpt-4o-mini',
          mode: 'chat',
          maxTokens: null,
          inputCostPerToken: null,
          outputCostPerToken: null,
        },
      ],
      fields: { base: [], extra: [] },
    },
    vertex_ai: {
      label: 'Vertex AI',
      models: [
        {
          id: 'vertex_ai/gemini-3.1-pro-preview',
          mode: 'chat',
          maxTokens: null,
          inputCostPerToken: null,
          outputCostPerToken: null,
        },
      ],
      fields: { base: [], extra: [] },
    },
  },
};

describe('findUnavailableModels', () => {
  it('returns empty when all configured models exist in selected catalog', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'openai-model',
        provider: 'openai',
        model: 'gpt-4o-mini',
        litellm_params: {},
      },
      {
        id: '2',
        model_name: 'vertex-model',
        provider: 'vertex_ai',
        model: 'vertex_ai/gemini-3.1-pro-preview',
        litellm_params: {},
      },
    ];

    expect(findUnavailableModels(models, catalog)).toEqual([]);
  });

  it('returns unavailable entries when model id is missing from provider catalog', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'missing-vertex',
        provider: 'vertex_ai',
        model: 'vertex_ai/gemini-1.5-pro',
        litellm_params: {},
      },
    ];

    const unavailable = findUnavailableModels(models, catalog);
    expect(unavailable).toHaveLength(1);
    expect(unavailable[0]?.model).toBe('vertex_ai/gemini-1.5-pro');
  });

  it('treats missing provider in catalog as unavailable', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'unknown-provider-model',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
        litellm_params: {},
      },
    ];

    const unavailable = findUnavailableModels(models, catalog);
    expect(unavailable).toHaveLength(1);
    expect(unavailable[0]?.provider).toBe('anthropic');
  });

  it('accepts model id with provider prefix when catalog stores unprefixed id', () => {
    const unprefixedCatalog: CatalogData = {
      ...catalog,
      providers: {
        ...catalog.providers,
        openai: {
          ...catalog.providers.openai,
          models: [
            {
              id: 'gpt-4o-mini',
              mode: 'chat',
              maxTokens: null,
              inputCostPerToken: null,
              outputCostPerToken: null,
            },
          ],
        },
      },
    };

    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'prefixed-openai-model',
        provider: 'openai',
        model: 'openai/gpt-4o-mini',
        litellm_params: {},
      },
    ];

    expect(findUnavailableModels(models, unprefixedCatalog)).toEqual([]);
  });

  it('matches prefixed catalog ids when configured model is unprefixed', () => {
    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'vertex-unprefixed',
        provider: 'vertex_ai',
        model: 'gemini-3.1-pro-preview',
        litellm_params: {},
      },
    ];

    expect(findUnavailableModels(models, catalog)).toEqual([]);
  });

  it('normalizes azure_text provider id to azure', () => {
    const azureCatalog: CatalogData = {
      ...catalog,
      providers: {
        ...catalog.providers,
        azure: {
          label: 'Azure',
          models: [
            {
              id: 'gpt-4o-mini',
              mode: 'chat',
              maxTokens: null,
              inputCostPerToken: null,
              outputCostPerToken: null,
            },
          ],
          fields: { base: [], extra: [] },
        },
      },
    };

    const models: ModelEntry[] = [
      {
        id: '1',
        model_name: 'azure-normalized',
        provider: 'azure_text',
        model: 'gpt-4o-mini',
        litellm_params: {},
      },
    ];

    expect(findUnavailableModels(models, azureCatalog)).toEqual([]);
  });
});
