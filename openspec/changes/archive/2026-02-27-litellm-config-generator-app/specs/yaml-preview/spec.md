## ADDED Requirements

### Requirement: YAML preview reflects current state in real time
The preview panel SHALL display the complete, valid `config.yaml` output (scoped to `model_list`) and update on every state change without requiring user action.

#### Scenario: Real-time update
- **WHEN** the user edits any field in any model card
- **THEN** the YAML preview updates within one render cycle (no debounce required for correctness)

#### Scenario: Empty state
- **WHEN** no models have been added
- **THEN** the preview shows `model_list: []` or an empty state placeholder

---

### Requirement: YAML output is syntactically valid
The generated YAML SHALL always be parseable by a standard YAML parser (e.g., `js-yaml`). Partial/incomplete form state SHALL produce partial but valid YAML (omit empty fields rather than render invalid YAML).

#### Scenario: Missing optional fields
- **WHEN** a model has `model_name` and `model` set but no api_key
- **THEN** the YAML contains only the fields that have values; `api_key` is omitted

#### Scenario: Fields with special characters
- **WHEN** an api_base value contains a colon (e.g., a URL)
- **THEN** the YAML correctly quotes the value to remain valid

---

### Requirement: YAML preview has syntax highlighting
The preview SHALL render with YAML syntax highlighting using a color scheme consistent with the emerald/dark theme.

#### Scenario: Highlighting visible
- **WHEN** the YAML preview is rendered
- **THEN** YAML keys, values, and structure elements are visually differentiated by color

---

### Requirement: YAML preview panel is sticky on desktop
The preview panel SHALL remain visible as the user scrolls the model list on screens ≥768px wide.

#### Scenario: Scrolling model list
- **WHEN** the user scrolls down through a long model list
- **THEN** the YAML preview remains anchored and visible

#### Scenario: Mobile layout
- **WHEN** the viewport is <768px wide
- **THEN** the YAML preview is accessible via a "Preview" tab, not shown simultaneously
