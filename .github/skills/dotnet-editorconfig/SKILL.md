---
name: dotnet-editorconfig
description: "Use when a C#/.NET repository needs a root .editorconfig and build-enforced code style, either from an industry baseline or a guided per-rule walkthrough, and needs every new project to inherit and enforce it at compile time."
argument-hint: "Say 'baseline' to accept industry defaults, or 'walkthrough' to choose rules one at a time"
user-invocable: true
disable-model-invocation: false
---

# .NET EditorConfig Adapter

The C#/.NET adapter for [`code-style/protocol.md`](../code-style/protocol.md). Load the protocol first; it owns the enforcement rules, repository maturity paths, and the `agent-instructions` handoff. This file supplies only what is specific to .NET.

Owns two durable outputs in the target repository:

- `.editorconfig` at the repository root (style and analyzer severities).
- `Directory.Build.props` at the repository root (build-time enforcement inherited by every project, including projects created later).

## Mode

- No root `.editorconfig` => new.
- Existing root `.editorconfig` => amendment: read it, preserve settings the user still wants, report conflicts with the chosen baseline before editing.
- Ask which mode the user wants when both apply; an explicit `baseline` or `walkthrough` answer wins.

## Path A: Baseline

Chosen when the user accepts industry best practices.

1. Confirm three inputs only: target framework(s), indent size (default 4 / 2 for markup), and enforcement level, chosen per the protocol's maturity paths.
2. Write `.editorconfig` from [references/BASELINE.md](references/BASELINE.md).
3. Write or amend `Directory.Build.props` from [references/ENFORCEMENT.md](references/ENFORCEMENT.md).
4. Verify and report.

## Path B: Walkthrough

Chosen when the user wants control. Ask one focused group at a time; number each question (`Q1`, `Q2`, ...) so answers can be revisited. Offer the baseline value as the default for every question so the user can accept it in one word.

Cover in order, stopping as soon as the user says "baseline for the rest":

1. Formatting: indent style/size, end of line, final newline, trimming, UTF-8 charset.
2. File scope: which globs get overrides (`*.cs`, `*.csproj`, `*.json`, `tests/**`, generated code).
3. `using` policy: outside/inside namespace, `System.*` sorting, unused-using severity.
4. Language style: `var` usage, expression-bodied members, pattern matching, null-checking, `this.` qualification.
5. Modern C#: file-scoped namespaces, primary constructors, collection expressions, `required`/`init`.
6. Naming: interface `I` prefix, private field convention (`_camelCase`), constants, async suffix.
7. Severities: which of `none`/`suggestion`/`warning`/`error` applies per category (Style, Naming, Design, Performance, Security).
8. Enforcement: warnings as errors, whether test projects are relaxed, whether generated code is excluded.

Record every deviation from the baseline as a comment in the generated `.editorconfig` so a future reader sees the intent.

## .NET Enforcement Specifics

How the protocol's non-negotiables map to MSBuild, per [references/ENFORCEMENT.md](references/ENFORCEMENT.md):

- Root `.editorconfig` starts with `root = true`.
- Root `Directory.Build.props` sets `EnforceCodeStyleInBuild`, `EnableNETAnalyzers`, `AnalysisLevel`, and the agreed warnings-as-errors setting.
- Settings forbidden in an individual `.csproj`, because a project-level value silently overrides the shared one: `EnforceCodeStyleInBuild`, `EnableNETAnalyzers`, `AnalysisLevel`, `AnalysisMode`, `Nullable`, `LangVersion`, `TreatWarningsAsErrors`. Strip them when a project template emits them.
- No nested `.editorconfig` may set `root = true`.
- A nested `Directory.Build.props` must import its parent explicitly, or it stops the upward search.
- If a project sits outside the root directory tree, say so explicitly instead of silently leaving it unenforced.

## Verification

Run and report both:

- `dotnet build -c Release` — proves style violations surface at compile time.
- `dotnet format --verify-no-changes` — proves the existing tree already satisfies the config.

If either fails, report the top violation codes and counts, and ask whether to fix the code or change the standard. Do not silently downgrade a severity to make the build pass.

## Exit Conditions

Done when `.editorconfig` and `Directory.Build.props` exist at the root, both verification commands were run, their results were reported, and the protocol's `/agent-instructions` handoff text was emitted. Return a short brief: files written, deviations from baseline, verification output, unresolved violations, and the handoff instruction.
