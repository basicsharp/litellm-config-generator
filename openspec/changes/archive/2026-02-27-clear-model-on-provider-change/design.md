## Context

`ModelForm` currently updates provider and clears `litellm_params` in `handleProviderChange`, but it preserves the existing `model` value. Since `ModelSelect` options are provider-scoped, preserving the previous model can leave an invalid provider/model pair in form state and eventually in exported YAML.

The current form architecture already uses React Hook Form with `form.reset(...)` and `startTransition(...)` for provider switches. This change should fit that pattern to keep behavior predictable and low risk.

## Goals / Non-Goals

**Goals:**

- Ensure changing provider always clears the dependent `model` field
- Preserve unrelated shared fields during provider switches (`model_name`, rate limit fields)
- Keep existing provider-change performance characteristics (`startTransition`)
- Add regression tests that prove model invalidation behavior

**Non-Goals:**

- Redesign `ProviderSelect` or `ModelSelect` UI components
- Add cross-field schema-level validation of model/provider compatibility
- Change YAML import parsing logic for provider inference

## Decisions

1. **Clear model as part of existing provider reset path**
   - Update `form.reset({ ...form.getValues(), provider: newProvider, model: '', litellm_params: {} })` in `handleProviderChange`.
   - **Rationale**: This is the narrowest change with existing behavior parity. It matches RHF dependent-field reset best practice where parent changes invalidate child selections.
   - **Alternative considered**: `resetField('model')` + separate `setValue` calls. Rejected to avoid splitting state updates across multiple operations when current code already centralizes provider reset through one `reset` call.

2. **Preserve shared fields, clear provider-bound fields only**
   - Keep spread of current values so shared fields remain untouched.
   - Explicitly clear `model` and `litellm_params` because both are provider-bound.
   - **Rationale**: Preserves user-entered data that remains semantically valid across providers and avoids unnecessary user friction.

3. **Lock behavior with focused component tests**
   - Extend `model-form.test.tsx` provider-change tests to assert model clearing and ongoing provider/model select consistency.
   - **Rationale**: Captures regression risk in the exact interaction point where bug appears.

## Risks / Trade-offs

- **[Risk] Hidden reliance on previously preserved model after provider switch** → **Mitigation**: Update tests and keep behavior explicit in spec so downstream assumptions are corrected.
- **[Risk] Extra form state churn on provider switch** → **Mitigation**: Continue using `startTransition` wrapper already in place.
- **[Trade-off] No schema-level provider/model compatibility guard** → **Mitigation**: Keep scope focused; this change fixes the primary invalid-state entry point in UI flow.
