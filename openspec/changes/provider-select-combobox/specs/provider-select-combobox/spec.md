## ADDED Requirements

### Requirement: Provider select renders as a searchable combobox

The `ProviderSelect` component SHALL render as a `Command + Popover` combobox, replacing the previous `Select` dropdown. The trigger button SHALL display the currently selected provider's label, or a placeholder when no provider is selected.

#### Scenario: Open combobox

- **WHEN** user clicks the provider trigger button
- **THEN** a popover opens with a text input focused and the list of providers visible

#### Scenario: Filter providers by typing

- **WHEN** user types a search string into the combobox input
- **THEN** only providers whose label contains the search string (case-insensitive) are shown

#### Scenario: No match

- **WHEN** user types a string that matches no provider label
- **THEN** an empty state message is displayed

#### Scenario: Select a provider

- **WHEN** user clicks or presses Enter on a provider item
- **THEN** the combobox closes, the trigger displays the selected provider's label, and `onChange` is called with the provider id

#### Scenario: Selected provider is visually indicated

- **WHEN** the combobox is open and a provider is already selected
- **THEN** that provider's item displays a checkmark indicator

### Requirement: Provider change does not block the main thread

When the user selects a provider, the downstream form re-render triggered by `form.reset()` SHALL be wrapped in `startTransition` so the UI remains interactive during the update.

#### Scenario: UI stays interactive after provider selection

- **WHEN** user selects a provider from the combobox
- **THEN** the combobox closes and the trigger updates immediately, while the form fields update without freezing the page
