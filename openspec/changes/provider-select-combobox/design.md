## Context

`ProviderSelect` (`src/components/provider-select.tsx`) currently uses Radix UI's `Select` primitive with a 10-item hardcoded `PROVIDERS` array. Selecting a provider triggers `form.reset()` in `model-form.tsx`, which synchronously re-renders 33+ `EnvVarInput` field components, blocking the main thread and making the page feel frozen.

`ModelSelect` (`src/components/model-select.tsx`) already implements a `Command + Popover` combobox pattern using `cmdk`. This change makes `ProviderSelect` consistent with that existing pattern and addresses the blocking re-render.

## Goals / Non-Goals

**Goals:**

- Eliminate the frozen-page UX when switching providers
- Add typeahead search to the provider dropdown
- Make `ProviderSelect` visually and behaviorally consistent with `ModelSelect`

**Non-Goals:**

- Virtualizing the `ModelSelect` model list (separate concern)
- Lazy-loading `catalog.json` (separate concern)
- Adding new providers or changing the provider data source
- Changing form field rendering or layout

## Decisions

### 1. `Command + Popover` over Radix `Select`

`ModelSelect` already uses `Command + Popover` — adopting the same pattern keeps both dropdowns consistent and reuses code the team already understands. The `Select` primitive has no built-in search; replacing it with `Command` provides filtering via `cmdk`'s built-in fuzzy match at no extra dependency cost.

Alternatives considered:

- **Extend Radix `Select` with a search input**: Not natively supported; would require a custom overlay hack.
- **Use a third-party combobox**: Unnecessary — `cmdk` is already installed.

### 2. Keep hardcoded `PROVIDERS` array (not `getProviders()` from catalog)

`catalog.json` omits `hosted_vllm` because the catalog generator skips providers with no priced models. Switching to `getProviders()` would silently drop a valid provider. The hardcoded list stays as the source of truth for `ProviderSelect` until a deliberate decision is made to unify provider sourcing.

Alternatives considered:

- **Augment `getProviders()` with a fallback list**: Adds complexity without clear benefit right now; defer.

### 3. `startTransition` wraps `form.reset()` in `model-form.tsx`

`startTransition` marks the re-render triggered by provider change as non-urgent, allowing React to keep the UI interactive while it batches and schedules the 33-field update. This is the minimal, correct React 18 primitive for this pattern — no new libraries needed.

Alternatives considered:

- **`useDeferredValue` on `providerId`**: Would defer downstream renders but doesn't help with the synchronous `form.reset()` call itself.
- **Debounce**: Introduces artificial delay; wrong tool for a selection event.

## Risks / Trade-offs

- **`startTransition` defers, doesn't eliminate cost**: The 33 field re-renders still happen; they just don't block the thread. On very slow devices the form might visibly lag after selection. → Acceptable for now; reducing rendered field count is a separate improvement.
- **`PROVIDERS` list stays hardcoded**: `ProviderSelect` and `catalog.json` can drift. → Document this and address in a future "unify provider data source" change.
- **`cmdk` filter is case-insensitive substring**: Works well for 10 items; no issues anticipated.
