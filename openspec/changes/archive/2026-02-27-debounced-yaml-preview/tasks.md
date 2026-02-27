## 1. Tests (write first — TDD)

- [x] 1.1 Add `HIGHLIGHT_DEBOUNCE_MS` constant test: assert component does not call `codeToHtml` before 250 ms have elapsed after a models change
- [x] 1.2 Add test: multiple models changes within 250 ms result in exactly one `codeToHtml` call after idle window
- [x] 1.3 Add test: Copy button uses current `yamlText` (not stale highlighted state) during a debounce window
- [x] 1.4 Add test: stale indicator (opacity class) is applied while debounce is pending and removed after highlight resolves
- [x] 1.5 Add test: cancels in-flight Shiki result when new models arrive before resolution

## 2. Implementation

- [x] 2.1 Add `HIGHLIGHT_DEBOUNCE_MS = 250` constant to `yaml-preview.tsx`
- [x] 2.2 Wrap the `models` prop with `useDeferredValue` inside `YamlPreview` to defer `configToYaml` computation
- [x] 2.3 Add `isStale` state (boolean) initialized to `false`; set to `true` when deferred models change, `false` after highlight resolves
- [x] 2.4 Replace the current `useEffect` with a debounced version: clear previous `setTimeout` on each new `yamlText` change; fire `codeToHtml` after `HIGHLIGHT_DEBOUNCE_MS`
- [x] 2.5 Apply `opacity-60 transition-opacity` classes to the code block div when `isStale` is `true`

## 3. Verification

- [x] 3.1 Run `npm run test` and confirm all new and existing tests pass with coverage ≥ 90%
- [x] 3.2 Run `npm run lint` and confirm no new lint errors
- [x] 3.3 Run `npm run build` and confirm clean production build
- [x] 3.4 Manual smoke test: open dev server, tab through several fields quickly, confirm YAML preview debounces and shows stale state before updating
