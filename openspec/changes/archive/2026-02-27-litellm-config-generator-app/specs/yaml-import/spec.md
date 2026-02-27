## ADDED Requirements

### Requirement: User can open an import dialog
The toolbar SHALL include an "Import YAML" button that opens a modal dialog with a textarea for pasting YAML content.

#### Scenario: Opening import dialog
- **WHEN** the user clicks "Import YAML"
- **THEN** a modal dialog opens with a focused textarea

---

### Requirement: Import parses model_list from pasted YAML
Upon confirmation, the system SHALL parse the pasted YAML and extract the `model_list` array into the editor's model entries, replacing the current state.

#### Scenario: Valid model_list import
- **WHEN** the user pastes a valid config.yaml containing `model_list` and clicks "Import"
- **THEN** the editor is populated with one model card per entry in `model_list`

#### Scenario: Partial YAML (model_list only)
- **WHEN** the user pastes only the `model_list` block (no other top-level keys)
- **THEN** the import succeeds and populates the model cards

#### Scenario: Import replaces existing state
- **WHEN** models already exist in the editor and the user imports new YAML
- **THEN** the existing models are replaced by the imported ones (with a confirmation prompt)

---

### Requirement: Import detects os.environ/ pattern
During import, credential field values matching `os.environ/<VAR>` SHALL be parsed into Env Var mode with the variable name extracted.

#### Scenario: Env var detected on import
- **WHEN** the imported YAML contains `api_key: os.environ/OPENAI_API_KEY`
- **THEN** the api_key field is set to Env Var mode with varName "OPENAI_API_KEY"

---

### Requirement: Import shows a clear error for invalid YAML
If the pasted content is not valid YAML or does not contain a parseable `model_list`, the system SHALL display an inline error message without closing the dialog.

#### Scenario: Invalid YAML
- **WHEN** the user pastes malformed YAML (e.g., bad indentation) and clicks "Import"
- **THEN** an error message is shown inside the dialog; the editor state is not changed

#### Scenario: Valid YAML but no model_list
- **WHEN** the user pastes valid YAML that lacks a `model_list` key
- **THEN** an error message indicates that `model_list` was not found

---

### Requirement: Import handles unknown providers gracefully
If an imported model's provider prefix is not in the known top-10 list, the system SHALL still import the entry and display the raw `litellm_params` fields.

#### Scenario: Unknown provider imported
- **WHEN** the imported YAML contains a model with `model: "cohere/command-r-plus"`
- **THEN** the model card is created with a generic form showing all `litellm_params` as key-value fields
