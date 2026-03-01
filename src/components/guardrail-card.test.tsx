import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { GuardrailCard } from '@/components/guardrail-card';
import type { GuardrailEntry } from '@/lib/schemas';

const entry: GuardrailEntry = {
  id: 'g1',
  guardrail_name: 'guardrail-one',
  guardrail: 'litellm_content_filter',
  mode: ['pre_call'],
  _extra: {},
};

describe('GuardrailCard', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'confirm', {
      value: vi.fn(() => true),
      writable: true,
      configurable: true,
    });
  });

  it('expands and deletes', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <GuardrailCard entry={entry} onSave={vi.fn()} onDelete={onDelete} defaultExpanded={false} />
    );

    await user.click(screen.getByRole('button', { name: 'Expand card' }));
    expect(screen.getByLabelText('Guardrail name')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete guardrail' }));
    expect(onDelete).toHaveBeenCalledWith('g1');
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    (window.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

    render(<GuardrailCard entry={entry} onSave={vi.fn()} onDelete={onDelete} defaultExpanded />);
    await user.click(screen.getByRole('button', { name: 'Delete guardrail' }));

    expect(onDelete).not.toHaveBeenCalled();
  });
});
