# Slice 02 - Repository root resolution and fail-closed error contract

- **User-visible outcome:** A caller passing a `repo_path` either receives a resolved, validated `Repository Root` or a fail-closed error carrying a stable machine-readable identifier that names exactly why the path was rejected.
- **Backend/data slice:** Implement a single error type carrying a stable identifier, a human-readable message, and structured details, plus one registry module declaring every identifier the package can emit. Implement repository root resolution that takes an explicit `repo_path`, rejects absent, empty, non-existent, and non-directory paths, rejects a path that is not inside a Git repository, resolves to the repository top level, and normalizes separators across Windows and POSIX. Resolution must invoke Git through direct executable invocation with an argument array, never a shell string, and must never consult `process.cwd()`.
- **UI/workflow slice:** None.
- **Files/modules in scope:** `packages/verification-mcp-server/src/errors/**`, `src/models/**`, `src/artifacts/repo-root.ts`, `test/errors/**`, `test/artifacts/repo-root.test.ts`, `test/helpers/**`. Do not add MCP transport, tools, or policy logic.
- **Verification command:**
  - static: `npm --prefix packages/verification-mcp-server run verify`
  - unit: `npm --prefix packages/verification-mcp-server test`
- **Acceptance checks:**
  - Resolving a temporary Git repository returns its absolute top-level path with normalized separators.
  - Resolving a nested subdirectory of that repository returns the same top-level path.
  - An absent or empty `repo_path` fails with its own stable identifier and does not spawn a process.
  - A non-existent path, a path that is a file rather than a directory, and a directory outside any Git repository each fail with their own distinct stable identifiers.
  - Every failure carries structured details naming the offending path.
  - Every identifier reachable from this module is declared in the registry, and a test asserts the registry contains no unused or duplicate identifiers.
  - No source file in scope references `process.cwd()` or passes a command as a shell string.
- **Useful-if-stopped statement:** The package gains the explicit-`repo_path` contract and the stable error vocabulary that every later tool, gate, and command-line entry point depends on.
