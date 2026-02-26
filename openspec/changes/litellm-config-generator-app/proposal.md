## Why

LiteLLM's proxy configuration (config.yaml) has no first-party tooling for authoring — users must manually write YAML by reading scattered provider-specific docs, with no validation, no field hints, and no awareness of the `os.environ/` pattern. This creates friction and misconfiguration risk. A focused web app closes this gap for the most common use case: building the `model_list`.

## What Changes

- **New**: Next.js 15 + shadcn-ui (nova style, emerald theme) web application at the project root
- **New**: ESLint + Prettier configured for TypeScript/React with enforced formatting on commit (lint-staged + husky)
- **New**: Vitest + React Testing Library test suite targeting ≥90% coverage on JS/TS; pytest + pytest-cov for the Python catalog script
- **New**: Python script (`scripts/generate-catalog.py`) that reads `litellm/model_prices_and_context_window.json` from the submodule and emits `public/catalog.json` — the model/provider catalog used by the UI
- **New**: `model_list` form editor — per-provider dynamic forms with credential fields, rate limit fields, and a live YAML preview
- **New**: Import flow — paste an existing `config.yaml` to populate the editor and continue editing
- **New**: Export flow — copy to clipboard or download as `config.yaml`

## Capabilities

### New Capabilities

- `catalog-generation`: Python script reads litellm submodule's `model_prices_and_context_window.json`, groups models by provider, and outputs `public/catalog.json` with model lists, modes, and context window sizes per provider
- `model-list-editor`: Core editing UI — add/remove/reorder model entries, select provider, fill dynamic credential fields, set rate limits, see real-time YAML output
- `env-var-input`: Smart input component supporting both literal values and `os.environ/VAR_NAME` references via a mode toggle
- `yaml-preview`: Live, read-only YAML preview panel that reflects the full `model_list` config as users edit
- `yaml-import`: Import dialog that parses a pasted `config.yaml` snippet and populates the editor state
- `yaml-export`: Copy-to-clipboard and download-as-file for the generated `config.yaml`
- `code-quality`: ESLint + Prettier enforcing consistent style; Vitest (JS/TS, ≥90% coverage) + pytest (Python, ≥90% coverage) test suites

### Modified Capabilities

## Impact

- **New dependencies**: `next`, `react`, `typescript`, `tailwindcss`, `@shadcn/ui`, `js-yaml` (npm); `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `eslint`, `prettier`, `husky`, `lint-staged` (dev); Python 3.x + `pytest`, `pytest-cov` for catalog script
- **Submodule read**: `scripts/generate-catalog.py` reads `litellm/model_prices_and_context_window.json` — must be re-run when submodule is updated to refresh the catalog
- **No backend required**: App is fully client-side (static export compatible); no server-side Python runtime at runtime
- **Output artifact**: `public/catalog.json` — committed to the repo, regenerated via `python scripts/generate-catalog.py`
- **Coverage gates**: `vitest --coverage` enforced at ≥90% (lines, branches, functions); `pytest --cov` enforced at ≥90% for `scripts/`
