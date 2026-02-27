## Context

The repo currently has only the litellm submodule pinned at `v1.81.12-stable.1`. There is no web app yet. The submodule contains two complementary sources of field knowledge:

1. **`litellm/model_prices_and_context_window.json`** — 2566 model entries, each with `litellm_provider`, `mode`, cost fields, and context window. Source of truth for *which models exist*.
2. **`litellm/litellm/types/router.py`** — Pydantic class hierarchy (`CredentialLiteLLMParams` → `CustomPricingLiteLLMParams` → `GenericLiteLLMParams` → `LiteLLM_Params`) defining the typed base fields for `litellm_params`. `LiteLLM_Params` uses `ConfigDict(extra="allow")`, meaning any extra field passes through silently.
3. **`litellm/litellm/llms/{provider}/**/*.py`** — Provider implementations that extract provider-specific fields via `optional_params.get('field_name')` patterns. These fields are NOT in any Pydantic model but are fully supported and documented — e.g. Vertex AI's `use_psc_endpoint_format`, Bedrock's `aws_session_token`, Azure's `azure_ad_token`.

The app is a single-page, client-side tool — no user accounts, no persistence, no backend. It generates YAML in the browser from form state and optionally parses imported YAML back into that state.

## Goals / Non-Goals

**Goals:**
- Bootstrap a Next.js 15 + shadcn-ui (nova style, emerald theme) app at the project root
- Generate `public/catalog.json` from the litellm submodule via `scripts/generate-catalog.ts` (run with `tsx`)
- Implement `model_list` editor: add/remove/reorder models, dynamic per-provider forms, rate limits
- Live YAML preview that reflects current editor state
- Import: parse pasted `config.yaml` → populate editor
- Export: copy to clipboard + download as `config.yaml`

**Non-Goals:**
- `litellm_settings`, `router_settings`, `general_settings` editing (future scope)
- Server-side validation using litellm's Python runtime
- User authentication or cloud persistence
- All 100+ providers on day one (top 10 providers cover >95% of real-world use)

## Decisions

### D1: Catalog strategy — build-time TypeScript script + committed JSON

**Decision**: `scripts/generate-catalog.ts` (run via `tsx`) reads the submodule and writes `public/catalog.json`. The JSON is committed to the repo and served as a static asset.

**Rationale**: Pure JSON-to-JSON transformation — no Python needed. `tsx` is already available in the project's Node ecosystem. Same developer experience: run once, commit output, regenerate when submodule updates. Sharing TypeScript types between the script and the app is a free bonus.

**Alternative considered**: Next.js API route at request time → unnecessary latency for static data; Python script → extra runtime with no benefit for a JSON transformation task.

---

### D2: Provider field catalog — auto-generated from submodule source

**Decision**: The catalog generator script extracts provider field definitions from TWO sources in the submodule, eliminating the need for a hand-coded `credentials.ts`:

- **Source A — Pydantic class hierarchy** (`litellm/litellm/types/router.py`): regex-parse `CredentialLiteLLMParams`, `GenericLiteLLMParams`, `LiteLLM_Params` to extract typed base fields with their Python types mapped to TypeScript equivalents.
- **Source B — Provider implementations** (`litellm/litellm/llms/{provider}/**/*.py`): regex-scan for `optional_params.get('field_name')` and `litellm_params.get('field_name')` patterns to discover provider-specific extra fields (e.g. `use_psc_endpoint_format`, `azure_ad_token`, `aws_session_token`).

The merged result is emitted into `public/catalog.json` under each provider's `fields` key, categorised as `base` (typed, Pydantic) and `extra` (untyped, pass-through).

**Rationale**: Hand-coding `credentials.ts` would go stale with every litellm update and miss the full field surface (the `optional_params.get()` scan revealed ~15 undocumented fields per major provider). Auto-generation from the submodule stays accurate and costs nothing to maintain — re-run the script when the submodule updates.

**Alternative considered**: Static `credentials.ts` mapping only common fields → misses provider-specific extras like `use_psc_endpoint_format`, `azure_ad_token`, `aws_session_token`, `thinking` (Anthropic extended thinking).

---

### D3: Top-10 provider scope

**Decision**: Launch with 10 providers: `openai`, `azure`, `anthropic`, `bedrock`, `vertex_ai`, `gemini`, `groq`, `mistral`, `ollama`, `hosted_vllm`.

**Rationale**: These cover the vast majority of real-world litellm deployments. The catalog generator auto-discovers fields for any provider — adding more providers later is a zero-code change (just re-run the script).

---

### D4: State management — React Hook Form + useReducer (list) + Zod schemas

**Decision**: Two-layer state model:
- **Model list layer** — `useReducer` at `app/page.tsx` manages the array of model entries (add, remove, reorder). Each `ModelEntry` in the array holds the *committed* (submitted) values.
- **Per-model form layer** — React Hook Form v7 (`useForm` with `zodResolver`) manages in-flight edits for a single open model card. RHF handles dirty/touched tracking, field-level error display, and `os.environ/` discriminated union inputs natively via `Controller`. On form submit, the reducer receives the validated `ModelEntry` and updates the list.
- **Validation** — Zod v4 schemas in `lib/schemas.ts` define `EnvVarValueSchema`, `LiteLLMParamsSchema`, and `ModelEntrySchema`. TypeScript types are inferred from schemas via `z.infer<>` — no separate type declarations needed.

**Rationale**: RHF eliminates manual touched/dirty/error state (which task 12.1 previously required us to hand-code). Zod v4 provides a single source of truth for both runtime validation and compile-time types. `useReducer` remains for the list because that state is not form state — it's structural (add/remove/reorder).

**Alternative considered**: `useReducer` for everything → requires hand-rolling touched state, error display, and field-level validation that RHF provides for free. Zustand → unnecessary indirection at this scale.
---

### D5: YAML serialization — js-yaml

**Decision**: Use `js-yaml` for both serialization (state → YAML string) and deserialization (pasted YAML → state).

**Rationale**: Battle-tested, handles edge cases (multiline strings, special characters, number-like strings). The alternative (manual string building) is error-prone and hard to maintain.

---

### D6: YAML preview — syntax-highlighted code block

**Decision**: Use `shiki` for syntax highlighting in the YAML preview panel. No Monaco Editor.

**Rationale**: Shiki is a lightweight, server-side highlighter that works naturally with Next.js App Router. Monaco is a full editor (3MB+) — overkill for a read-only preview.

---

### D7: EnvVarInput — discriminated union state

**Decision**: Each credential field stores `{ mode: 'literal', value: string } | { mode: 'env', varName: string }`. Serializes to raw string for literal mode, `os.environ/${varName}` for env mode.

**Rationale**: Makes the intent explicit in the data model. Parsing on import detects the `os.environ/` prefix and sets mode accordingly.

---

### D8: Layout — fixed two-panel split

**Decision**: CSS Grid, ~60/40 split. Model list panel left (scrollable), YAML preview right (sticky). Mobile: tabs (Edit | Preview).

**Rationale**: The two panels are always in use together on desktop. A fixed split (no drag-to-resize) reduces complexity while covering the primary use case.

---

### D9: shadcn components

Components to install: `button`, `card`, `dialog`, `input`, `label`, `select`, `badge`, `command` (for combobox), `popover`, `tabs`, `tooltip`, `scroll-area`, `separator`, `toggle-group`, `textarea`, `alert`.

---

### D10: Schema validation — Zod v4

**Decision**: Use Zod v4 (`zod`) for all runtime schema validation, bridged to React Hook Form via `@hookform/resolvers/zod`.

**Rationale**: Zod v4 (released 2025) reduced core bundle size by 57% and parse speed by 7–14x vs v3. The `@hookform/resolvers/zod` adapter is first-class and used in all shadcn-ui form examples. Defining schemas in `lib/schemas.ts` and exporting `z.infer<typeof Schema>` types eliminates the need for a separate `lib/types.ts` — one definition, both runtime and compile-time safety.

**Alternative considered**: Valibot v1 → smaller baseline bundle but thinner ecosystem integration with shadcn; functional API unfamiliar to most contributors. ArkType v2 → cutting-edge but less battle-tested resolver support.

## Risks / Trade-offs

**[Catalog staleness]** → If the submodule is updated but `generate-catalog.ts` is not re-run, the UI shows stale models and fields.  
**Mitigation**: Document in README. Add a `generate` npm script. Optionally add a CI step to regenerate on submodule update.

**[Regex fragility for field extraction]** → The `optional_params.get('X')` regex scan could miss fields using bracket notation or indirect access, or pick up false positives from test files.  
**Mitigation**: Exclude `tests/` paths from the scan. Cross-check output against known fields during development. The `extra="allow"` safety net means missed fields still work — they just won't appear in the guided form.

**[Nova style availability]** → shadcn "nova" may not be in the stable release at time of implementation.  
**Mitigation**: Fall back to `new-york` style if `nova` is unavailable. Emerald theme is stable.

**[YAML import round-trip fidelity]** → Parsing a handwritten YAML then re-generating it may reorder keys, lose comments, or alter formatting.  
**Mitigation**: Document as known limitation. Import is best-effort for structured fields; comments and custom ordering are not preserved.

**[js-yaml bundle size]** → `js-yaml` adds ~60KB to the client bundle.  
**Mitigation**: Acceptable for a developer tool. If needed, dynamic import to avoid blocking initial load.

**[Model search UX]** → With 200+ models per provider, a flat list is unusable.  
**Mitigation**: Combobox with search/filter. Also allow free-text entry for models not in the catalog.
