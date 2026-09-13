# Ubiquitous Language

Canonical domain terminology and banned synonyms for the `git-mcp-server` product.

## Canonical Terms

### `Git MCP Server`
- **Meaning**: Standalone Model Context Protocol server exposing typed Git tools via JSON-RPC over standard input/output (stdio).
- **Avoid synonyms**: `git wrapper`, `git runner`, `git service`, `cli agent`.

### `Repository`
- **Meaning**: A directory containing a `.git` database and associated working tree files.
- **Avoid synonyms**: `folder`, `project folder`, `repo folder`, `workspace directory`.

### `Tool`
- **Meaning**: An MCP specification-compliant function definition with a name, description, JSON schema input definition, and typed output schema.
- **Avoid synonyms**: `action`, `command`, `endpoint`, `rpc method`.

### `Working Tree`
- **Meaning**: The set of checked-out files on disk currently available for editing.
- **Avoid synonyms**: `local files`, `disk files`, `workspace files`.

### `Index`
- **Meaning**: The Git staging area recording changes queued for the next commit.
- **Avoid synonyms**: `staging cache`, `staged list`, `stage area`.

### `Commit`
- **Meaning**: A cryptographically hashed, immutable Git snapshot containing metadata, message subject, message body, and tree reference.
- **Avoid synonyms**: `revision entry`, `save point`, `history item`.

### `Diff Patch`
- **Meaning**: Structured textual or statistical representation of line-level or file-level differences between references, the index, or the working tree.
- **Avoid synonyms**: `change data`, `delta info`, `diff text`.

### `Reference`
- **Meaning**: A Git ref pointer such as a branch (`refs/heads/*`), tag (`refs/tags/*`), remote tracking branch, or `HEAD`.
- **Avoid synonyms**: `branch pointer`, `target pointer`, `rev`.

### `Stash Entry`
- **Meaning**: A recorded temporary state of dirty working tree modifications and staged index entries.
- **Avoid synonyms**: `stash item`, `temporary save`, `shelf`.

### `Status Code`
- **Meaning**: Two-character porcelain status code (`XY`) representing index and working tree state for a file (e.g. `M `, ` M`, `??`, `A `).
- **Avoid synonyms**: `file state string`, `flag`, `status mark`.

## Banned Generic Synonyms
- `item` -> use specific domain entity (`Commit`, `Stash Entry`, `File Status`).
- `thing` / `data` -> use specific data structure (`Diff Patch`, `Status Code`, `Tool Input`).
- `process` / `service` -> use `Tool` or `Git MCP Server`.
- `runner` / `helper` -> use `Git Executor` or `Git Command Handler`.
