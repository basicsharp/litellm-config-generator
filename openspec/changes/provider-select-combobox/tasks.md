## 1. Tests

- [ ] 1.1 Write tests for `ProviderSelect`: opens on click, filters by typing, shows empty state, selects a provider and calls `onChange`, shows checkmark on selected item
- [ ] 1.2 Write tests for `ModelForm`: provider change calls `onChange` with correct id, form fields update after provider switch (non-blocking)

## 2. ProviderSelect component

- [ ] 2.1 Rewrite `src/components/provider-select.tsx` to use `Command + Popover` (mirror `ModelSelect` pattern) with the existing `PROVIDERS` hardcoded array
- [ ] 2.2 Verify trigger button shows selected provider label (or placeholder when unselected) and the checkmark renders on the active item

## 3. Non-blocking provider change

- [ ] 3.1 Add `startTransition` import to `src/components/model-form.tsx`
- [ ] 3.2 Wrap `form.reset()` call inside `handleProviderChange` with `startTransition`

## 4. Verification

- [ ] 4.1 Run `npm run lint` — no new errors
- [ ] 4.2 Run `npm run test` — all tests pass and coverage remains ≥ 90%
- [ ] 4.3 Manually verify in browser: provider dropdown opens with search input, typing filters the list, selecting a provider updates form fields without page freeze
