## 1. Project Bootstrap & Tooling

- [ ] 1.1 Initialize Next.js 15 app at project root with TypeScript, Tailwind CSS, App Router, and `@/*` import alias (`npx create-next-app@latest .`)
- [ ] 1.2 Initialize shadcn-ui with nova style (fall back to new-york if unavailable) and emerald base color (`npx shadcn@latest init`)
- [ ] 1.3 Install shadcn components: button, card, dialog, input, label, select, badge, command, popover, tabs, tooltip, scroll-area, separator, toggle-group, textarea, alert
- [ ] 1.4 Install runtime dependencies: `js-yaml` (YAML parse/serialize), `@types/js-yaml`
- [ ] 1.5 Verify dev server starts clean (`npm run dev`) and shadcn components render correctly
- [ ] 1.6 Install and configure ESLint: use `eslint-config-next` (included by `create-next-app`) + add `eslint-plugin-import` and `eslint-plugin-react-hooks`; set `"extends": ["next/core-web-vitals", "next/typescript"]` in `eslint.config.mjs`
- [ ] 1.7 Install and configure Prettier: `prettier`, `eslint-config-prettier` (disables conflicting ESLint rules); add `.prettierrc` with project conventions (singleQuote, semi, tabWidth: 2, trailingComma: "es5", printWidth: 100)
- [ ] 1.8 Add `.prettierignore` covering `node_modules/`, `.next/`, `out/`, `public/catalog.json`
- [ ] 1.9 Install husky + lint-staged: `npx husky init`; configure `lint-staged` in `package.json` to run `eslint --fix` and `prettier --write` on staged `*.{ts,tsx,js,mjs}` files on pre-commit
- [ ] 1.10 Install Vitest test stack: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`
- [ ] 1.11 Configure Vitest in `vitest.config.ts`: environment `jsdom`, coverage provider `v8`, coverage thresholds `lines: 90, branches: 90, functions: 90, statements: 90`, include `src/**/*.{ts,tsx}`
- [ ] 1.12 Add `test` and `test:coverage` scripts to `package.json`; verify `npm run test:coverage` passes on an empty test file
- [ ] 1.13 Install Python test stack: `pip install pytest pytest-cov`; add `pytest.ini` (or `pyproject.toml` `[tool.pytest.ini_options]`) with `--cov=scripts --cov-fail-under=90`

## 2. Catalog Generation Script

- [ ] 2.1 Create `scripts/generate-catalog.py` that reads `litellm/model_prices_and_context_window.json`
- [ ] 2.2 Implement provider grouping: group model entries by `litellm_provider`, filter to providers that have at least one `mode: "chat"` or `mode: "completion"` model
- [ ] 2.3 Map each model to `{ id, mode, maxTokens, inputCostPerToken, outputCostPerToken }` — omit missing fields rather than null
- [ ] 2.4 Write output to `public/catalog.json` with top-level `meta: { generatedAt, litellmSubmodulePath }` and `providers: { [providerId]: { models: [...] } }`
- [ ] 2.5 Run the script and commit `public/catalog.json` to the repo
- [ ] 2.6 Add `README.md` section documenting how to regenerate the catalog when the submodule is updated

## 3. TypeScript Foundation

- [ ] 3.1 Create `lib/types.ts` with types: `EnvVarValue`, `ModelEntry`, `LiteLLMParams`, `ModelInfo`, `ConfigState`
- [ ] 3.2 Create `lib/credentials.ts` with the static provider credential map for all 10 providers (openai, azure, anthropic, bedrock, vertex_ai, gemini, groq, mistral, ollama, hosted_vllm) — each entry has `label`, `prefix`, `fields[]` with `name`, `required`, `secret`, `label`, `placeholder`, `default`
- [ ] 3.3 Create `lib/catalog.ts` that imports `public/catalog.json` and exports typed accessor functions: `getProviders()`, `getModelsForProvider(providerId)`
- [ ] 3.4 Create `lib/yaml-gen.ts`: `configToYaml(models: ModelEntry[]) → string` — uses js-yaml, omits empty fields, serializes EnvVarValue correctly
- [ ] 3.5 Create `lib/yaml-parse.ts`: `yamlToConfig(yaml: string) → { models: ModelEntry[], errors: string[] }` — detects `os.environ/` pattern, maps to EnvVarValue, handles unknown providers
- [ ] 3.6 Write unit tests (or manual verification) for yaml-gen and yaml-parse round-trip with at least: OpenAI literal key, Azure env-var key, unknown provider passthrough

## 4. EnvVarInput Component

- [ ] 4.1 Create `components/env-var-input.tsx` — renders a mode toggle (Literal | Env Var) and the appropriate input below
- [ ] 4.2 Implement Literal mode: plain text input, password input for `secret: true` fields with show/hide eye toggle
- [ ] 4.3 Implement Env Var mode: prefix label "os.environ/" + plain text input for variable name
- [ ] 4.4 Ensure keyboard accessibility: mode toggle navigable by Tab, toggled by Enter/Space; ARIA labels on both inputs
- [ ] 4.5 Wire to `EnvVarValue` discriminated union — emit `{ mode: 'literal', value }` or `{ mode: 'env', varName }` via `onChange`

## 5. Provider & Model Selectors

- [ ] 5.1 Create `components/provider-select.tsx` — shadcn Select showing all 10 providers with display labels; emits provider id on change
- [ ] 5.2 Create `components/model-select.tsx` — shadcn Command/Combobox populated from `getModelsForProvider()`; includes free-text fallback for custom model strings; shows model mode as secondary text
- [ ] 5.3 Verify that switching providers in ProviderSelect triggers model selector to reset and credential fields to update

## 6. Model Form

- [ ] 6.1 Create `components/model-form.tsx` — renders the full edit form for one `ModelEntry`: alias input, ProviderSelect, ModelSelect, dynamic credential fields, rate limit fields
- [ ] 6.2 Implement dynamic credential fields: read from `credentials.ts` for the selected provider; render each field as `EnvVarInput`; mark required fields with asterisk
- [ ] 6.3 Create `components/rate-limit-fields.tsx` — number inputs for `rpm`, `tpm`, `timeout`, `stream_timeout`, `max_retries`; render as optional, omit from state when empty
- [ ] 6.4 When provider changes, clear provider-specific field values from state while preserving shared fields (model_name, rpm, tpm, timeout)

## 7. Model Card

- [ ] 7.1 Create `components/model-card.tsx` — collapsible card using shadcn Card; collapsed view shows model_name, provider badge, model id; click header to expand/collapse
- [ ] 7.2 Collapsed state renders a colored provider Badge (one consistent color per provider)
- [ ] 7.3 Card header includes a delete button (trash icon) that removes the model from the list after confirmation
- [ ] 7.4 New cards start in expanded state; existing cards start in collapsed state when imported

## 8. Model List Panel

- [ ] 8.1 Create `components/model-list-panel.tsx` — renders the list of ModelCards + an "Add Model" button at the bottom
- [ ] 8.2 "Add Model" appends a new blank ModelEntry (uuid id, empty fields, openai as default provider) and expands the new card
- [ ] 8.3 Wire model-level edits from ModelForm up to the top-level state via callback props
- [ ] 8.4 Show an empty state illustration/message when the model list is empty

## 9. YAML Preview Panel

- [ ] 9.1 Create `components/yaml-preview.tsx` — reads from the shared config state, calls `configToYaml()`, renders the result
- [ ] 9.2 Add syntax highlighting using `shiki` with a dark theme compatible with the emerald UI color scheme
- [ ] 9.3 Add a "Copy" button inside the preview panel that copies YAML to clipboard and shows a brief "Copied!" indicator (shadcn toast or button state change)
- [ ] 9.4 Make the panel sticky on desktop (CSS: `position: sticky; top: 0; height: 100vh; overflow-y: auto`)

## 10. Import Dialog

- [ ] 10.1 Create `components/import-dialog.tsx` — shadcn Dialog with a large textarea and "Import" / "Cancel" buttons
- [ ] 10.2 On "Import" click: call `yamlToConfig()`, show inline errors if parsing fails (do not close dialog), populate editor state on success
- [ ] 10.3 If models already exist, show a shadcn Alert confirmation: "This will replace your current models. Continue?" before replacing state
- [ ] 10.4 After successful import, close the dialog and show a toast: "Imported N models"

## 11. Toolbar & Page Layout

- [ ] 11.1 Create `components/toolbar.tsx` — top bar with app title "LiteLLM Config Generator", "Import YAML" button (opens ImportDialog), "Download" button
- [ ] 11.2 "Download" button creates a Blob from `configToYaml()` and triggers `<a download="config.yaml">` click
- [ ] 11.3 Create `app/page.tsx` with the two-panel layout: left `ModelListPanel` (~60%), right `YamlPreview` (~40%), separated by a Separator; wrap in a single React state/reducer that feeds both panels
- [ ] 11.4 Create `app/layout.tsx` with page title "LiteLLM Config Generator" and standard meta tags
- [ ] 11.5 Implement mobile tab layout (<768px): shadcn Tabs with "Edit" and "Preview" tabs switching between the two panels

## 12. Polish & Validation

- [ ] 12.1 Add field-level validation hints: highlight required empty fields with a red border + helper text when the user has interacted with the field (touched state)
- [ ] 12.2 Verify YAML output round-trip: import the `litellm/cookbook/misc/config.yaml` example, verify all models parse correctly, export, and confirm the output is valid YAML
- [ ] 12.3 Test the `os.environ/` pattern: import the `litellm/proxy_server_config.yaml` example, verify env var fields are detected and shown in Env Var mode
- [ ] 12.4 Verify empty state: fresh page load shows empty model list, YAML preview shows `model_list: []`
- [ ] 12.5 Run `npm run build` and confirm the production build succeeds with no type errors
