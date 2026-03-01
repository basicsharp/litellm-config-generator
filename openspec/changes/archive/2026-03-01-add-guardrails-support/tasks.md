## 1. Schema — GuardrailEntry types

- [x] 1.1 Add `GuardrailMode` union type and `GuardrailInfoParam` / `GuardrailInfo` types to `schemas.ts`
- [x] 1.2 Add `GuardrailBase` Zod schema (id, guardrail_name, guardrail, mode array, default_on, api_key EnvVarValue, api_base, guardrail_info, \_extra)
- [x] 1.3 Add provider-specific Zod schemas: `PresidioParamsSchema`, `BedrockParamsSchema`, `AzureTextModerationsParamsSchema`, `LiteLLMContentFilterParamsSchema`, `GenericGuardrailParamsSchema`
- [x] 1.4 Compose `GuardrailEntrySchema` as discriminated union and export `GuardrailEntry` type
- [x] 1.5 Add supporting types for Presidio (`PiiEntitiesConfig`, `PresidioScoreThresholds`), content filter (`ContentFilterCategory`, `ContentFilterPattern`, `BlockedWord`)
- [x] 1.6 Write unit tests for `GuardrailEntrySchema` covering parse of each provider shape and rejection of invalid entries

## 2. YAML Generation — guardrail-yaml-gen

- [x] 2.1 Extend `configToYaml` signature to accept `guardrails?: GuardrailEntry[]`
- [x] 2.2 Implement `serializeGuardrailEntry(entry: GuardrailEntry)` — common fields + provider-specific fields + `_extra` spread
- [x] 2.3 Ensure `mode` always serializes as a YAML sequence
- [x] 2.4 Ensure `api_key` serializes using the `os.environ/` convention (reuse existing `serializeParamValue`)
- [x] 2.5 Ensure `default_on: false` is omitted, `guardrail_info` is omitted when empty
- [x] 2.6 Emit `guardrails:` block after `model_list:` in output; omit key when array is empty
- [x] 2.7 Write unit tests for `configToYaml` with guardrails: empty array, single entry per provider type, `_extra` roundtrip, `guardrail_info` serialization

## 3. YAML Parsing — guardrail-yaml-parse

- [x] 3.1 Extend `yamlToConfig` return type to include `guardrails: GuardrailEntry[]`
- [x] 3.2 Implement `parseGuardrailEntry(raw: unknown, index: number)` — extract common fields, normalize `mode` to array, parse `api_key` env-var format
- [x] 3.3 Implement provider-specific field extraction for: presidio, bedrock, azure/prompt_shield, azure/text_moderations, litellm_content_filter, generic_guardrail_api
- [x] 3.4 Capture unrecognized `litellm_params` fields into `_extra`
- [x] 3.5 Parse `guardrail_info.params` array when present
- [x] 3.6 Wire `parseGuardrailEntry` into `yamlToConfig` — iterate `guardrails` array, push errors for invalid entries, return parsed array
- [x] 3.7 Write unit tests for `yamlToConfig` guardrail parsing: no guardrails key, valid entries per provider, mode normalization, env-var api_key, `_extra` capture, invalid entry error handling, `guardrail_info` parsing

## 4. App State — guardrails reducer

- [x] 4.1 Add `GuardrailsAction` union type (add / update / remove / replace)
- [x] 4.2 Implement `guardrailsReducer` in `page.tsx` (mirrors existing `modelsReducer`)
- [x] 4.3 Add `[guardrails, dispatchGuardrails]` state to `HomePage` via `useReducer`
- [x] 4.4 Extend `yaml` memo in `HomePage` to pass `guardrails` to `configToYaml`
- [x] 4.5 Pass `guardrails` prop to `YamlPreview`

## 5. Layout — Tabs wrapping ModelListPanel

- [x] 5.1 Add shadcn `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` imports to `page.tsx` (verify already present via components.json)
- [x] 5.2 Wrap `ModelListPanel` in `TabsContent value="models"` and add `TabsContent value="guardrails"` placeholder in the desktop layout
- [x] 5.3 Add third `Preview` tab to the mobile layout (`TabsContent value="preview"`) alongside existing Models and Guardrails
- [x] 5.4 Verify toolbar `Card` is visually unchanged after layout change

## 6. GuardrailListPanel component

- [x] 6.1 Create `src/components/guardrail-list-panel.tsx` — renders list of `GuardrailCard` components and an `Add Guardrail` button
- [x] 6.2 Implement expand/collapse state for guardrail cards (mirrors `expandedIds` pattern from `ModelListPanel`)
- [x] 6.3 Wire `onAddGuardrail`, `onSaveGuardrail`, `onDeleteGuardrail` callbacks
- [x] 6.4 Write smoke test for `GuardrailListPanel` render (empty state + one entry)

## 7. GuardrailForm — common fields

- [x] 7.1 Create `src/components/guardrail-form.tsx` with fields: `guardrail_name`, `guardrail` provider dropdown, `mode` multi-select checkboxes, `default_on` checkbox, `api_key` (EnvVarInput), `api_base` text input
- [x] 7.2 Implement provider dropdown with grouped options: Built-in → External Tier 1 (alphabetical) → External Tier 2 (alphabetical) → Custom
- [x] 7.3 Implement `mode` as multi-select checkbox group (pre_call, post_call, during_call, logging_only, pre_mcp_call)
- [x] 7.4 Clear provider-specific fields when `guardrail` selection changes
- [x] 7.5 Write unit tests for common fields: provider dropdown ordering, mode multi-select behavior, api_key env-var toggle, provider-change clears specific fields

## 8. Provider-specific sub-forms

- [x] 8.1 Create `src/components/guardrail-presidio-form.tsx` — language select, filter scope select, output_parse_pii checkbox, PII entities config multi-select with MASK/BLOCK per entity + custom entity text input, score thresholds (ALL + per-entity overrides)
- [x] 8.2 Create `src/components/guardrail-bedrock-form.tsx` — guardrailIdentifier, guardrailVersion, aws_region_name (EnvVarInput), aws_role_name (EnvVarInput), mask_request_content, mask_response_content, disable_exception_on_block checkboxes
- [x] 8.3 Create `src/components/guardrail-azure-form.tsx` — severity_threshold number (0-8), per-category thresholds (Hate, SelfHarm, Sexual, Violence), categories multi-select, blocklistNames tag list, haltOnBlocklistHit checkbox, outputType select (for text_moderations only; prompt_shield renders nothing extra)
- [x] 8.4 Create `src/components/guardrail-content-filter-form.tsx` — categories list (category name select, enabled, action, severity_threshold), patterns list (type select + name/regex + action), blocked_words list (keyword + action)
- [x] 8.5 Create `src/components/guardrail-generic-form.tsx` — unreachable_fallback select + key-value editor for additional_provider_specific_params
- [x] 8.6 Wire sub-forms into `guardrail-form.tsx` via conditional rendering on `guardrail` value
- [x] 8.7 Write unit tests for each sub-form: Presidio entity list + custom entity, Bedrock fields, Azure severity inputs, content filter category/pattern lists, generic KV editor

## 9. GuardrailInfo collapsible section

- [x] 9.1 Create `src/components/guardrail-info-form.tsx` — collapsible section with params list (name, type, description fields) and `Add Param` / remove controls
- [x] 9.2 Section collapsed by default; expand/collapse via click on header
- [x] 9.3 Wire into `guardrail-form.tsx` at the bottom
- [x] 9.4 Write unit tests: collapsed by default, expand reveals param list, add/remove param

## 10. YamlPreview — accept guardrails prop

- [x] 10.1 Extend `YamlPreviewProps` to include `guardrails: GuardrailEntry[]`
- [x] 10.2 Update `useMemo` calls for `latestYamlText` and `highlightedYamlText` to pass `guardrails` to `configToYaml`
- [x] 10.3 Apply `useDeferredValue` to `guardrails` prop alongside existing `models` deferred value
- [x] 10.4 Update existing `YamlPreview` tests to pass `guardrails` prop (empty array for existing test cases)
- [x] 10.5 Add new test: YAML preview includes `guardrails:` block when guardrails are present

## 11. Import dialog — parse and warn on guardrails replace

- [x] 11.1 Update `onImport` callback type in `import-dialog.tsx` to include `importedGuardrails: GuardrailEntry[]`
- [x] 11.2 Use extended `yamlToConfig` return value to surface `guardrails` from parsed YAML
- [x] 11.3 Add `existingGuardrailCount` prop to `ImportDialog` (mirrors existing `existingModelCount`)
- [x] 11.4 Show replace warning when `existingGuardrailCount > 0` and imported YAML contains guardrails
- [x] 11.5 Wire `importedGuardrails` through `onImport` callback into `dispatchGuardrails({ type: 'replace' })` in `page.tsx`
- [x] 11.6 Update import success toast to include guardrail count: e.g. "Imported 2 models, 1 guardrail"
- [x] 11.7 Write unit tests for import dialog: guardrail count in warning message, callback fires with guardrail array, toast message includes guardrail count

## 12. Integration and coverage

- [x] 12.1 Run `npm run lint` and resolve any issues
- [x] 12.2 Run `npm run test:coverage` and verify overall coverage stays at 90%+; add tests for any gaps
- [x] 12.3 Run `npm run build` and verify build succeeds with no type errors
