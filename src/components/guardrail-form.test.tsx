import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GuardrailForm } from '@/components/guardrail-form';
import type { GuardrailEntry } from '@/lib/schemas';

const baseEntry: GuardrailEntry = {
  id: 'g-1',
  guardrail_name: 'guardrail',
  guardrail: 'litellm_content_filter',
  mode: ['pre_call'],
  _extra: {},
};

async function selectGuardrailProvider(user: ReturnType<typeof userEvent.setup>, provider: string) {
  await user.click(screen.getByRole('combobox', { name: 'Guardrail provider' }));
  const optionLabel = screen
    .getAllByText(provider)
    .find((element) => element.closest('[cmdk-item]') !== null);
  const option = optionLabel?.closest('[cmdk-item]');
  expect(option).not.toBeNull();
  await user.click(option as HTMLElement);
}

describe('GuardrailForm', () => {
  it('renders provider groups and mode multi-select', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<GuardrailForm entry={baseEntry} onSave={onSave} />);

    await user.click(screen.getByRole('combobox', { name: 'Guardrail provider' }));
    expect(screen.getByText('Built-in')).not.toBeNull();
    expect(screen.getByText('External Tier 1')).not.toBeNull();
    expect(screen.getByText('External Tier 2')).not.toBeNull();
    expect(screen.getByText('Custom')).not.toBeNull();
    expect(screen.getAllByText('litellm_content_filter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('presidio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('generic_guardrail_api').length).toBeGreaterThan(0);

    await selectGuardrailProvider(user, 'litellm_content_filter');

    expect(screen.getByText('Ent.')).not.toBeNull();
    expect(screen.getByText(/Tag-based mode mapping/)).not.toBeNull();
    expect(screen.getByText('At least one mode must stay selected.')).not.toBeNull();

    const preCall = screen.getByRole('checkbox', { name: 'pre_call' });
    expect((preCall as HTMLInputElement).disabled).toBe(true);

    const postCall = screen.getByRole('checkbox', { name: 'post_call' });
    await user.click(postCall);
    expect((screen.getByRole('checkbox', { name: 'pre_call' }) as HTMLInputElement).disabled).toBe(
      false
    );
    expect(onSave).toHaveBeenCalled();
  }, 15000);

  it('supports api_key env-var toggle', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<GuardrailForm entry={baseEntry} onSave={onSave} />);

    await user.click(screen.getByRole('radio', { name: 'Env var mode' }));
    await user.type(screen.getByLabelText('Environment variable name'), 'MY_GUARDRAIL_KEY');

    const lastCall = onSave.mock.calls.at(-1)?.[0] as GuardrailEntry;
    expect(lastCall.api_key).toEqual({ mode: 'env', varName: 'MY_GUARDRAIL_KEY' });
  });

  it('requires guardrail name before saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<GuardrailForm entry={baseEntry} onSave={onSave} />);

    const nameInput = screen.getByLabelText('Guardrail name');
    await user.clear(nameInput);

    expect(screen.getByText('Guardrail name is required')).not.toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('clears provider-specific fields when provider changes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <GuardrailForm
        entry={{
          ...baseEntry,
          guardrail: 'presidio',
          pii_entities_config: { CREDIT_CARD: 'MASK' },
        }}
        onSave={onSave}
      />
    );

    await selectGuardrailProvider(user, 'bedrock');
    const lastCall = onSave.mock.calls.at(-1)?.[0] as GuardrailEntry;
    expect(lastCall.guardrail).toBe('bedrock');
    expect(lastCall.pii_entities_config).toBeUndefined();
  });

  it('keeps at least one mode selected when toggling off all modes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <GuardrailForm
        entry={{
          ...baseEntry,
          mode: ['pre_call'],
        }}
        onSave={onSave}
      />
    );

    const preCall = screen.getByRole('checkbox', { name: 'pre_call' }) as HTMLInputElement;
    expect(preCall.disabled).toBe(true);
    await user.click(preCall);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('renders provider-specific subforms for selected provider values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<GuardrailForm entry={baseEntry} onSave={onSave} />);

    await selectGuardrailProvider(user, 'presidio');
    expect(screen.getByText('Presidio Settings')).not.toBeNull();

    await selectGuardrailProvider(user, 'bedrock');
    expect(screen.getByText('Bedrock Settings')).not.toBeNull();

    await selectGuardrailProvider(user, 'azure/text_moderations');
    expect(screen.getByText('Azure Text Moderations')).not.toBeNull();

    await selectGuardrailProvider(user, 'azure/prompt_shield');
    expect(screen.queryByText('Azure Text Moderations')).toBeNull();

    await selectGuardrailProvider(user, 'generic_guardrail_api');
    expect(screen.getByText('Generic Guardrail API')).not.toBeNull();
  });

  it('toggles guardrail info section and manages params', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<GuardrailForm entry={baseEntry} onSave={onSave} />);

    expect(screen.queryByLabelText('Param name 1')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Guardrail Info' }));
    await user.click(screen.getByRole('button', { name: 'Add Param' }));
    const paramInput = screen.getByLabelText('Param name 1');
    expect(paramInput).not.toBeNull();
    await user.type(paramInput, 't');
    expect((paramInput as HTMLInputElement).value).toBe('t');
    expect(onSave).toHaveBeenCalled();
  });

  it('keeps focus when typing guardrail info param name with parent state updates', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [current, setCurrent] = React.useState<GuardrailEntry>(baseEntry);
      return <GuardrailForm entry={current} onSave={setCurrent} />;
    }

    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Guardrail Info' }));
    await user.click(screen.getByRole('button', { name: 'Add Param' }));

    const nameInput = screen.getByLabelText('Param name 1') as HTMLInputElement;
    await user.click(nameInput);
    await user.type(nameInput, 'threshold');

    expect(nameInput.value).toBe('threshold');
    expect(document.activeElement).toBe(nameInput);
  }, 15000);
});
