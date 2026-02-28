## ADDED Requirements

### Requirement: Serialize guardrails array to YAML

`configToYaml` SHALL accept an optional `guardrails: GuardrailEntry[]` parameter. When `guardrails` is a non-empty array, the output YAML SHALL include a top-level `guardrails:` key containing the serialized entries. When `guardrails` is empty or omitted, the `guardrails:` key SHALL be absent from the output.

#### Scenario: Empty guardrails array omits key

- **WHEN** `configToYaml` is called with an empty `guardrails` array
- **THEN** the output YAML SHALL NOT contain a `guardrails:` key

#### Scenario: Non-empty guardrails array is serialized

- **WHEN** `configToYaml` is called with one or more `GuardrailEntry` values
- **THEN** the output YAML SHALL contain a `guardrails:` key with one entry per `GuardrailEntry`

---

### Requirement: Guardrail entry serialization — common fields

Each `GuardrailEntry` SHALL serialize to a YAML object with:

- `guardrail_name` as the top-level key
- `litellm_params` containing at minimum: `guardrail` (provider type) and `mode` (always as a YAML sequence)
- `api_key` serialized using the same `os.environ/<VAR>` convention as model params when in env-var mode, or as a literal string otherwise — omitted when not set
- `api_base` serialized as a string — omitted when not set
- `default_on: true` — omitted when false

#### Scenario: mode always serializes as array

- **WHEN** a guardrail has `mode: ["pre_call"]` (single value)
- **THEN** the YAML SHALL contain `mode: [pre_call]`, not `mode: pre_call`

#### Scenario: api_key with env-var reference

- **WHEN** `api_key` is set to `{ mode: 'env', varName: 'MY_API_KEY' }`
- **THEN** the YAML SHALL contain `api_key: os.environ/MY_API_KEY`

#### Scenario: default_on false is omitted

- **WHEN** `default_on` is false
- **THEN** the `default_on` field SHALL be absent from the serialized YAML

---

### Requirement: Guardrail entry serialization — provider-specific fields

Provider-specific fields stored on the `GuardrailEntry` SHALL be serialized under `litellm_params`. Provider-specific field presence is conditional on the selected `guardrail` provider type.

#### Scenario: Presidio entity config serialization

- **WHEN** a presidio guardrail has `pii_entities_config: { CREDIT_CARD: 'MASK', EMAIL_ADDRESS: 'BLOCK' }`
- **THEN** the YAML SHALL contain a `pii_entities_config` map under `litellm_params` with the same keys and values

#### Scenario: Bedrock guardrail identifier serialization

- **WHEN** a bedrock guardrail has `guardrailIdentifier: "abc123"` and `guardrailVersion: "DRAFT"`
- **THEN** the YAML SHALL contain `guardrailIdentifier: abc123` and `guardrailVersion: DRAFT` under `litellm_params`

#### Scenario: Generic API additional params serialization

- **WHEN** a `generic_guardrail_api` guardrail has `additional_provider_specific_params: { threshold: 0.8, lang: 'en' }`
- **THEN** the YAML SHALL contain an `additional_provider_specific_params` map under `litellm_params` with those entries

---

### Requirement: Roundtrip of unknown fields via `_extra`

Any fields stored in a `GuardrailEntry`'s `_extra` record SHALL be emitted into `litellm_params` in the serialized YAML, after the typed fields. This ensures unknown fields parsed from an imported YAML are preserved on re-export.

#### Scenario: \_extra fields appear in YAML output

- **WHEN** a `GuardrailEntry` has `_extra: { custom_param: true, region: 'us-east-1' }`
- **THEN** the serialized YAML SHALL include `custom_param: true` and `region: us-east-1` under `litellm_params`

---

### Requirement: Serialize guardrail_info

When a `GuardrailEntry` has a non-empty `guardrail_info.params` array, the serialized YAML SHALL include a top-level `guardrail_info` key (sibling of `litellm_params`) containing the `params` array.

#### Scenario: guardrail_info omitted when empty

- **WHEN** `guardrail_info` is undefined or has an empty `params` array
- **THEN** the `guardrail_info` key SHALL be absent from the serialized entry

#### Scenario: guardrail_info serialized with params

- **WHEN** `guardrail_info.params` has entries
- **THEN** the serialized YAML SHALL include `guardrail_info.params` as a list of objects with `name`, `type`, and optional `description`
