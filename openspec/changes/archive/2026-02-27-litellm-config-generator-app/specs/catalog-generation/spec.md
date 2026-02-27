## Requirements

### Requirement: Script is TypeScript, run via tsx
The system SHALL include a TypeScript script at `scripts/generate-catalog.ts` (run with `npx tsx scripts/generate-catalog.ts`) — no Python dependency.

#### Scenario: Script runs without Python
- **WHEN** the user runs `npx tsx scripts/generate-catalog.ts` from the project root
- **THEN** the script executes using the project's existing Node/tsx toolchain with no Python interpreter required

---

### Requirement: Script reads submodule model prices JSON (Source A — model list)
The script SHALL read `litellm/model_prices_and_context_window.json` from the litellm submodule to populate each provider's model array.

#### Scenario: Successful catalog generation
- **WHEN** the user runs `npx tsx scripts/generate-catalog.ts` from the project root
- **THEN** `public/catalog.json` is created (or overwritten) with a valid JSON object

#### Scenario: Submodule not initialized
- **WHEN** the litellm submodule is not present or the JSON file does not exist
- **THEN** the script exits with a non-zero code and prints a clear error message

---

### Requirement: Script extracts base fields from Pydantic router types (Source A — base fields)
The script SHALL parse `litellm/litellm/types/router.py` via regex to extract the typed field definitions from the Pydantic class hierarchy (`CredentialLiteLLMParams`, `GenericLiteLLMParams`, `LiteLLM_Params`, `CustomPricingLiteLLMParams`) and emit them under each provider's `fields.base` array.

#### Scenario: Base field extraction
- **WHEN** the script scans `router.py`
- **THEN** `fields.base` for every provider contains at minimum: `model`, `api_key`, `api_base`, `rpm`, `tpm`, `timeout`, `max_retries`
- **AND** each base field entry has: `name` (string), `type` ("string" | "number" | "boolean" | "unknown"), `required` (boolean), `secret` (boolean — true for fields whose name contains `key`, `secret`, `token`, `password`, `credential`)

---

### Requirement: Script extracts extra fields from provider implementations (Source B — extra fields)
The script SHALL scan `litellm/litellm/llms/{provider}/**/*.py` for all 10 target providers using the regex pattern `(?:optional_params|litellm_params)\.get\(['"](\w+)['"]\s*(?:,|\))` and emit discovered field names under each provider's `fields.extra` array.

Target providers: `openai`, `azure`, `anthropic`, `bedrock`, `vertex_ai`, `gemini`, `groq`, `mistral`, `ollama`, `hosted_vllm`.

#### Scenario: Provider-specific extra field discovered
- **WHEN** the script scans `litellm/litellm/llms/vertex_ai/`
- **THEN** `providers.vertex_ai.fields.extra` contains `use_psc_endpoint_format`

#### Scenario: Azure extra fields discovered
- **WHEN** the script scans `litellm/litellm/llms/azure/`
- **THEN** `providers.azure.fields.extra` contains at least: `azure_ad_token`, `tenant_id`, `client_id`, `client_secret`

#### Scenario: Bedrock extra fields discovered
- **WHEN** the script scans `litellm/litellm/llms/bedrock/`
- **THEN** `providers.bedrock.fields.extra` contains at least: `aws_session_token`, `aws_role_name`, `aws_profile_name`

#### Scenario: Test files excluded from scan
- **WHEN** the script scans provider directories
- **THEN** any files under `tests/` or `test_*.py` paths are excluded from the regex scan

#### Scenario: Base fields deduplicated from extra
- **WHEN** a field name appears in both `fields.base` and the Source B scan
- **THEN** it is included only in `fields.base`, not duplicated in `fields.extra`

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

### Requirement: Catalog output shape
The generated `public/catalog.json` SHALL conform to the following top-level structure:

```json
{
  "meta": {
    "generatedAt": "<ISO 8601 timestamp>",
    "litellmSubmodulePath": "litellm"
  },
  "providers": {
    "<providerId>": {
      "label": "<human-readable name>",
      "models": [
        { "id": "...", "mode": "chat", "maxTokens": 1048576, "inputCostPerToken": null, "outputCostPerToken": null }
      ],
      "fields": {
        "base": [
          { "name": "api_key", "type": "string", "required": false, "secret": true }
        ],
        "extra": [
          { "name": "use_psc_endpoint_format", "type": "unknown", "required": false, "secret": false }
        ]
      }
    }
  }
}
```

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

---

### Requirement: npm script to regenerate
A `generate:catalog` npm script SHALL be added to `package.json` that runs `npx tsx scripts/generate-catalog.ts`.

#### Scenario: Regeneration command
- **WHEN** the user runs `npm run generate:catalog`
- **THEN** `public/catalog.json` is regenerated from the current submodule state
