'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GuardrailInfo } from '@/lib/schemas';

type GuardrailInfoFormProps = {
  value: GuardrailInfo | undefined;
  onChange: (next: GuardrailInfo | undefined) => void;
};

export function GuardrailInfoForm({ value, onChange }: GuardrailInfoFormProps) {
  const [open, setOpen] = useState(false);
  const params = value?.params ?? [];

  const updateParam = (
    index: number,
    field: 'name' | 'type' | 'description',
    fieldValue: string
  ) => {
    const nextParams = params.map((param, paramIndex) =>
      paramIndex === index ? { ...param, [field]: fieldValue } : param
    );
    onChange({ params: nextParams });
  };

  return (
    <div className="rounded border p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium"
        onClick={() => setOpen((current) => !current)}
      >
        Guardrail Info
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          {params.map((param, index) => (
            <div
              key={`param-${index}`}
              className="grid gap-2 rounded border p-2 md:grid-cols-[1fr_1fr_2fr_auto]"
            >
              <Input
                aria-label={`Param name ${index + 1}`}
                value={param.name}
                onChange={(event) => updateParam(index, 'name', event.target.value)}
                placeholder="Name"
              />
              <Input
                aria-label={`Param type ${index + 1}`}
                value={param.type}
                onChange={(event) => updateParam(index, 'type', event.target.value)}
                placeholder="Type"
              />
              <Input
                aria-label={`Param description ${index + 1}`}
                value={param.description ?? ''}
                onChange={(event) => updateParam(index, 'description', event.target.value)}
                placeholder="Description"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove param ${index + 1}`}
                onClick={() => {
                  const nextParams = params.filter((_, paramIndex) => paramIndex !== index);
                  onChange(nextParams.length > 0 ? { params: nextParams } : undefined);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={() => {
              onChange({
                params: [...params, { name: '', type: '', description: '' }],
              });
            }}
          >
            <Plus className="h-4 w-4" />
            Add Param
          </Button>
        </div>
      ) : null}
    </div>
  );
}
