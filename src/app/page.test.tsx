import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import HomePage from '@/app/page';

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
  ImportDialog: ({ onImport }: { onImport: (models: unknown[]) => void }) => (
    <button
      type="button"
      onClick={() =>
        onImport([
          {
            id: 'imported-1',
            model_name: 'imported',
            provider: 'openai',
            model: 'gpt-4o-mini',
            litellm_params: {},
          },
        ])
      }
    >
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

describe('HomePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
    expect(screen.getByText('Imported 1 models')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Imported 1 models')).not.toBeNull();
  });
});
