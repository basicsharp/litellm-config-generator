'use client';

import React, { startTransition, useCallback, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { EnvVarInput } from '@/components/env-var-input';
import { ModelSelect } from '@/components/model-select';
import { BooleanEnvVarInput } from '@/components/boolean-env-var-input';
import { ProviderSelect } from '@/components/provider-select';
import { RateLimitFields } from '@/components/rate-limit-fields';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getFieldsForProvider } from '@/lib/catalog';
import { modelEntryResolver } from '@/lib/form-utils';
import type { EnvVarValue, ModelEntry } from '@/lib/schemas';
import { Separator } from './ui/separator';

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

  const submitHandler = useCallback(() => {
    void form.handleSubmit(onSave)();
  }, [form, onSave]);

  useEffect(() => {
    form.reset(entry);
  }, [entry, form]);

  const providerId = form.watch('provider');
  const fields = getFieldsForProvider(providerId);

  const optionalFields = React.useMemo(() => {
    const merged = [...fields.base, ...fields.extra].filter(
      (field) => !EXCLUDED_DYNAMIC_FIELDS.has(field.name)
    );
    const deduped = new Map(merged.map((field) => [field.name, field]));
    return Array.from(deduped.values());
  }, [fields.base, fields.extra]);

  const [addOptionOpen, setAddOptionOpen] = React.useState(false);
  const [addOptionQuery, setAddOptionQuery] = React.useState('');
  const [selectedOptionNames, setSelectedOptionNames] = React.useState<string[]>([]);

  useEffect(() => {
    const currentParams = form.getValues('litellm_params');
    const selected = optionalFields
      .filter((field) => Object.prototype.hasOwnProperty.call(currentParams, field.name))
      .map((field) => field.name);
    setSelectedOptionNames((current) => {
      if (
        current.length === selected.length &&
        current.every((name, index) => name === selected[index])
      ) {
        return current;
      }
      return selected;
    });
  }, [form, providerId, optionalFields]);

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      startTransition(() => {
        form.reset({ ...form.getValues(), provider: newProvider, model: '', litellm_params: {} });
      });
    },
    [form]
  );

  const selectedFields = selectedOptionNames
    .map((name) => optionalFields.find((field) => field.name === name))
    .filter((field): field is NonNullable<typeof field> => Boolean(field));

  const availableOptions = optionalFields.filter(
    (field) => !selectedOptionNames.includes(field.name)
  );

  const handleAddOption = useCallback(
    (fieldName: string) => {
      setSelectedOptionNames((current) => {
        if (current.includes(fieldName)) {
          return current;
        }
        return [...current, fieldName];
      });
      const addedField = optionalFields.find((f) => f.name === fieldName);
      if (addedField?.type === 'boolean') {
        form.setValue(`litellm_params.${fieldName}` as `litellm_params.${string}`, false, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      setAddOptionOpen(false);
      setAddOptionQuery('');
    },
    [form, optionalFields]
  );

  const handleRemoveOption = useCallback(
    (fieldName: string) => {
      setSelectedOptionNames((current) => current.filter((name) => name !== fieldName));

      const currentParams = form.getValues('litellm_params');
      const nextParams = Object.fromEntries(
        Object.entries(currentParams).filter(([name]) => name !== fieldName)
      );
      form.setValue('litellm_params', nextParams, { shouldDirty: true, shouldTouch: true });
    },
    [form]
  );

  useEffect(() => {
    const subscription = form.watch((_values, { type }) => {
      if (type !== 'change') {
        return;
      }
      submitHandler();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, submitHandler]);

  return (
    <Form {...form}>
      <form onSubmit={submitHandler} className="space-y-4">
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

        <details className="rounded border p-3">
          <summary className="text-sm cursor-pointer font-medium">Advanced</summary>
          <div className="mt-3 space-y-4">
            <RateLimitFields form={form} />
          </div>
        </details>

        <div className="space-y-3 rounded border p-3">
          <p className="text-sm font-medium">Optional Parameters</p>
          {selectedFields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={`litellm_params.${field.name}` as `litellm_params.${string}`}
              render={({ field: formField }) => (
                <FormItem className="space-y-0">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">{field.name}</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${field.name}`}
                      onClick={() => handleRemoveOption(field.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormControl>
                    {field.type === 'boolean' ? (
                      <BooleanEnvVarInput
                        value={formField.value as boolean | undefined}
                        onChange={formField.onChange}
                      />
                    ) : (
                      <EnvVarInput
                        value={asEnvValue(formField.value)}
                        onChange={formField.onChange}
                        secret={field.secret}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Separator orientation="horizontal" />
          <Popover open={addOptionOpen} onOpenChange={setAddOptionOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                role="combobox"
                aria-label="Add option"
                className="w-full justify-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add option
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search option..."
                  value={addOptionQuery}
                  onValueChange={setAddOptionQuery}
                />
                <CommandList>
                  <CommandEmpty>No options found.</CommandEmpty>
                  <CommandGroup>
                    {availableOptions
                      .filter((field) =>
                        field.name.toLowerCase().includes(addOptionQuery.trim().toLowerCase())
                      )
                      .map((field) => (
                        <CommandItem
                          key={field.name}
                          value={field.name}
                          onSelect={() => handleAddOption(field.name)}
                        >
                          {field.name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </form>
    </Form>
  );
}
