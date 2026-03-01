'use client';

import React, { startTransition, useCallback, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { EnvVarInput } from '@/components/env-var-input';
import { ModelSelect } from '@/components/model-select';
import { BooleanEnvVarInput } from '@/components/boolean-env-var-input';
import { ProviderSelect } from '@/components/provider-select';
import { RateLimitFields } from '@/components/rate-limit-fields';
import { Badge } from '@/components/ui/badge';
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
import { useFieldsForProvider } from '@/lib/catalog-context';
import { modelEntryResolver } from '@/lib/form-utils';
import type { EnvVarValue, ModelEntry } from '@/lib/schemas';
import { Separator } from './ui/separator';
import type { CatalogField } from '@/lib/catalog';

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

const ENTERPRISE_PARAM_NAMES = new Set([
  'guardrails',
  'budget_id',
  'temp_budget_increase',
  'temp_budget_expiry',
  'callback_name',
  'callback_type',
  'callback_vars',
]);

const ENTERPRISE_OPTIONAL_FIELDS: CatalogField[] = [
  { name: 'guardrails', type: 'unknown', required: false, secret: false },
  { name: 'budget_id', type: 'string', required: false, secret: false },
  { name: 'temp_budget_increase', type: 'number', required: false, secret: false },
  { name: 'temp_budget_expiry', type: 'string', required: false, secret: false },
  { name: 'callback_name', type: 'string', required: false, secret: false },
  { name: 'callback_type', type: 'string', required: false, secret: false },
  { name: 'callback_vars', type: 'string', required: false, secret: false },
];

function isEnterpriseParam(name: string): boolean {
  return ENTERPRISE_PARAM_NAMES.has(name);
}

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
  const fields = useFieldsForProvider(providerId);

  const optionalFields = React.useMemo(() => {
    const merged = [...fields.base, ...fields.extra, ...ENTERPRISE_OPTIONAL_FIELDS].filter(
      (field) => !EXCLUDED_DYNAMIC_FIELDS.has(field.name)
    );
    const deduped = new Map(merged.map((field) => [field.name, field]));
    return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [fields.base, fields.extra]);

  const [addOptionOpen, setAddOptionOpen] = React.useState(false);
  const [addOptionQuery, setAddOptionQuery] = React.useState('');
  const [selectedOptionNames, setSelectedOptionNames] = React.useState<string[]>([]);
  const [guardrailInput, setGuardrailInput] = React.useState('');

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
      } else if (fieldName === 'guardrails') {
        form.setValue('litellm_params.guardrails', [], {
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

  const addModelGuardrail = useCallback(
    (current: string[], onChange: (value: string[]) => void) => {
      const nextGuardrail = guardrailInput.trim();
      if (!nextGuardrail || current.includes(nextGuardrail)) {
        return;
      }
      onChange([...current, nextGuardrail]);
      setGuardrailInput('');
    },
    [guardrailInput]
  );

  const removeModelGuardrail = useCallback(
    (current: string[], guardrail: string, onChange: (value: string[]) => void) => {
      onChange(current.filter((item) => item !== guardrail));
    },
    []
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
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-sm font-medium">{field.name}</FormLabel>
                      {isEnterpriseParam(field.name) ? (
                        <Badge variant="secondary">Ent.</Badge>
                      ) : null}
                    </div>
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
                    {field.name === 'guardrails' ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            aria-label="Add guardrail name"
                            placeholder="e.g. azure-text-moderation"
                            value={guardrailInput}
                            onChange={(event) => setGuardrailInput(event.target.value)}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const current = Array.isArray(formField.value)
                                ? formField.value.filter(
                                    (value): value is string => typeof value === 'string'
                                  )
                                : [];
                              addModelGuardrail(current, formField.onChange);
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {Array.isArray(formField.value) && formField.value.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {formField.value
                              .filter((value): value is string => typeof value === 'string')
                              .map((guardrail) => (
                                <Badge key={guardrail} variant="outline" className="gap-1 pr-1">
                                  <span>{guardrail}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    aria-label={`Remove model guardrail ${guardrail}`}
                                    onClick={() => {
                                      const current = Array.isArray(formField.value)
                                        ? formField.value.filter(
                                            (value): value is string => typeof value === 'string'
                                          )
                                        : [];
                                      removeModelGuardrail(current, guardrail, formField.onChange);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    ) : field.type === 'boolean' ? (
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
                          <div className="flex w-full items-center justify-between gap-2">
                            <span>{field.name}</span>
                            {isEnterpriseParam(field.name) ? (
                              <Badge variant="secondary">Ent.</Badge>
                            ) : null}
                          </div>
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
