'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { EnvVarInput } from '@/components/env-var-input';
import { GuardrailAzureForm } from '@/components/guardrail-azure-form';
import { GuardrailBedrockForm } from '@/components/guardrail-bedrock-form';
import { GuardrailContentFilterForm } from '@/components/guardrail-content-filter-form';
import { GuardrailGenericForm } from '@/components/guardrail-generic-form';
import { GuardrailInfoForm } from '@/components/guardrail-info-form';
import { GuardrailProviderSelect } from '@/components/guardrail-provider-select';
import { GuardrailPresidioForm } from '@/components/guardrail-presidio-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GUARDRAIL_MODES, clearProviderSpecificFields } from '@/lib/guardrails';
import type { GuardrailEntry } from '@/lib/schemas';

type GuardrailFormProps = {
  entry: GuardrailEntry;
  onSave: (entry: GuardrailEntry) => void;
};

export function GuardrailForm({ entry, onSave }: GuardrailFormProps) {
  const form = useForm<GuardrailEntry>({
    defaultValues: entry,
    mode: 'onSubmit',
  });

  const submitHandler = useCallback(() => {
    void form.handleSubmit(onSave)();
  }, [form, onSave]);

  useEffect(() => {
    form.reset(entry);
  }, [entry, form]);

  useEffect(() => {
    const subscription = form.watch(() => {
      submitHandler();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, submitHandler]);

  const draft = form.watch();

  const updateDraft = useCallback(
    (patch: Partial<GuardrailEntry>) => {
      const next = { ...form.getValues(), ...patch };
      form.reset(next, {
        keepDirty: true,
        keepTouched: true,
      });
    },
    [form]
  );

  const modeSet = useMemo(() => new Set(draft.mode), [draft.mode]);

  const toggleMode = useCallback(
    (mode: GuardrailEntry['mode'][number], enabled: boolean) => {
      const currentModes = form.getValues('mode');
      const nextModes = enabled
        ? [...new Set([...currentModes, mode])]
        : currentModes.filter((item) => item !== mode);
      form.setValue('mode', nextModes.length > 0 ? nextModes : ['pre_call'], {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [form]
  );

  return (
    <Form {...form}>
      <form onSubmit={submitHandler} className="space-y-4">
        <FormField
          control={form.control}
          name="guardrail_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guardrail Name</FormLabel>
              <FormControl>
                <Input {...field} aria-label="Guardrail name" placeholder="Guardrail name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guardrail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guardrail Provider</FormLabel>
              <FormControl>
                <GuardrailProviderSelect
                  value={field.value}
                  onChange={(provider) => {
                    const next = clearProviderSpecificFields(form.getValues(), provider);
                    form.reset(next, {
                      keepDirty: true,
                      keepTouched: true,
                    });
                    onSave(next);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mode"
          render={() => (
            <FormItem>
              <FormLabel>Mode</FormLabel>
              <div className="space-y-1">
                {GUARDRAIL_MODES.map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={modeSet.has(mode)}
                      onChange={(event) => toggleMode(mode, event.target.checked)}
                    />
                    {mode}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_on"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default On</FormLabel>
              <FormControl>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value ?? false}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Enabled
                </label>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <EnvVarInput value={field.value} onChange={field.onChange} secret />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="api_base"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Base</FormLabel>
              <FormControl>
                <Input
                  aria-label="API base"
                  placeholder="https://..."
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {draft.guardrail === 'presidio' ? (
          <GuardrailPresidioForm entry={draft} onChange={updateDraft} />
        ) : null}
        {draft.guardrail === 'bedrock' ? (
          <GuardrailBedrockForm entry={draft} onChange={updateDraft} />
        ) : null}
        {draft.guardrail === 'azure/prompt_shield' ||
        draft.guardrail === 'azure/text_moderations' ? (
          <GuardrailAzureForm entry={draft} onChange={updateDraft} />
        ) : null}
        {draft.guardrail === 'litellm_content_filter' ? (
          <GuardrailContentFilterForm entry={draft} onChange={updateDraft} />
        ) : null}
        {draft.guardrail === 'generic_guardrail_api' ? (
          <GuardrailGenericForm entry={draft} onChange={updateDraft} />
        ) : null}

        <GuardrailInfoForm
          value={draft.guardrail_info}
          onChange={(value) => updateDraft({ guardrail_info: value })}
        />
      </form>
    </Form>
  );
}
