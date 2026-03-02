import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toolbar } from '@/components/toolbar';
import type { VersionEntry } from '@/lib/catalog-context';

// Mock ModeToggle so toolbar tests stay isolated
vi.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <button data-testid="mode-toggle">Toggle theme</button>,
}));

const versions: VersionEntry[] = [
  { ref: 'v1.0.0', folderName: 'v1.0.0', commit: 'aaaaaaa', generatedAt: '2026-01-01T00:00:00Z' },
];

describe('Toolbar', () => {
  it('shows version selector when versions provided', () => {
    render(
      <Toolbar
        onImport={vi.fn()}
        onDownload={vi.fn()}
        versions={versions}
        selectedVersion="v1.0.0"
        onVersionChange={vi.fn()}
      />
    );

    expect(screen.getByRole('img', { name: 'LiteLLM logo' })).not.toBeNull();
    expect(screen.getByRole('combobox')).not.toBeNull();
  });

  it('hides version selector when versions are empty', () => {
    render(
      <Toolbar
        onImport={vi.fn()}
        onDownload={vi.fn()}
        versions={[]}
        selectedVersion={null}
        onVersionChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Select version')).toBeNull();
  });

  it('renders ModeToggle in the toolbar', () => {
    render(
      <Toolbar
        onImport={vi.fn()}
        onDownload={vi.fn()}
        versions={[]}
        selectedVersion={null}
        onVersionChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('mode-toggle')).not.toBeNull();
  });
});
