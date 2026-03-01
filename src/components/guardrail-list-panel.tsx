'use client';

import React from 'react';
import { Plus } from 'lucide-react';

import { GuardrailCard } from '@/components/guardrail-card';
import { Button } from '@/components/ui/button';
import type { GuardrailEntry } from '@/lib/schemas';

type GuardrailListPanelProps = {
  guardrails: GuardrailEntry[];
  expandedIds: Set<string>;
  onAddGuardrail: () => void;
  onSaveGuardrail: (entry: GuardrailEntry) => void;
  onDeleteGuardrail: (id: string) => void;
};

export function GuardrailListPanel({
  guardrails,
  expandedIds,
  onAddGuardrail,
  onSaveGuardrail,
  onDeleteGuardrail,
}: GuardrailListPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      {guardrails.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No guardrails yet. Add one to protect requests and responses.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {guardrails.map((entry) => (
            <GuardrailCard
              key={entry.id}
              entry={entry}
              defaultExpanded={expandedIds.has(entry.id)}
              onSave={onSaveGuardrail}
              onDelete={onDeleteGuardrail}
            />
          ))}
        </div>
      )}

      <Button type="button" onClick={onAddGuardrail} className="mt-auto gap-2">
        <Plus className="h-4 w-4" />
        Add Guardrail
      </Button>
    </div>
  );
}
