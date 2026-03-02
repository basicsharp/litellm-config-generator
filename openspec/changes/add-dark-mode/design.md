## Context

The app is a Next.js 15 / React 19 / TypeScript project using Tailwind CSS with shadcn/ui.
Dark-mode CSS variables are already declared in `src/app/globals.css` under `.dark { … }`.
No runtime mechanism currently activates that class on `<html>`.
The official shadcn/ui guidance for Next.js dark mode (https://ui.shadcn.com/docs/dark-mode/next) prescribes `next-themes` as the theme manager.

## Goals / Non-Goals

**Goals:**

- Allow users to switch between Light, Dark, and System (OS preference) themes
- Persist the selected theme across page reloads (via `localStorage`, handled by `next-themes`)
- Follow the shadcn/ui Next.js dark-mode guide exactly — no custom theme solutions
- Surface the toggle in the existing `Toolbar` so it is always reachable

**Non-Goals:**

- Per-user server-side theme persistence (beyond `localStorage`)
- Additional themes beyond Light / Dark / System
- Theming of non-UI assets (e.g. favicons, OG images)

## Decisions

### D1 — Use `next-themes` (not manual class toggling)

**Chosen**: `next-themes`
**Alternatives considered**: Manual `document.documentElement.classList` toggle, CSS `prefers-color-scheme` only
**Rationale**: `next-themes` is the only approach endorsed by shadcn/ui's Next.js dark-mode doc. It handles SSR hydration safely (`suppressHydrationWarning`), syncs with OS preference, and persists selection to `localStorage` automatically.

### D2 — Thin `ThemeProvider` wrapper component

**Chosen**: `src/components/theme-provider.tsx` — a minimal re-export of `NextThemesProvider`
**Rationale**: Keeps `layout.tsx` clean; isolates the `"use client"` boundary to one small file, consistent with shadcn/ui's recommended pattern.

### D3 — `ModeToggle` as a `DropdownMenu` with three options

**Chosen**: Dropdown with Light / Dark / System options using `Sun`/`Moon` icons from `lucide-react` (already a project dependency)
**Alternatives considered**: Simple two-state button (light↔dark only)
**Rationale**: Three-state (including System) aligns with shadcn/ui's canonical example and is more accessible — power users can follow their OS preference.

### D4 — Place `ModeToggle` inside `Toolbar`

**Chosen**: Added to `Toolbar`'s right-side button group
**Rationale**: Toolbar is always visible and already contains the primary action buttons, making it the natural home for a global app setting toggle.

### D5 — shadcn/ui `DropdownMenu` component

The project does not yet have `@radix-ui/react-dropdown-menu` as a direct dep, but it is used by `cmdk` (already installed) and Radix packages are already present. We will add the shadcn `dropdown-menu` component via `npx shadcn@latest add dropdown-menu`.

## Risks / Trade-offs

- **Hydration flash** → Mitigated by `suppressHydrationWarning` on `<html>` and `disableTransitionOnChange` prop on `ThemeProvider`
- **Added bundle** → `next-themes` is ~4 kB gzipped; negligible for this app
- **Test coverage** → `ThemeProvider` and `ModeToggle` are new components; tests must be written first (TDD). The `useTheme` hook from `next-themes` must be mocked in tests to avoid SSR-related failures.

## Migration Plan

1. Install `next-themes`
2. Add `dropdown-menu` shadcn component
3. Create `theme-provider.tsx` and `mode-toggle.tsx`
4. Update `layout.tsx` (add `suppressHydrationWarning`, wrap with `ThemeProvider`)
5. Update `toolbar.tsx` (add `ModeToggle`)
6. Run full test suite; fix any regressions
7. Deploy — no rollback required (purely additive, CSS variables already present)

## Open Questions

- (none — approach is fully specified by the shadcn/ui guide)
