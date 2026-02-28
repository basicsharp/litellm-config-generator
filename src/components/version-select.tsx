'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import type { VersionEntry } from '@/lib/catalog-context';

type VersionSelectProps = {
  versions: VersionEntry[];
  selectedVersion: string | null;
  onVersionChange: (folderName: string) => void;
};

export function VersionSelect({ versions, selectedVersion, onVersionChange }: VersionSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  if (versions.length === 0) {
    return null;
  }

  const selectedLabel =
    versions.find((version) => version.folderName === selectedVersion)?.ref ?? 'Select version';

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? versions.filter((version) => version.ref.toLowerCase().includes(normalizedQuery))
    : versions;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-56 justify-between"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search version..."
            value={query}
            onValueChange={(next) => setQuery(next)}
          />
          <CommandList>
            <CommandEmpty>No versions found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((version) => (
                <CommandItem
                  key={version.folderName}
                  value={version.ref}
                  onSelect={() => {
                    onVersionChange(version.folderName);
                    setOpen(false);
                  }}
                >
                  <Check
                    data-testid="version-checkmark"
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedVersion === version.folderName ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{version.ref}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
