## Requirements

### Requirement: Build produces a static output directory

The system SHALL produce a self-contained `out/` directory when `next build` is executed, containing all HTML, CSS, JavaScript, and public assets required to serve the app without a Node.js runtime.

#### Scenario: Running next build emits the out/ directory

- **WHEN** the developer runs `npm run build`
- **THEN** an `out/` directory is created at the project root containing `index.html` and all bundled assets

#### Scenario: Exported output is self-contained

- **WHEN** the `out/` directory is served by any static file server
- **THEN** the app loads and all features (model form, YAML preview, catalog selection, import, download) work without a backend

### Requirement: Export npm script is available

The system SHALL expose an `npm run export` script as a human-readable alias that triggers the static build.

#### Scenario: Running npm run export produces static output

- **WHEN** the developer runs `npm run export`
- **THEN** it executes the same build as `npm run build` and the `out/` directory is created

### Requirement: start script is removed to prevent confusion

The system SHALL NOT expose an `npm run start` script, because `next start` is incompatible with `output: 'export'` mode and would fail at runtime.

#### Scenario: Attempting to run next start after static build fails gracefully

- **WHEN** a developer tries to run `next start` directly (without the npm script)
- **THEN** Next.js exits with an error message indicating that `next start` is not supported with `output: 'export'`

#### Scenario: npm run start is not available

- **WHEN** a developer runs `npm run start`
- **THEN** npm reports that no `start` script is defined
