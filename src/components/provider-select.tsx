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
import { cn } from '@/lib/utils';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'azure', label: 'Azure OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'bedrock', label: 'AWS Bedrock' },
  { id: 'vertex_ai', label: 'Vertex AI' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'groq', label: 'Groq' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'ollama', label: 'Ollama' },
  { id: 'hosted_vllm', label: 'Hosted vLLM' },
];

type ProviderSelectProps = {
  value: string;
  onChange: (providerId: string) => void;
};

export function ProviderSelect({ value, onChange }: ProviderSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel =
    PROVIDERS.find((provider) => provider.id === value)?.label ?? 'Select provider';

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return PROVIDERS;
    }

    return PROVIDERS.filter((provider) => provider.label.toLowerCase().includes(normalizedQuery));
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
          aria-label="Provider"
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
            placeholder="Search provider..."
            value={query}
            onValueChange={(next) => setQuery(next)}
            autoFocus
          />
          <CommandList>
            <CommandEmpty>No providers found.</CommandEmpty>
            <CommandGroup>
              {filteredProviders.map((provider) => (
                <CommandItem
                  key={provider.id}
                  value={provider.label}
                  onSelect={() => {
                    onChange(provider.id);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Check
                    data-testid="provider-checkmark"
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === provider.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{provider.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
