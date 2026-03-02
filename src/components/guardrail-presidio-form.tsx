'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GuardrailEntry, PiiEntitiesConfig } from '@/lib/schemas';

type GuardrailPresidioFormProps = {
  entry: GuardrailEntry;
  onChange: (next: Partial<GuardrailEntry>) => void;
};

const KNOWN_ENTITIES = ['CREDIT_CARD', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'IP_ADDRESS', 'PERSON'];

export function GuardrailPresidioForm({ entry, onChange }: GuardrailPresidioFormProps) {
  const [customEntity, setCustomEntity] = useState('');
  const config = entry.pii_entities_config ?? {};
  const thresholds = entry.score_thresholds ?? {};

  const setEntity = (name: string, enabled: boolean) => {
    const next: PiiEntitiesConfig = { ...config };
    if (enabled) {
      next[name] = next[name] ?? 'MASK';
    } else {
      delete next[name];
    }
    onChange({ pii_entities_config: next });
  };

  const setEntityAction = (name: string, action: 'MASK' | 'BLOCK') => {
    onChange({
      pii_entities_config: {
        ...config,
        [name]: action,
      },
    });
  };

  return (
    <div className="space-y-3 rounded border p-3">
      <p className="text-sm font-medium">Presidio Settings</p>
      <div className="grid gap-2 md:grid-cols-2">
        <select
          aria-label="Language"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={entry.language ?? 'en'}
          onChange={(event) => onChange({ language: event.target.value as 'en' | 'es' | 'de' })}
        >
          <option value="en">en</option>
          <option value="es">es</option>
          <option value="de">de</option>
        </select>
        <select
          aria-label="Filter scope"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={entry.filter_scope ?? 'both'}
          onChange={(event) =>
            onChange({ filter_scope: event.target.value as 'input' | 'output' | 'both' })
          }
        >
          <option value="input">input</option>
          <option value="output">output</option>
          <option value="both">both</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={entry.output_parse_pii ?? false}
          onChange={(event) => onChange({ output_parse_pii: event.target.checked })}
        />
        Output parse PII
      </label>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">PII entities</p>
        {KNOWN_ENTITIES.concat(
          Object.keys(config).filter((name) => !KNOWN_ENTITIES.includes(name))
        ).map((entity) => {
          const enabled = Boolean(config[entity]);
          return (
            <div key={entity} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEntity(entity, event.target.checked)}
                />
                {entity}
              </label>
              <select
                aria-label={`Action for ${entity}`}
                className="h-9 rounded-md border bg-background px-2 text-xs"
                value={config[entity] ?? 'MASK'}
                disabled={!enabled}
                onChange={(event) =>
                  setEntityAction(entity, event.target.value as 'MASK' | 'BLOCK')
                }
              >
                <option value="MASK">MASK</option>
                <option value="BLOCK">BLOCK</option>
              </select>
            </div>
          );
        })}
        <div className="flex items-center gap-2">
          <Input
            aria-label="Custom entity"
            placeholder="Custom entity"
            value={customEntity}
            onChange={(event) => setCustomEntity(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Add custom entity"
            onClick={() => {
              const name = customEntity.trim();
              if (!name) {
                return;
              }
              setEntity(name, true);
              setCustomEntity('');
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Score thresholds</p>
        <Input
          aria-label="ALL threshold"
          type="number"
          placeholder="ALL"
          value={typeof thresholds.ALL === 'number' ? String(thresholds.ALL) : ''}
          onChange={(event) => {
            const nextThresholds: Record<string, number> = { ...thresholds };
            if (event.target.value === '') {
              delete nextThresholds.ALL;
            } else {
              nextThresholds.ALL = Number(event.target.value);
            }
            onChange({ score_thresholds: nextThresholds });
          }}
        />
      </div>
    </div>
  );
}
