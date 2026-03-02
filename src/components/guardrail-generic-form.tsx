'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GuardrailEntry } from '@/lib/schemas';

type GuardrailGenericFormProps = {
  entry: GuardrailEntry;
  onChange: (next: Partial<GuardrailEntry>) => void;
};

export function GuardrailGenericForm({ entry, onChange }: GuardrailGenericFormProps) {
  const params = entry.additional_provider_specific_params ?? {};
  const rows = Object.entries(params);

  return (
    <div className="space-y-3 rounded border p-3">
      <p className="text-sm font-medium">Generic Guardrail API</p>
      <select
        aria-label="Unreachable fallback"
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={entry.unreachable_fallback ?? 'fail_closed'}
        onChange={(event) =>
          onChange({ unreachable_fallback: event.target.value as 'fail_closed' | 'fail_open' })
        }
      >
        <option value="fail_closed">fail_closed</option>
        <option value="fail_open">fail_open</option>
      </select>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Additional provider params</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              onChange({
                additional_provider_specific_params: {
                  ...params,
                  [`key_${rows.length + 1}`]: '',
                },
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Param
          </Button>
        </div>

        {rows.map(([key, value], index) => (
          <div
            key={`${key}-${index}`}
            className="grid gap-2 rounded border p-2 md:grid-cols-[1fr_1fr_auto]"
          >
            <Input
              aria-label={`Param key ${index + 1}`}
              value={key}
              onChange={(event) => {
                const next = { ...params };
                delete next[key];
                next[event.target.value] = value;
                onChange({ additional_provider_specific_params: next });
              }}
            />
            <Input
              aria-label={`Param value ${index + 1}`}
              value={value}
              onChange={(event) =>
                onChange({
                  additional_provider_specific_params: {
                    ...params,
                    [key]: event.target.value,
                  },
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove param ${index + 1}`}
              onClick={() => {
                const next = { ...params };
                delete next[key];
                onChange({ additional_provider_specific_params: next });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
