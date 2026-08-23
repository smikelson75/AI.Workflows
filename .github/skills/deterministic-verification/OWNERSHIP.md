# Deterministic Verification Ownership

- Owner: deterministic-verification skill package
- Routing owner: Orchestrator
- Implementation/test owner per pass: Engineer
- Slice scope and verification command owner: work-planner

## Canonical Artifact Locations

- Policies: `.github/skills/deterministic-verification/policies/`
- Schemas: `.github/skills/deterministic-verification/schemas/`
- Templates: `.github/skills/deterministic-verification/templates/`
- Scripts: `.github/skills/deterministic-verification/scripts/`
- Hooks: `.github/skills/deterministic-verification/hooks/`

All deterministic verification assets must remain in this skill package so `.github/` can be copied as a self-contained setup.

## Role-Scope Enforcement

`scripts/check-role-scope.sh`, run from the `pre-commit` hook, fails closed if a commit carries an `out/engineer-*-report.json` alongside a changed `CONTEXT.md`, `UBIQUITOUS-LANGUAGE.md`, `docs/prd/**`, `docs/plans/**`, or `AGENTS.md` file. It reports the violating files and which owning skill (`brain-storm`, `prd-writer`, `work-planner`, `agent-instructions`) should be run instead. It is a backstop, not a replacement for the scope boundaries in `.github/agents/engineer.agent.md` and `.github/skills/onboard-project/SKILL.md`: it cannot catch an Engineer dispatch that never produced a report.