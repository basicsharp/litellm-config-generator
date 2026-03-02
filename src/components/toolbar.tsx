'use client';

import React from 'react';
import { Download, Upload } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import type { VersionEntry } from '@/lib/catalog-context';
import { VersionSelect } from '@/components/version-select';
import { ModeToggle } from '@/components/mode-toggle';
import { Card } from './ui/card';

type ToolbarProps = {
  onImport: () => void;
  onDownload: () => void;
  versions: VersionEntry[];
  selectedVersion: string | null;
  onVersionChange: (folderName: string) => void;
};

export function Toolbar({
  onImport,
  onDownload,
  versions,
  selectedVersion,
  onVersionChange,
}: ToolbarProps) {
  return (
    <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <Image
          src="/icon.png?v=gear"
          alt="LiteLLM logo"
          className="h-6 w-6 rounded-sm"
          width={24}
          height={24}
        />
        <h1 className="text-lg font-semibold">LiteLLM Config Generator</h1>
      </div>
      {versions.length > 0 ? (
        <VersionSelect
          versions={versions}
          selectedVersion={selectedVersion}
          onVersionChange={onVersionChange}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onImport}
          className="gap-2 text-xs sm:text-sm"
        >
          <Upload className="h-4 w-4" />
          Import YAML
        </Button>
        <Button type="button" onClick={onDownload} className="gap-2 text-xs sm:text-sm">
          <Download className="h-4 w-4" />
          Download
        </Button>
        <ModeToggle />
      </div>
    </Card>
  );
}
