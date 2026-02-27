'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ModelEntry } from '@/lib/schemas';

type RateLimitFieldsProps = {
  form: UseFormReturn<ModelEntry>;
};

function NumberField({
  form,
  name,
  label,
}: {
  form: UseFormReturn<ModelEntry>;
  name: 'rpm' | 'tpm' | 'timeout' | 'stream_timeout' | 'max_retries';
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={typeof field.value === 'number' ? field.value : ''}
              onChange={(event) => {
                const next = event.target.value;
                field.onChange(next === '' ? undefined : Number(next));
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function RateLimitFields({ form }: RateLimitFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <NumberField form={form} name="rpm" label="RPM" />
      <NumberField form={form} name="tpm" label="TPM" />
      <NumberField form={form} name="timeout" label="Timeout" />
      <NumberField form={form} name="stream_timeout" label="Stream Timeout" />
      <NumberField form={form} name="max_retries" label="Max Retries" />
    </div>
  );
}
