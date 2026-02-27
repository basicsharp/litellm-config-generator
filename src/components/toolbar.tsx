'use client';

import React from 'react';
import { Download, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from './ui/card';

type ToolbarProps = {
  onImport: () => void;
  onDownload: () => void;
};

export function Toolbar({ onImport, onDownload }: ToolbarProps) {
  return (
    <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
      <h1 className="text-lg font-semibold">LiteLLM Config Generator</h1>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
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
      </div>
    </Card>
  );
}
