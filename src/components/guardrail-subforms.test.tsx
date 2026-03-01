import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GuardrailAzureForm } from '@/components/guardrail-azure-form';
import { GuardrailBedrockForm } from '@/components/guardrail-bedrock-form';
import { GuardrailContentFilterForm } from '@/components/guardrail-content-filter-form';
import { GuardrailGenericForm } from '@/components/guardrail-generic-form';
import { GuardrailPresidioForm } from '@/components/guardrail-presidio-form';
import type { GuardrailEntry } from '@/lib/schemas';

const base: GuardrailEntry = {
  id: 'g',
  guardrail_name: 'g',
  guardrail: 'presidio',
  mode: ['pre_call'],
  _extra: {},
};

describe('guardrail subforms', () => {
  it('supports presidio controls and custom entity add', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<GuardrailPresidioForm entry={base} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText('Language'), 'de');
    await user.selectOptions(screen.getByLabelText('Filter scope'), 'input');
    await user.click(screen.getByRole('checkbox', { name: 'Output parse PII' }));
    await user.click(screen.getByRole('checkbox', { name: 'CREDIT_CARD' }));
    await user.type(screen.getByLabelText('Custom entity'), 'MY_ENTITY');
    await user.click(screen.getByRole('button', { name: 'Add custom entity' }));
    await user.type(screen.getByLabelText('ALL threshold'), '8');
    await user.selectOptions(screen.getByLabelText('Action for CREDIT_CARD'), 'BLOCK');
    await user.click(screen.getByRole('checkbox', { name: 'CREDIT_CARD' }));

    expect(onChange).toHaveBeenCalled();
  }, 15000);

  it('updates bedrock fields', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<GuardrailBedrockForm entry={{ ...base, guardrail: 'bedrock' }} onChange={onChange} />);
    await user.type(screen.getByLabelText('Guardrail Identifier'), 'abc');
    await user.type(screen.getByLabelText('Guardrail Version'), 'DRAFT');
    await user.click(screen.getByRole('checkbox', { name: 'Mask request content' }));
    await user.click(screen.getByRole('checkbox', { name: 'Mask response content' }));
    await user.click(screen.getByRole('checkbox', { name: 'Disable exception on block' }));
    await user.click(screen.getAllByRole('radio', { name: 'Env var mode' })[0] as HTMLElement);

    expect(onChange).toHaveBeenCalled();
  });

  it('updates azure severity and categories', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GuardrailAzureForm
        entry={{ ...base, guardrail: 'azure/text_moderations' }}
        onChange={onChange}
      />
    );

    await user.type(screen.getByLabelText('Severity threshold'), '4');
    await user.type(screen.getByLabelText('Hate threshold'), '3');
    await user.click(screen.getByRole('checkbox', { name: 'Hate' }));
    await user.type(screen.getByLabelText('Blocklist name'), 'default-blocklist');
    await user.click(screen.getByRole('button', { name: 'Add blocklist' }));
    await user.click(screen.getByRole('checkbox', { name: 'Halt on blocklist hit' }));
    await user.selectOptions(screen.getByLabelText('Output type'), 'summary');

    expect(onChange).toHaveBeenCalled();
  });

  it('renders no extra fields for azure prompt shield', () => {
    const onChange = vi.fn();
    const { container } = render(
      <GuardrailAzureForm
        entry={{ ...base, guardrail: 'azure/prompt_shield' }}
        onChange={onChange}
      />
    );

    expect(container.textContent).toBe('');
  });

  it('supports content filter category and pattern lists', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GuardrailContentFilterForm
        entry={{ ...base, guardrail: 'litellm_content_filter' }}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Add Category' }));
    await user.click(screen.getByRole('button', { name: 'Add Pattern' }));
    await user.click(screen.getByRole('button', { name: 'Add Word' }));

    expect(onChange).toHaveBeenCalled();
  });

  it('supports removing prefilled content filter rows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GuardrailContentFilterForm
        entry={{
          ...base,
          guardrail: 'litellm_content_filter',
          categories: [{ category: 'harmful_violence' }],
          patterns: [{ type: 'name', name: 'email' }],
          blocked_words: [{ keyword: 'secret' }],
        }}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Remove category 1' }));
    await user.click(screen.getByRole('button', { name: 'Remove pattern 1' }));
    await user.click(screen.getByRole('button', { name: 'Remove blocked word 1' }));
    expect(onChange).toHaveBeenCalled();
  });

  it('updates generic params and fallback values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GuardrailGenericForm
        entry={{
          ...base,
          guardrail: 'generic_guardrail_api',
          additional_provider_specific_params: { alpha: '1' },
          unreachable_fallback: 'fail_closed',
        }}
        onChange={onChange}
      />
    );

    await user.selectOptions(screen.getByLabelText('Unreachable fallback'), 'fail_open');
    await user.type(screen.getByLabelText('Param key 1'), 'beta');
    await user.type(screen.getByLabelText('Param value 1'), '2');
    expect(onChange).toHaveBeenCalled();
  });

  it('supports generic additional provider params editor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GuardrailGenericForm
        entry={{
          ...base,
          guardrail: 'generic_guardrail_api',
          additional_provider_specific_params: { threshold: '0.8' },
        }}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Add Param' }));
    await user.type(screen.getByLabelText('Param key 1'), 'foo');
    await user.type(screen.getByLabelText('Param value 1'), 'bar');
    await user.click(screen.getByRole('button', { name: 'Remove param 1' }));
    await user.selectOptions(screen.getByLabelText('Unreachable fallback'), 'fail_open');

    expect(onChange).toHaveBeenCalled();
  });
});
