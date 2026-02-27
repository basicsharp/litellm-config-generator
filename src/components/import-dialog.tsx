'use client';

import React from 'react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { yamlToConfig } from '@/lib/yaml-parse';
import type { ModelEntry } from '@/lib/schemas';

type ImportDialogProps = {
  open: boolean;
  existingModelCount: number;
  onOpenChange: (open: boolean) => void;
  onImport: (models: ModelEntry[]) => void;
};

export function ImportDialog({
  open,
  existingModelCount,
  onOpenChange,
  onImport,
}: ImportDialogProps) {
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingModels, setPendingModels] = useState<ModelEntry[] | null>(null);

  const handleImport = () => {
    const parsed = yamlToConfig(content);
    if (parsed.errors.length > 0) {
      setErrors(parsed.errors);
      return;
    }

    if (existingModelCount > 0) {
      setPendingModels(parsed.models);
      return;
    }

    onImport(parsed.models);
    setErrors([]);
    setPendingModels(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import YAML</DialogTitle>
          <DialogDescription>
            Paste a LiteLLM config snippet containing model_list.
          </DialogDescription>
        </DialogHeader>

        {pendingModels ? (
          <Alert>
            <AlertTitle>This will replace your current models. Continue?</AlertTitle>
            <AlertDescription className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onImport(pendingModels);
                  setPendingModels(null);
                  setErrors([]);
                  onOpenChange(false);
                }}
              >
                Continue
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPendingModels(null)}
              >
                Cancel
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Textarea
          rows={14}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="model_list:\n  - model_name: gpt-4o"
        />

        {errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{errors.join(' ')}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
