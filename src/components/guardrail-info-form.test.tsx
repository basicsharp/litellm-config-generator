import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GuardrailInfoForm } from '@/components/guardrail-info-form';
import type { GuardrailInfo } from '@/lib/schemas';

describe('GuardrailInfoForm', () => {
  it('is collapsed by default and can add/remove params', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = React.useState<GuardrailInfo | undefined>(undefined);
      return (
        <GuardrailInfoForm
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }

    render(<Harness />);
    expect(screen.queryByLabelText('Param name 1')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Guardrail Info' }));
    await user.click(screen.getByRole('button', { name: 'Add Param' }));
    expect(screen.getByLabelText('Param name 1')).not.toBeNull();

    await user.type(screen.getByLabelText('Param name 1'), 'threshold');
    await user.type(screen.getByLabelText('Param type 1'), 'number');
    await user.type(screen.getByLabelText('Param description 1'), 'risk');
    const hasFilledUpdate = onChange.mock.calls.some(([value]) => {
      const firstParam = (value as GuardrailInfo | undefined)?.params?.[0];
      return (
        typeof firstParam?.name === 'string' &&
        firstParam.name.length > 0 &&
        firstParam.type === 'number' &&
        firstParam.description === 'risk'
      );
    });
    expect(hasFilledUpdate).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Remove param 1' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    expect(onChange).toHaveBeenCalled();
  });
});
