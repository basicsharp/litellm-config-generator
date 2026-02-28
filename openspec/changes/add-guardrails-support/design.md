## Context

The generator currently manages a single top-level YAML key: `model_list`. The LiteLLM config format has a parallel top-level key `guardrails` that the tool does not yet handle. The existing codebase has clean layered separation: Zod schemas → yaml-gen → yaml-parse → React state (reducer) → UI components. Guardrails follow the same pattern and slot in at every layer.

The `guardrails` array has a heterogeneous structure: all entries share a common envelope (`guardrail_name`, `litellm_params.guardrail`, `litellm_params.mode`, etc.) but provider-specific fields vary significantly per provider. Three providers need rich bespoke UIs (presidio, bedrock, litellm_content_filter); most others share a standard form; one is a fully custom escape hatch (generic_guardrail_api).

## Goals / Non-Goals

**Goals:**

- Full CRUD for guardrail entries in the UI (add, edit, remove, reorder)
- Typed Zod schemas for all fields, with provider-specific discriminated shapes for rich-config providers
- `configToYaml` emits a valid `guardrails:` block alongside `model_list:`
- `yamlToConfig` parses `guardrails:` from imported YAML; unknown fields survive roundtrip
- Import dialog warns before replacing existing guardrails (mirrors existing model replace warning)
- YAML preview renders the combined config (model_list + guardrails) in one block
- Provider dropdown covers 30+ providers organized as: Built-in → External (Tier 1 alphabetical, Tier 2 alphabetical) → Custom
- `guardrail_info` metadata exposed as a collapsible section per guardrail card
- `mode` always serializes as YAML array (even single-value)
- `api_key` uses the existing `EnvVarValue` pattern (`os.environ/VAR` vs literal)

**Non-Goals:**

- Tag-based mode objects (Enterprise feature — emit as generic string for now)
- Per-API-key guardrail assignment (runtime concern, not config-file concern)
- Model-level guardrail attachment via UI (users can hand-edit that field)
- Guardrail load balancing config (separate advanced topic)
- Guardrail testing/playground UI
- Generating Presidio Analyzer/Anonymizer deployment config

## Decisions

### D1: Schema — discriminated union for provider-specific params

**Decision:** Use a Zod discriminated union on the `guardrail` field for Tier 1 providers (presidio, bedrock, azure/prompt_shield, azure/text_moderations, litellm_content_filter, generic_guardrail_api). All other providers use a "standard" fallback shape (api_key, api_base only). An `_extra` field on every entry captures unknown litellm_params fields.

**Why:** Strong typing for the complex providers (presidio's `pii_entities_config`, bedrock's `guardrailIdentifier`) prevents silent data loss. The fallback shape + `_extra` ensures Tier 2 providers and future providers roundtrip without schema changes.

**Alternative considered:** A single flat schema with all fields optional. Rejected because it loses the invariant that `guardrailIdentifier` is only meaningful for bedrock, making form logic and serialization messier.

### D2: `_extra` for roundtrip fidelity

**Decision:** During YAML parse, any `litellm_params` field not in the known schema for that provider is stored in `_extra: Record<string, unknown>`. During serialization, typed fields are emitted first, then `_extra` fields are spread in. The `_extra` field is excluded from the UI.

**Why:** Users who import production configs with provider-specific fields we haven't modeled (e.g., advanced Lakera params, custom Bedrock options) should not lose those fields when they re-export. This is the same trust contract the model roundtrip already provides.

**Alternative considered:** Store the entire raw `litellm_params` object and diff against known fields. Equivalent result but more complex to implement.

### D3: UI layout — Tabs inside the left panel

**Decision:** Wrap the existing `ModelListPanel` in a shadcn `Tabs` component (line variant) with tabs `Models` and `Guardrails`. The `YamlPreview` on the right remains outside the tabs and receives both model and guardrail state.

**Why:** The toolbar (title + version picker + Import + Download) is visually and logically independent and should not change. Tabs inside the content area keeps the two-column layout intact and the YAML preview always visible regardless of active tab — which is the core value of the layout.

**Alternative considered:** A separate accordion/section below models (always visible). Rejected because it compresses the model list on screens where both sections have content, and mixes two distinct config concerns in one scrollable column.

### D4: `mode` always serializes as array

**Decision:** Internally, `mode` is always `GuardrailMode[]`. On serialization it always emits as a YAML sequence (`mode: [pre_call]`), never a bare string.

**Why:** LiteLLM accepts both forms but the array form is always valid. Normalizing to one form avoids a conditional in the serializer and makes test expectations simpler. The multi-select UI naturally produces an array.

### D5: Provider form — conditional rendering via provider type

**Decision:** The guardrail form renders provider-specific sub-forms conditionally based on the selected `guardrail` value. Provider-specific sub-forms are separate components (`PresidioForm`, `BedrockForm`, `LiteLLMContentFilterForm`, `GenericGuardrailForm`). All other providers render nothing (standard fields only are sufficient).

**Why:** Isolates provider complexity to dedicated components, making each testable independently. Matches the existing `model-form.tsx` pattern which conditionally renders provider-specific credential fields.

### D6: Presidio entity config — multi-select checkbox group

**Decision:** `pii_entities_config` renders as a scrollable list of known Presidio entity types, each with a checkbox (enabled/disabled) and a MASK/BLOCK action select. Score thresholds are a separate key-value list with an `ALL` field and per-entity overrides.

**Why:** The mapping from entity → action is the primary configuration concern for Presidio users. A checkbox list makes it scannable and avoids free-text errors in entity names.

### D7: `guardrail_info` — collapsible section at bottom of form

**Decision:** Each guardrail card has an optional collapsible `Guardrail Info` section containing a list of `{ name, type, description }` param entries. This section is collapsed by default.

**Why:** `guardrail_info` is metadata surfaced by `/guardrails/list`. It's useful for teams exposing guardrails to end users but not needed for basic operation. Collapsed by default keeps the form scannable.

## Risks / Trade-offs

**[Risk] Presidio entity type list becomes stale** — Presidio supports 50+ entity types and adds new ones. We ship a static list of common types.  
→ Mitigation: Include a "custom entity" text input below the list so users can type arbitrary entity names not in the preset list.

**[Risk] Schema divergence for exotic providers** — A Tier 2 provider with non-standard fields (e.g., Bedrock guardrail load balancing config) will silently fall into `_extra` and be invisible in the UI.  
→ Mitigation: `_extra` roundtrips cleanly, so data is never lost. The generic_guardrail_api form with its KV editor serves as an explicit escape hatch for power users.

**[Risk] Mode array normalization changes existing YAML** — If a user imports YAML with `mode: "pre_call"` (string), the exported YAML will have `mode: [pre_call]` (array). LiteLLM accepts both but it's a diff.  
→ Acceptable: LiteLLM behavior is identical. The normalized form is documented in design.

**[Risk] `guardrail_info` params have no type validation** — The `type` field (float, boolean, string) is free text.  
→ Acceptable for v1: The field is metadata for documentation only, not validated by LiteLLM.

## Migration Plan

No server-side migration. This is a pure client-side addition:

1. New schemas, components, and extended gen/parse functions ship together
2. Existing users with no guardrails in their YAML see no change (guardrails array is omitted from output when empty)
3. Users importing existing YAML with guardrails get a parsed guardrail list in the new Guardrails tab
4. Rollback: revert to previous build — no persistent state (all state is in-memory + YAML file)

## Open Questions

None — all design decisions resolved during exploration phase before this proposal was created.
