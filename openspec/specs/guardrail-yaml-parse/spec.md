# guardrail-yaml-parse Specification

## Purpose

Defines parsing requirements for extracting `GuardrailEntry` values from imported YAML via `yamlToConfig`.

## Requirements

### Requirement: Parse guardrails array from YAML

`yamlToConfig` SHALL parse a top-level `guardrails` array from imported YAML when present. The function return type SHALL be extended to include `guardrails: GuardrailEntry[]`. When the `guardrails` key is absent, the returned array SHALL be empty. Errors in individual guardrail entries SHALL be appended to the existing `errors` array without aborting the parse of other entries.

#### Scenario: YAML without guardrails key returns empty array

- **WHEN** `yamlToConfig` is called with YAML containing only `model_list`
- **THEN** the returned `guardrails` SHALL be an empty array

#### Scenario: YAML with guardrails key returns parsed entries

- **WHEN** `yamlToConfig` is called with YAML containing a `guardrails` array
- **THEN** the returned `guardrails` SHALL contain one `GuardrailEntry` per valid entry in the array

#### Scenario: Invalid guardrail entry is skipped with error

- **WHEN** a guardrail entry is missing `guardrail_name` or `litellm_params`
- **THEN** that entry SHALL be skipped and an error message SHALL be appended to the `errors` array

---

### Requirement: Parse common guardrail fields

For each guardrail entry in the YAML array, the parser SHALL extract: `guardrail_name`, `litellm_params.guardrail`, `litellm_params.mode` (normalized to an array regardless of whether the YAML value is a string or array), `litellm_params.default_on`, `litellm_params.api_key` (using the same `os.environ/` detection as model params), and `litellm_params.api_base`.

#### Scenario: mode string normalized to array

- **WHEN** a guardrail entry has `mode: "pre_call"` (string)
- **THEN** the parsed `GuardrailEntry.mode` SHALL be `["pre_call"]`

#### Scenario: mode array preserved as array

- **WHEN** a guardrail entry has `mode: [pre_call, post_call]`
- **THEN** the parsed `GuardrailEntry.mode` SHALL be `["pre_call", "post_call"]`

#### Scenario: api_key env-var reference parsed

- **WHEN** a guardrail entry has `api_key: os.environ/MY_KEY`
- **THEN** the parsed `api_key` SHALL be `{ mode: 'env', varName: 'MY_KEY' }`

---

### Requirement: Parse provider-specific fields

For Tier 1 providers (presidio, bedrock, azure/prompt_shield, azure/text_moderations, litellm_content_filter, generic_guardrail_api), the parser SHALL extract provider-specific fields into typed properties on the `GuardrailEntry`.

#### Scenario: Presidio entity config parsed

- **WHEN** a presidio guardrail entry has `pii_entities_config: { CREDIT_CARD: MASK }`
- **THEN** the parsed `GuardrailEntry` SHALL have `pii_entities_config: { CREDIT_CARD: 'MASK' }`

#### Scenario: Bedrock identifiers parsed

- **WHEN** a bedrock guardrail entry has `guardrailIdentifier: "abc"` and `guardrailVersion: "DRAFT"`
- **THEN** the parsed `GuardrailEntry` SHALL have `guardrailIdentifier: "abc"` and `guardrailVersion: "DRAFT"`

---

### Requirement: Unknown fields stored in `_extra` for roundtrip

Any `litellm_params` field not recognized as a common or provider-specific field SHALL be stored in `_extra: Record<string, unknown>` on the parsed `GuardrailEntry`. These fields SHALL not be displayed in the UI but SHALL be re-emitted verbatim during serialization.

#### Scenario: Unknown litellm_params fields captured in \_extra

- **WHEN** a guardrail entry has `litellm_params` containing an unrecognized field (e.g., `on_flagged: "block"`)
- **THEN** the parsed `GuardrailEntry._extra` SHALL contain `{ on_flagged: "block" }`

#### Scenario: \_extra is empty for fully-known providers

- **WHEN** a presidio guardrail entry has only recognized fields
- **THEN** the parsed `GuardrailEntry._extra` SHALL be an empty object

---

### Requirement: Parse guardrail_info

When a guardrail entry has a `guardrail_info` key (sibling of `litellm_params`), the parser SHALL extract it into `GuardrailEntry.guardrail_info`. The `params` array within SHALL be parsed as a list of `{ name, type, description? }` objects.

#### Scenario: guardrail_info params parsed

- **WHEN** a guardrail entry has `guardrail_info.params` with entries
- **THEN** the parsed `GuardrailEntry.guardrail_info.params` SHALL contain matching objects

#### Scenario: Missing guardrail_info is undefined

- **WHEN** a guardrail entry has no `guardrail_info` key
- **THEN** `GuardrailEntry.guardrail_info` SHALL be undefined
