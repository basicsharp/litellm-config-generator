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
  ModelSelect: ({ providerId }: { providerId: string }) => (
    <div data-testid="model-select-provider">{providerId}</div>
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

    await user.click(screen.getByRole('button', { name: 'Change Provider' }));

    expect(screen.getByTestId('provider-value').textContent).toBe('anthropic');
    expect(screen.getByTestId('model-select-provider').textContent).toBe('anthropic');
  });

  it('updates provider-specific form fields after provider switch', async () => {
    const user = userEvent.setup();

    render(<ModelForm entry={makeEntry()} onSave={vi.fn()} />);

    expect(screen.getByText('openai_api_key')).not.toBeNull();
    expect(screen.queryByText('anthropic_api_key')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Change Provider' }));

    expect(screen.getByText('anthropic_api_key')).not.toBeNull();
    expect(screen.queryByText('openai_api_key')).toBeNull();
    expect(screen.getByText('temperature')).not.toBeNull();
  });
});
