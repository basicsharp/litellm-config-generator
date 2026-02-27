'use client';

import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { EnvVarInput } from '@/components/env-var-input';
import { ModelSelect } from '@/components/model-select';
import { ProviderSelect } from '@/components/provider-select';
import { RateLimitFields } from '@/components/rate-limit-fields';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getFieldsForProvider } from '@/lib/catalog';
import { modelEntryResolver } from '@/lib/form-utils';
import type { EnvVarValue, ModelEntry } from '@/lib/schemas';

type ModelFormProps = {
  entry: ModelEntry;
  onSave: (entry: ModelEntry) => void;
};

const EXCLUDED_DYNAMIC_FIELDS = new Set([
  'model',
  'rpm',
  'tpm',
  'timeout',
  'stream_timeout',
  'max_retries',
]);

function asEnvValue(value: unknown): EnvVarValue {
  if (value && typeof value === 'object' && 'mode' in value) {
    return value as EnvVarValue;
  }
  return { mode: 'literal', value: '' };
}

export function ModelForm({ entry, onSave }: ModelFormProps) {
  const form = useForm<ModelEntry>({
    resolver: modelEntryResolver,
    defaultValues: entry,
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(entry);
  }, [entry, form]);

  const providerId = form.watch('provider');
  const fields = getFieldsForProvider(providerId);
  const baseFields = fields.base.filter((field) => !EXCLUDED_DYNAMIC_FIELDS.has(field.name));

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      form.reset({ ...form.getValues(), provider: newProvider, litellm_params: {} });
    },
    [form]
  );

  return (
    <Form {...form}>
      <form onBlur={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="model_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Alias</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <ProviderSelect
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    handleProviderChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <ModelSelect
                  providerId={providerId}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {baseFields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={`litellm_params.${field.name}` as `litellm_params.${string}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <EnvVarInput
                    value={asEnvValue(formField.value)}
                    onChange={formField.onChange}
                    secret={field.secret}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        {fields.extra.length > 0 && (
          <details className="border rounded p-3">
            <summary className="cursor-pointer font-semibold">Advanced</summary>
            <div className="mt-3 space-y-4">
              {fields.extra.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={`litellm_params.${field.name}` as `litellm_params.${string}`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>
                        {field.name}
                        {field.required && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <EnvVarInput
                          value={asEnvValue(formField.value)}
                          onChange={formField.onChange}
                          secret={field.secret}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </details>
        )}

        <RateLimitFields form={form} />

        <Button type="submit" className="w-full">
          Save
        </Button>
      </form>
    </Form>
  );
}
