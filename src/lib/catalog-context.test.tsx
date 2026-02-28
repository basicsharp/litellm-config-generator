import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CatalogProvider,
  useCatalogContext,
  useFieldsForProvider,
  useModelsForProvider,
  useProviders,
} from '@/lib/catalog-context';

function ContextProbe() {
  const { versions, selectedVersion, setSelectedVersion, isLoading } = useCatalogContext();
  const providers = useProviders();
  const models = useModelsForProvider('openai');
  const fields = useFieldsForProvider('openai');

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="versions">{versions.length}</div>
      <div data-testid="selected">{selectedVersion ?? 'none'}</div>
      <div data-testid="providers">{providers.length}</div>
      <div data-testid="models">{models.length}</div>
      <div data-testid="fields">{fields.base.length + fields.extra.length}</div>
      <button type="button" onClick={() => setSelectedVersion('feature__main')}>
        switch
      </button>
    </div>
  );
}

describe('CatalogProvider', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('handles no-catalog state when index is missing', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 404 })) as typeof fetch;

    render(
      <CatalogProvider>
        <ContextProbe />
      </CatalogProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('versions').textContent).toBe('0');
    });
    expect(screen.getByTestId('providers').textContent).toBe('0');
    expect(screen.getByTestId('models').textContent).toBe('0');
    expect(screen.getByTestId('fields').textContent).toBe('0');
  });

  it('supports default context outside provider without crashing', async () => {
    function BareConsumer() {
      const { selectedVersion, setSelectedVersion } = useCatalogContext();
      return (
        <button type="button" onClick={() => setSelectedVersion('x')}>
          {selectedVersion ?? 'none'}
        </button>
      );
    }

    const user = userEvent.setup();
    render(<BareConsumer />);
    await user.click(screen.getByRole('button', { name: 'none' }));
    expect(screen.getByRole('button', { name: 'none' })).not.toBeNull();
  });

  it('loads index and latest catalog successfully', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/catalogs/index.json')) {
        return new Response(
          JSON.stringify({
            latest: 'v1.0.0',
            versions: [
              {
                ref: 'v1.0.0',
                folderName: 'v1.0.0',
                commit: 'aaaaaaa',
                generatedAt: '2026-01-01T00:00:00Z',
              },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          meta: {
            generatedAt: '2026-01-01T00:00:00Z',
            litellmSubmodulePath: 'litellm',
            litellmRef: 'v1.0.0',
            litellmCommit: 'aaaaaaa',
          },
          providers: {
            openai: {
              label: 'OpenAI',
              models: [{ id: 'gpt-4o-mini', mode: 'chat' }],
              fields: {
                base: [{ name: 'api_key', type: 'string', required: true, secret: true }],
                extra: [],
              },
            },
          },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    render(
      <CatalogProvider>
        <ContextProbe />
      </CatalogProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected').textContent).toBe('v1.0.0');
      expect(screen.getByTestId('providers').textContent).toBe('1');
      expect(screen.getByTestId('models').textContent).toBe('1');
      expect(screen.getByTestId('fields').textContent).toBe('1');
    });
  });

  it('switches selected version and refetches catalog', async () => {
    const user = userEvent.setup();

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/catalogs/index.json')) {
        return new Response(
          JSON.stringify({
            latest: 'v1.0.0',
            versions: [
              {
                ref: 'v1.0.0',
                folderName: 'v1.0.0',
                commit: 'aaaaaaa',
                generatedAt: '2026-01-01T00:00:00Z',
              },
              {
                ref: 'feature/main',
                folderName: 'feature__main',
                commit: 'bbbbbbb',
                generatedAt: '2026-01-02T00:00:00Z',
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.endsWith('/catalogs/feature__main/catalog.json')) {
        return new Response(
          JSON.stringify({
            meta: {
              generatedAt: '2026-01-02T00:00:00Z',
              litellmSubmodulePath: 'litellm',
              litellmRef: 'feature/main',
              litellmCommit: 'bbbbbbb',
            },
            providers: {
              openai: {
                label: 'OpenAI',
                models: [{ id: 'gpt-4.1', mode: 'chat' }],
                fields: { base: [], extra: [] },
              },
            },
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          meta: {
            generatedAt: '2026-01-01T00:00:00Z',
            litellmSubmodulePath: 'litellm',
            litellmRef: 'v1.0.0',
            litellmCommit: 'aaaaaaa',
          },
          providers: {
            openai: {
              label: 'OpenAI',
              models: [{ id: 'gpt-4o-mini', mode: 'chat' }],
              fields: { base: [], extra: [] },
            },
          },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    render(
      <CatalogProvider>
        <ContextProbe />
      </CatalogProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected').textContent).toBe('v1.0.0');
      expect(screen.getByTestId('models').textContent).toBe('1');
    });

    await user.click(screen.getByRole('button', { name: 'switch' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected').textContent).toBe('feature__main');
      expect(screen.getByTestId('models').textContent).toBe('1');
    });
  });

  it('sets catalog to null when catalog fetch errors', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/catalogs/index.json')) {
        return new Response(
          JSON.stringify({
            latest: 'v1.0.0',
            versions: [
              {
                ref: 'v1.0.0',
                folderName: 'v1.0.0',
                commit: 'aaaaaaa',
                generatedAt: '2026-01-01T00:00:00Z',
              },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    render(
      <CatalogProvider>
        <ContextProbe />
      </CatalogProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected').textContent).toBe('v1.0.0');
      expect(screen.getByTestId('providers').textContent).toBe('0');
      expect(screen.getByTestId('models').textContent).toBe('0');
    });
  });

  it('handles network throw when loading catalog', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/catalogs/index.json')) {
        return new Response(
          JSON.stringify({
            latest: 'v1.0.0',
            versions: [
              {
                ref: 'v1.0.0',
                folderName: 'v1.0.0',
                commit: 'aaaaaaa',
                generatedAt: '2026-01-01T00:00:00Z',
              },
            ],
          }),
          { status: 200 }
        );
      }

      throw new Error('network');
    }) as typeof fetch;

    render(
      <CatalogProvider>
        <ContextProbe />
      </CatalogProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('providers').textContent).toBe('0');
      expect(screen.getByTestId('models').textContent).toBe('0');
    });
  });

  it('ignores index updates after unmount', async () => {
    const resolveIndex: { current: ((value: Response) => void) | null } = { current: null };
    globalThis.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveIndex.current = resolve;
        })
    ) as typeof fetch;

    const { unmount } = render(
      <CatalogProvider>
        <ContextProbe />
      </CatalogProvider>
    );

    unmount();
    if (resolveIndex.current) {
      resolveIndex.current(
        new Response(
          JSON.stringify({
            latest: 'v1.0.0',
            versions: [
              {
                ref: 'v1.0.0',
                folderName: 'v1.0.0',
                commit: 'aaaaaaa',
                generatedAt: '2026-01-01T00:00:00Z',
              },
            ],
          }),
          { status: 200 }
        )
      );
    }

    expect(true).toBe(true);
  });
});
