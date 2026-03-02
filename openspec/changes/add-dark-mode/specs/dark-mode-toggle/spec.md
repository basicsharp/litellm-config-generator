## ADDED Requirements

### Requirement: Theme provider wraps the application

The root layout SHALL wrap all page content with a `ThemeProvider` configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`. The `<html>` element SHALL have `suppressHydrationWarning` set to prevent hydration mismatch warnings.

#### Scenario: App loads with system theme by default

- **WHEN** a user opens the app for the first time (no stored preference)
- **THEN** the app SHALL apply the OS color scheme (dark if OS is in dark mode, light otherwise)

#### Scenario: App restores user's last theme choice

- **WHEN** a user has previously selected a theme and reloads the page
- **THEN** the app SHALL apply the previously selected theme without flickering

### Requirement: Mode toggle control is visible in the toolbar

The `Toolbar` component SHALL render a `ModeToggle` button in its right-side action group alongside the existing Import and Download buttons.

#### Scenario: Toggle is always visible

- **WHEN** the user is on any page of the app
- **THEN** the mode toggle SHALL be present in the toolbar

### Requirement: Mode toggle allows selecting Light, Dark, or System theme

The `ModeToggle` component SHALL render as a dropdown menu with three options: Light, Dark, and System. Selecting an option SHALL immediately update the active theme. The trigger button SHALL display an animated Sun icon in light mode and an animated Moon icon in dark mode.

#### Scenario: User selects dark theme

- **WHEN** the user opens the mode toggle dropdown and clicks "Dark"
- **THEN** the app SHALL switch to dark mode and the `<html>` element SHALL have the `dark` class

#### Scenario: User selects light theme

- **WHEN** the user opens the mode toggle dropdown and clicks "Light"
- **THEN** the app SHALL switch to light mode and the `<html>` element SHALL NOT have the `dark` class

#### Scenario: User selects system theme

- **WHEN** the user opens the mode toggle dropdown and clicks "System"
- **THEN** the app SHALL follow the OS color-scheme preference

#### Scenario: Animated icons indicate current mode

- **WHEN** the app is in light mode
- **THEN** the Sun icon SHALL be visible and the Moon icon SHALL be hidden

- **WHEN** the app is in dark mode
- **THEN** the Moon icon SHALL be visible and the Sun icon SHALL be hidden

### Requirement: Theme toggle has an accessible label

The `ModeToggle` button SHALL include a visually-hidden `<span className="sr-only">Toggle theme</span>` so screen readers can identify its purpose.

#### Scenario: Screen reader announces button purpose

- **WHEN** a screen reader focuses the mode toggle button
- **THEN** the accessible name SHALL be "Toggle theme"
