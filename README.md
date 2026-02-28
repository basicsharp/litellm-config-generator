# LiteLLM Config Generator

A Next.js app for building LiteLLM `model_list` YAML configs from a form UI instead of editing YAML by hand.

It supports:

- creating configs from scratch
- importing existing YAML
- editing provider/model/credential fields
- live YAML preview with copy
- downloading `config.yaml`
- regenerating provider/model catalog data from the `litellm` submodule

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

## Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint checks
- `npm run test` - run Vitest
- `npm run test:coverage` - run Vitest with coverage report
- `npm run generate:catalog` - regenerate versioned catalogs under `public/catalogs/`

## Project Map

- `src/app/page.tsx` - main app layout and reducer-driven state wiring
- `src/components/` - UI features (toolbar, forms, cards, import, preview)
- `src/lib/schemas.ts` - Zod schemas and inferred types
- `src/lib/yaml-gen.ts` - state -> YAML serialization
- `src/lib/yaml-parse.ts` - YAML -> state parsing
- `src/lib/catalog.ts` - typed accessors for runtime-loaded catalog data
- `scripts/generate-catalog.ts` - catalog generation script (repo root, not in `src/`)

## Troubleshooting

- **`generate:catalog` fails with missing files**
  - Ensure submodule exists and is initialized at `litellm/`
- **`model_list was not found` during import**
  - Confirm the pasted YAML contains a top-level `model_list` array
- **Port 3000 already in use**
  - Run with another port: `PORT=3001 npm run dev`
