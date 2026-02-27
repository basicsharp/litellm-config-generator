## ADDED Requirements

### Requirement: User can copy YAML to clipboard
The toolbar and/or YAML preview panel SHALL include a "Copy" button that copies the current YAML output to the system clipboard.

#### Scenario: Copy succeeds
- **WHEN** the user clicks "Copy"
- **THEN** the full YAML string is written to the clipboard and a success toast/indicator appears briefly

#### Scenario: Copy on empty state
- **WHEN** no models are in the editor and the user clicks "Copy"
- **THEN** `model_list: []\n` is copied (or the button is disabled with a tooltip)

---

### Requirement: User can download YAML as a file
The toolbar SHALL include a "Download" button that triggers a browser file download of the YAML content as `config.yaml`.

#### Scenario: Download triggered
- **WHEN** the user clicks "Download"
- **THEN** the browser prompts to save a file named `config.yaml` containing the YAML output

#### Scenario: File content matches preview
- **WHEN** the user downloads the file
- **THEN** the file content is byte-for-byte identical to what is shown in the YAML preview

---

### Requirement: Exported YAML omits empty fields
The export SHALL not include keys with null, undefined, or empty-string values — only fields the user has explicitly set.

#### Scenario: Empty field omitted
- **WHEN** a model card has rpm left empty
- **THEN** the exported YAML does not contain an `rpm` key for that model

#### Scenario: Zero value preserved
- **WHEN** a user explicitly sets rpm to 0
- **THEN** `rpm: 0` appears in the YAML output
