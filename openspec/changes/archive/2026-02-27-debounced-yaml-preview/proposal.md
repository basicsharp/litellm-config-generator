## Why

The YAML preview re-highlights via Shiki on every models state update (including every form blur), triggering an expensive async `codeToHtml` call synchronously tied to the React render cycle. As the model list grows, this creates visible lag and unnecessary work on rapid or consecutive edits.

## What Changes

- Introduce a debounce mechanism so Shiki highlighting is deferred until the user pauses editing (≥300 ms idle)
- Show the last-known highlighted output during the debounce window, with a subtle loading state
- Keep plain-text YAML generation (`configToYaml`) synchronous and always up-to-date for the Copy/Download actions
- Optionally use React 18 `useDeferredValue` to keep the UI responsive without blocking high-priority updates

## Capabilities

### New Capabilities

- `debounced-yaml-preview`: Debounced, performance-optimized YAML preview that defers Shiki re-highlighting until the user pauses, avoiding redundant async calls on every form change

### Modified Capabilities

<!-- No existing spec-level requirements change -->

## Impact

- `src/components/yaml-preview.tsx` — primary change: debounce + deferred value around `codeToHtml`
- `src/app/page.tsx` — no changes required; `models` prop stays the same
- No new dependencies needed (uses built-in `setTimeout` / React 18 `useDeferredValue`)
- Copy and Download actions are unaffected; they read `yamlText` directly without waiting for highlighting
