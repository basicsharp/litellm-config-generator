import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GuardrailAzureForm } from '@/components/guardrail-azure-form';
import type { GuardrailEntry } from '@/lib/schemas';

function createEntry(overrides: Partial<GuardrailEntry> = {}): GuardrailEntry {
  return {
    id: 'g1',
    guardrail_name: 'azure',
    guardrail: 'azure/text_moderations',
    mode: ['pre_call'],
    _extra: {},
    ...overrides,
  };
}

describe('GuardrailAzureForm', () => {
  it('returns null for azure/prompt_shield guardrails', () => {
    const onChange = vi.fn();
    const { container } = render(
      <GuardrailAzureForm
        entry={createEntry({ guardrail: 'azure/prompt_shield' })}
        onChange={onChange}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not add empty blocklist values and supports clearing numeric threshold', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <GuardrailAzureForm entry={createEntry({ severity_threshold: 3 })} onChange={onChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Add blocklist' }));
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ blocklistNames: expect.anything() })
    );

    await user.clear(screen.getByLabelText('Severity threshold'));
    expect(onChange).toHaveBeenCalledWith({ severity_threshold: undefined });
  });

  it('updates per-category thresholds, categories, and blocklist add/remove', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <GuardrailAzureForm
        entry={createEntry({ blocklistNames: ['known'], categories: ['Hate'] })}
        onChange={onChange}
      />
    );

    await user.type(screen.getByLabelText('Hate threshold'), '2');
    await user.type(screen.getByLabelText('SelfHarm threshold'), '3');
    await user.type(screen.getByLabelText('Sexual threshold'), '4');
    await user.type(screen.getByLabelText('Violence threshold'), '5');
    await user.click(screen.getByRole('checkbox', { name: 'Sexual' }));

    await user.type(screen.getByLabelText('Blocklist name'), ' new-list ');
    await user.click(screen.getByRole('button', { name: 'Add blocklist' }));
    await user.click(screen.getByRole('button', { name: 'Remove known' }));

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        severity_threshold_hate: 2,
      })
    );
  });
});
