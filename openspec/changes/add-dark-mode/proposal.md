## Why

Users working in low-light environments have no way to switch the app to a dark theme, causing eye strain during extended sessions. The CSS dark mode variables are already defined in `globals.css` but there is no runtime mechanism to activate the `.dark` class.

## What Changes

- Install `next-themes` package to manage theme state across the app
- Add a `ThemeProvider` wrapper component (`src/components/theme-provider.tsx`) using `next-themes`
- Update root layout (`src/app/layout.tsx`) to wrap content with `ThemeProvider` (attribute=`class`, defaultTheme=`system`, enableSystem, suppressHydrationWarning on `<html>`)
- Add a `ModeToggle` dropdown component (`src/components/mode-toggle.tsx`) with Light / Dark / System options, using Sun/Moon icons from `lucide-react`
- Place the `ModeToggle` in the `Toolbar` component so the toggle is always accessible

## Capabilities

### New Capabilities

- `dark-mode-toggle`: User-facing control (Sun/Moon dropdown) that switches the app between light, dark, and system themes via `next-themes`

### Modified Capabilities

- (none — no existing spec-level requirements are changing)

## Impact

- **New dependency**: `next-themes` (~4 kB gzipped)
- **Files modified**: `src/app/layout.tsx`, `src/components/toolbar.tsx`
- **Files added**: `src/components/theme-provider.tsx`, `src/components/mode-toggle.tsx`
- **shadcn/ui components needed**: `DropdownMenu` (if not yet present) — used by `ModeToggle`
- No API or data-layer changes; purely UI/styling
