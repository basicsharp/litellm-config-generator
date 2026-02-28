'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getFieldsForProvider,
  getModelsForProvider,
  getProviders,
  type CatalogData,
  type CatalogField,
  type CatalogModel,
  type CatalogProvider,
} from '@/lib/catalog';

export type VersionEntry = {
  ref: string;
  folderName: string;
  commit: string;
  generatedAt: string;
};

export type CatalogIndex = {
  versions: VersionEntry[];
  latest: string;
};

type CatalogContextValue = {
  catalog: CatalogData | null;
  isLoading: boolean;
  versions: VersionEntry[];
  selectedVersion: string | null;
  setSelectedVersion: React.Dispatch<React.SetStateAction<string | null>>;
};

const defaultCatalogContextValue: CatalogContextValue = {
  catalog: null,
  isLoading: false,
  versions: [],
  selectedVersion: null,
  setSelectedVersion: () => undefined,
};

const CatalogContext = createContext<CatalogContextValue>(defaultCatalogContextValue);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadIndex = async () => {
      try {
        const response = await fetch('/catalogs/index.json');
        if (!response.ok) {
          if (isMounted) {
            setVersions([]);
            setSelectedVersion(null);
          }
          return;
        }

        const indexJson = (await response.json()) as CatalogIndex;
        if (!isMounted) {
          return;
        }

        const availableVersions = Array.isArray(indexJson.versions) ? indexJson.versions : [];
        setVersions(availableVersions);
        setSelectedVersion(indexJson.latest || availableVersions.at(-1)?.folderName || null);
      } catch {
        if (isMounted) {
          setVersions([]);
          setSelectedVersion(null);
        }
      }
    };

    void loadIndex();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCatalog = async () => {
      if (!selectedVersion) {
        setCatalog(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/catalogs/${selectedVersion}/catalog.json`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setCatalog(null);
          return;
        }

        const catalogJson = (await response.json()) as CatalogData;
        setCatalog(catalogJson);
      } catch {
        if (!controller.signal.aborted) {
          setCatalog(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      controller.abort();
    };
  }, [selectedVersion]);

  const value = useMemo(
    () => ({
      catalog,
      isLoading,
      versions,
      selectedVersion,
      setSelectedVersion,
    }),
    [catalog, isLoading, versions, selectedVersion]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalogContext(): CatalogContextValue {
  return useContext(CatalogContext);
}

export function useProviders(): CatalogProvider[] {
  const { catalog } = useCatalogContext();
  if (!catalog) {
    return [];
  }
  return getProviders(catalog);
}

export function useModelsForProvider(providerId: string): CatalogModel[] {
  const { catalog } = useCatalogContext();
  if (!catalog) {
    return [];
  }
  return getModelsForProvider(catalog, providerId);
}

export function useFieldsForProvider(providerId: string): {
  base: CatalogField[];
  extra: CatalogField[];
} {
  const { catalog } = useCatalogContext();
  if (!catalog) {
    return { base: [], extra: [] };
  }
  return getFieldsForProvider(catalog, providerId);
}
