## 1. Script: Versioned Catalog Generation

- [ ] 1.1 Add `--ref` argument parsing to `scripts/generate-catalog.ts` using Node's built-in `util.parseArgs`
- [ ] 1.2 Implement `sanitizeRef(ref: string): string` to produce safe folder names (replace `/` with `__`, strip unsupported chars)
- [ ] 1.3 Implement `resolveCommitSha(repoPath: string): Promise<string>` using `git rev-parse --short HEAD`
- [ ] 1.4 Implement `addWorktree(submodulePath: string, worktreePath: string, ref: string): Promise<void>` with fetch fallback for remote-only refs
- [ ] 1.5 Implement `removeWorktree(submodulePath: string, worktreePath: string): Promise<void>` for cleanup in `finally` block
- [ ] 1.6 Update `main()` to branch on whether `--ref` is provided: use worktree path when ref given, `litellm/` directly when not
- [ ] 1.7 Update `CatalogOutput` type to include `litellmRef` and `litellmCommit` in `meta`; populate both fields in `main()`
- [ ] 1.8 Change output path logic: write to `public/catalogs/<folderName>/catalog.json` instead of `public/catalog.json`
- [ ] 1.9 Implement `updateIndexJson(outputDir: string, entry: VersionEntry): Promise<void>` — read existing index, upsert entry (update-in-place if folderName exists, append otherwise), write back with updated `latest`
- [ ] 1.10 Write unit tests for `sanitizeRef`, `updateIndexJson`, and ref parsing edge cases
- [ ] 1.11 Update README to document `--ref` usage and new catalog output paths; remove references to `public/catalog.json`

## 2. Catalog Module: Remove Static Import, Add Pure Functions

- [ ] 2.1 Update `CatalogJson` type in `src/lib/catalog.ts` to include `litellmRef` and `litellmCommit` in `meta`
- [ ] 2.2 Remove the static `import catalogData from '../../public/catalog.json'` from `catalog.ts`
- [ ] 2.3 Refactor `getProviders`, `getModelsForProvider`, and `getFieldsForProvider` to accept an explicit `CatalogData` first argument
- [ ] 2.4 Update `src/lib/additional-lib-coverage.test.ts` to import a catalog fixture and pass it explicitly to the pure functions

## 3. Catalog Context: Runtime Loading and Version State

- [ ] 3.1 Define `VersionEntry` and `CatalogIndex` types in `src/lib/catalog-context.tsx`
- [ ] 3.2 Implement `CatalogContext` with fields: `catalog`, `isLoading`, `versions`, `selectedVersion`, `setSelectedVersion`
- [ ] 3.3 Implement `CatalogProvider`: fetch `index.json` on mount; fetch selected version's `catalog.json`; handle 404 / network errors gracefully (set catalog to null)
- [ ] 3.4 Re-fetch `catalog.json` when `selectedVersion` changes (with `AbortController` to cancel stale requests)
- [ ] 3.5 Export hook wrappers: `useCatalogContext`, `useProviders`, `useModelsForProvider(providerId)`, `useFieldsForProvider(providerId)` — each returns empty/safe defaults when catalog is null
- [ ] 3.6 Write unit tests for `CatalogProvider`: no-catalog state, successful load, version switch, fetch error handling

## 4. App Layout: Mount the Provider

- [ ] 4.1 Wrap `{children}` in `src/app/layout.tsx` with `<CatalogProvider>`

## 5. Version Selector UI

- [ ] 5.1 Create `src/components/version-select.tsx` using the Command + Popover pattern from `model-select.tsx`; show version ref strings; support text search filtering; show checkmark on active version
- [ ] 5.2 Update `src/components/toolbar.tsx` to accept `versions`, `selectedVersion`, `onVersionChange` props; render `<VersionSelect>` between the title and action buttons when `versions.length > 0`
- [ ] 5.3 Update `src/app/page.tsx` to read `versions`, `selectedVersion`, and `setSelectedVersion` from `useCatalogContext` and pass them to `<Toolbar>`
- [ ] 5.4 Write unit tests for `VersionSelect`: renders version list, filters by search query, calls `onVersionChange` on selection, hidden when no versions provided
- [ ] 5.5 Write unit tests for `Toolbar`: version selector visible when versions provided, hidden when versions list is empty

## 6. Consumer Components: Switch to Context Hooks

- [ ] 6.1 Update `src/components/model-select.tsx` to call `useModelsForProvider(providerId)` from `catalog-context` instead of `getModelsForProvider` from `catalog`
- [ ] 6.2 Update `src/components/model-form.tsx` to call `useFieldsForProvider(providerId)` from `catalog-context` instead of `getFieldsForProvider` from `catalog`
- [ ] 6.3 Verify existing `model-select.test.tsx` still passes (mock update if needed due to import path change)

## 7. Cleanup and Validation

- [ ] 7.1 Delete `public/catalog.json` from the repository
- [ ] 7.2 Run `npm run generate:catalog` (no ref) to produce the first versioned catalog from current submodule HEAD; commit `public/catalogs/` output
- [ ] 7.3 Run `npm run lint`, `npm run test`, `npm run build`; fix any failures
- [ ] 7.4 Verify 90%+ test coverage is maintained (`npm run test:coverage`)
