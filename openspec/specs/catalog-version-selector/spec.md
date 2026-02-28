## ADDED Requirements

### Requirement: Catalog data is loaded dynamically at runtime

The application SHALL load catalog data at runtime via fetch rather than a compile-time static import. On mount, the app SHALL fetch `public/catalogs/index.json` to discover available versions, then fetch the catalog JSON for the latest version.

#### Scenario: App boots with available catalogs

- **WHEN** the application loads and `public/catalogs/index.json` exists with at least one version
- **THEN** the catalog for the `latest` version is fetched and made available to all components

#### Scenario: App boots with no catalogs generated

- **WHEN** `public/catalogs/index.json` does not exist or returns a 404
- **THEN** the UI renders without catalog data; provider and model selects show empty lists; no error is thrown

#### Scenario: Catalog fetch failure is handled gracefully

- **WHEN** fetching a catalog JSON file fails (network error, 404)
- **THEN** catalog data is set to null and components that consume it render with empty lists

### Requirement: CatalogProvider exposes catalog state to all consumers

A `CatalogProvider` React component SHALL wrap the application in `layout.tsx` and expose via context: the loaded catalog data, the list of available versions, the currently selected version folder name, and a setter to change the selected version.

#### Scenario: Context is available to all child components

- **WHEN** any component inside the provider calls a catalog hook
- **THEN** it receives the current catalog state without prop-drilling

#### Scenario: Version selection triggers catalog reload

- **WHEN** the user selects a different version from the version picker
- **THEN** the new version's catalog JSON is fetched and the context updates with the new data

### Requirement: Version selector combobox appears in the Toolbar

The Toolbar SHALL display a searchable combobox listing available catalog versions when at least one version exists in the manifest. Each list item SHALL show the version `ref` string.

The combobox SHALL use the existing Command + Popover pattern established by `model-select.tsx`. The default selection SHALL be the version identified as `latest` in `index.json`.

#### Scenario: Version selector displays available versions

- **WHEN** the Toolbar renders and multiple catalog versions are available
- **THEN** a combobox is shown between the app title and the action buttons, listing all version refs

#### Scenario: Version selector supports search filtering

- **WHEN** the user types in the version combobox input
- **THEN** only version refs containing the typed string (case-insensitive) are shown

#### Scenario: Currently selected version is visually indicated

- **WHEN** the version combobox is open
- **THEN** the currently active version displays a checkmark indicator

#### Scenario: No catalogs — version selector is hidden

- **WHEN** no catalogs have been generated and `index.json` does not exist
- **THEN** no version selector is rendered in the Toolbar

### Requirement: Catalog accessor functions accept explicit catalog data

The pure accessor functions `getProviders`, `getModelsForProvider`, and `getFieldsForProvider` SHALL accept an explicit `CatalogData` argument instead of reading from a module-level static import. Hook wrappers (`useProviders`, `useModelsForProvider`, `useFieldsForProvider`) SHALL read from the CatalogContext and delegate to the pure functions.

#### Scenario: Hook returns empty result when catalog is not yet loaded

- **WHEN** a component calls `useModelsForProvider(providerId)` before the catalog fetch completes
- **THEN** an empty array is returned and no error is thrown

#### Scenario: Hook returns populated result after catalog loads

- **WHEN** the catalog has been successfully fetched and a component calls `useModelsForProvider("openai")`
- **THEN** the array of OpenAI models from the loaded catalog is returned
