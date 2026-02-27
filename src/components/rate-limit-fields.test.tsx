import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useForm } from 'react-hook-form';

import type { ModelEntry } from '@/lib/schemas';
import { Form } from '@/components/ui/form';
import { RateLimitFields } from '@/components/rate-limit-fields';

function Wrapper() {
  const form = useForm<ModelEntry>({
    defaultValues: {
      id: 'm',
      model_name: 'demo',
      provider: 'openai',
      model: 'gpt-4o-mini',
      litellm_params: {},
      rpm: undefined,
      tpm: undefined,
      timeout: undefined,
      stream_timeout: undefined,
      max_retries: undefined,
    },
  });

  return (
    <Form {...form}>
      <RateLimitFields form={form} />
    </Form>
  );
}

describe('RateLimitFields', () => {
  it('updates numeric values from inputs', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const rpm = screen.getByLabelText('RPM');
    await user.type(rpm, '123');
    await user.clear(rpm);

    expect((rpm as HTMLInputElement).value).toBe('');
    expect(screen.getByLabelText('TPM')).not.toBeNull();
    expect(screen.getByLabelText('Timeout')).not.toBeNull();
    expect(screen.getByLabelText('Stream Timeout')).not.toBeNull();
    expect(screen.getByLabelText('Max Retries')).not.toBeNull();
  });
});
