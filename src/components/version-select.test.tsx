import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VersionSelect } from '@/components/version-select';
import type { VersionEntry } from '@/lib/catalog-context';

const versions: VersionEntry[] = [
  { ref: 'v1.0.0', folderName: 'v1.0.0', commit: 'aaaaaaa', generatedAt: '2026-01-01T00:00:00Z' },
  {
    ref: 'feature/main',
    folderName: 'feature__main',
    commit: 'bbbbbbb',
    generatedAt: '2026-01-02T00:00:00Z',
  },
];

describe('VersionSelect', () => {
  it('renders version list', async () => {
    const user = userEvent.setup();
    render(
      <VersionSelect versions={versions} selectedVersion="v1.0.0" onVersionChange={vi.fn()} />
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getAllByText('v1.0.0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('feature/main')).not.toBeNull();
  });

  it('filters by search query', async () => {
    const user = userEvent.setup();
    render(
      <VersionSelect versions={versions} selectedVersion="v1.0.0" onVersionChange={vi.fn()} />
    );

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search version...'), 'feature');

    expect(screen.getByRole('option', { name: 'feature/main' })).not.toBeNull();
    expect(screen.queryByRole('option', { name: 'v1.0.0' })).toBeNull();
  });

  it('calls onVersionChange on selection', async () => {
    const user = userEvent.setup();
    const onVersionChange = vi.fn();
    render(
      <VersionSelect
        versions={versions}
        selectedVersion="v1.0.0"
        onVersionChange={onVersionChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('feature/main'));

    expect(onVersionChange).toHaveBeenCalledWith('feature__main');
  });

  it('is hidden when no versions are provided', () => {
    const { container } = render(
      <VersionSelect versions={[]} selectedVersion={null} onVersionChange={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });
});
