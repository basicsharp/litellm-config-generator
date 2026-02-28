## Why

The catalog generator always writes to a single `public/catalog.json` from the submodule's current HEAD, making it impossible to generate or compare catalogs across litellm releases. Users who want to test their config against a specific version have no supported path today.

## What Changes

- `npm run generate:catalog` accepts an optional `--ref <tag|branch|commit>` argument
- All catalogs are written to versioned paths: `public/catalogs/<version>/catalog.json`
- A manifest file `public/catalogs/index.json` tracks available versions and marks the latest
- The app loads the catalog dynamically at runtime instead of via a static compile-time import
- A version selector combobox appears in the Toolbar, defaulting to the latest available version
- Switching versions re-fetches the corresponding catalog without a full page reload
- **BREAKING**: `public/catalog.json` is removed as the primary catalog path; all output is now versioned

## Capabilities

### New Capabilities

- `versioned-catalog-script`: CLI `--ref` argument support in the generate script, git worktree-based isolated checkout, versioned output paths, and `index.json` manifest management
- `catalog-version-selector`: Runtime catalog loading via React context, version picker combobox in the Toolbar, and graceful empty/error states when no catalogs exist

### Modified Capabilities

- (none — no existing `openspec/specs/` entries are affected)

## Impact

- **`scripts/generate-catalog.ts`**: Major changes — ref parsing, worktree orchestration, versioned write paths, index.json upsert logic
- **`src/lib/catalog.ts`**: Breaking refactor — static JSON import replaced by pure functions accepting explicit catalog data
- **`src/lib/catalog-context.tsx`** (new): React context, provider, and hooks for async catalog loading and version state
- **`src/app/layout.tsx`**: Wrapped with `<CatalogProvider>`
- **`src/components/toolbar.tsx`**: Gains version selector props and renders `<VersionSelect>`
- **`src/components/version-select.tsx`** (new): Command + Popover combobox following existing `model-select.tsx` pattern
- **`src/components/model-select.tsx`**, **`model-form.tsx`**: Switch from direct function calls to context hooks
- **Tests**: `additional-lib-coverage.test.ts` updated to pass explicit catalog data to pure functions
