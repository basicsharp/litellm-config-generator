## ADDED Requirements

### Requirement: User can add a model entry
The system SHALL allow the user to add a new model entry to the `model_list` via an "Add Model" button that opens an inline form or expands a new card.

#### Scenario: Adding first model
- **WHEN** the user clicks "Add Model" on an empty list
- **THEN** a new model card appears in expanded/edit state with empty fields

#### Scenario: Adding subsequent models
- **WHEN** the user clicks "Add Model" with existing models in the list
- **THEN** a new model card is appended at the bottom of the list in edit state

---

### Requirement: User can remove a model entry
The system SHALL allow the user to delete any model entry from the list.

#### Scenario: Removing a model
- **WHEN** the user clicks the delete/remove control on a model card
- **THEN** the model is removed from the list and the YAML preview updates immediately

---

### Requirement: User sets the model alias
Each model entry SHALL have a `model_name` field (the virtual alias exposed to API callers).

#### Scenario: Setting alias
- **WHEN** the user types in the model alias field
- **THEN** the `model_name` value in the YAML output updates in real time

#### Scenario: Empty alias
- **WHEN** the alias field is empty
- **THEN** the YAML preview shows the field as empty string or omits it, and a validation hint is shown

---

### Requirement: User selects a provider
Each model entry SHALL have a provider selector that determines which credential fields are shown.

#### Scenario: Provider selection changes fields
- **WHEN** the user selects "Azure" as the provider
- **THEN** the form shows fields: api_key, api_base, api_version (and hides vertex_project, aws_region_name, etc.)

#### Scenario: Switching providers clears previous fields
- **WHEN** the user switches from "Azure" to "OpenAI"
- **THEN** Azure-specific field values (api_base, api_version) are cleared from the state

---

### Requirement: User selects or enters a model identifier
Each model entry SHALL have a searchable model selector pre-populated from the catalog for the selected provider, with the option to type a custom model string.

#### Scenario: Selecting from catalog
- **WHEN** the user opens the model selector with provider "openai" selected
- **THEN** a searchable list of OpenAI models from the catalog is shown

#### Scenario: Custom model string
- **WHEN** the user types a model string not in the catalog
- **THEN** the custom value is accepted and used as-is in `litellm_params.model`

---

### Requirement: User fills provider-specific credential fields
The form SHALL show the required and optional credential fields for the selected provider. Required fields MUST be visually marked.

#### Scenario: Required field marked
- **WHEN** a provider has a required field (e.g., Azure's api_base)
- **THEN** the field is marked with a required indicator (asterisk or badge)

#### Scenario: Optional fields available
- **WHEN** a provider has optional fields
- **THEN** optional fields are visible (not hidden behind a toggle) but clearly labeled as optional

---

### Requirement: User sets per-model rate limits
Each model entry SHALL expose optional fields for `rpm` (requests per minute) and `tpm` (tokens per minute), `timeout`, and `stream_timeout`.

#### Scenario: Setting RPM
- **WHEN** the user enters a number in the RPM field
- **THEN** `rpm` appears in the `litellm_params` block in the YAML output

#### Scenario: Empty rate limit
- **WHEN** a rate limit field is left empty
- **THEN** the corresponding key is omitted from the YAML output

---

### Requirement: Model cards show a collapsed summary
Each model entry SHALL render in a collapsed state showing the alias, provider badge, and model identifier. The user can expand to edit.

#### Scenario: Collapsed view
- **WHEN** a model card is collapsed
- **THEN** it shows: model_name alias, provider name as a badge, model identifier string

#### Scenario: Expanding a card
- **WHEN** the user clicks the collapsed card header
- **THEN** the form fields expand inline

---

### Requirement: Provider selector covers the top 10 providers
The provider selector SHALL include at minimum: openai, azure, anthropic, bedrock, vertex_ai, gemini, groq, mistral, ollama, hosted_vllm.

#### Scenario: Provider list visible
- **WHEN** the user opens the provider selector
- **THEN** all 10 providers are listed with their display names
