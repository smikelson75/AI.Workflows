---
name: agent-instructions
description: "Create or update project-wide AGENTS.md instructions from product context, PRD, implementation plans, and repository evidence."
argument-hint: "Optional: describe the project or instruction change"
user-invocable: true
---

# Agent Instructions

Create or update the repository's durable, project-wide instructions for coding agents.

## Purpose

`AGENTS.md` is a compact operating guide for work across the repository. It records stable conventions and constraints that apply to most coding tasks. It is not a product specification, implementation plan, progress report, or decision log.

## Mode

- Missing root `AGENTS.md` => bootstrap mode.
- Existing root `AGENTS.md` => amendment mode: preserve valid guidance, replace stale guidance, and surface conflicts before writing.
- If the user explicitly requests a subdirectory `AGENTS.md`, create or update that file instead and scope its guidance to that subtree.
- Use `AGENTS.md` (plural). Do not create both `AGENT.md` and `AGENTS.md`.
- Do not create both `AGENTS.md` and `.github/copilot-instructions.md`; ask which project-wide instruction primitive should be canonical if both are present.

## Source Order

Read only the sources that exist and are relevant:

1. Existing `AGENTS.md`, if present.
2. `CONTEXT.md` and `UBIQUITOUS-LANGUAGE.md`, if present, for stable domain terminology and boundaries.
3. The PRD, normally `docs/prd/scheduler-prd.md`, for target architecture and hard constraints.
4. The main implementation plan and targeted phase or slice artifacts, normally under `docs/plans/`, only to identify durable repository conventions or required commands.
5. Targeted repository evidence: manifests, project files, formatter/linter configuration, CI workflows, test projects, and representative source files.

Do not survey the entire repository when targeted evidence is sufficient.

## Workflow

1. Determine whether this is bootstrap or amendment mode and confirm the requested scope.
2. Check for a competing project-wide instruction file and resolve that choice before writing.
3. Extract only guidance that is stable, actionable, and applicable to most work in the file's scope.
4. Reconcile contradictions using this precedence: explicit user direction, enforced repository configuration, current architecture evidence, PRD target constraints, then planning assumptions.
5. Draft or update `AGENTS.md` using [references/AGENTS-FORMAT.md](references/AGENTS-FORMAT.md).
6. Validate that the file is at the correct path, contains concise actionable guidance, and does not duplicate or contradict nearby authoritative documentation.
7. Return a brief listing the instruction areas added or changed and any unresolved conflicts.

## Required Boundaries

- If product problem, users, workflow, scope, or vocabulary are unsettled, stop and redirect to `brain-storm`.
- If the target behavior or target architecture is unsettled, stop and redirect to `prd-writer`.
- If the question is about current implementation status, sequencing, phase status, or active slices, leave it to `work-planner` and do not encode it as a standing instruction.
- If a plan discovery changes the target, do not silently update `AGENTS.md`; route the target change through the owning skill first.
- Do not invent commands, conventions, architecture, or tool requirements. Mark genuinely unknown items as unresolved and ask when they affect agent behavior.
- Prefer links to detailed documentation over duplicated prose.
- Preserve unrelated user edits and avoid reformatting unrelated files.

## Content Rules

Include only sections that have verified, project-specific value:

- code style and formatting
- architecture and dependency boundaries
- build, test, lint, and validation commands
- repository conventions that differ from defaults
- required documentation, security, or data-handling practices
- navigation links to authoritative detailed documentation

Exclude:

- product requirements already owned by `CONTEXT.md` or the PRD
- implementation phases, slices, task lists, readiness, or completion status
- temporary workarounds and one-off task instructions
- speculative future architecture
- duplicated README or contribution documentation
- generic advice that an agent already follows by default

## Stability

Update `AGENTS.md` when a project-wide convention, hard constraint, command, architecture boundary, or documentation location changes. Do not update it merely because a task was completed, a phase advanced, or an implementation detail was discovered.

## Exit

Write only when the guidance is sufficiently verified to be useful. If the repository is too new to establish conventions, create a minimal file containing confirmed constraints and links, then state what remains unknown. Never present inferred conventions as settled facts.
