'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GuardrailEntry } from '@/lib/schemas';

type GuardrailContentFilterFormProps = {
  entry: GuardrailEntry;
  onChange: (next: Partial<GuardrailEntry>) => void;
};

const CATEGORY_OPTIONS = [
  'harmful_self_harm',
  'harmful_violence',
  'harmful_illegal_weapons',
  'bias_gender',
  'bias_sexual_orientation',
  'bias_racial',
  'bias_religious',
  'denied_financial_advice',
  'denied_medical_advice',
  'denied_legal_advice',
];

const PATTERN_PRESETS = [
  'us_ssn',
  'email',
  'phone',
  'visa',
  'mastercard',
  'amex',
  'aws_access_key',
  'aws_secret_key',
  'github_token',
];

export function GuardrailContentFilterForm({ entry, onChange }: GuardrailContentFilterFormProps) {
  const categories = Array.isArray(entry.categories)
    ? entry.categories.filter(
        (
          item
        ): item is {
          category: string;
          enabled?: boolean;
          action?: string;
          severity_threshold?: number;
        } => typeof item === 'object' && item !== null && 'category' in item
      )
    : [];
  const patterns = entry.patterns ?? [];
  const blockedWords = entry.blocked_words ?? [];

  return (
    <div className="space-y-3 rounded border p-3">
      <p className="text-sm font-medium">Content Filter</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Categories</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                categories: [
                  ...categories,
                  {
                    category: CATEGORY_OPTIONS[0] ?? 'harmful_violence',
                    enabled: true,
                    action: 'block',
                  },
                ],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
        {categories.map((item, index) => (
          <div
            key={`${item.category}-${index}`}
            className="grid gap-2 rounded border p-2 md:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <select
              aria-label={`Category ${index + 1}`}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={item.category}
              onChange={(event) => {
                const next = categories.map((entryItem, entryIndex) =>
                  entryIndex === index ? { ...entryItem, category: event.target.value } : entryItem
                );
                onChange({ categories: next });
              }}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              aria-label={`Action ${index + 1}`}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={item.action ?? 'block'}
              onChange={(event) => {
                const next = categories.map((entryItem, entryIndex) =>
                  entryIndex === index ? { ...entryItem, action: event.target.value } : entryItem
                );
                onChange({ categories: next });
              }}
            >
              <option value="block">block</option>
              <option value="mask">mask</option>
              <option value="log">log</option>
            </select>
            <Input
              aria-label={`Severity ${index + 1}`}
              type="number"
              value={item.severity_threshold ?? ''}
              onChange={(event) => {
                const next = categories.map((entryItem, entryIndex) =>
                  entryIndex === index
                    ? {
                        ...entryItem,
                        severity_threshold:
                          event.target.value === '' ? undefined : Number(event.target.value),
                      }
                    : entryItem
                );
                onChange({ categories: next });
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Remove category ${index + 1}`}
              onClick={() =>
                onChange({ categories: categories.filter((_, entryIndex) => entryIndex !== index) })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Patterns</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                patterns: [
                  ...patterns,
                  { type: 'name', name: PATTERN_PRESETS[0], action: 'block' },
                ],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Pattern
          </Button>
        </div>
        {patterns.map((item, index) => (
          <div
            key={`${item.name ?? item.regex ?? 'pattern'}-${index}`}
            className="grid gap-2 rounded border p-2 md:grid-cols-[1fr_2fr_1fr_auto]"
          >
            <select
              aria-label={`Pattern type ${index + 1}`}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={item.type}
              onChange={(event) => {
                const next = patterns.map((entryItem, entryIndex) =>
                  entryIndex === index ? { ...entryItem, type: event.target.value } : entryItem
                );
                onChange({ patterns: next });
              }}
            >
              <option value="name">name</option>
              <option value="regex">regex</option>
            </select>
            <Input
              aria-label={`Pattern value ${index + 1}`}
              list={`pattern-presets-${index}`}
              value={item.type === 'regex' ? (item.regex ?? '') : (item.name ?? '')}
              onChange={(event) => {
                const next = patterns.map((entryItem, entryIndex) =>
                  entryIndex === index
                    ? entryItem.type === 'regex'
                      ? { ...entryItem, regex: event.target.value }
                      : { ...entryItem, name: event.target.value }
                    : entryItem
                );
                onChange({ patterns: next });
              }}
            />
            <datalist id={`pattern-presets-${index}`}>
              {PATTERN_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
            <select
              aria-label={`Pattern action ${index + 1}`}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={item.action ?? 'block'}
              onChange={(event) => {
                const next = patterns.map((entryItem, entryIndex) =>
                  entryIndex === index ? { ...entryItem, action: event.target.value } : entryItem
                );
                onChange({ patterns: next });
              }}
            >
              <option value="block">block</option>
              <option value="mask">mask</option>
              <option value="log">log</option>
            </select>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Remove pattern ${index + 1}`}
              onClick={() =>
                onChange({ patterns: patterns.filter((_, entryIndex) => entryIndex !== index) })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Blocked words</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({ blocked_words: [...blockedWords, { keyword: '', action: 'block' }] })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Word
          </Button>
        </div>
        {blockedWords.map((item, index) => (
          <div
            key={`${item.keyword}-${index}`}
            className="grid gap-2 rounded border p-2 md:grid-cols-[2fr_1fr_auto]"
          >
            <Input
              aria-label={`Blocked keyword ${index + 1}`}
              value={item.keyword}
              onChange={(event) => {
                const next = blockedWords.map((entryItem, entryIndex) =>
                  entryIndex === index ? { ...entryItem, keyword: event.target.value } : entryItem
                );
                onChange({ blocked_words: next });
              }}
            />
            <select
              aria-label={`Blocked action ${index + 1}`}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={item.action ?? 'block'}
              onChange={(event) => {
                const next = blockedWords.map((entryItem, entryIndex) =>
                  entryIndex === index ? { ...entryItem, action: event.target.value } : entryItem
                );
                onChange({ blocked_words: next });
              }}
            >
              <option value="block">block</option>
              <option value="mask">mask</option>
              <option value="log">log</option>
            </select>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Remove blocked word ${index + 1}`}
              onClick={() =>
                onChange({
                  blocked_words: blockedWords.filter((_, entryIndex) => entryIndex !== index),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
