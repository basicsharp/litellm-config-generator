'use client';

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ModelForm } from '@/components/model-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModelEntry } from '@/lib/schemas';

type ModelCardProps = {
  entry: ModelEntry;
  onSave: (entry: ModelEntry) => void;
  onDelete: (id: string) => void;
  defaultExpanded: boolean;
};

const PROVIDER_BADGE_STYLES: Record<string, string> = {
  openai: 'bg-emerald-100 text-emerald-900',
  azure: 'bg-sky-100 text-sky-900',
  anthropic: 'bg-orange-100 text-orange-900',
  bedrock: 'bg-amber-100 text-amber-900',
  vertex_ai: 'bg-lime-100 text-lime-900',
  gemini: 'bg-indigo-100 text-indigo-900',
  groq: 'bg-fuchsia-100 text-fuchsia-900',
  mistral: 'bg-rose-100 text-rose-900',
  ollama: 'bg-cyan-100 text-cyan-900',
  hosted_vllm: 'bg-violet-100 text-violet-900',
  unknown: 'bg-muted text-muted-foreground',
};

export function ModelCard({ entry, onSave, onDelete, defaultExpanded }: ModelCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const badgeStyle = PROVIDER_BADGE_STYLES[entry.provider] ?? PROVIDER_BADGE_STYLES.unknown;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => setExpanded((value) => !value)}
          >
            <CardTitle className="text-base">{entry.model_name || 'Untitled Model'}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge className={badgeStyle}>{entry.provider}</Badge>
              <span className="truncate">{entry.model || 'No model selected'}</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? 'Collapse card' : 'Expand card'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete model"
              onClick={() => {
                if (window.confirm('Delete this model?')) {
                  onDelete(entry.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded ? (
        <CardContent>
          <ModelForm entry={entry} onSave={onSave} />
        </CardContent>
      ) : null}
    </Card>
  );
}
