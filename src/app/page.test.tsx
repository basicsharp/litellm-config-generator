import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import HomePage from '@/app/page';
import { configToYaml } from '@/lib/yaml-gen';
import { toast } from 'sonner';
import type { CatalogData } from '@/lib/catalog';
import type { VersionEntry } from '@/lib/catalog-context';

const setSelectedVersionMock = vi.fn();
let importedCatalogRefMock: string | null = 'v1.81.14.rc.2';
let importedModelsMock: unknown[] = [
  {
    id: 'imported-1',
    model_name: 'imported',
    provider: 'openai',
    model: 'gpt-4o-mini',
    litellm_params: {},
  },
];

const latestCatalogMock = {
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
} satisfies CatalogData;

const oldCatalogMock = {
  meta: {
    generatedAt: '2025-12-01T00:00:00Z',
    litellmSubmodulePath: 'litellm',
    litellmRef: 'v1.81.13',
    litellmCommit: 'bbbbbbb',
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
          id: 'vertex_ai/gemini-1.5-pro',
          mode: 'chat',
          maxTokens: null,
          inputCostPerToken: null,
          outputCostPerToken: null,
        },
      ],
      fields: { base: [], extra: [] },
    },
  },
} satisfies CatalogData;

type CatalogContextMock = {
  versions: VersionEntry[];
  selectedVersion: string | null;
  isLoading: boolean;
  catalog: CatalogData | null;
  setSelectedVersion: typeof setSelectedVersionMock;
};

let catalogContextMock: CatalogContextMock = {
  versions: [
    {
      ref: 'v1.81.13',
      folderName: 'v1.81.13',
      commit: 'bbbbbbb',
      generatedAt: '2025-12-01T00:00:00Z',
    },
    {
      ref: 'v1.81.14.rc.2',
      folderName: 'v1.81.14.rc.2',
      commit: 'aaaaaaa',
      generatedAt: '2026-01-01T00:00:00Z',
    },
  ],
  selectedVersion: 'v1.81.14.rc.2',
  isLoading: false,
  catalog: latestCatalogMock,
  setSelectedVersion: setSelectedVersionMock,
};

vi.mock('@/components/toolbar', () => ({
  Toolbar: ({ onImport, onDownload }: { onImport: () => void; onDownload: () => void }) => (
    <div>
      <button type="button" onClick={onImport}>
        Import
      </button>
      <button type="button" onClick={onDownload}>
        Download
      </button>
    </div>
  ),
}));

vi.mock('@/components/model-list-panel', () => ({
  ModelListPanel: ({
    models,
    onAddModel,
    onSaveModel,
    onDeleteModel,
  }: {
    models: Array<{
      id: string;
      model_name: string;
      provider: string;
      model: string;
      litellm_params: Record<string, never>;
    }>;
    onAddModel: () => void;
    onSaveModel: (entry: {
      id: string;
      model_name: string;
      provider: string;
      model: string;
      litellm_params: Record<string, never>;
    }) => void;
    onDeleteModel: (id: string) => void;
  }) => (
    <div>
      <div data-testid="models-count">{models.length}</div>
      <button type="button" onClick={onAddModel}>
        Add
      </button>
      <button
        type="button"
        onClick={() =>
          onSaveModel({
            id: 'new-1',
            model_name: 'saved-model',
            provider: 'openai',
            model: 'gpt-4o-mini',
            litellm_params: {},
          })
        }
      >
        Save mock
      </button>
      <button type="button" onClick={() => onDeleteModel('new-1')}>
        Delete mock
      </button>
    </div>
  ),
}));

vi.mock('@/components/yaml-preview', () => ({
  YamlPreview: ({ models }: { models: unknown[] }) => <div>Preview {models.length}</div>,
}));

vi.mock('@/components/import-dialog', () => ({
  ImportDialog: ({
    onImport,
  }: {
    onImport: (models: unknown[], catalogRef: string | null) => void;
  }) => (
    <button type="button" onClick={() => onImport(importedModelsMock, importedCatalogRefMock)}>
      Import now
    </button>
  ),
}));

vi.mock('@/lib/form-utils', () => ({
  defaultModelEntry: vi.fn(() => ({
    id: 'new-1',
    model_name: '',
    provider: 'openai',
    model: '',
    litellm_params: {},
  })),
}));

vi.mock('@/lib/yaml-gen', () => ({
  configToYaml: vi.fn(() => 'model_list: []'),
}));

vi.mock('@/lib/catalog-context', () => ({
  useCatalogContext: () => catalogContextMock,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setSelectedVersionMock.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    importedCatalogRefMock = 'v1.81.14.rc.2';
    importedModelsMock = [
      {
        id: 'imported-1',
        model_name: 'imported',
        provider: 'openai',
        model: 'gpt-4o-mini',
        litellm_params: {},
      },
    ];
    catalogContextMock = {
      versions: [
        {
          ref: 'v1.81.13',
          folderName: 'v1.81.13',
          commit: 'bbbbbbb',
          generatedAt: '2025-12-01T00:00:00Z',
        },
        {
          ref: 'v1.81.14.rc.2',
          folderName: 'v1.81.14.rc.2',
          commit: 'aaaaaaa',
          generatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      selectedVersion: 'v1.81.14.rc.2',
      isLoading: false,
      catalog: latestCatalogMock,
      setSelectedVersion: setSelectedVersionMock,
    };
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:demo'),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return {
          href: '',
          download: '',
          click: vi.fn(),
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    });
  });

  it('adds, imports, and downloads models', async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    expect(screen.getAllByTestId('models-count')[0]?.textContent).toBe('0');

    await user.click(screen.getAllByRole('button', { name: 'Add' })[0] as HTMLElement);
    expect(screen.getAllByTestId('models-count')[0]?.textContent).toBe('1');

    await user.click(screen.getAllByRole('button', { name: 'Save mock' })[0] as HTMLElement);
    expect(screen.getAllByTestId('models-count')[0]?.textContent).toBe('1');

    await user.click(screen.getAllByRole('button', { name: 'Delete mock' })[0] as HTMLElement);
    expect(screen.getAllByTestId('models-count')[0]?.textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: 'Import now' }));
    expect(screen.getAllByTestId('models-count')[0]?.textContent).toBe('1');
    expect(setSelectedVersionMock).toHaveBeenCalledWith('v1.81.14.rc.2');
    expect(toast.success).toHaveBeenCalledWith('Imported 1 models (litellm:v1.81.14.rc.2)', {
      duration: 3000,
    });

    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Downloaded config.yaml', {
      duration: 3000,
    });
    expect(configToYaml).toHaveBeenCalledWith(expect.any(Array), {
      catalogRef: 'v1.81.14.rc.2',
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it('does not switch catalog version when imported ref is missing or unknown', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    importedCatalogRefMock = null;
    await user.click(screen.getByRole('button', { name: 'Import now' }));
    expect(setSelectedVersionMock).not.toHaveBeenCalled();

    importedCatalogRefMock = 'v9.9.9';
    await user.click(screen.getByRole('button', { name: 'Import now' }));
    expect(setSelectedVersionMock).not.toHaveBeenCalled();
  });

  it('passes undefined catalogRef when selected version cannot be resolved', () => {
    catalogContextMock = {
      versions: [],
      selectedVersion: 'missing',
      isLoading: false,
      catalog: latestCatalogMock,
      setSelectedVersion: setSelectedVersionMock,
    };

    render(<HomePage />);
    expect(configToYaml).toHaveBeenCalledWith(expect.any(Array), {
      catalogRef: undefined,
    });
  });

  it('validates configured models after version change and reports unavailable ones', async () => {
    const user = userEvent.setup();
    importedModelsMock = [
      {
        id: 'imported-vertex',
        model_name: 'ccc_gemini-3.1-pro-preview',
        provider: 'vertex_ai',
        model: 'vertex_ai/gemini-3.1-pro-preview',
        litellm_params: {},
      },
    ];

    const { rerender } = render(<HomePage />);

    await user.click(screen.getByRole('button', { name: 'Import now' }));
    expect(toast.error).not.toHaveBeenCalled();

    catalogContextMock = {
      ...catalogContextMock,
      selectedVersion: 'v1.81.13',
      catalog: oldCatalogMock,
    };
    rerender(<HomePage />);

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('vertex_ai/gemini-3.1-pro-preview'),
      { duration: 3000 }
    );
  });

  it('shows compatibility success toast when switched version still supports all models', async () => {
    const user = userEvent.setup();
    importedModelsMock = [
      {
        id: 'imported-openai',
        model_name: 'openai-model',
        provider: 'openai',
        model: 'gpt-4o-mini',
        litellm_params: {},
      },
    ];

    const { rerender } = render(<HomePage />);
    await user.click(screen.getByRole('button', { name: 'Import now' }));

    catalogContextMock = {
      ...catalogContextMock,
      selectedVersion: 'v1.81.13',
      catalog: oldCatalogMock,
    };
    rerender(<HomePage />);

    expect(toast.success).toHaveBeenCalledWith(
      'All configured models are available in litellm:v1.81.13',
      { duration: 3000 }
    );
  });

  it('reports compact unavailable summary with "and N more" when many are missing', async () => {
    const user = userEvent.setup();
    importedModelsMock = [
      {
        id: 'm1',
        model_name: 'missing-1',
        provider: 'vertex_ai',
        model: 'vertex_ai/gemini-3.1-pro-preview',
        litellm_params: {},
      },
      {
        id: 'm2',
        model_name: 'missing-2',
        provider: 'vertex_ai',
        model: 'vertex_ai/gemini-3.1-ultra-preview',
        litellm_params: {},
      },
      {
        id: 'm3',
        model_name: 'missing-3',
        provider: 'vertex_ai',
        model: 'vertex_ai/gemini-3.1-flash-preview',
        litellm_params: {},
      },
    ];

    const { rerender } = render(<HomePage />);
    await user.click(screen.getByRole('button', { name: 'Import now' }));

    catalogContextMock = {
      ...catalogContextMock,
      selectedVersion: 'v1.81.13',
      catalog: oldCatalogMock,
    };
    rerender(<HomePage />);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('and 1 more'), {
      duration: 3000,
    });
  });

  it('skips compatibility validation while catalog is loading or unavailable', () => {
    catalogContextMock = {
      ...catalogContextMock,
      isLoading: true,
      catalog: latestCatalogMock,
    };
    render(<HomePage />);

    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalledWith(
      expect.stringContaining('All configured models are available'),
      expect.any(Object)
    );

    catalogContextMock = {
      ...catalogContextMock,
      isLoading: false,
      catalog: null,
    };
    render(<HomePage />);

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does not validate against stale catalog and waits for matching selected version catalog', async () => {
    const user = userEvent.setup();
    importedModelsMock = [
      {
        id: 'imported-vertex',
        model_name: 'ccc_gemini-3.1-pro-preview',
        provider: 'vertex_ai',
        model: 'gemini-3.1-pro-preview',
        litellm_params: {},
      },
    ];

    catalogContextMock = {
      ...catalogContextMock,
      selectedVersion: 'v1.81.14.rc.2',
      catalog: oldCatalogMock,
      isLoading: false,
    };

    const { rerender } = render(<HomePage />);
    await user.click(screen.getByRole('button', { name: 'Import now' }));

    expect(toast.error).not.toHaveBeenCalled();

    catalogContextMock = {
      ...catalogContextMock,
      catalog: latestCatalogMock,
    };
    rerender(<HomePage />);

    expect(toast.success).toHaveBeenCalledWith(
      'All configured models are available in litellm:v1.81.14.rc.2',
      { duration: 3000 }
    );
  });
});
