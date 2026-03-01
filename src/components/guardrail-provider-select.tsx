'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  BUILT_IN_GUARDRAILS,
  CUSTOM_GUARDRAILS,
  EXTERNAL_TIER1_GUARDRAILS,
  EXTERNAL_TIER2_GUARDRAILS,
} from '@/lib/guardrails';
import { cn } from '@/lib/utils';

type GuardrailProviderSelectProps = {
  value: string;
  onChange: (guardrailProvider: string) => void;
};

type GuardrailGroup = {
  label: string;
  values: readonly string[];
};

const GUARDRAIL_GROUPS: GuardrailGroup[] = [
  { label: 'Built-in', values: BUILT_IN_GUARDRAILS },
  { label: 'External Tier 1', values: EXTERNAL_TIER1_GUARDRAILS },
  { label: 'External Tier 2', values: EXTERNAL_TIER2_GUARDRAILS },
  { label: 'Custom', values: CUSTOM_GUARDRAILS },
];

export function GuardrailProviderSelect({ value, onChange }: GuardrailProviderSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = value || 'Select guardrail provider';

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return GUARDRAIL_GROUPS;
    }

    return GUARDRAIL_GROUPS.map((group) => ({
      ...group,
      values: group.values.filter((provider) => provider.toLowerCase().includes(normalizedQuery)),
    })).filter((group) => group.values.length > 0);
  }, [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Guardrail provider"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search guardrail provider..."
            value={query}
            onValueChange={(next) => setQuery(next)}
            autoFocus
          />
          <CommandList>
            <CommandEmpty>No guardrail providers found.</CommandEmpty>
            {filteredGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.values.map((provider) => (
                  <CommandItem
                    key={provider}
                    value={provider}
                    onSelect={() => {
                      onChange(provider);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <Check
                      data-testid="guardrail-provider-checkmark"
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === provider ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{provider}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
