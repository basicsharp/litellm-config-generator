'use client';

import React from 'react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { codeToHtml } from 'shiki';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { configToYaml } from '@/lib/yaml-gen';
import type { GuardrailEntry, ModelEntry } from '@/lib/schemas';
import { Card } from './ui/card';

type YamlPreviewProps = {
  models: ModelEntry[];
  guardrails: GuardrailEntry[];
  catalogRef?: string;
};

export const HIGHLIGHT_DEBOUNCE_MS = 300;

export function YamlPreview({ models, guardrails, catalogRef }: YamlPreviewProps) {
  const [highlighted, setHighlighted] = useState('');
  const [highlightedFor, setHighlightedFor] = useState('');
  const [copied, setCopied] = useState(false);
  const deferredModels = useDeferredValue(models);
  const deferredGuardrails = useDeferredValue(guardrails);
  const latestYamlText = useMemo(
    () => configToYaml(models, guardrails, { catalogRef }),
    [catalogRef, guardrails, models]
  );
  const highlightedYamlText = useMemo(
    () => configToYaml(deferredModels, deferredGuardrails, { catalogRef }),
    [catalogRef, deferredGuardrails, deferredModels]
  );
  const isStale = highlightedFor !== highlightedYamlText;

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      codeToHtml(highlightedYamlText, { lang: 'yaml', theme: 'github-dark' }).then((html) => {
        if (!active) {
          return;
        }
        setHighlighted(html);
        setHighlightedFor(highlightedYamlText);
      });
    }, HIGHLIGHT_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [highlightedYamlText]);

  return (
    <Card className="sticky top-0 flex flex-col gap-3 overflow-y-auto rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">YAML Preview</h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(latestYamlText);
            setCopied(true);
            toast.success('Copied YAML to clipboard', { duration: 3000 });
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <div
        data-testid="yaml-highlighted-preview"
        className={`overflow-x-auto text-sm transition-opacity [&_pre]:m-0 [&_pre]:rounded-md [&_pre]:p-4 ${
          isStale ? 'opacity-60' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </Card>
  );
}
