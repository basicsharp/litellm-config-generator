## Why

LiteLLM configs support a `guardrails` section alongside `model_list`, but the generator only handles models — users who need guardrails (PII masking, prompt injection, content filtering) must hand-edit YAML after export. Adding first-class guardrail support makes the tool complete for teams deploying LiteLLM proxy in production.

## What Changes

- Add a `Guardrails` tab (shadcn line-variant) to the left panel alongside the existing `Models` tab
- Add a `GuardrailListPanel` component for adding, editing, and removing guardrail entries
- Add `GuardrailEntry` Zod schema covering common fields and provider-specific fields for all supported providers
- Extend `configToYaml` to serialize the `guardrails` key in the output YAML
- Extend `yamlToConfig` to parse the `guardrails` key from imported YAML (roundtrip-safe: unknown fields preserved via `_extra`)
- Update the import dialog to warn when imported YAML contains guardrails that would replace existing ones
- Update the YAML preview to render `model_list` + `guardrails` together
- Support 30+ guardrail providers organized in three tiers: built-in (no credentials), external (standard + rich config), and custom/generic

## Capabilities

### New Capabilities

- `guardrail-config`: Define, edit, and remove guardrail entries with full provider-aware field sets. Covers all supported providers (built-in, external, generic), mode multi-select, `default_on`, `api_key` with env-var support, and `guardrail_info` metadata.
- `guardrail-yaml-gen`: Serialize the `guardrails` array into valid LiteLLM config YAML alongside `model_list`. Mode always serializes as an array. Unknown fields roundtrip losslessly.
- `guardrail-yaml-parse`: Parse the `guardrails` array from imported YAML into typed `GuardrailEntry` state. Unknown provider-specific fields are preserved in `_extra` for roundtrip fidelity.

### Modified Capabilities

- `debounced-yaml-preview`: YAML preview must now accept and render guardrails state in addition to model state.

## Impact

- **`src/lib/schemas.ts`** — new `GuardrailEntry`, `GuardrailMode`, `GuardrailInfo`, and provider-specific param types
- **`src/lib/yaml-gen.ts`** — `configToYaml` signature extended to accept `guardrails: GuardrailEntry[]`
- **`src/lib/yaml-parse.ts`** — `yamlToConfig` return extended to include `guardrails: GuardrailEntry[]`
- **`src/app/page.tsx`** — new `guardrails` reducer + state; left panel wrapped in shadcn `Tabs`
- **`src/components/`** — new components: `GuardrailListPanel`, `GuardrailCard`, `GuardrailForm`, provider-specific sub-forms (`PresidioForm`, `BedrockForm`, `LiteLLMContentFilterForm`, `GenericGuardrailForm`)
- **`src/components/yaml-preview.tsx`** — accept `guardrails` prop and pass to `configToYaml`
- **`src/components/import-dialog.tsx`** — parse and surface guardrails from imported YAML; warn on replace
- No new external dependencies required (shadcn Tabs already present, Zod already in use)
