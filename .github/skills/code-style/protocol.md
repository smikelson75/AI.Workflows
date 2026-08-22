# Code Style Enforcement Protocol

Stack-agnostic requirements for any code style adapter (`dotnet-editorconfig`, and future Node/Python equivalents). An adapter supplies the tools and file formats; this file supplies the rules that do not change between stacks.

## Outcome

Style is enforced by the repository's standard verification command, not by reviewer discipline. A violation must fail something a developer or agent already runs.

The enforcement point differs by stack:

| Stack | Enforcement point |
| --- | --- |
| .NET | The compiler, via analyzer properties in the build |
| Node/TypeScript | A lint script wired into the verification command, plus a CI gate or pre-commit hook |
| Python | A linter/formatter check in the verification command, plus a CI gate or pre-commit hook |

Only .NET can enforce in the compiler. Everything else needs an explicit gate, and an adapter that omits the gate has not met this protocol.

## Non-Negotiables

1. **Root-level configuration.** One config at the repository root is the source of truth. Mark it as the stopping point for hierarchical resolution where the format supports it (for example `root = true`).
2. **Inheritance, not opt-in.** Subprojects created later must pick up the config by position in the directory tree. Never require a per-subproject registration step.
3. **No local overrides of shared settings.** A subproject must not redeclare a setting the root config owns; a local value silently wins and the shared rule becomes a lie. Adapters must list the specific settings that are forbidden locally.
4. **Measure before blocking.** On a repository with existing code, first configure at non-blocking severity and report the violation count. Only tighten to blocking once the backlog is cleared.
5. **Never lower a severity to pass.** A failing check is resolved by fixing the code or by an explicit, recorded decision to change the standard. Silently downgrading a rule to unblock a build is prohibited.
6. **Config changes are their own commit.** Never mix style configuration with behavior changes; the diff becomes unreviewable.

## Repository Maturity Paths

The adapter's sequencing depends on how much code already exists.

- **No code yet** — the stack is not knowable, so style setup cannot run. It waits until a scaffolding slice has produced a buildable project.
- **Scaffold only** — run immediately, at blocking severity. The backlog is near zero and this is the cheapest moment the repository will ever offer. Strip any settings the project template emitted that the root config now owns.
- **Existing codebase** — run early but non-blocking. Report the violation count and hand it to `work-planner` as remediation work: a mechanical formatting phase, then a judgment-required phase, then a final slice that flips enforcement to blocking. Do not leave the ramp at non-blocking indefinitely; a warning nobody fails on is ignored within a week.

## Formatting Existing Code

Reformatting is a separate, explicitly requested step, never a side effect of configuration. When it happens it is one commit, no behavior change, verified by the existing test suite staying green.

## Handoff To `agent-instructions`

Enforcement catches a bad subproject config only *after* an agent has written it. Agents default to pasting stack-standard settings into every new subproject because that is what the scaffolding tools emit. That rule therefore has to live in `AGENTS.md`, where agents already read it.

The final step of every adapter run is to tell the user to run `/agent-instructions` and to hand them the exact text to pass. Do not make them compose it. The text must:

- name the root config files and state that they are inherited by directory position;
- list the specific settings forbidden in a subproject config;
- give the verification command and the current enforcement severity;
- forbid resolving a violation by lowering a severity.

Adjust the framing to the situation:

- **No `AGENTS.md` yet** — say `/agent-instructions` will bootstrap it, and these rules will be one section among several.
- **`AGENTS.md` exists** — the instruction must contain the word "amend" and name the target section, or unrelated sections may be rewritten. Also check the existing file for style guidance that contradicts the config just written, and name the contradiction so the user resolves it deliberately.
- **A relaxed scope was configured** (for example test directories) — append the exception so the rule does not read as absolute.

## Boundaries For Every Adapter

- Does not write `AGENTS.md`; that file is owned by `agent-instructions`.
- Does not create projects, solutions, or CI pipelines.
- Does not duplicate test conventions owned by the stack's TDD skill.
- Escalates to `adr-writer` only when the enforcement choice is hard to reverse and genuinely contested, such as blocking enforcement across a large legacy codebase.
