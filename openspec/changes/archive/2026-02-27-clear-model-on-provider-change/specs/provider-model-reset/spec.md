## ADDED Requirements

### Requirement: Provider change invalidates selected model

The system SHALL clear the `model` field when a user changes the `provider` field in the model form.

#### Scenario: Provider changes after model was selected

- **WHEN** a user has selected a model and then selects a different provider
- **THEN** the form clears the selected model value

#### Scenario: Provider-specific parameters are reset with model

- **WHEN** a user changes provider
- **THEN** the form clears provider-specific `litellm_params` values and keeps shared fields intact

### Requirement: Model selector reflects new provider state after reset

After provider change, the model selector SHALL remain bound to the newly selected provider and SHALL not display the previous provider's selected model as active.

#### Scenario: Model selector uses new provider options

- **WHEN** the provider is changed
- **THEN** model options shown in the model selector come from the new provider and the current model selection is empty

### Requirement: Provider-change behavior is regression tested

The system SHALL include automated tests verifying provider-change dependent reset behavior.

#### Scenario: Test coverage for provider-dependent model reset

- **WHEN** provider-change interaction tests run
- **THEN** tests assert that changing provider updates provider state and clears the dependent model field
