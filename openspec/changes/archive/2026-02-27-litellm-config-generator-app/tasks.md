## 1. Project Bootstrap & Tooling

- [x] 1.1 Initialize Next.js 15 app at project root with TypeScript, Tailwind CSS, App Router, and `@/*` import alias (`npx create-next-app@latest .`)
- [x] 1.2 Initialize shadcn-ui with nova style (fall back to new-york if unavailable) and emerald base color (`npx shadcn@latest init`)
- [x] 1.3 Install shadcn components: button, card, dialog, form, input, label, select, badge, command, popover, tabs, tooltip, scroll-area, separator, toggle-group, textarea, alert (`form` is shadcn's React Hook Form wrapper)
- [x] 1.4 Install runtime dependencies: `js-yaml` + `@types/js-yaml` (YAML); `react-hook-form` v7 (form state); `zod` v4 (schema validation); `@hookform/resolvers` (Zod ↔ RHF bridge)
- [x] 1.5 Verify dev server starts clean (`npm run dev`) and shadcn components render correctly
- [x] 1.6 Install and configure ESLint: use `eslint-config-next` (included by `create-next-app`) + add `eslint-plugin-import` and `eslint-plugin-react-hooks`; set `"extends": ["next/core-web-vitals", "next/typescript"]` in `eslint.config.mjs`
- [x] 1.7 Install and configure Prettier: `prettier`, `eslint-config-prettier` (disables conflicting ESLint rules); add `.prettierrc` with project conventions (singleQuote, semi, tabWidth: 2, trailingComma: "es5", printWidth: 100)
- [x] 1.8 Add `.prettierignore` covering `node_modules/`, `.next/`, `out/`, `public/catalog.json`
- [x] 1.9 Install husky + lint-staged: `npx husky init`; configure `lint-staged` in `package.json` to run `eslint --fix` and `prettier --write` on staged `*.{ts,tsx,js,mjs}` files on pre-commit
- [x] 1.10 Install Vitest test stack: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`
- [x] 1.11 Configure Vitest in `vitest.config.ts`: environment `jsdom`, coverage provider `v8`, coverage thresholds `lines: 90, branches: 90, functions: 90, statements: 90`, include `src/**/*.{ts,tsx}`
- [x] 1.12 Add `test` and `test:coverage` scripts to `package.json`; verify `npm run test:coverage` passes on an empty test file

## 2. Catalog Generation Script

- [x] 2.1 Create `scripts/generate-catalog.ts` with a `main()` function; add `generate:catalog` npm script to `package.json` (`npx tsx scripts/generate-catalog.ts`)
- [x] 2.2 Implement Source A (model list): read `litellm/model_prices_and_context_window.json`, group by `litellm_provider`, filter to providers with at least one `chat` or `completion` mode model; map each to `{ id, mode, maxTokens, inputCostPerToken, outputCostPerToken }`
- [x] 2.3 Implement Source A (base fields): regex-parse `litellm/litellm/types/router.py` to extract Pydantic field definitions from `CredentialLiteLLMParams`, `GenericLiteLLMParams`, `LiteLLM_Params`, `CustomPricingLiteLLMParams`; map Python types to string/number/boolean/unknown; mark `secret: true` for fields whose name contains key/secret/token/password/credential
- [x] 2.4 Implement Source B (extra fields): for each of the 10 target providers, regex-scan `litellm/litellm/llms/{provider}/**/*.py` for `optional_params.get` and `litellm_params.get` call patterns to discover provider-specific extra fields; exclude `tests/` paths; deduplicate against base field names
- [x] 2.5 Write output to `public/catalog.json` with shape: `{ meta: { generatedAt, litellmSubmodulePath }, providers: { [id]: { label, models, fields: { base, extra } } } }`
- [x] 2.6 Run `npm run generate:catalog` and commit `public/catalog.json` to the repo
- [x] 2.7 Add `README.md` section documenting how to regenerate the catalog when the submodule is updated

## 3. TypeScript Foundation

- [x] 3.1 Create `lib/schemas.ts` with Zod v4 schemas: `EnvVarValueSchema` (discriminated union `literal | env`), `LiteLLMParamsSchema` (record of EnvVarValue | number | boolean), `ModelEntrySchema` (model_name, provider, model, litellm_params, rpm/tpm/timeout/max_retries); export TypeScript types via `z.infer<>` — no separate types file needed
- [x] 3.2 Create `lib/catalog.ts` that imports `public/catalog.json` and exports typed accessor functions: `getProviders()`, `getModelsForProvider(providerId)`, `getFieldsForProvider(providerId)` — returns `{ base: CatalogField[], extra: CatalogField[] }`; no hand-coded `credentials.ts` needed
- [x] 3.3 Create `lib/form-utils.ts`: `defaultModelEntry(providerId): ModelEntry` factory (blank entry with openai default), `modelEntryResolver` using `zodResolver(ModelEntrySchema)` from `@hookform/resolvers/zod`; export for use in ModelForm
- [x] 3.4 Create `lib/yaml-gen.ts`: `configToYaml(models: ModelEntry[]) → string` — uses js-yaml, omits empty fields, serializes EnvVarValue correctly
- [x] 3.5 Create `lib/yaml-parse.ts`: `yamlToConfig(yaml: string) → { models: ModelEntry[], errors: string[] }` — detects `os.environ/` pattern, maps to EnvVarValue, handles unknown providers
- [x] 3.6 Write unit tests (or manual verification) for yaml-gen and yaml-parse round-trip with at least: OpenAI literal key, Azure env-var key, unknown provider passthrough

## 4. EnvVarInput Component

- [x] 4.1 Create `components/env-var-input.tsx` — renders a mode toggle (Literal | Env Var) and the appropriate input below
- [x] 4.2 Implement Literal mode: plain text input, password input for `secret: true` fields with show/hide eye toggle
- [x] 4.3 Implement Env Var mode: prefix label "os.environ/" + plain text input for variable name
- [x] 4.4 Ensure keyboard accessibility: mode toggle navigable by Tab, toggled by Enter/Space; ARIA labels on both inputs
- [x] 4.5 Wire to `EnvVarValue` discriminated union — emit `{ mode: 'literal', value }` or `{ mode: 'env', varName }` via `onChange`

## 5. Provider & Model Selectors

- [x] 5.1 Create `components/provider-select.tsx` — shadcn Select showing all 10 providers with display labels; emits provider id on change
- [x] 5.2 Create `components/model-select.tsx` — shadcn Command/Combobox populated from `getModelsForProvider()`; includes free-text fallback for custom model strings; shows model mode as secondary text
- [x] 5.3 Verify that switching providers in ProviderSelect triggers model selector to reset and credential fields to update

## 6. Model Form

- [x] 6.1 Create `components/model-form.tsx` using shadcn `<Form>` + RHF `useForm({ resolver: modelEntryResolver, defaultValues })`: wrap all fields in `<FormField>` + `<FormItem>` + `<FormControl>` + `<FormMessage>` for automatic error display; include alias input, ProviderSelect, ModelSelect, dynamic credential fields, rate limit fields
- [x] 6.2 Implement dynamic credential fields: call `getFieldsForProvider(providerId)` from `lib/catalog.ts`; render `fields.base` (excluding model/rpm/tpm/timeout/max_retries which have dedicated inputs) and `fields.extra` as `EnvVarInput`; mark required fields with asterisk; show `fields.extra` in a collapsible "Advanced" section
- [x] 6.3 Create `components/rate-limit-fields.tsx` — number inputs for `rpm`, `tpm`, `timeout`, `stream_timeout`, `max_retries`; render as optional, omit from state when empty
- [x] 6.4 When provider changes, call `form.reset({ ...form.getValues(), provider: newProvider, litellm_params: {} })` to clear provider-specific fields while preserving shared fields (model_name, rpm, tpm, timeout)

## 7. Model Card

- [x] 7.1 Create `components/model-card.tsx` — collapsible card using shadcn Card; collapsed view shows model_name, provider badge, model id; click header to expand/collapse
- [x] 7.2 Collapsed state renders a colored provider Badge (one consistent color per provider)
- [x] 7.3 Card header includes a delete button (trash icon) that removes the model from the list after confirmation
- [x] 7.4 New cards start in expanded state; existing cards start in collapsed state when imported

## 8. Model List Panel

- [x] 8.1 Create `components/model-list-panel.tsx` — renders the list of ModelCards + an "Add Model" button at the bottom
- [x] 8.2 "Add Model" appends a new blank ModelEntry (uuid id, empty fields, openai as default provider) and expands the new card
- [x] 8.3 Wire model-level edits from ModelForm up to the top-level state via callback props
- [x] 8.4 Show an empty state illustration/message when the model list is empty

## 9. YAML Preview Panel

- [x] 9.1 Create `components/yaml-preview.tsx` — reads from the shared config state, calls `configToYaml()`, renders the result
- [x] 9.2 Add syntax highlighting using `shiki` with a dark theme compatible with the emerald UI color scheme
- [x] 9.3 Add a "Copy" button inside the preview panel that copies YAML to clipboard and shows a brief "Copied!" indicator (shadcn toast or button state change)
- [x] 9.4 Make the panel sticky on desktop (CSS: `position: sticky; top: 0; height: 100vh; overflow-y: auto`)

## 10. Import Dialog

- [x] 10.1 Create `components/import-dialog.tsx` — shadcn Dialog with a large textarea and "Import" / "Cancel" buttons
- [x] 10.2 On "Import" click: call `yamlToConfig()`, show inline errors if parsing fails (do not close dialog), populate editor state on success
- [x] 10.3 If models already exist, show a shadcn Alert confirmation: "This will replace your current models. Continue?" before replacing state
- [x] 10.4 After successful import, close the dialog and show a toast: "Imported N models"

## 11. Toolbar & Page Layout

- [x] 11.1 Create `components/toolbar.tsx` — top bar with app title "LiteLLM Config Generator", "Import YAML" button (opens ImportDialog), "Download" button
- [x] 11.2 "Download" button creates a Blob from `configToYaml()` and triggers `<a download="config.yaml">` click
- [x] 11.3 Create `app/page.tsx` with the two-panel layout: left `ModelListPanel` (~60%), right `YamlPreview` (~40%), separated by a Separator; wrap in a single React state/reducer that feeds both panels
- [x] 11.4 Create `app/layout.tsx` with page title "LiteLLM Config Generator" and standard meta tags
- [x] 11.5 Implement mobile tab layout (<768px): shadcn Tabs with "Edit" and "Preview" tabs switching between the two panels

## 12. Polish & Validation

- [x] 12.1 Verify field-level validation UX: required empty fields show red border + FormMessage error text on submit attempt; RHF's touched/dirty tracking drives this automatically — no custom touched state needed
- [x] 12.2 Verify YAML output round-trip: import the `litellm/cookbook/misc/config.yaml` example, verify all models parse correctly, export, and confirm the output is valid YAML
- [x] 12.3 Test the `os.environ/` pattern: import the `litellm/proxy_server_config.yaml` example, verify env var fields are detected and shown in Env Var mode
- [x] 12.4 Verify empty state: fresh page load shows empty model list, YAML preview shows `model_list: []`
- [x] 12.5 Run `npm run build` and confirm the production build succeeds with no type errors
