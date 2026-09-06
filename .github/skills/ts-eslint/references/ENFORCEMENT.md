# Enforcement And New-Package Inheritance

Goal: a violation fails a command a developer or agent already runs, and a package added later is covered with no per-package setup step.

## Why This Stack Needs An Explicit Gate

.NET gets enforcement free because Roslyn runs analyzers inside the compiler. TypeScript has no equivalent: `tsc`, ESLint, and Prettier are three programs with three ASTs and three exit codes. Nothing runs them together unless the repository says so.

That single place is the `verify` script. It is the stack's enforcement point, and every other contract — CI, hooks, slice verification commands — references it rather than restating the three commands.

```json
"verify": "npm run typecheck && eslint . --max-warnings=0 && prettier --check ."
```

`&&` ordering is intentional: type errors make lint output meaningless, so `tsc` runs first and short-circuits.

## How Coverage Reaches New Packages

ESLint flat config does **not** merge a parent config into a child directory. There is no upward search, no inheritance by position. This is the single biggest difference from `.editorconfig` and `Directory.Build.props`.

Coverage therefore comes from reach, not inheritance:

- One `eslint.config.js` at the repository root, whose `files` and `ignores` globs already match paths that do not exist yet.
- `projectService: true`, which resolves the nearest `tsconfig.json` per file without the root config naming each one.
- `verify` run from the root, not per package.

A new package under the root is covered the moment it is created. A new package that adds its own ESLint config removes itself from coverage silently — which is why the list below matters more here than in a single-file stack.

## Forbidden In A Subpackage

Four files can each be shadowed. Each entry silently wins over the root and turns a shared rule into a lie.

| Forbidden | Why |
| --- | --- |
| A nested `eslint.config.*` | Replaces the root config for that package. Not merged with it. |
| Any `.eslintrc*` file | Legacy format. Competes with flat config and is honoured or ignored depending on the ESLint version and flags. Delete on sight. |
| A package-level `.prettierrc` | Prettier resolves the nearest config, so the package formats differently from the rest of the tree. |
| `strict` or a strictness flag weakened in a package `tsconfig.json` | The package may `extends` the root config; it may not turn a flag off. |
| A file-level `/* eslint-disable */` | Disables every rule for the file with no record of which one was in the way. |
| An added path in `ignores` or `.prettierignore` to clear a failure | Silently reduces the enforced surface. Same prohibition as lowering a severity. |

Line-level `eslint-disable-next-line` is permitted, must name the specific rule, and must carry a reason comment on the same line.

## Workspaces Monorepos

Keep exactly one `eslint.config.js`, one `.prettierrc`, and one `verify` script at the workspace root. Per-package copies are the failure mode this whole section exists to prevent.

- Scope rule differences by glob in the root config (`packages/*/src/**`, `packages/*/test/**`), never by a per-package file.
- Give each package a `tsconfig.json` that `extends` a root `tsconfig.base.json` and adds only `rootDir`, `outDir`, and references. `projectService` finds them automatically.
- Run `verify` once at the root. Per-package `verify` scripts produce partial results that read as a full pass.

## Mixed-Stack Repositories

Applies when a `.csproj` or another stack shares the repository root. The arbitration rules are in [`code-style/protocol.md`](../../code-style/protocol.md); the TypeScript-specific consequences:

- If `.editorconfig` already exists, run in amendment mode. Add only TypeScript-owned globs. Never touch `[*]` or another adapter's sections.
- Do not add the frontend lint step to the other stack's build, and do not accept it in reverse. `dotnet build` must not invoke `npm run verify`. Enforcement points stay separate and verification is chosen by the files a change touched.
- In the ASP.NET Core SPA layout the client project is wrapped in an `.esproj`, which inherits the root `Directory.Build.props`. That is the .NET adapter's problem to guard, not this one's — but report it if the guard is missing, because it will surface as build noise in the client project.
- Report violation counts for this stack separately. A merged number cannot be planned against.

## Verification Commands

| Command | Proves |
| --- | --- |
| `npm run verify` | The full gate passes. The only command other contracts should reference. |
| `npx tsc --noEmit` | Type strictness holds; no emit side effects. |
| `npx eslint . --max-warnings=0` | Lint rules run and nothing is merely warning. |
| `npx prettier --check .` | The tree is already formatted; exits non-zero on drift. |
| `npx eslint . --max-warnings=<n>` | Legacy ramp, pinned to the measured backlog. |

## Maturity Ramp

Per the protocol's "measure before blocking":

1. Configure, then run `npx eslint .` and record the count.
2. Pin `verify` to `--max-warnings=<count>` and commit. Nothing new can be added.
3. Hand the backlog to `work-planner`: a mechanical `--fix` and `prettier --write` phase, then a judgment-required phase, then a final slice that sets `--max-warnings=0`.
4. Do not leave the ramp pinned indefinitely. A number nobody lowers is a warning nobody fails on.

## New-Package Checklist

Apply whenever a package is added:

1. The package directory is under the repository root and matched by the root config's globs — no new ESLint or Prettier config.
2. No `.eslintrc*`, no local `.prettierrc`; delete them if a scaffolding tool emitted them.
3. Its `tsconfig.json` extends the root base and weakens no strictness flag.
4. `npm run verify` from the root reports diagnostics for the new package. If deliberately malformed code produces zero findings, coverage is broken.

## Inheritance Smoke Test

To prove coverage reaches new packages, temporarily add a violating line — an unawaited promise in a new file is ideal, since it exercises the type-aware path — and confirm `npm run verify` fails with `@typescript-eslint/no-floating-promises`. Remove it afterwards. A test that only proves formatting is caught does not prove the type-aware program is wired.

## CI Note

CI runs `npm run verify` and nothing else. Do not restate the three commands in CI YAML, and do not add a separate lint job — a second definition drifts from the first, and developers stop being able to reproduce CI locally.
