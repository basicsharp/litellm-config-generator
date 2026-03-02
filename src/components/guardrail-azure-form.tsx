'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GuardrailEntry } from '@/lib/schemas';

type GuardrailAzureFormProps = {
  entry: GuardrailEntry;
  onChange: (next: Partial<GuardrailEntry>) => void;
};

const CATEGORY_OPTIONS = ['Hate', 'SelfHarm', 'Sexual', 'Violence'];

export function GuardrailAzureForm({ entry, onChange }: GuardrailAzureFormProps) {
  const [blocklistInput, setBlocklistInput] = useState('');

  if (entry.guardrail === 'azure/prompt_shield') {
    return null;
  }

  const categories = Array.isArray(entry.categories)
    ? entry.categories.filter((item): item is string => typeof item === 'string')
    : [];

  return (
    <div className="space-y-3 rounded border p-3">
      <p className="text-sm font-medium">Azure Text Moderations</p>
      <Input
        aria-label="Severity threshold"
        type="number"
        min={0}
        max={8}
        value={entry.severity_threshold ?? ''}
        onChange={(event) =>
          onChange({
            severity_threshold: event.target.value === '' ? undefined : Number(event.target.value),
          })
        }
      />
      <div className="grid gap-2 md:grid-cols-2">
        <Input
          aria-label="Hate threshold"
          type="number"
          min={0}
          max={8}
          value={entry.severity_threshold_hate ?? ''}
          onChange={(event) =>
            onChange({
              severity_threshold_hate:
                event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
        <Input
          aria-label="SelfHarm threshold"
          type="number"
          min={0}
          max={8}
          value={entry.severity_threshold_self_harm ?? ''}
          onChange={(event) =>
            onChange({
              severity_threshold_self_harm:
                event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
        <Input
          aria-label="Sexual threshold"
          type="number"
          min={0}
          max={8}
          value={entry.severity_threshold_sexual ?? ''}
          onChange={(event) =>
            onChange({
              severity_threshold_sexual:
                event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
        <Input
          aria-label="Violence threshold"
          type="number"
          min={0}
          max={8}
          value={entry.severity_threshold_violence ?? ''}
          onChange={(event) =>
            onChange({
              severity_threshold_violence:
                event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Categories</p>
        {CATEGORY_OPTIONS.map((category) => {
          const checked = categories.includes(category);
          return (
            <label key={category} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...categories, category]
                    : categories.filter((item) => item !== category);
                  onChange({ categories: next });
                }}
              />
              {category}
            </label>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Blocklist names</p>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Blocklist name"
            value={blocklistInput}
            onChange={(event) => setBlocklistInput(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Add blocklist"
            onClick={() => {
              const value = blocklistInput.trim();
              if (!value) {
                return;
              }
              onChange({ blocklistNames: [...(entry.blocklistNames ?? []), value] });
              setBlocklistInput('');
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {(entry.blocklistNames ?? []).map((name) => (
            <div
              key={name}
              className="flex items-center justify-between rounded border px-2 py-1 text-sm"
            >
              <span>{name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${name}`}
                onClick={() =>
                  onChange({
                    blocklistNames: (entry.blocklistNames ?? []).filter((value) => value !== name),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={entry.haltOnBlocklistHit ?? false}
          onChange={(event) => onChange({ haltOnBlocklistHit: event.target.checked })}
        />
        Halt on blocklist hit
      </label>

      <select
        aria-label="Output type"
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={entry.outputType ?? ''}
        onChange={(event) => onChange({ outputType: event.target.value || undefined })}
      >
        <option value="">Select output type</option>
        <option value="raw">raw</option>
        <option value="summary">summary</option>
      </select>
    </div>
  );
}
