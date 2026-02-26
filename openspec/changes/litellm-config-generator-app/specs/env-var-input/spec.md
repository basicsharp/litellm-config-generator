## ADDED Requirements

### Requirement: Credential fields support literal and env-var modes
Every credential field (api_key, api_base, api_version, vertex_project, aws_access_key_id, etc.) SHALL support two input modes: **Literal** (plain string value) and **Env Var** (reference using the `os.environ/VAR_NAME` pattern).

#### Scenario: Default mode
- **WHEN** a credential field is first rendered
- **THEN** it defaults to Literal mode

#### Scenario: Switching to Env Var mode
- **WHEN** the user switches the field to Env Var mode
- **THEN** the input shows a prefix label "os.environ/" and an editable variable name field

#### Scenario: Switching back to Literal mode
- **WHEN** the user switches back to Literal mode
- **THEN** the env var name is cleared and a plain text input is shown

---

### Requirement: Env Var mode serializes to os.environ/ pattern
In Env Var mode, the field SHALL serialize to `os.environ/<VAR_NAME>` in the YAML output.

#### Scenario: Env var in YAML
- **WHEN** the user sets api_key to Env Var mode with variable name "OPENAI_API_KEY"
- **THEN** the YAML output contains `api_key: os.environ/OPENAI_API_KEY`

#### Scenario: Empty var name in env var mode
- **WHEN** the variable name field is empty in Env Var mode
- **THEN** the YAML output omits the field (treated as unset)

---

### Requirement: Literal mode masks secret fields
Fields designated as secrets (api_key, aws_secret_access_key, etc.) SHALL render as password inputs in Literal mode, with a show/hide toggle.

#### Scenario: Secret field masked by default
- **WHEN** a secret credential field is in Literal mode
- **THEN** the value is masked (password input type)

#### Scenario: Show/hide toggle works
- **WHEN** the user clicks the show/hide eye icon
- **THEN** the value toggles between masked and visible

---

### Requirement: Mode toggle is accessible
The mode toggle (Literal | Env Var) SHALL be keyboard accessible and have appropriate ARIA labels.

#### Scenario: Keyboard switch
- **WHEN** the user tabs to the mode toggle and presses Enter or Space
- **THEN** the mode switches between Literal and Env Var
