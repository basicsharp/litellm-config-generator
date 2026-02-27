## Why

When users change the provider in the model form, the previously selected model value is preserved even when it is invalid for the new provider. This creates stale provider/model combinations that can silently produce incorrect YAML output and confusing UI behavior.

## What Changes

- Clear the `model` field whenever `provider` changes in the model form
- Continue clearing provider-specific `litellm_params` on provider switch
- Preserve shared fields (for example `model_name` and rate limit values) during provider switch
- Add explicit test coverage for provider-change behavior to verify `model` reset and form consistency

## Capabilities

### New Capabilities

- `provider-model-reset`: enforce dependent-field reset behavior so provider changes invalidate and clear the selected model

### Modified Capabilities

- (none)

## Impact

- **`src/components/model-form.tsx`**: update provider change handler to clear the dependent `model` field alongside provider-specific params
- **`src/components/model-form.test.tsx`**: add regression tests asserting model is cleared when provider changes
- **Form behavior**: improves data integrity for generated config by preventing stale provider/model pairs
