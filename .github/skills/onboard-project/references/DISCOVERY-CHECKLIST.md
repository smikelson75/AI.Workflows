# Repo Discovery Checklist

Purpose: ground `brain-storm`, `prd-writer`, and `work-planner` in real repo evidence before their normal workflows run. Read-only; produces a disposable findings draft, not a written artifact.

## Read First

- Root `README.md` and any docs folder index.
- Package/project manifests (`package.json`, `*.csproj`, `pyproject.toml`, `go.mod`, etc.) for stack, dependencies, and scripts.
- Top-level folder structure to infer architecture shape (layered, modular, monolith, services).
- CI/build config (`.github/workflows`, `Makefile`, task runners) for build/test/lint commands.
- Existing lint/format config for code style conventions.

## Infer Product Intent

- What problem the code appears to solve, from entry points, primary modules, and README framing.
- Who the primary user/actor appears to be (CLI user, API consumer, end user, internal service).
- Primary workflow: trace the main entry point or top-level use case through the code.
- Apparent v1/current scope: what's implemented vs. stubbed, feature-flagged, or TODO.

## Infer Architecture And Conventions

- Layering and dependency direction (e.g., domain/application/infrastructure boundaries).
- Naming patterns for projects, namespaces, folders, and aggregates.
- Testing approach and frameworks in use.
- Any existing but undocumented conventions worth carrying into `AGENTS.md` later.

## Build A Glossary Candidate

- Domain terms repeated across code, tests, and docs (class names, module names, comments).
- Note apparent synonyms so `brain-storm` can confirm the canonical term.
- Do not invent terms; only surface what evidence supports.

## Flag, Don't Resolve

- Contradictions between README/docs and actual code behavior.
- Dead or unused modules that could mislead the workflow trace.
- Areas where intent cannot be inferred confidently — mark unknown rather than guessing.

## Output

A disposable findings draft covering: candidate problem/users/workflow, current architecture and stack, apparent conventions, glossary candidates, and a short list of contradictions/unknowns to raise during the `brain-storm` interview.
