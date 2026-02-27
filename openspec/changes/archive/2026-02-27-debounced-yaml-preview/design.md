## Context

`YamlPreview` currently calls `codeToHtml` (Shiki) inside a `useEffect` every time `yamlText` changes. `yamlText` is derived from `models` via `useMemo`, so every reducer dispatch (e.g. every form `onBlur`) triggers a full async Shiki re-render. Shiki is not lightweight—it ships grammar and theme data and runs tokenization on the full YAML string. As the model list grows (more lines), this becomes visibly slow.

The form (`ModelForm`) already saves on `onBlur`, so edits only propagate to state when focus leaves a field. However, if a user tabs through several fields quickly, each blur fires a save and each save re-triggers Shiki.

## Goals / Non-Goals

**Goals:**

- Debounce Shiki re-highlighting so it runs at most once per 250 ms idle window
- Keep the Copy/Download flow reading `yamlText` directly (no debounce on text, only on highlighting)
- Show a visible but unobtrusive "stale" indicator during the debounce window so the user knows the preview will catch up
- Maintain correct cancellation of stale async Shiki calls (already done via `active` flag; keep it)

**Non-Goals:**

- Moving Shiki to a Web Worker (future optimization, out of scope here)
- Changing form submission/save frequency in `ModelForm`
- Modifying `configToYaml` or the reducer in `page.tsx`
- Changing mobile tab layout behavior

## Decisions

### Decision 1: `useDeferredValue` + debounce together vs. one alone

**Choice**: Use `useDeferredValue` on the `models` prop inside `YamlPreview` to defer YAML text generation, _and_ use a debounced `useEffect` (via `setTimeout`) for the Shiki call.

**Why not `useDeferredValue` alone**: `useDeferredValue` marks the update as low-priority and React will skip re-renders during urgent updates, but it doesn't batch or delay async side-effects like Shiki. If many updates land in quick succession, Shiki would still fire multiple times.

**Why not debounce alone (no `useDeferredValue`)**: Without `useDeferredValue`, `configToYaml` and the Shiki call are on the critical path of every render, blocking the thread even during typing. `useDeferredValue` decouples the expensive path from the input path entirely.

**Combined approach**: `useDeferredValue` keeps the UI snappy (React can skip the deferred subtree during urgent updates), and the `setTimeout` debounce ensures Shiki runs only after the user has paused for 250 ms.

### Decision 2: Debounce delay — 250 ms

A 250 ms idle window is imperceptible at human typing/tabbing speed but catches bursts of back-to-back field blurs. This matches common debounce conventions for live preview UIs.

### Decision 3: Loading indicator strategy

Show a subtle opacity reduction (e.g. `opacity-60`) on the highlighted area while the debounce window is pending. Avoid spinners or layout shifts—those are more distracting than a slight fade.

**Why not full skeleton**: The previous highlight stays visible while debouncing, which is better UX than a blank/skeleton. Users can still read the last-known state.

### Decision 4: No new dependencies

Implement using `useState`, `useEffect`, `useDeferredValue` (React 18, already available), and `setTimeout`/`clearTimeout`. No new npm packages.

## Risks / Trade-offs

- **250 ms window feels slow on large configs** → Configurable constant `HIGHLIGHT_DEBOUNCE_MS` in the file makes tuning easy.
- **`useDeferredValue` requires React 18** → Already in use (Next.js 14+).
- **Stale highlight for 250 ms on every save** → Acceptable; Copy/Download always use the fresh `yamlText` regardless.
- **Test coverage**: `codeToHtml` is async and Shiki-specific; tests should mock it and assert debounce behavior via fake timers.
