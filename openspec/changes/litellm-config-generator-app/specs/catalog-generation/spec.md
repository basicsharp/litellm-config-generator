## ADDED Requirements

### Requirement: Script reads submodule model prices JSON
The system SHALL include a Python script at `scripts/generate-catalog.py` that reads `litellm/model_prices_and_context_window.json` from the litellm submodule and produces `public/catalog.json`.

#### Scenario: Successful catalog generation
- **WHEN** the user runs `python scripts/generate-catalog.py` from the project root
- **THEN** `public/catalog.json` is created (or overwritten) with a valid JSON object

#### Scenario: Submodule not initialized
- **WHEN** the litellm submodule is not present or the JSON file does not exist
- **THEN** the script exits with a non-zero code and prints a clear error message

---

### Requirement: Catalog groups models by provider
The script SHALL group model entries by their `litellm_provider` field and output a catalog with one entry per provider.

#### Scenario: Provider grouping
- **WHEN** the JSON contains models with `litellm_provider: "openai"` and `litellm_provider: "azure"`
- **THEN** the output catalog contains separate `"openai"` and `"azure"` entries, each with their respective model arrays

---

### Requirement: Catalog includes model metadata
Each model entry in the catalog SHALL include: `id` (the model string as used in `litellm_params.model`), `mode` (chat/embedding/completion/image), `maxTokens`, `inputCostPerToken`, `outputCostPerToken`.

#### Scenario: Model with full metadata
- **WHEN** a model entry in the JSON has `max_tokens`, `input_cost_per_token`, `output_cost_per_token`, and `mode`
- **THEN** the catalog entry for that model includes all four fields

#### Scenario: Model with partial metadata
- **WHEN** a model entry is missing some fields (e.g., no cost data)
- **THEN** missing fields are omitted or set to `null`; the entry is still included

---

### Requirement: Catalog records generation metadata
The catalog JSON SHALL include a top-level `meta` object with `generatedAt` (ISO timestamp) and `litellmSubmodulePath` (relative path used).

#### Scenario: Metadata present
- **WHEN** the catalog is generated
- **THEN** `catalog.meta.generatedAt` is a valid ISO 8601 timestamp

---

### Requirement: Catalog filters to chat-compatible providers
The script SHALL exclude providers whose models have no `chat` or `completion` mode entries, to keep the UI focused on the core `model_list` use case.

#### Scenario: Image-only provider excluded
- **WHEN** a provider has only `mode: "image"` model entries
- **THEN** that provider does not appear in the catalog

#### Scenario: Chat provider included
- **WHEN** a provider has at least one `mode: "chat"` model entry
- **THEN** that provider appears in the catalog
