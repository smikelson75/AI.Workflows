---
name: ts-eslint
description: "Set up root-level TypeScript strictness, ESLint, and Prettier for TypeScript/Node projects using a baseline or per-rule walkthrough."
argument-hint: "Say 'baseline' to accept industry defaults, or 'walkthrough' to choose rules one at a time"
user-invocable: true
disable-model-invocation: false
---

# TypeScript/Node ESLint Adapter

The TypeScript/Node adapter for [`code-style/protocol.md`](../code-style/protocol.md). Load the protocol first; it owns the enforcement rules, repository maturity paths, mixed-stack arbitration, and the `agent-instructions` handoff. This file supplies only what is specific to TypeScript and Node.

Unlike .NET, no compiler runs these checks for you. Three separate tools each own one concern, and a single npm script is what makes them fail together:

| Tool | Owns | Never owns |
| --- | --- | --- |
| `tsc` | Type strictness | Style, lint rules |
| ESLint | Correctness and bug-class rules | Formatting |
| Prettier | Formatting | Anything semantic |

Overlap between the last two is removed by `eslint-config-prettier`, not by judgement.

## Durable Outputs

Written at the repository root:

- `eslint.config.js` — flat config, the only ESLint config in the repository.
- `.prettierrc` and `.prettierignore`.
- `tsconfig.json` — the strictness block only; other settings are the project's own.
- `package.json` — the `verify` script that is the enforcement point, plus `engines`.
- `.editorconfig` — **conditional**, see below.

## Mode

- No `eslint.config.js` and no `.eslintrc*` => new.
- Existing config => amendment: read it, preserve settings the user still wants, report conflicts with the chosen baseline before editing.
- Existing `.eslintrc*` (legacy) => report it as a migration, not an amendment. Legacy and flat config compete silently; the legacy file must be deleted in the same change, not left beside the new one.
- Ask which mode the user wants when both apply; an explicit `baseline` or `walkthrough` answer wins.

## Node Version Targeting

Resolve the target before writing anything, because it decides `target`, `lib`, and the `engines` floor.

1. Check the current release state at <https://nodejs.org/en/about/previous-releases>. This document outlives the release schedule; do not trust the versions written here without checking.
2. Default to the Active LTS line for `target`/`lib`, and the oldest still-supported LTS for the `engines` floor.
3. If the repository already declares `engines.node` or a CI matrix, that wins — report the difference instead of silently raising the floor.

At the time of writing: Node 24 Active LTS, Node 22 Maintenance, Node 20 end-of-life. Baseline uses a `>=22.12.0` floor, the first release where `require(esm)` is unflagged.

## `.editorconfig` Is Conditional

Do not write one by default. Prettier rewrites every file it can parse, so an `.editorconfig` declaring indent for `*.ts` is a second source of truth for a setting Prettier already owns.

Write one only when the repository contains files Prettier has no parser for — `Dockerfile`, `.env*`, `*.sh`, `Makefile`, `.gitattributes`. Then scope it to `end_of_line`, `charset`, `insert_final_newline`, `trim_trailing_whitespace`, and any tab-mandatory glob. It must not declare `indent_size` for a glob Prettier owns.

In a mixed-stack repository the file already exists and belongs to another adapter too. Follow the protocol's mixed-stack arbitration: amend only TypeScript-owned globs, never `[*]`.

## Path A: Baseline

Chosen when the user accepts industry best practices.

1. Confirm four inputs only: Node target (above), package manager, whether the repository is a workspaces monorepo, and enforcement level chosen per the protocol's maturity paths.
2. Write the configs from [references/BASELINE.md](references/BASELINE.md).
3. Wire the `verify` script and `engines` from [references/ENFORCEMENT.md](references/ENFORCEMENT.md).
4. Verify and report.

## Path B: Walkthrough

Chosen when the user wants control. Ask one focused group at a time; number each question (`Q1`, `Q2`, ...) so answers can be revisited. Offer the baseline value as the default for every question so the user can accept it in one word.

Cover in order, stopping as soon as the user says "baseline for the rest":

1. Module system: ESM or CommonJS, `verbatimModuleSyntax`, whether Node's native type stripping is used (which forces `erasableSyntaxOnly`).
2. Type strictness: which flags above `strict` apply — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`.
3. Type-aware linting: `strictTypeChecked` or `recommendedTypeChecked`, and which globs are excluded from the type-checked program.
4. Rule set: which plugins beyond `@eslint/js` and `typescript-eslint` — `eslint-plugin-n` for Node API support, and any optional opinionated set.
5. File scope: which globs get overrides (`src/**`, tests, generated code, config files, build output ignores).
6. Prettier deviations: every deviation from Prettier defaults, one at a time. Default answer is "no deviation".
7. Severities: which rule groups are `off`/`warn`/`error`.
8. Enforcement: the `--max-warnings` value, whether tests are relaxed, and whether the ramp is blocking yet.

Record every deviation from the baseline as a comment in the generated config so a future reader sees the intent.

## Boundary Rules Specific To This Stack

Four config files can each be shadowed by a subpackage, so the forbidden-locally list is longer than a single-file stack's. It is enumerated in [references/ENFORCEMENT.md](references/ENFORCEMENT.md) and must be repeated verbatim in the `agent-instructions` handoff.

Two traps worth naming here:

- **Flat config does not inherit by directory position.** Unlike `.editorconfig` and `Directory.Build.props`, ESLint does not merge a parent config into a child package. The protocol's "inheritance, not opt-in" requirement is satisfied by one root config whose `files` globs reach every package — not by a config per package.
- **`eslint-plugin-prettier` is not the integration to use.** Running Prettier as an ESLint rule makes formatting diffs appear as lint errors, is markedly slower, and couples the two tools. Use `eslint-config-prettier` to disable overlap and run `prettier --check` separately.

## Verification

Run and report all three:

- `npx tsc --noEmit` — proves type strictness holds.
- `npx eslint . --max-warnings=0` — proves lint rules run and nothing is merely warning.
- `npx prettier --check .` — proves the tree is already formatted.

`npm run verify` runs all three in order and is the command every other contract should reference.

If any fails, report the top rule IDs and counts, and ask whether to fix the code or change the standard. Do not silently downgrade a rule, widen an ignore glob, or add a file-level `eslint-disable` to make the command pass.

## Exit Conditions

Done when the configs exist at the root, `verify` is wired into `package.json`, all three verification commands were run, their results were reported, any legacy `.eslintrc*` was removed, and the protocol's `/agent-instructions` handoff text was emitted. Return a short brief: files written, deviations from baseline, verification output, unresolved violations, and the handoff instruction.
