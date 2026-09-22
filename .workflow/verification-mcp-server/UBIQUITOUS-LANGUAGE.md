# Ubiquitous Language

Canonical domain terminology and banned synonyms for the `verification-mcp-server` product.

## Canonical Terms

### `Verification MCP Server`
- **Meaning**: Standalone Model Context Protocol server exposing deterministic verification operations as typed tools via JSON-RPC over standard input/output (stdio).
- **Avoid synonyms**: `verification scripts`, `gate runner`, `check service`, `verification harness`.

### `Slice`
- **Meaning**: The smallest dispatched unit of implementation work, carrying its own file scope, verification command, and acceptance checks.
- **Avoid synonyms**: `task`, `ticket`, `work item`, `chunk`.

### `Phase`
- **Meaning**: An ordered group of slices concluding in a final integration and end-to-end slice, gated by approved acceptance scenarios.
- **Avoid synonyms**: `stage`, `milestone`, `sprint`, `iteration`.

### `Pass`
- **Meaning**: A single Engineer execution over a slice. `Pass A` covers behavior implementation and unit verification; `Pass B` covers integration scope only.
- **Avoid synonyms**: `round`, `attempt`, `run`, `iteration`.

### `Engineer Report`
- **Meaning**: The structured evidence artifact a Pass emits, recording changed files, captured verification evidence, and required justifications.
- **Avoid synonyms**: `result file`, `output json`, `handoff`, `summary`.

### `Integration Gate`
- **Meaning**: The deterministic evaluation that reconciles reported changed files against the Git change set and decides whether `Pass B` is required.
- **Avoid synonyms**: `gate check`, `integration test`, `quality gate`, `barrier`.

### `Review Report`
- **Meaning**: The structured outcome artifact recording gate result, server-derived status, captured verification evidence, and the next action.
- **Avoid synonyms**: `review notes`, `final report`, `verdict`, `sign-off`.

### `Boundary Classification`
- **Meaning**: The categorisation of changed files that determines whether a slice crosses an integration boundary; unknown classification requires integration.
- **Avoid synonyms**: `file analysis`, `change category`, `scope check`.

### `Verification Command`
- **Meaning**: The project-supplied command that a runner executes to produce verification evidence; it is owned by the plan, never invented by the server or the agent.
- **Avoid synonyms**: `test command`, `build step`, `script`.

### `Next Action`
- **Meaning**: The single legal operation available given the current workflow position derived from repository artifacts.
- **Avoid synonyms**: `next step`, `todo`, `suggestion`, `recommendation`.

### `Repository Root`
- **Meaning**: The explicit filesystem path of the repository under verification, supplied per call as `repo_path`.
- **Avoid synonyms**: `workspace`, `project folder`, `working directory`, `cwd`.

## Banned Drift Terms
- `check` - use `Integration Gate`, `Boundary Classification`, or `Verification Command`.
- `validation` unqualified - name the artifact being validated, such as `Engineer Report`.
- `script` - the bash scripts are retired; use `Tool` or the command-line surface by name.
- `report` unqualified - use `Engineer Report` or `Review Report`.
- `data`, `item`, `process`, `service` - a domain term above always exists.
