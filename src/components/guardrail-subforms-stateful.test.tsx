import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { GuardrailAzureForm } from '@/components/guardrail-azure-form';
import { GuardrailContentFilterForm } from '@/components/guardrail-content-filter-form';
import { GuardrailPresidioForm } from '@/components/guardrail-presidio-form';
import type { GuardrailEntry } from '@/lib/schemas';

describe('guardrail subforms stateful', () => {
  it('covers presidio entity action and threshold update paths', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [entry, setEntry] = React.useState<GuardrailEntry>({
        id: 'p',
        guardrail_name: 'p',
        guardrail: 'presidio',
        mode: ['pre_call'],
        _extra: {},
      });
      return (
        <GuardrailPresidioForm
          entry={entry}
          onChange={(patch) => setEntry((prev) => ({ ...prev, ...patch }))}
        />
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: 'CREDIT_CARD' }));
    await user.selectOptions(screen.getByLabelText('Action for CREDIT_CARD'), 'BLOCK');
    await user.type(screen.getByLabelText('ALL threshold'), '7');
    await user.click(screen.getByRole('checkbox', { name: 'CREDIT_CARD' }));

    expect(screen.getByText('Presidio Settings')).not.toBeNull();
  });

  it('covers azure blocklist add/remove and output selection paths', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [entry, setEntry] = React.useState<GuardrailEntry>({
        id: 'a',
        guardrail_name: 'a',
        guardrail: 'azure/text_moderations',
        mode: ['pre_call'],
        _extra: {},
      });
      return (
        <GuardrailAzureForm
          entry={entry}
          onChange={(patch) => setEntry((prev) => ({ ...prev, ...patch }))}
        />
      );
    }

    render(<Harness />);
    await user.type(screen.getByLabelText('Severity threshold'), '4');
    await user.click(screen.getByRole('checkbox', { name: 'Hate' }));
    await user.type(screen.getByLabelText('Blocklist name'), 'default-list');
    await user.click(screen.getByRole('button', { name: 'Add blocklist' }));
    await user.click(screen.getByRole('button', { name: 'Remove default-list' }));
    await user.selectOptions(screen.getByLabelText('Output type'), 'raw');

    expect(screen.getByText('Azure Text Moderations')).not.toBeNull();
  });

  it('covers content filter add/edit/remove rows', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [entry, setEntry] = React.useState<GuardrailEntry>({
        id: 'c',
        guardrail_name: 'c',
        guardrail: 'litellm_content_filter',
        mode: ['pre_call'],
        _extra: {},
      });
      return (
        <GuardrailContentFilterForm
          entry={entry}
          onChange={(patch) => setEntry((prev) => ({ ...prev, ...patch }))}
        />
      );
    }

    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Add Category' }));
    await user.selectOptions(screen.getByLabelText('Category 1'), 'bias_gender');
    await user.selectOptions(screen.getByLabelText('Action 1'), 'mask');
    await user.type(screen.getByLabelText('Severity 1'), '5');

    await user.click(screen.getByRole('button', { name: 'Add Pattern' }));
    await user.selectOptions(screen.getByLabelText('Pattern type 1'), 'regex');
    await user.type(screen.getByLabelText('Pattern value 1'), 'foo.*bar');
    await user.selectOptions(screen.getByLabelText('Pattern action 1'), 'log');

    await user.click(screen.getByRole('button', { name: 'Add Word' }));
    await user.type(screen.getByLabelText('Blocked keyword 1'), 'password');
    await user.selectOptions(screen.getByLabelText('Blocked action 1'), 'mask');

    await user.click(screen.getByRole('button', { name: 'Remove category 1' }));
    await user.click(screen.getByRole('button', { name: 'Remove pattern 1' }));
    await user.click(screen.getByRole('button', { name: 'Remove blocked word 1' }));

    expect(screen.getByText('Content Filter')).not.toBeNull();
  });
});
