import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ModelEntry } from '@/lib/schemas';
import { ModelForm } from '@/components/model-form';

vi.mock('@/lib/catalog', () => ({
  getFieldsForProvider: (providerId: string) => {
    if (providerId === 'anthropic') {
      return {
        base: [
          {
            name: 'anthropic_api_key',
            type: 'string',
            required: true,
            secret: true,
          },
        ],
        extra: [
          {
            name: 'temperature',
            type: 'number',
            required: false,
            secret: false,
          },
        ],
      };
    }

    return {
      base: [
        {
          name: 'openai_api_key',
          type: 'string',
          required: true,
          secret: true,
        },
      ],
      extra: [
        {
          name: 'max_tokens',
          type: 'number',
          required: false,
          secret: false,
        },
        {
          name: 'use_psc_endpoint_format',
          type: 'boolean',
          required: false,
          secret: false,
        },
      ],
    };
  },
}));

vi.mock('@/components/provider-select', () => ({
  ProviderSelect: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (providerId: string) => void;
  }) => (
    <div>
      <div data-testid="provider-value">{value}</div>
      <button type="button" onClick={() => onChange('anthropic')}>
        Change Provider
      </button>
    </div>
  ),
}));

vi.mock('@/components/model-select', () => ({
  ModelSelect: ({ providerId, value }: { providerId: string; value: string }) => (
    <div>
      <div data-testid="model-select-provider">{providerId}</div>
      <div data-testid="model-select-value">{value}</div>
    </div>
  ),
}));

vi.mock('@/components/env-var-input', () => ({
  EnvVarInput: ({ value }: { value: { mode: string; value?: string } }) => (
    <div data-testid="env-var-input">{value.mode}</div>
  ),
}));

vi.mock('@/components/rate-limit-fields', () => ({
  RateLimitFields: () => null,
}));

describe('ModelForm provider change behavior', () => {
  const makeEntry = (): ModelEntry => ({
    id: 'model-1',
    model_name: 'my-model',
    provider: 'openai',
    model: 'gpt-4o-mini',
    litellm_params: {
      openai_api_key: {
        mode: 'literal',
        value: 'x',
      },
    },
  });

  it('updates provider id through ProviderSelect change', async () => {
    const user = userEvent.setup();

    render(<ModelForm entry={makeEntry()} onSave={vi.fn()} />);

    expect(screen.getByTestId('provider-value').textContent).toBe('openai');
    expect(screen.getByTestId('model-select-provider').textContent).toBe('openai');
    expect(screen.getByTestId('model-select-value').textContent).toBe('gpt-4o-mini');
    expect((screen.getByLabelText('Model Alias') as HTMLInputElement).value).toBe('my-model');

    await user.click(screen.getByRole('button', { name: 'Change Provider' }));

    expect(screen.getByTestId('provider-value').textContent).toBe('anthropic');
    expect(screen.getByTestId('model-select-provider').textContent).toBe('anthropic');
    expect(screen.getByTestId('model-select-value').textContent).toBe('');
    expect((screen.getByLabelText('Model Alias') as HTMLInputElement).value).toBe('my-model');
  });

  it('updates provider-specific form fields after provider switch', async () => {
    const user = userEvent.setup();

    render(<ModelForm entry={makeEntry()} onSave={vi.fn()} />);

    expect(screen.getByText('openai_api_key')).not.toBeNull();
    expect(screen.queryByText('anthropic_api_key')).toBeNull();

    await user.click(screen.getByRole('combobox', { name: /add option/i }));
    await user.click(screen.getByText('openai_api_key'));
    expect(screen.getByText('openai_api_key')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Change Provider' }));

    expect(screen.queryByText('openai_api_key')).toBeNull();

    await user.click(screen.getByRole('combobox', { name: /add option/i }));
    expect(screen.getByText('anthropic_api_key')).not.toBeNull();
    expect(screen.getByText('temperature')).not.toBeNull();
  });

  it('removes an added optional field from the form', async () => {
    const user = userEvent.setup();

    render(<ModelForm entry={makeEntry()} onSave={vi.fn()} />);

    expect(screen.getByText('openai_api_key')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Remove openai_api_key' }));
    expect(screen.queryByText('openai_api_key')).toBeNull();
  });

  it('saves while typing without requiring blur', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ModelForm entry={makeEntry()} onSave={onSave} />);

    const aliasInput = screen.getByLabelText('Model Alias');
    await user.clear(aliasInput);
    await user.type(aliasInput, 'live-update');

    expect(onSave).toHaveBeenCalled();
    expect(onSave.mock.calls.at(-1)?.[0]?.model_name).toBe('live-update');
  });

  it('saves boolean option changes immediately without blur', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ModelForm entry={makeEntry()} onSave={onSave} />);

    await user.click(screen.getByRole('combobox', { name: /add option/i }));
    await user.click(screen.getByText('use_psc_endpoint_format'));

    await user.click(screen.getByRole('radio', { name: 'True' }));

    expect(onSave).toHaveBeenCalled();
    const latest = onSave.mock.calls.at(-1)?.[0];
    expect(latest?.litellm_params?.use_psc_endpoint_format).toBe(true);
  });
});
