# AGENTS.md Format

Purpose: a concise project-wide operating guide for coding agents. It applies to the repository root and, when placed elsewhere, to that subtree.

## Include Only When Verified

- code style and formatting conventions
- architecture boundaries and dependency direction
- build, test, lint, and validation commands
- repository-specific conventions and workflows
- security, data-handling, or documentation requirements
- links to detailed authoritative documents

## Exclude

- product discovery, users, workflow, scope, or glossary content owned by `CONTEXT.md`
- target-state requirements owned by the PRD
- current-state summaries, readiness, phase status, or implementation progress owned by the plan
- task lists, active slices, and one-off instructions
- speculative future architecture
- generic advice and duplicated documentation
- amendment history

## Rules

- Use the root file name `AGENTS.md`; do not create `AGENT.md` alongside it.
- Keep instructions short, concrete, and applicable to most tasks in scope.
- Prefer commands and examples that have been verified in the repository.
- Link to detailed documentation instead of copying it.
- State precedence when multiple tools or conventions could conflict.
- If a rule is enforced by tooling, name the tool and command rather than restating every detail.
- Keep the file current when stable project-wide practice changes.

## Skeleton

```md
# Project Guidelines

## Architecture
- ...

## Code Style
- ...

## Build And Test
- install: `...`
- build: `...`
- test: `...`
- lint or format: `...`

## Conventions
- ...

## Documentation
- ...
```

Omit empty sections. Use the repository's existing heading style when amending a file.

## Quality Bar

A coding agent should be able to answer these questions without guessing:

- Where does new code belong?
- Which boundaries must it respect?
- Which commands verify a change?
- Which project-specific conventions are easy to miss?
- Where is the authoritative detail documented?
