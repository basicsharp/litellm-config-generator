'use client';

import { useEffect, useMemo, useState } from 'react';
import { codeToHtml } from 'shiki';

import { Button } from '@/components/ui/button';
import { configToYaml } from '@/lib/yaml-gen';
import type { ModelEntry } from '@/lib/schemas';

type YamlPreviewProps = {
  models: ModelEntry[];
};

export function YamlPreview({ models }: YamlPreviewProps) {
  const [highlighted, setHighlighted] = useState('');
  const [copied, setCopied] = useState(false);
  const yamlText = useMemo(() => configToYaml(models), [models]);

  useEffect(() => {
    let active = true;
    codeToHtml(yamlText, { lang: 'yaml', theme: 'github-dark' }).then((html) => {
      if (!active) {
        return;
      }
      setHighlighted(html);
    });
    return () => {
      active = false;
    };
  }, [yamlText]);

  return (
    <div className="sticky top-0 flex flex-col gap-3 overflow-y-auto rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">YAML Preview</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(yamlText);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <div className="overflow-x-auto text-sm" dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}
