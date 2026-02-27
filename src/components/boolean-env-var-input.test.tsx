import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BooleanEnvVarInput } from '@/components/boolean-env-var-input';
import type { EnvVarValue } from '@/lib/schemas';

describe('BooleanEnvVarInput', () => {
  it('switches from literal to env mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BooleanEnvVarInput value={false} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Env var mode' }));

    expect(onChange).toHaveBeenCalledWith({ mode: 'env', varName: '' });
  });

  it('updates env var name in env mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: boolean | EnvVarValue) => void>();

    function ControlledEnvInput() {
      const [value, setValue] = React.useState<boolean | EnvVarValue>({ mode: 'env', varName: '' });
      return (
        <BooleanEnvVarInput
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }

    render(<ControlledEnvInput />);

    await user.type(screen.getByLabelText('Environment variable name'), 'FEATURE_FLAG');

    expect(onChange).toHaveBeenLastCalledWith({ mode: 'env', varName: 'FEATURE_FLAG' });
  });

  it('switches from env mode to literal false', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BooleanEnvVarInput value={{ mode: 'env', varName: 'FLAG' }} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Literal mode' }));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('selects true/false literal values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: boolean | EnvVarValue) => void>();

    function ControlledLiteralInput() {
      const [value, setValue] = React.useState<boolean | EnvVarValue>(true);
      return (
        <BooleanEnvVarInput
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }

    render(<ControlledLiteralInput />);

    await user.click(screen.getByRole('radio', { name: 'False' }));
    await user.click(screen.getByRole('radio', { name: 'True' }));

    expect(onChange).toHaveBeenCalledWith(false);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not emit changes when toggle-group emits an empty literal value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BooleanEnvVarInput value={true} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'True' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not emit mode change when empty mode is emitted', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BooleanEnvVarInput value={{ mode: 'env', varName: 'FLAG' }} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Env var mode' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
