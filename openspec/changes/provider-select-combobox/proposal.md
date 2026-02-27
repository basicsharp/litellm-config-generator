## Why

Clicking the provider dropdown freezes the page because selecting a provider synchronously re-renders 33+ `EnvVarInput` field components via `form.reset()`, blocking the main thread. The current `Select` component also provides no search capability, which will become more painful as the provider list grows.

## What Changes

- Replace the `Select`-based `ProviderSelect` component with a `Command + Popover` combobox, consistent with the existing `ModelSelect` pattern
- Add typeahead filtering so users can search providers by name
- Wrap `form.reset()` in `startTransition` so the expensive field re-render is non-blocking, keeping the UI responsive during provider switching

## Capabilities

### New Capabilities

- `provider-select-combobox`: Searchable combobox for provider selection with non-blocking form update on provider change

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `src/components/provider-select.tsx` — rewritten to use `Command + Popover` instead of `Select`
- `src/components/model-form.tsx` — `handleProviderChange` wrapped in `startTransition`
- No new dependencies (reuses `cmdk`, `Popover`, `Command` already used by `ModelSelect`)
- No API or schema changes
