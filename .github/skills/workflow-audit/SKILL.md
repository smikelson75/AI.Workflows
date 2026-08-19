---
name: workflow-audit
description: "Audit the workflow system for token waste, duplicated authority, contradictory contracts, oversized handoffs, and unnecessary artifact churn."
argument-hint: "Optional: name a workflow area or ask for audit or repair mode"
user-invocable: true
---

# Workflow Audit

Review the workflow system itself for efficiency and contract drift. This is an on-demand maintenance workflow, not a step in every product coding cycle.

## When To Use

Invoke `/workflow-audit` when workflow definitions change, before publishing a significant revision, or when orchestration feels repetitive, contradictory, or expensive. Do not invoke it for ordinary product changes unless the workflow contracts are in scope.

## Modes

- **Audit** (default): read-only review that returns findings and proposed minimal edits. Do not modify files.
- **Repair**: apply only the user-approved corrective edits, then validate the affected contracts. Never repair silently.

## Read Budget

Read the smallest authoritative set needed for the requested area:

1. `README.md` for the public workflow model and design principles.
2. The relevant files under `.github/agents/` and `.github/skills/`.
3. Linked workflow and artifact documentation only when the selected contracts reference it or a contradiction needs resolution.
4. `docs/extending.md` when assessing whether a new primitive or contract is justified.

Do not load product context, PRDs, implementation plans, or product source code unless the user explicitly asks for their interaction with the workflow system. Do not reread unchanged files during one audit.

## Audit Questions

Check for:

- duplicated authority: the same decision or status owned by multiple artifacts;
- contradictory permissions, read orders, escalation rules, or output contracts;
- oversized handoffs that repeat durable context;
- unnecessary rereads or repository-wide scans;
- artifact churn, especially status logs or copied content in multiple files;
- skills, agents, or instructions whose scope overlaps without a clear owner;
- stale links, invalid frontmatter, and catalog entries that do not match source files;
- guidance that is too vague to enforce or too verbose to justify its context cost.

## Findings

Order findings by highest combined operational risk and likely token cost. For each finding, state:

- **Location:** file or contract;
- **Problem:** the specific duplication, contradiction, or waste;
- **Impact:** why it increases tokens, churn, ambiguity, or failure risk;
- **Smallest fix:** the minimum change that resolves it;
- **Confidence:** confirmed or needs verification.

Distinguish actual waste from intentional repetition needed at an ownership boundary. Do not recommend a new skill, agent, or artifact when a concise instruction or existing contract can solve the issue.

## Repair Boundaries

In repair mode:

- preserve artifact ownership and public paths unless the user approves a workflow change;
- edit the smallest number of source contracts;
- update catalogs or links when a source contract changes;
- do not rewrite durable product or planning artifacts;
- do not add a running audit log or audit artifact unless explicitly requested;
- validate Markdown, frontmatter, links, and whitespace after editing.

If a proposed repair changes product truth, target truth, implementation sequencing, or status ownership, stop and route it to `brain-storm`, `prd-writer`, or `work-planner` instead of applying it here.

## Exit

Return a compact report containing:

- scope read;
- findings ordered by token cost and risk;
- smallest recommended changes;
- validation performed;
- whether repair is needed or the system is coherent.

The report is disposable. The workflow files remain the only durable source of truth.
