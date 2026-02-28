## Context

The catalog generator (`scripts/generate-catalog.ts`) reads from the `litellm/` git submodule at its current HEAD and writes a single flat `public/catalog.json`. This file is consumed via a compile-time static import in `src/lib/catalog.ts`, making it impossible to switch versions at runtime. The submodule is pinned to one commit, so every user gets the same catalog version baked into the bundle.

The UI components (`model-select.tsx`, `model-form.tsx`) call catalog accessor functions synchronously at render time, which works today because the data is bundled but precludes any dynamic loading strategy.

## Goals / Non-Goals

**Goals:**

- Script can target any tag, branch, or commit without modifying the working submodule
- Versioned catalogs persist in `public/catalogs/` and accumulate over time
- Runtime version switching requires no rebuild — only a fetch
- UI gracefully handles missing catalogs (fresh clone, no versions generated yet)
- Existing Command + Popover combobox pattern is reused for the version selector

**Non-Goals:**

- Automatic fetching/generation of catalogs on app start (manual `generate:catalog` remains the trigger)
- Displaying catalog diffs between versions
- Remote catalog hosting (catalogs are always served from `public/`)

## Decisions

### D1: git worktree over temporary checkout

**Decision**: Use `git worktree add <path> <ref>` to access a specific litellm ref.

**Rationale**: A `git checkout` inside the submodule mutates the working directory, creating a dirty state that can surprise developers and fails if there are uncommitted changes. A worktree creates an isolated checkout at a temp path with zero impact on the working tree, and is safe for concurrent script runs. It is cleaned up in a `finally` block.

**Alternative considered**: `git show <ref>:<file>` for reading individual files without checkout. Rejected because the script recurses the entire `litellm/llms/<provider>/` directory tree; reconstructing that traversal over git object storage would require a full rewrite.

**Alternative considered**: Temporary `git stash` + checkout + pop. Rejected because it mutates the submodule HEAD and is not concurrent-safe.

### D2: React Context for catalog state over per-component fetch

**Decision**: A single `CatalogProvider` wraps `layout.tsx` and exposes catalog data, version list, and version selection state via context. Components access data through hooks (`useModelsForProvider`, `useFieldsForProvider`).

**Rationale**: Multiple components (`model-select.tsx`, `model-form.tsx`) consume catalog data. Without a shared context, each would independently fetch the same JSON and manage its own loading state. The context centralises the single fetch and provides a stable reference for all consumers.

**Alternative considered**: Next.js `getServerSideProps` / Route Handlers. Rejected because the app is fully client-side (`'use client'`) and static export friendly; a server layer adds unnecessary complexity.

**Alternative considered**: SWR / React Query for fetching. Rejected to avoid a new runtime dependency; a plain `useEffect` + `fetch` with `AbortController` covers the use case without overhead.

### D3: Pure functions + hook wrappers for catalog accessors

**Decision**: `catalog.ts` exports pure functions that accept an explicit `CatalogData` argument (e.g., `getProviders(data)`). `catalog-context.tsx` exports hook wrappers that pull data from context (e.g., `useProviders()`).

**Rationale**: Pure functions remain trivially testable without mocking a context provider. Hook wrappers keep component call sites minimal (one import, one call). Tests in `additional-lib-coverage.test.ts` that test pure functions directly can pass a fixture catalog instead of relying on a static import.

**Alternative considered**: Convert everything to hooks only. Rejected because it makes unit-testing the accessor logic dependent on React's rendering environment.

### D4: index.json as the version manifest

**Decision**: `public/catalogs/index.json` is created/updated by the script on each run. It contains the ordered list of available versions and a `latest` pointer (last entry added).

**Rationale**: The UI needs to know which catalog versions are available without scanning the directory (not possible from a browser). A single manifest fetch at boot is the minimal solution. "Latest" is the last written entry — simpler and more predictable than semver sorting against litellm's non-standard tag format (e.g., `v1.81.12-stable.gemini.3.1-pro`).

**Alternative considered**: Scan `public/catalogs/` at build time and embed version list in the bundle. Rejected because it requires a rebuild every time a new catalog is generated.

### D5: Ref sanitization for folder names

**Decision**: Replace `/` with `__` and strip any character outside `[a-zA-Z0-9._-]` with `_` to produce a safe folder name.

**Examples**:

- `v1.81.13` → `v1.81.13`
- `feature/some-branch` → `feature__some-branch`
- `refs/heads/main` → `refs__heads__main`

The original ref string is preserved in `index.json` metadata for display; only the folder name is sanitized.

### D6: No-ref behaviour uses current submodule HEAD

**Decision**: Running without `--ref` resolves the current submodule commit via `git -C litellm rev-parse HEAD`, reads files directly from `litellm/` (no worktree), and writes to `public/catalogs/<commit-sha>/catalog.json`.

**Rationale**: Maintains one-command ergonomics for the common case while migrating fully to the versioned structure. The short SHA is stable and human-readable enough to identify the catalog later.

## Risks / Trade-offs

- **Worktree + remote ref**: If the ref doesn't exist locally, the script fetches it from origin. This requires network access. → Mitigation: clear error message when fetch fails, prompt user to check ref spelling and network.
- **Stale index.json**: Manually deleting a versioned folder without updating `index.json` leaves a stale entry. → Mitigation: the script validates that the target folder exists when loading the index before writing, but the UI will 404 on stale entries. Acceptable trade-off for now; cleanup is a manual operation.
- **Breaking: `public/catalog.json` removed**: Existing setups that reference this path directly will break. → Mitigation: documented in proposal as a breaking change; no external consumers are known.
- **Loading flicker on version switch**: Re-fetching catalog on version change causes a brief render with empty provider/model lists. Acceptable per explicit user decision.

## Migration Plan

1. Run `npm run generate:catalog` (no `--ref`) after merging — this creates `public/catalogs/<sha>/catalog.json` and `public/catalogs/index.json` from the current submodule HEAD, replacing the now-removed `public/catalog.json`.
2. Commit the generated `public/catalogs/` directory.
3. `public/catalog.json` can be deleted from the repo.
4. To generate a versioned catalog: `npm run generate:catalog -- --ref v1.81.13`.

## Open Questions

- (none — all design decisions resolved during exploration)
