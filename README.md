# <img src="src/app/icon.png" width="28" /> LiteLLM Config Generator

**Live site**: https://basicsharp.github.io/litellm-config-generator/

A Next.js app for building LiteLLM `model_list` and `guardrails` YAML configs from a form UI instead of editing YAML by hand.

It supports:

- creating configs from scratch
- importing existing YAML
- editing provider/model/credential fields
- live YAML preview with copy
- downloading `config.yaml`
- regenerating provider/model catalog data from the `litellm` submodule
- configuring guardrails (content filtering, PII detection, prompt injection protection, and more)

## Prerequisites

- Node.js 20+
- npm 10+
- `litellm` submodule initialized in this repo (required for catalog regeneration)

## Install

```bash
npm install
```

## Run Scenarios

### Scenario 1: Local development (UI work)

Use this when building features or testing flows in the browser.

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Scenario 2: Create a config from scratch

1. Click **Add Model**.
2. Pick a provider and model.
3. Fill credentials and optional limits.
4. Review live YAML in the preview panel.
5. Click **Download** to save `config.yaml`.

Relevant files: `src/app/page.tsx`, `src/components/model-form.tsx`, `src/components/model-list-panel.tsx`, `src/components/yaml-preview.tsx`.

### Scenario 3: Import and continue editing existing YAML

1. Click **Import YAML**.
2. Paste config content containing `model_list`.
3. Resolve any inline parse errors if shown.
4. Confirm replacement if models already exist.

Relevant files: `src/components/import-dialog.tsx`, `src/lib/yaml-parse.ts`.

### Scenario 4: Copy YAML quickly (without download)

Use the **Copy** button in the preview panel to push current YAML to clipboard.

Relevant files: `src/components/yaml-preview.tsx`, `src/lib/yaml-gen.ts`.

### Scenario 5: Validate quality gates before sharing changes

```bash
npm run lint
npm run test
npm run test:coverage
npm run build
```

Coverage is configured in `vitest.config.ts`.

### Scenario 6: Regenerate catalog after submodule updates

Run this whenever `litellm` source files change.

```bash
npm run generate:catalog
```

Optional: generate a specific litellm ref (tag, branch, or commit):

```bash
npm run generate:catalog -- --ref v1.81.13
```

Reads from:

- `litellm/model_prices_and_context_window.json`
- `litellm/litellm/types/router.py`
- `litellm/litellm/llms/<provider>/**/*.py`

Writes to:

- `public/catalogs/<version>/catalog.json`
- `public/catalogs/index.json`

Note: the generator targets the top providers configured in `scripts/generate-catalog.ts` and only includes providers with chat/completion-capable models in output.

### Scenario 7: Export static site

Use this to build a fully static version of the app for CDN or static hosting.

```bash
npm run export
```

This command generates an `out/` directory containing static HTML/CSS/JS assets.
Serve `out/` with any static file server (for example, `npx serve out`).

### Scenario 8: Add guardrails to a config

1. Click the **Guardrails** tab.
2. Click **Add Guardrail**.
3. Enter a unique `guardrail_name` (referenced later from model entries).
4. Select a provider (e.g. `presidio`, `bedrock`, `azure/text_moderations`).
5. Choose one or more **modes** controlling when the guardrail fires.
6. Fill provider-specific fields (API key, region, thresholds, etc.).
7. Save — the `guardrails:` block appears in the YAML preview.
8. To attach a guardrail to a model, open the model form → **Enterprise** → **guardrails** field → type the `guardrail_name` and press Enter.

Relevant files: `src/components/guardrail-list-panel.tsx`, `src/components/guardrail-form.tsx`, `src/components/guardrail-card.tsx`.

## Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - create production build
- `npm run export` - create static export output in `out/`
- `npm run lint` - run ESLint checks
- `npm run test` - run Vitest
- `npm run test:coverage` - run Vitest with coverage report
- `npm run generate:catalog` - regenerate versioned catalogs under `public/catalogs/`

Note: `next start` is not used for static export mode; serve the generated `out/` directory with a static host/server instead.

## Project Map

- `src/app/page.tsx` - main app layout and reducer-driven state wiring
- `src/components/` - UI features (toolbar, forms, cards, import, preview)
- `src/lib/schemas.ts` - Zod schemas and inferred types
- `src/lib/yaml-gen.ts` - state -> YAML serialization
- `src/lib/yaml-parse.ts` - YAML -> state parsing
- `src/lib/catalog.ts` - typed accessors for runtime-loaded catalog data
- `scripts/generate-catalog.ts` - catalog generation script (repo root, not in `src/`)
- `src/lib/guardrails.ts` - provider lists, mode constants, field-clear helpers
- `src/lib/guardrail-yaml.ts` - guardrail-specific YAML serialization/parsing helpers
- `src/components/guardrail-list-panel.tsx` - guardrail tab panel
- `src/components/guardrail-form.tsx` - add/edit guardrail form
- `src/components/guardrail-card.tsx` - collapsed guardrail card

## Guardrails YAML Reference

The optional top-level `guardrails:` array configures request/response guards that LiteLLM applies before, during, or after LLM calls.

### Top-level structure

```yaml
guardrails:
  - guardrail_name: my-guard # required; unique alias
    litellm_params:
      guardrail: <provider> # required; see Providers below
      mode: # required; one or more values:
        - pre_call #   before the LLM call
        - post_call #   after the LLM call
        - during_call #   during streaming
        - logging_only #   log only, does not block
        - pre_mcp_call #   before MCP tool calls
      default_on: true # optional; apply to all models automatically
      api_key: os.environ/MY_KEY # optional; env var (os.environ/VAR) or literal
      api_base: https://... # optional; guardrail service base URL
    guardrail_info: # optional; documents custom API params
      params:
        - name: threshold
          type: float
          description: Detection threshold
```

### Providers

#### `presidio` — PII detection and masking

```yaml
litellm_params:
  guardrail: presidio
  mode: [pre_call, post_call]
  api_base: http://presidio.example.com
  language: en # en | es | de
  presidio_language: en # en | es | de
  filter_scope: both # input | output | both
  output_parse_pii: false
  pii_entities_config:
    CREDIT_CARD: MASK # MASK | BLOCK per entity type
    EMAIL_ADDRESS: BLOCK
  score_thresholds:
    ALL: 0.5 # confidence threshold per entity
  score_threshold: 0.7 # global confidence threshold
```

#### `bedrock` — AWS Bedrock Guardrails

```yaml
litellm_params:
  guardrail: bedrock
  mode: [pre_call, post_call]
  guardrailIdentifier: abc123
  guardrailVersion: DRAFT
  aws_region_name: os.environ/AWS_REGION
  aws_role_name: os.environ/AWS_ROLE_ARN
  mask_request_content: false
  mask_response_content: false
  disable_exception_on_block: false
```

#### `azure/text_moderations` — Azure Content Safety

```yaml
litellm_params:
  guardrail: azure/text_moderations
  mode: [pre_call, post_call]
  api_key: os.environ/AZURE_CONTENT_SAFETY_KEY
  api_base: https://<resource>.cognitiveservices.azure.com
  severity_threshold: 4 # global severity cutoff (0–7)
  severity_threshold_hate: 2
  severity_threshold_self_harm: 4
  severity_threshold_sexual: 4
  severity_threshold_violence: 4
  categories: [Hate, SelfHarm]
  blocklistNames: [my-blocklist]
  haltOnBlocklistHit: true
  outputType: FourSeverityLevels
```

#### `azure/prompt_shield` — Azure prompt injection detection

```yaml
litellm_params:
  guardrail: azure/prompt_shield
  mode: [pre_call]
  api_key: os.environ/AZURE_CONTENT_SAFETY_KEY
  api_base: https://<resource>.cognitiveservices.azure.com
```

#### `litellm_content_filter` — Built-in content filter

```yaml
litellm_params:
  guardrail: litellm_content_filter
  mode: [pre_call, post_call]
  categories:
    - category: Hate
      enabled: true
      action: block
      severity_threshold: 4
  patterns:
    - type: name
      name: email-pattern
      regex: '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
      action: mask
  blocked_words:
    - keyword: forbidden
      action: block
```

#### `generic_guardrail_api` — Custom guardrail endpoint

```yaml
litellm_params:
  guardrail: generic_guardrail_api
  mode: [pre_call, post_call]
  api_key: os.environ/MY_GUARDRAIL_KEY
  api_base: https://my-guardrail.example.com
  unreachable_fallback: fail_closed # fail_closed | fail_open
  additional_provider_specific_params:
    threshold: '0.8'
```

#### Other providers (standard schema)

The following providers use only the common fields (`api_key`, `api_base`, `mode`, `default_on`):

| Tier 1 (UI-supported)                         | Tier 2 (standard fields only)                         |
| --------------------------------------------- | ----------------------------------------------------- |
| `aim`, `aporia`, `guardrails_ai`, `lakera_v2` | `activefence`, `api7`, `authzed`, `cohere_safety`     |
| `model_armor`, `openai_moderation`            | `llama_guard`, `nemo_guardrails`, `pangea`            |
| `detect_prompt_injection`, `hide-secrets`     | `protectai`, `rebuff`, `safeinput`, `safebase`        |
|                                               | `tavily`, `uptrain`, `vertex_guardrails`, `wiseguard` |

### Attaching guardrails to a model

Reference a guardrail by its `guardrail_name` in the model's `litellm_params.guardrails` list:

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      guardrails:
        - my-presidio-guard
        - bedrock-safety

guardrails:
  - guardrail_name: my-presidio-guard
    litellm_params:
      guardrail: presidio
      mode: [pre_call, post_call]
      api_base: http://presidio.example.com
  - guardrail_name: bedrock-safety
    litellm_params:
      guardrail: bedrock
      mode: [pre_call]
      guardrailIdentifier: abc123
      guardrailVersion: DRAFT
      aws_region_name: os.environ/AWS_REGION
```

Models with `default_on: true` guardrails automatically have those guardrails applied even when not listed explicitly.

## Troubleshooting

- **`generate:catalog` fails with missing files**
  - Ensure submodule exists and is initialized at `litellm/`
- **`model_list was not found` during import**
  - Confirm the pasted YAML contains a top-level `model_list` array
- **Port 3000 already in use**
  - Run with another port: `PORT=3001 npm run dev`
