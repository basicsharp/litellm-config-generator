'use client';

import React from 'react';
import { useMemo, useReducer, useState } from 'react';

import { ImportDialog } from '@/components/import-dialog';
import { ModelListPanel } from '@/components/model-list-panel';
import { Toolbar } from '@/components/toolbar';
import { YamlPreview } from '@/components/yaml-preview';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { defaultModelEntry } from '@/lib/form-utils';
import { configToYaml } from '@/lib/yaml-gen';
import type { ModelEntry } from '@/lib/schemas';

type ModelsAction =
  | { type: 'add'; payload: ModelEntry }
  | { type: 'update'; payload: ModelEntry }
  | { type: 'remove'; payload: { id: string } }
  | { type: 'replace'; payload: ModelEntry[] };

function modelsReducer(state: ModelEntry[], action: ModelsAction): ModelEntry[] {
  if (action.type === 'add') {
    return [...state, action.payload];
  }
  if (action.type === 'update') {
    return state.map((item) => (item.id === action.payload.id ? action.payload : item));
  }
  if (action.type === 'remove') {
    return state.filter((item) => item.id !== action.payload.id);
  }
  return action.payload;
}

export default function HomePage() {
  const [models, dispatch] = useReducer(modelsReducer, [] as ModelEntry[]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const yaml = useMemo(() => configToYaml(models), [models]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <Toolbar
        onImport={() => setImportOpen(true)}
        onDownload={() => {
          const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'config.yaml';
          link.click();
          URL.revokeObjectURL(url);
        }}
      />

      {statusMessage ? <p className="mb-3 text-sm text-emerald-700">{statusMessage}</p> : null}

      <div className="hidden gap-4 md:grid md:grid-cols-[3fr_auto_2fr]">
        <ModelListPanel
          models={models}
          expandedIds={expandedIds}
          onAddModel={() => {
            const newEntry = defaultModelEntry('openai');
            dispatch({ type: 'add', payload: newEntry });
            setExpandedIds((previous) => new Set(previous).add(newEntry.id));
          }}
          onSaveModel={(entry) => dispatch({ type: 'update', payload: entry })}
          onDeleteModel={(id) => dispatch({ type: 'remove', payload: { id } })}
        />
        <Separator orientation="vertical" />
        <YamlPreview models={models} />
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="edit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <ModelListPanel
              models={models}
              expandedIds={expandedIds}
              onAddModel={() => {
                const newEntry = defaultModelEntry('openai');
                dispatch({ type: 'add', payload: newEntry });
                setExpandedIds((previous) => new Set(previous).add(newEntry.id));
              }}
              onSaveModel={(entry) => dispatch({ type: 'update', payload: entry })}
              onDeleteModel={(id) => dispatch({ type: 'remove', payload: { id } })}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <YamlPreview models={models} />
          </TabsContent>
        </Tabs>
      </div>

      <ImportDialog
        open={importOpen}
        existingModelCount={models.length}
        onOpenChange={setImportOpen}
        onImport={(importedModels) => {
          dispatch({ type: 'replace', payload: importedModels });
          setExpandedIds(new Set());
          setStatusMessage(`Imported ${importedModels.length} models`);
          setTimeout(() => setStatusMessage(''), 1500);
        }}
      />
    </main>
  );
}
