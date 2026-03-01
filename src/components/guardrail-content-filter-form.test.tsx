import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GuardrailContentFilterForm } from '@/components/guardrail-content-filter-form';
import type { GuardrailEntry } from '@/lib/schemas';

function createEntry(overrides: Partial<GuardrailEntry> = {}): GuardrailEntry {
  return {
    id: 'g1',
    guardrail_name: 'content',
    guardrail: 'litellm_content_filter',
    mode: ['pre_call'],
    categories: [{ category: 'harmful_violence', action: 'block', enabled: true }],
    patterns: [
      { type: 'name', name: 'email', action: 'block' },
      { type: 'regex', regex: '.*secret.*', action: 'mask' },
    ],
    blocked_words: [{ keyword: 'secret', action: 'block' }],
    _extra: {},
    ...overrides,
  };
}

describe('GuardrailContentFilterForm', () => {
  it('updates regex/name pattern branches and blocked word actions', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [entry, setEntry] = React.useState<GuardrailEntry>(createEntry());
      return (
        <GuardrailContentFilterForm
          entry={entry}
          onChange={(next) => {
            setEntry((current) => ({ ...current, ...next }));
            onChange(next);
          }}
        />
      );
    }

    render(<Harness />);

    await user.clear(screen.getByLabelText('Pattern value 2'));
    await user.type(screen.getByLabelText('Pattern value 2'), '^masked$');
    await user.selectOptions(screen.getByLabelText('Pattern action 2'), 'log');

    await user.clear(screen.getByLabelText('Pattern value 1'));
    await user.type(screen.getByLabelText('Pattern value 1'), 'phone');
    await user.selectOptions(screen.getByLabelText('Pattern action 1'), 'mask');

    await user.clear(screen.getByLabelText('Blocked keyword 1'));
    await user.type(screen.getByLabelText('Blocked keyword 1'), 'token');
    await user.selectOptions(screen.getByLabelText('Blocked action 1'), 'log');
    await user.click(screen.getByRole('button', { name: 'Remove blocked word 1' }));

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ blocked_words: [] }));
  }, 15000);
});
