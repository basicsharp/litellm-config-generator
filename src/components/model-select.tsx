'use client';

import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { getModelsForProvider } from '@/lib/catalog';
import { cn } from '@/lib/utils';

type ModelSelectProps = {
  providerId: string;
  value: string;
  onChange: (model: string) => void;
};

export function ModelSelect({ providerId, value, onChange }: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const models = useMemo(() => getModelsForProvider(providerId), [providerId]);
  const selectedLabel = value || 'Select model';
  const allowCustom = query.trim().length > 0 && !models.some((model) => model.id === query.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Search model..."
            value={query}
            onValueChange={(next) => setQuery(next)}
          />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup>
              {allowCustom ? (
                <CommandItem
                  value={query.trim()}
                  onSelect={() => {
                    onChange(query.trim());
                    setOpen(false);
                  }}
                >
                  <span className="truncate">Use custom: {query.trim()}</span>
                </CommandItem>
              ) : null}
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={(selected) => {
                    onChange(selected);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === model.id ? 'opacity-100' : 'opacity-0')}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{model.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {model.mode ?? 'unknown mode'}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
