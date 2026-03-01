'use client';

import React from 'react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { toast } from 'sonner';

import { GuardrailListPanel } from '@/components/guardrail-list-panel';
import { ImportDialog } from '@/components/import-dialog';
import { ModelListPanel } from '@/components/model-list-panel';
import { Toolbar } from '@/components/toolbar';
import { YamlPreview } from '@/components/yaml-preview';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { defaultGuardrailEntry, defaultModelEntry } from '@/lib/form-utils';
import { useCatalogContext } from '@/lib/catalog-context';
import { findUnavailableModels } from '@/lib/model-compatibility';
import { configToYaml } from '@/lib/yaml-gen';
import type { GuardrailEntry, ModelEntry } from '@/lib/schemas';

type ModelsAction =
  | { type: 'add'; payload: ModelEntry }
  | { type: 'update'; payload: ModelEntry }
  | { type: 'remove'; payload: { id: string } }
  | { type: 'replace'; payload: ModelEntry[] };

type GuardrailsAction =
  | { type: 'add'; payload: GuardrailEntry }
  | { type: 'update'; payload: GuardrailEntry }
  | { type: 'remove'; payload: { id: string } }
  | { type: 'replace'; payload: GuardrailEntry[] };

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

function guardrailsReducer(state: GuardrailEntry[], action: GuardrailsAction): GuardrailEntry[] {
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
  const { versions, selectedVersion, setSelectedVersion, catalog, isLoading } = useCatalogContext();
  const [models, dispatch] = useReducer(modelsReducer, [] as ModelEntry[]);
  const [guardrails, dispatchGuardrails] = useReducer(guardrailsReducer, [] as GuardrailEntry[]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedGuardrailIds, setExpandedGuardrailIds] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const lastValidationKeyRef = useRef<string | null>(null);

  const selectedCatalogRef = useMemo(
    () => versions.find((version) => version.folderName === selectedVersion)?.ref ?? null,
    [selectedVersion, versions]
  );

  const yaml = useMemo(
    () => configToYaml(models, guardrails, { catalogRef: selectedCatalogRef ?? undefined }),
    [guardrails, models, selectedCatalogRef]
  );

  useEffect(() => {
    if (!selectedVersion || isLoading || !catalog) {
      return;
    }

    if (selectedCatalogRef && catalog.meta.litellmRef !== selectedCatalogRef) {
      return;
    }

    const validationKey = `${selectedVersion}:${catalog.meta.litellmCommit}`;
    if (lastValidationKeyRef.current === validationKey) {
      return;
    }

    lastValidationKeyRef.current = validationKey;

    if (models.length === 0) {
      return;
    }

    const unavailable = findUnavailableModels(models, catalog);
    if (unavailable.length === 0) {
      toast.success(
        `All configured models are available in litellm:${selectedCatalogRef ?? selectedVersion}`,
        { duration: 3000 }
      );
      return;
    }

    const preview = unavailable
      .slice(0, 2)
      .map((entry) => entry.model)
      .join(', ');
    const remainingCount = unavailable.length - 2;
    const moreSuffix = remainingCount > 0 ? ` and ${remainingCount} more` : '';
    toast.error(
      `${unavailable.length} model(s) unavailable in litellm:${selectedCatalogRef ?? selectedVersion}: ${preview}${moreSuffix}`,
      { duration: 3000 }
    );
  }, [catalog, isLoading, models, selectedCatalogRef, selectedVersion]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <Toolbar
        onImport={() => setImportOpen(true)}
        versions={versions}
        selectedVersion={selectedVersion}
        onVersionChange={setSelectedVersion}
        onDownload={() => {
          const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'config.yaml';
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Downloaded config.yaml', { duration: 3000 });
        }}
      />

      <div className="hidden gap-4 md:grid md:grid-cols-[3fr_auto_2fr]">
        <Tabs defaultValue="models">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
          </TabsList>
          <TabsContent value="models" className="mt-4">
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
          <TabsContent value="guardrails" className="mt-4">
            <GuardrailListPanel
              guardrails={guardrails}
              expandedIds={expandedGuardrailIds}
              onAddGuardrail={() => {
                const newEntry = defaultGuardrailEntry();
                dispatchGuardrails({ type: 'add', payload: newEntry });
                setExpandedGuardrailIds((previous) => new Set(previous).add(newEntry.id));
              }}
              onSaveGuardrail={(entry) => dispatchGuardrails({ type: 'update', payload: entry })}
              onDeleteGuardrail={(id) => dispatchGuardrails({ type: 'remove', payload: { id } })}
            />
          </TabsContent>
        </Tabs>
        <Separator orientation="vertical" />
        <YamlPreview
          models={models}
          guardrails={guardrails}
          catalogRef={selectedCatalogRef ?? undefined}
        />
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="models">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="models" className="mt-4">
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
          <TabsContent value="guardrails" className="mt-4">
            <GuardrailListPanel
              guardrails={guardrails}
              expandedIds={expandedGuardrailIds}
              onAddGuardrail={() => {
                const newEntry = defaultGuardrailEntry();
                dispatchGuardrails({ type: 'add', payload: newEntry });
                setExpandedGuardrailIds((previous) => new Set(previous).add(newEntry.id));
              }}
              onSaveGuardrail={(entry) => dispatchGuardrails({ type: 'update', payload: entry })}
              onDeleteGuardrail={(id) => dispatchGuardrails({ type: 'remove', payload: { id } })}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <YamlPreview
              models={models}
              guardrails={guardrails}
              catalogRef={selectedCatalogRef ?? undefined}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ImportDialog
        open={importOpen}
        existingModelCount={models.length}
        existingGuardrailCount={guardrails.length}
        onOpenChange={setImportOpen}
        onImport={(importedModels, importedGuardrails, importedCatalogRef) => {
          dispatch({ type: 'replace', payload: importedModels });
          dispatchGuardrails({ type: 'replace', payload: importedGuardrails });

          if (importedCatalogRef) {
            const matchingVersion = versions.find((version) => version.ref === importedCatalogRef);
            if (matchingVersion) {
              setSelectedVersion(matchingVersion.folderName);
            }
          }

          setExpandedIds(new Set());
          setExpandedGuardrailIds(new Set());
          const versionSuffix = importedCatalogRef ? ` (litellm:${importedCatalogRef})` : '';
          const guardrailLabel = importedGuardrails.length === 1 ? 'guardrail' : 'guardrails';
          toast.success(
            `Imported ${importedModels.length} models, ${importedGuardrails.length} ${guardrailLabel}${versionSuffix}`,
            {
              duration: 3000,
            }
          );
        }}
      />
    </main>
  );
}
