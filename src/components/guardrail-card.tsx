'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Trash2 } from 'lucide-react';

import { GuardrailForm } from '@/components/guardrail-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GuardrailEntry } from '@/lib/schemas';

type GuardrailCardProps = {
  entry: GuardrailEntry;
  onSave: (entry: GuardrailEntry) => void;
  onDelete: (id: string) => void;
  defaultExpanded: boolean;
};

export function GuardrailCard({ entry, onSave, onDelete, defaultExpanded }: GuardrailCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => setExpanded((value) => !value)}
          >
            <CardTitle className="text-base">
              {entry.guardrail_name || 'Untitled Guardrail'}
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge className="shadow-none">
                <Shield className="mr-1 h-3 w-3" />
                {entry.guardrail}
              </Badge>
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
              aria-label="Delete guardrail"
              onClick={() => {
                if (window.confirm('Delete this guardrail?')) {
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
        <CardContent className="p-4 pt-0">
          <GuardrailForm entry={entry} onSave={onSave} />
        </CardContent>
      ) : null}
    </Card>
  );
}
