'use client';

import { Plus } from 'lucide-react';

import { ModelCard } from '@/components/model-card';
import { Button } from '@/components/ui/button';
import type { ModelEntry } from '@/lib/schemas';

type ModelListPanelProps = {
  models: ModelEntry[];
  expandedIds: Set<string>;
  onAddModel: () => void;
  onSaveModel: (entry: ModelEntry) => void;
  onDeleteModel: (id: string) => void;
};

export function ModelListPanel({
  models,
  expandedIds,
  onAddModel,
  onSaveModel,
  onDeleteModel,
}: ModelListPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      {models.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No models yet. Add one to start building config.yaml.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {models.map((entry) => (
            <ModelCard
              key={entry.id}
              entry={entry}
              defaultExpanded={expandedIds.has(entry.id)}
              onSave={onSaveModel}
              onDelete={onDeleteModel}
            />
          ))}
        </div>
      )}

      <Button type="button" onClick={onAddModel} className="mt-auto gap-2">
        <Plus className="h-4 w-4" />
        Add Model
      </Button>
    </div>
  );
}
