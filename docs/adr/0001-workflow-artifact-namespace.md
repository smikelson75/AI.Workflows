# 0001. Relocate Workflow-Consumed Artifacts to Root .workflow Namespace

- **Status:** Accepted
- **Date:** 2026-09-19

## Context

Workflow artifacts (`CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, `docs/prd/`, `docs/plans/`, and phase acceptance features) were previously interspersed with human-facing project documentation under `docs/` and repository root. This created ambiguity between documents intended for AI orchestration loops versus human maintainers, cluttered `docs/`, and risked accidental edits by non-owning agents or contributors.

A clear boundary was required to distinguish machine-routed workflow artifacts from public human documentation without breaking tool integrations or editor conventions.

## Decision

1. Relocate all workflow-consumed routing artifacts into a dedicated root `.workflow/` directory (`.workflow/CONTEXT.md`, `.workflow/UBIQUITOUS-LANGUAGE.md`, `.workflow/prd/`, `.workflow/plans/`).
2. Retain Architectural Decision Records (ADRs) under `docs/adr/`. ADRs are historical, append-only records read primarily by humans to understand architectural choices; they are not inputs to autonomous workflow loops.
3. Retain `AGENTS.md` at the repository root. `AGENTS.md` is discovered by convention at repo root by agent harnesses, editors, and IDE extensions; moving it would silently break automatic instructions loading.
4. Update all workflow contracts, catalogs, pre-commit backstops (`check-role-scope.sh`), and onboarding discovery mechanisms to reference `.workflow/`.

## Alternatives Considered

- **Keep all workflow artifacts in `docs/`**: Rejected because `docs/` becomes cluttered with granular phase/slice planning documents and machine-routed context, making human navigation difficult and blurring machine vs human authority.
- **Move all artifacts including `AGENTS.md` into `.workflow/`**: Rejected because agent harnesses specifically look for `AGENTS.md` at repository root. Moving it would silently break agent behavior.
- **Move ADRs into `.workflow/adr/`**: Rejected because ADRs are intended for human engineers reviewing architectural evolution over time, not as loop-routing inputs for automated agents.

## Consequences

- Workflow artifacts have a clean, dedicated namespace (`.workflow/`) isolating machine-routed artifacts from human documentation.
- Any project adopting these skills and workflow conventions inherits `.workflow/` as the published convention.
- Relative links within moved phase and plan structures remain intact at matching directory depth.
- Role-scope checks in pre-commit hooks and onboarding classification check `.workflow/` explicitly.
