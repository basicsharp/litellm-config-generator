import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProviderSelect } from '@/components/provider-select';

vi.mock('@/lib/catalog-context', () => ({
  useProviders: vi.fn(() => [
    { id: 'openai', label: 'OpenAI' },
    { id: 'azure', label: 'Azure OpenAI' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'bedrock', label: 'AWS Bedrock' },
    { id: 'vertex_ai', label: 'Vertex AI' },
    { id: 'gemini', label: 'Gemini' },
    { id: 'groq', label: 'Groq' },
    { id: 'mistral', label: 'Mistral' },
    { id: 'ollama', label: 'Ollama' },
    { id: 'hosted_vllm', label: 'Hosted vLLM' },
  ]),
}));

describe('ProviderSelect', () => {
  it('opens on click with focused search input', async () => {
    const user = userEvent.setup();

    render(<ProviderSelect value="" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox', { name: /provider/i }));

    const input = await screen.findByPlaceholderText('Search provider...');
    expect(input).not.toBeNull();

    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  it('filters providers by typing (case-insensitive contains)', async () => {
    const user = userEvent.setup();

    render(<ProviderSelect value="" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox', { name: /provider/i }));
    await user.type(screen.getByPlaceholderText('Search provider...'), 'AZURE');

    expect(screen.getByText('Azure OpenAI')).not.toBeNull();
    expect(screen.queryByText('Anthropic')).toBeNull();
  });

  it('shows empty state when no providers match', async () => {
    const user = userEvent.setup();

    render(<ProviderSelect value="" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox', { name: /provider/i }));
    await user.type(screen.getByPlaceholderText('Search provider...'), 'zzzzzz');

    expect(screen.getByText('No providers found.')).not.toBeNull();
  });

  it('selects a provider, calls onChange, and closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Wrapper() {
      const [value, setValue] = useState('');

      return (
        <ProviderSelect
          value={value}
          onChange={(providerId) => {
            onChange(providerId);
            setValue(providerId);
          }}
        />
      );
    }

    render(<Wrapper />);

    await user.click(screen.getByRole('combobox', { name: /provider/i }));
    await user.click(screen.getByText('Anthropic'));

    expect(onChange).toHaveBeenCalledWith('anthropic');
    expect(screen.getByRole('combobox', { name: /provider/i }).textContent).toContain('Anthropic');
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search provider...')).toBeNull();
    });
  });

  it('shows a checkmark on the selected item', async () => {
    const user = userEvent.setup();

    render(<ProviderSelect value="groq" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox', { name: /provider/i }));

    const selectedLabel = screen
      .getAllByText('Groq')
      .find((element) => element.closest('[cmdk-item]') !== null);
    const selectedItem = selectedLabel?.closest('[cmdk-item]');
    expect(selectedItem).not.toBeNull();

    const selectedIcon = within(selectedItem as HTMLElement).getByTestId('provider-checkmark');
    expect(selectedIcon.getAttribute('class')).toContain('opacity-100');
  });
});
