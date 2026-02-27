## 1. Provider-change dependent reset implementation

- [x] 1.1 Add or update a `ModelForm` test that asserts changing provider clears the `model` field while updating provider value
- [x] 1.2 Update `handleProviderChange` in `src/components/model-form.tsx` to clear `model` in the same reset operation that updates `provider` and clears `litellm_params`
- [x] 1.3 Ensure provider-switch behavior still preserves shared fields (`model_name`, rate-limit fields) while clearing provider-dependent fields

## 2. Verification and regression safety

- [x] 2.1 Run `model-form` related tests and ensure provider-change scenarios pass with the new reset behavior
- [x] 2.2 Run project verification (`npm run lint`, targeted tests, and any required build/type checks) to confirm no regressions
- [x] 2.3 Manually verify provider-switch UX: model selector is empty after provider change and only new-provider model options are selectable
