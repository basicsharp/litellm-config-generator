## 1. Dependencies & Scaffolding

- [x] 1.1 Install `next-themes` package (`npm install next-themes`)
- [x] 1.2 Add `dropdown-menu` shadcn component (`npx shadcn@latest add dropdown-menu`)

## 2. ThemeProvider Component (TDD)

- [x] 2.1 Write test for `ThemeProvider` — verify it renders children and forwards props to `NextThemesProvider`
- [x] 2.2 Create `src/components/theme-provider.tsx` wrapping `NextThemesProvider` from `next-themes`

## 3. ModeToggle Component (TDD)

- [x] 3.1 Write tests for `ModeToggle` — verify dropdown renders three options (Light, Dark, System), calling `setTheme` with correct argument on click, and sr-only label is present
- [x] 3.2 Create `src/components/mode-toggle.tsx` using `DropdownMenu`, `Button`, `Sun`/`Moon` icons, and `useTheme` from `next-themes`

## 4. Root Layout Update

- [x] 4.1 Update `src/app/layout.tsx`: add `suppressHydrationWarning` to `<html>`, wrap content with `ThemeProvider` (attribute=`"class"`, defaultTheme=`"system"`, enableSystem, disableTransitionOnChange)
- [x] 4.2 Update `src/app/layout.test.tsx` to cover `ThemeProvider` integration (if layout tests exist)

## 5. Toolbar Update (TDD)

- [x] 5.1 Update `src/components/toolbar.test.tsx` — add assertion that `ModeToggle` renders inside the toolbar
- [x] 5.2 Update `src/components/toolbar.tsx` — import and render `ModeToggle` in the right-side button group

## 6. Verification

- [x] 6.1 Run `npm run lint` — confirm zero new lint errors
- [x] 6.2 Run `npm run test` — confirm all tests pass and coverage ≥ 90%
- [x] 6.3 Run `npm run build` — confirm production build succeeds
- [x] 6.4 Manual smoke test: open app, toggle through Light / Dark / System, reload to verify persistence
