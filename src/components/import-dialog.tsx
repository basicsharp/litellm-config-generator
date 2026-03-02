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
import type { GuardrailEntry, ModelEntry } from '@/lib/schemas';

type ImportDialogProps = {
  open: boolean;
  existingModelCount: number;
  existingGuardrailCount: number;
  onOpenChange: (open: boolean) => void;
  onImport: (
    models: ModelEntry[],
    importedGuardrails: GuardrailEntry[],
    catalogRef: string | null
  ) => void;
};

export function ImportDialog({
  open,
  existingModelCount,
  existingGuardrailCount,
  onOpenChange,
  onImport,
}: ImportDialogProps) {
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingModels, setPendingModels] = useState<ModelEntry[] | null>(null);
  const [pendingGuardrails, setPendingGuardrails] = useState<GuardrailEntry[] | null>(null);
  const [pendingCatalogRef, setPendingCatalogRef] = useState<string | null>(null);

  const handleImport = () => {
    setErrors([]);
    const parsed = yamlToConfig(content);
    if (parsed.errors.length > 0) {
      setErrors(parsed.errors);
      return;
    }

    if (existingModelCount > 0 || (existingGuardrailCount > 0 && parsed.guardrails.length > 0)) {
      setPendingModels(parsed.models);
      setPendingGuardrails(parsed.guardrails);
      setPendingCatalogRef(parsed.catalogRef);
      return;
    }

    onImport(parsed.models, parsed.guardrails, parsed.catalogRef);
    setErrors([]);
    setPendingModels(null);
    setPendingGuardrails(null);
    setPendingCatalogRef(null);
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

        <Textarea
          rows={14}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={'model_list:\n  - model_name: gpt-4o'}
        />

        {pendingModels ? (
          <Alert>
            <AlertTitle>
              This will replace your current models
              {pendingGuardrails && pendingGuardrails.length > 0 ? ' and guardrails' : ''}.
              Continue?
            </AlertTitle>
            <AlertDescription className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onImport(pendingModels, pendingGuardrails ?? [], pendingCatalogRef);
                  setPendingModels(null);
                  setPendingGuardrails(null);
                  setPendingCatalogRef(null);
                  setErrors([]);
                  onOpenChange(false);
                }}
              >
                Continue
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setPendingModels(null);
                  setPendingGuardrails(null);
                  setPendingCatalogRef(null);
                }}
              >
                Cancel
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{errors.join(' ')}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
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
