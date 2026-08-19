# Extending The System

Add to this repository when a workflow gap is repeatable and deserves a named contract. Keep the extension narrow and make its ownership explicit.

## Adding A Skill

1. Create `.github/skills/<skill-name>/SKILL.md` with YAML frontmatter containing `name`, `description`, and `argument-hint`.
2. State when the skill is used, its read order, workflow, boundaries, durable outputs, and exit conditions.
3. Add references under the skill directory for formats or domain protocols.
4. Define which existing skill or agent owns adjacent decisions; do not duplicate an existing artifact owner.
5. Add the skill to [the skills catalog](skills.md) and the README map if it changes the normal workflow.

An audit or maintenance skill should remain on-demand. Do not add it to the normal product workflow unless its checks are cheaper than the context and execution cost they introduce.

## Adding An Agent

1. Create `.github/agents/<agent-name>.agent.md` with `description`, `name`, tools, and any allowed child agents.
2. Define the role's boundaries, inputs, output contract, and verification expectations.
3. Specify which files it may edit. A routing agent should not implement product code.
4. Add the agent to [the agents catalog](agents.md) and document its handoff in [the workflow](workflow.md).

## Revising A Contract

Before changing a skill or agent:

- check all links to its files;
- identify the artifact owner and downstream consumers;
- preserve explicit stop and escalation rules;
- update examples and catalogs in the same change;
- run a Markdown link and whitespace check.

Changes to artifact paths, statuses, or handoff payloads are workflow changes, not cosmetic documentation changes. Describe the compatibility impact clearly and update every contract that depends on the old shape.

## Documentation Quality Bar

Documentation should let a user answer:

- Which skill or agent do I invoke first?
- What must be true before it runs?
- What does it write or edit?
- Who owns the next decision?
- What verification proves the handoff succeeded?

When the answer is unknown, document the unknown rather than inferring a repository convention.