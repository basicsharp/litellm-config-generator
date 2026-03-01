# guardrail-config Specification

## Purpose

Defines UI requirements for configuring LiteLLM guardrail entries — tab navigation, add/edit/remove guardrail forms, and provider-specific field sets.

## Requirements

### Requirement: Guardrail tab navigation

The application SHALL render a shadcn `Tabs` component (line variant) in the left panel with two tabs: `Models` and `Guardrails`. The `YamlPreview` panel SHALL remain visible outside the tabs regardless of which tab is active. On mobile, a third tab `Preview` SHALL be added.

#### Scenario: Switching to Guardrails tab

- **WHEN** the user clicks the `Guardrails` tab
- **THEN** the `GuardrailListPanel` SHALL be displayed and the `ModelListPanel` SHALL be hidden

#### Scenario: Switching to Models tab

- **WHEN** the user clicks the `Models` tab
- **THEN** the `ModelListPanel` SHALL be displayed and the `GuardrailListPanel` SHALL be hidden

#### Scenario: YAML preview stays visible on tab switch

- **WHEN** the user switches between `Models` and `Guardrails` tabs
- **THEN** the YAML preview panel on the right SHALL remain visible and continue to reflect current state

#### Scenario: Mobile layout adds Preview tab

- **WHEN** the viewport is below the `md` breakpoint
- **THEN** the tabs SHALL include `Models`, `Guardrails`, and `Preview` — each showing only their respective content

---

### Requirement: Add guardrail entry

The application SHALL allow the user to add a new guardrail entry. A new entry SHALL be initialized with empty `guardrail_name`, provider set to `litellm_content_filter`, mode set to `["pre_call"]`, and `default_on` set to false.

#### Scenario: Add button creates new entry

- **WHEN** the user clicks the `Add Guardrail` button
- **THEN** a new guardrail card SHALL appear in the list in an expanded/editing state

---

### Requirement: Edit guardrail entry

The user SHALL be able to edit all fields of a guardrail entry through a form. The form SHALL expose: `guardrail_name` (text), `guardrail` provider (dropdown), `mode` (multi-select), `default_on` (checkbox), `api_key` (env-var input), `api_base` (text), and provider-specific fields conditionally rendered based on the selected provider.

#### Scenario: Provider dropdown ordering

- **WHEN** the provider dropdown is opened
- **THEN** providers SHALL be grouped and ordered as: Built-in (litellm_content_filter first, then detect_prompt_injection, hide-secrets), External Tier 1 (alphabetical: aim, aporia, azure/prompt_shield, azure/text_moderations, bedrock, guardrails_ai, lakera_v2, model_armor, openai_moderation, presidio), External Tier 2 (alphabetical, all remaining named providers), Custom (generic_guardrail_api)

#### Scenario: Mode multi-select

- **WHEN** the user opens the mode selector
- **THEN** checkboxes for `pre_call`, `post_call`, `during_call`, `logging_only`, and `pre_mcp_call` SHALL be shown, and the user SHALL be able to select one or more

#### Scenario: api_key supports env-var reference

- **WHEN** the user enters `os.environ/MY_KEY` in the API Key field
- **THEN** the field SHALL render using the existing `EnvVarInput` component, allowing toggle between literal value and environment variable reference

#### Scenario: Changing provider resets provider-specific fields

- **WHEN** the user changes the `guardrail` provider selection
- **THEN** any previously set provider-specific fields (e.g., Presidio entity config) SHALL be cleared

---

### Requirement: Provider-specific form — Presidio

When `guardrail` is `presidio`, the form SHALL additionally render: language select (en, es, de), filter scope select (input/output/both), output_parse_pii checkbox, a PII entities config section, and a score thresholds section.

#### Scenario: PII entities config multi-select

- **WHEN** the user views the Presidio form
- **THEN** a list of known Presidio entity types SHALL be shown, each with a checkbox (enabled/disabled) and a MASK/BLOCK action select — plus a free-text input to add custom entity names not in the preset list

#### Scenario: Score thresholds

- **WHEN** the user enables a score threshold
- **THEN** an `ALL` global threshold number input SHALL appear, plus a list of per-entity overrides (entity name + threshold number) with add/remove controls

---

### Requirement: Provider-specific form — Bedrock

When `guardrail` is `bedrock`, the form SHALL additionally render: `guardrailIdentifier` (text, required), `guardrailVersion` (text, required), `aws_region_name` (env-var input), `aws_role_name` (env-var input), `mask_request_content` (checkbox), `mask_response_content` (checkbox), and `disable_exception_on_block` (checkbox).

#### Scenario: Bedrock form renders AWS fields

- **WHEN** the user selects `bedrock` as the provider
- **THEN** the provider-specific section SHALL show Guardrail Identifier, Guardrail Version, AWS Region, and AWS Role inputs instead of api_key/api_base

---

### Requirement: Provider-specific form — Azure

When `guardrail` is `azure/text_moderations`, the form SHALL additionally render: `severity_threshold` (number 0–8), per-category severity thresholds (Hate, SelfHarm, Sexual, Violence as number inputs), `categories` (multi-select), `blocklistNames` (tag list), `haltOnBlocklistHit` (checkbox), and `outputType` select. When `guardrail` is `azure/prompt_shield`, no additional provider-specific fields beyond the standard fields are shown.

#### Scenario: Azure text moderation shows severity controls

- **WHEN** the user selects `azure/text_moderations`
- **THEN** severity threshold inputs per category SHALL be visible

---

### Requirement: Provider-specific form — LiteLLM Content Filter

When `guardrail` is `litellm_content_filter`, the form SHALL additionally render: a `categories` section (list of category entries each with category name select, enabled checkbox, action select, severity_threshold select), a `patterns` section (list of pattern entries each with type select, pattern name or regex text, action select), and a `blocked_words` section (list of keyword + action entries).

#### Scenario: Content filter category list

- **WHEN** the user selects `litellm_content_filter`
- **THEN** a list of known content categories (harmful_self_harm, harmful_violence, harmful_illegal_weapons, bias_gender, bias_sexual_orientation, bias_racial, bias_religious, denied_financial_advice, denied_medical_advice, denied_legal_advice) SHALL be available to enable with action and severity

#### Scenario: Prebuilt and custom patterns

- **WHEN** the user adds a pattern entry
- **THEN** they SHALL be able to select from prebuilt pattern names (us_ssn, email, phone, visa, mastercard, amex, aws_access_key, aws_secret_key, github_token) or enter a custom regex

---

### Requirement: Provider-specific form — Generic Guardrail API

When `guardrail` is `generic_guardrail_api`, the form SHALL additionally render: `unreachable_fallback` select (fail_closed/fail_open) and a key-value editor for `additional_provider_specific_params`.

#### Scenario: Additional params KV editor

- **WHEN** the user selects `generic_guardrail_api`
- **THEN** a key-value pair editor SHALL appear allowing the user to add, edit, and remove arbitrary string parameters that will be serialized under `additional_provider_specific_params`

---

### Requirement: Guardrail info collapsible section

Each guardrail form SHALL include a collapsible `Guardrail Info` section at the bottom. When expanded, it SHALL allow the user to add, edit, and remove `{ name, type, description }` param entries that map to the `guardrail_info.params` field in the YAML output.

#### Scenario: Guardrail info collapsed by default

- **WHEN** a guardrail card is opened for editing
- **THEN** the `Guardrail Info` section SHALL be collapsed

#### Scenario: Guardrail info can be expanded

- **WHEN** the user clicks the `Guardrail Info` section header
- **THEN** the section SHALL expand to show a list of param entries with name, type, and description fields, and an `Add Param` button

---

### Requirement: Remove guardrail entry

The user SHALL be able to delete a guardrail entry from the list.

#### Scenario: Delete button removes entry

- **WHEN** the user clicks the delete button on a guardrail card
- **THEN** the guardrail SHALL be removed from the list and the YAML preview SHALL update immediately
