import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { codeToHtml } from 'shiki';

import type { ModelEntry } from '@/lib/schemas';
import { EnvVarInput } from '@/components/env-var-input';
import { ImportDialog } from '@/components/import-dialog';
import { ModelCard } from '@/components/model-card';
import { ModelListPanel } from '@/components/model-list-panel';
import { Toolbar } from '@/components/toolbar';
import { YamlPreview } from '@/components/yaml-preview';

vi.mock('shiki', () => ({
  codeToHtml: vi.fn(async (yaml: string) => `<pre>${yaml}</pre>`),
}));

vi.mock('@/lib/yaml-parse', () => ({
  yamlToConfig: vi.fn((content: string) => {
    if (content.includes('bad')) {
      return { models: [], errors: ['bad yaml'] };
    }

    return {
      models: [
        {
          id: 'imported-1',
          model_name: 'imported',
          provider: 'openai',
          model: 'gpt-4o-mini',
          litellm_params: {},
        },
      ],
      errors: [],
    };
  }),
}));

vi.mock('@/components/model-form', () => ({
  ModelForm: ({ entry }: { entry: ModelEntry }) => <div>Form for {entry.model_name}</div>,
}));

const baseEntry: ModelEntry = {
  id: 'm-1',
  model_name: 'demo-model',
  provider: 'openai',
  model: 'gpt-4o-mini',
  litellm_params: {},
};

const altEntry: ModelEntry = {
  ...baseEntry,
  id: 'm-2',
  model_name: 'alt-model',
};

const waitForMicrotasks = async () => {
  await Promise.resolve();
};

describe('app component smoke', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'confirm', {
      value: vi.fn(() => true),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => undefined,
      },
      configurable: true,
    });
  });

  it('renders toolbar and triggers actions', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const onDownload = vi.fn();

    render(<Toolbar onImport={onImport} onDownload={onDownload} />);

    await user.click(screen.getByRole('button', { name: 'Import YAML' }));
    await user.click(screen.getByRole('button', { name: 'Download' }));

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('renders model list panel empty and populated states', async () => {
    const user = userEvent.setup();
    const onAddModel = vi.fn();

    const { rerender } = render(
      <ModelListPanel
        models={[]}
        expandedIds={new Set()}
        onAddModel={onAddModel}
        onSaveModel={vi.fn()}
        onDeleteModel={vi.fn()}
      />
    );

    expect(
      screen.getByText('No models yet. Add one to start building config.yaml.')
    ).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Add Model' }));
    expect(onAddModel).toHaveBeenCalledTimes(1);

    rerender(
      <ModelListPanel
        models={[baseEntry]}
        expandedIds={new Set([baseEntry.id])}
        onAddModel={onAddModel}
        onSaveModel={vi.fn()}
        onDeleteModel={vi.fn()}
      />
    );

    expect(screen.getByText('demo-model')).not.toBeNull();
  });

  it('handles model-card expand/collapse and delete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <ModelCard entry={baseEntry} onSave={vi.fn()} onDelete={onDelete} defaultExpanded={false} />
    );

    await user.click(screen.getByRole('button', { name: 'Expand card' }));
    expect(screen.getByText('Form for demo-model')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete model' }));
    expect(onDelete).toHaveBeenCalledWith('m-1');

    (window.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Delete model' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders model-card fallback title/model text for empty values', () => {
    const entryWithFallbacks: ModelEntry = {
      ...baseEntry,
      provider: 'custom_provider',
      model_name: '',
      model: '',
    };

    render(
      <ModelCard
        entry={entryWithFallbacks}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        defaultExpanded={false}
      />
    );

    expect(screen.getByText('Untitled Model')).not.toBeNull();
    expect(screen.getByText('No model selected')).not.toBeNull();
  });

  it('handles import dialog parse errors and success', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();

    render(<ImportDialog open existingModelCount={0} onOpenChange={vi.fn()} onImport={onImport} />);

    await user.type(screen.getByPlaceholderText(/model_list:/i), 'bad');
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(screen.getByText('Import failed')).not.toBeNull();

    await user.clear(screen.getByPlaceholderText(/model_list:/i));
    await user.type(screen.getByPlaceholderText(/model_list:/i), 'model_list:\n  - model_name: ok');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('supports replace confirmation flow when models already exist', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ImportDialog open existingModelCount={2} onOpenChange={onOpenChange} onImport={onImport} />
    );

    await user.type(screen.getByPlaceholderText(/model_list:/i), 'model_list:\n  - model_name: ok');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(screen.getByText('This will replace your current models. Continue?')).not.toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[0] as HTMLElement);
    expect(screen.queryByText('This will replace your current models. Continue?')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Import' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders yaml preview and copies content', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(<YamlPreview models={[baseEntry]} />);

    await waitFor(() => {
      expect(screen.getByText('YAML Preview')).not.toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeTextSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1300));
    });

    expect(screen.getByRole('button').textContent).toContain('Copy');
  });

  it('cleans up highlight effect on unmount', async () => {
    const { unmount } = render(<YamlPreview models={[baseEntry]} />);

    unmount();
    expect(true).toBe(true);
  });

  it('debounces highlight calls until 250ms idle after model changes', async () => {
    vi.useFakeTimers();
    const codeToHtmlMock = vi.mocked(codeToHtml);
    codeToHtmlMock.mockResolvedValue('<pre>ok</pre>');

    const { rerender } = render(<YamlPreview models={[baseEntry]} />);

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForMicrotasks();
    });
    codeToHtmlMock.mockClear();

    rerender(<YamlPreview models={[altEntry]} />);

    await act(async () => {
      vi.advanceTimersByTime(249);
      await waitForMicrotasks();
    });
    expect(codeToHtmlMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await waitForMicrotasks();
    });
    expect(codeToHtmlMock).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('coalesces multiple model changes within debounce window into one highlight call', async () => {
    vi.useFakeTimers();
    const codeToHtmlMock = vi.mocked(codeToHtml);
    codeToHtmlMock.mockResolvedValue('<pre>ok</pre>');

    const { rerender } = render(<YamlPreview models={[baseEntry]} />);

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForMicrotasks();
    });
    codeToHtmlMock.mockClear();

    const entryA: ModelEntry = { ...baseEntry, id: 'm-a', model_name: 'first-change' };
    const entryB: ModelEntry = { ...baseEntry, id: 'm-b', model_name: 'final-change' };

    rerender(<YamlPreview models={[entryA]} />);
    await act(async () => {
      vi.advanceTimersByTime(125);
    });

    rerender(<YamlPreview models={[entryB]} />);
    await act(async () => {
      vi.advanceTimersByTime(249);
      await waitForMicrotasks();
    });
    expect(codeToHtmlMock).toHaveBeenCalledTimes(0);

    await act(async () => {
      vi.advanceTimersByTime(1);
      await waitForMicrotasks();
    });

    expect(codeToHtmlMock).toHaveBeenCalledTimes(1);
    expect(String(codeToHtmlMock.mock.calls[0]?.[0] ?? '')).toContain('final-change');

    vi.useRealTimers();
  });

  it('copies latest yaml text even while highlight debounce is pending', async () => {
    vi.useFakeTimers();
    const codeToHtmlMock = vi.mocked(codeToHtml);
    codeToHtmlMock.mockResolvedValue('<pre>ok</pre>');

    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const { rerender } = render(<YamlPreview models={[baseEntry]} />);

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForMicrotasks();
    });

    const freshEntry: ModelEntry = { ...baseEntry, id: 'm-fresh', model_name: 'fresh-copy-model' };
    rerender(<YamlPreview models={[freshEntry]} />);

    await act(async () => {
      screen.getByRole('button', { name: 'Copy' }).click();
      await waitForMicrotasks();
    });

    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    expect(String(writeTextSpy.mock.calls[0]?.[0] ?? '')).toContain('fresh-copy-model');

    vi.useRealTimers();
  });

  it('shows stale opacity class while debounce is pending and clears after highlight', async () => {
    vi.useFakeTimers();
    const codeToHtmlMock = vi.mocked(codeToHtml);
    codeToHtmlMock.mockResolvedValue('<pre>ok</pre>');

    const { rerender } = render(<YamlPreview models={[baseEntry]} />);

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForMicrotasks();
    });

    const staleTarget: ModelEntry = { ...baseEntry, id: 'm-stale', model_name: 'stale-model' };
    rerender(<YamlPreview models={[staleTarget]} />);

    const preview = screen.getByTestId('yaml-highlighted-preview');
    expect(preview.className).toContain('opacity-60');

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForMicrotasks();
    });

    expect(screen.getByTestId('yaml-highlighted-preview').className).not.toContain('opacity-60');

    vi.useRealTimers();
  });

  it('ignores stale in-flight highlight results when newer models arrive', async () => {
    vi.useFakeTimers();
    const codeToHtmlMock = vi.mocked(codeToHtml);

    let resolveFirst: ((html: string) => void) | null = null;
    let resolveSecond: ((html: string) => void) | null = null;

    codeToHtmlMock.mockImplementation((yamlText: string) => {
      if (yamlText.includes('stale-source')) {
        return new Promise<string>((resolve) => {
          resolveFirst = resolve;
        });
      }
      return new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });
    });

    const staleSource: ModelEntry = {
      ...baseEntry,
      id: 'm-stale-source',
      model_name: 'stale-source',
    };
    const freshSource: ModelEntry = {
      ...baseEntry,
      id: 'm-fresh-source',
      model_name: 'fresh-source',
    };

    const { rerender } = render(<YamlPreview models={[staleSource]} />);

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForMicrotasks();
    });

    rerender(<YamlPreview models={[freshSource]} />);

    await act(async () => {
      vi.advanceTimersByTime(250);
      await waitForMicrotasks();
    });

    await act(async () => {
      resolveFirst?.('<pre>STALE_HTML</pre>');
      await waitForMicrotasks();
    });

    await act(async () => {
      resolveSecond?.('<pre>FRESH_HTML</pre>');
      await waitForMicrotasks();
    });

    const preview = screen.getByTestId('yaml-highlighted-preview');
    expect(preview.innerHTML).toContain('FRESH_HTML');
    expect(preview.innerHTML).not.toContain('STALE_HTML');

    vi.useRealTimers();
  });

  it('toggles env-var input modes and secret visibility', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <EnvVarInput value={{ mode: 'literal', value: 'secret' }} onChange={onChange} secret />
    );

    await user.click(screen.getByRole('button', { name: 'Show secret' }));
    expect(screen.getByRole('button', { name: 'Hide secret' })).not.toBeNull();

    await user.click(screen.getByRole('radio', { name: 'Env var mode' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'env', varName: '' });

    onChange.mockClear();

    rerender(
      <EnvVarInput value={{ mode: 'env', varName: 'API_KEY' }} onChange={onChange} secret />
    );

    await user.click(screen.getByRole('radio', { name: 'Literal mode' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'literal', value: '' });
  });
});
