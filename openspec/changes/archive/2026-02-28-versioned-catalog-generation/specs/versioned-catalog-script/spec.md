## ADDED Requirements

### Requirement: Script accepts an optional ref argument

The `generate:catalog` script SHALL accept an optional `--ref <value>` CLI argument where `<value>` may be any valid git ref (tag, branch name, or commit SHA).

When `--ref` is omitted, the script SHALL use the current `litellm/` submodule HEAD as the source and resolve its commit SHA as the version identifier.

#### Scenario: Run with explicit tag ref

- **WHEN** the script is invoked as `npm run generate:catalog -- --ref v1.81.13`
- **THEN** the script checks out litellm at tag `v1.81.13`, generates the catalog, and exits with code 0

#### Scenario: Run with branch ref

- **WHEN** the script is invoked as `npm run generate:catalog -- --ref main`
- **THEN** the script checks out litellm at the `main` branch tip, generates the catalog, and exits with code 0

#### Scenario: Run with commit SHA ref

- **WHEN** the script is invoked as `npm run generate:catalog -- --ref 7e4e4545c5`
- **THEN** the script checks out litellm at that commit, generates the catalog, and exits with code 0

#### Scenario: Run without ref argument

- **WHEN** the script is invoked as `npm run generate:catalog` (no `--ref`)
- **THEN** the script reads from the current submodule HEAD without creating a worktree, generates the catalog, and exits with code 0

#### Scenario: Invalid ref provided

- **WHEN** the script is invoked with `--ref <ref>` and that ref cannot be resolved locally or fetched from origin
- **THEN** the script prints a descriptive error message and exits with code 1

### Requirement: Isolated checkout via git worktree

When a `--ref` argument is provided, the script SHALL use `git worktree add` to create a temporary isolated checkout at a path under the OS temp directory, leaving the current `litellm/` submodule working tree unmodified.

The worktree SHALL be removed in a `finally` block regardless of success or failure.

#### Scenario: Worktree created and removed on success

- **WHEN** the script runs with `--ref` and catalog generation succeeds
- **THEN** the worktree at `/tmp/litellm-worktree-<folderName>` is removed before the script exits

#### Scenario: Worktree cleaned up on failure

- **WHEN** catalog generation throws an error after the worktree is created
- **THEN** the worktree is still removed before the script exits with code 1

#### Scenario: Remote-only ref requires fetch

- **WHEN** the ref does not exist in the local submodule repository
- **THEN** the script fetches it from `origin` before creating the worktree

### Requirement: Versioned catalog output path

The script SHALL write the generated catalog to `public/catalogs/<folderName>/catalog.json` where `<folderName>` is a filesystem-safe transformation of the ref string.

Folder name sanitization rules:

- Replace `/` with `__`
- Replace any character outside `[a-zA-Z0-9._-]` with `_`

#### Scenario: Tag ref produces readable folder name

- **WHEN** `--ref v1.81.13` is used
- **THEN** the catalog is written to `public/catalogs/v1.81.13/catalog.json`

#### Scenario: Branch ref with slash is sanitized

- **WHEN** `--ref feature/my-branch` is used
- **THEN** the catalog is written to `public/catalogs/feature__my-branch/catalog.json`

#### Scenario: No-ref run uses commit SHA as folder name

- **WHEN** the script runs without `--ref` and the submodule HEAD resolves to commit `7e4e4545c5`
- **THEN** the catalog is written to `public/catalogs/7e4e4545c5/catalog.json`

### Requirement: Catalog JSON includes version metadata

The generated `catalog.json` SHALL include `litellmRef` (the original ref string) and `litellmCommit` (the resolved 7-character short SHA) in its `meta` object in addition to the existing `generatedAt` and `litellmSubmodulePath` fields.

#### Scenario: Catalog meta contains ref and commit

- **WHEN** a catalog is generated with `--ref v1.81.13`
- **THEN** `catalog.json` contains `"litellmRef": "v1.81.13"` and `"litellmCommit": "<7-char sha>"`

### Requirement: Version manifest is created and kept up to date

The script SHALL create or update `public/catalogs/index.json` after each successful catalog generation.

The manifest SHALL contain:

- `versions`: array of version entries in insertion order (oldest first), each with `ref`, `folderName`, `commit`, and `generatedAt`
- `latest`: the `folderName` of the most recently generated catalog (last entry in `versions`)

If an entry with the same `folderName` already exists, the script SHALL update it in place and move it to the end of the array, updating `latest` accordingly.

#### Scenario: First catalog creates index.json

- **WHEN** no `public/catalogs/index.json` exists and the script runs successfully
- **THEN** `index.json` is created with one entry and `latest` set to that entry's `folderName`

#### Scenario: Second catalog appends to index.json

- **WHEN** `index.json` exists with one entry and a new ref is generated
- **THEN** the new entry is appended and `latest` is updated to the new `folderName`

#### Scenario: Regenerating an existing ref updates the entry

- **WHEN** the script runs with a ref that is already listed in `index.json`
- **THEN** the existing entry is updated (not duplicated) and moved to the end, and `latest` reflects it
