## ADDED Requirements

### Requirement: Debounced Shiki highlighting

The `YamlPreview` component SHALL debounce calls to `codeToHtml` so that Shiki re-highlighting is deferred by at least 300 ms after the last `models` change, preventing redundant highlighting work on rapid consecutive edits.

#### Scenario: Rapid model updates debounce highlighting

- **WHEN** multiple models state updates arrive within 300 ms of each other
- **THEN** Shiki `codeToHtml` SHALL be called only once, after the 300 ms idle window expires

#### Scenario: Single model update triggers highlighting after delay

- **WHEN** a single model is saved (form blur)
- **THEN** Shiki `codeToHtml` SHALL be called once after the 300 ms debounce delay

#### Scenario: Stale async highlight is cancelled on new input

- **WHEN** a new models update arrives while a previous Shiki call is still in-flight
- **THEN** the previous Shiki call's result SHALL be discarded and a new debounced call SHALL be scheduled

### Requirement: Fresh YAML text for clipboard and download

The plain-text YAML output SHALL always reflect the latest `models` state immediately, independent of the debounce delay, so that Copy and Download actions are never stale.

#### Scenario: Copy uses latest YAML regardless of debounce

- **WHEN** the user clicks the Copy button during a debounce window
- **THEN** the copied text SHALL contain the YAML derived from the current `models` state, not the previous highlighted state

### Requirement: Loading indicator during debounce window

The component SHALL render a visual indicator (reduced opacity on the code block) whenever the highlighted output is stale (i.e., a debounce is pending), so the user is aware the preview is catching up.

#### Scenario: Stale indicator appears after model change

- **WHEN** a model is saved and the debounce window has not yet elapsed
- **THEN** the highlighted code block SHALL have reduced opacity (e.g., opacity-60)

#### Scenario: Stale indicator clears after highlight completes

- **WHEN** the debounce window elapses and `codeToHtml` resolves
- **THEN** the highlighted code block SHALL return to full opacity

### Requirement: Deferred YAML text computation

The `YamlPreview` component SHALL use `useDeferredValue` on the incoming `models` prop to defer the execution of `configToYaml` during urgent React updates, keeping the rest of the UI responsive.

#### Scenario: UI remains responsive during model list edits

- **WHEN** the user is actively editing form fields that trigger re-renders
- **THEN** the YAML preview computation SHALL not block or delay higher-priority UI updates
