import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ModelSelect } from '@/components/model-select';

vi.mock('@/lib/catalog-context', () => ({
  useModelsForProvider: vi.fn(() => [
    { id: 'gpt-4o-mini', mode: null },
    { id: 'gpt-4.1', mode: 'chat' },
  ]),
}));

describe('ModelSelect', () => {
  it('shows models and supports selecting an item', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ModelSelect providerId="openai" value="" onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('unknown mode')).not.toBeNull();
    await user.click(screen.getByText('gpt-4o-mini'));

    expect(onChange).toHaveBeenCalledWith('gpt-4o-mini');
  });

  it('allows custom model entry', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ModelSelect providerId="openai" value="" onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search model...'), 'custom.model');
    await user.click(screen.getByText('Use custom: custom.model'));

    expect(onChange).toHaveBeenCalledWith('custom.model');
  });
});
