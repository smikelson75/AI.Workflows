# 0002. TypeScript MCP Server as the Sole Deterministic Verification Policy Implementation

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

Deterministic verification policy - report validation, integration gating, boundary classification, verification runs - lives in bash scripts under `.github/skills/deterministic-verification/scripts/`, invoked by agents as terminal strings. This forces every call through shell escaping that differs between Windows PowerShell and Git Bash, leaves the argument contract in prose so agents invent flags and malformed JSON, and produces mute pass/fail exits that carry no workflow position. Because the scripts do not capture evidence into a typed contract, agents end up authoring their own evidence and outcome status, which defeats fail-closed verification.

A choice was forced about where the policy lives once a `Verification MCP Server` exists: alongside the scripts, or instead of them.

## Decision

1. Reimplement the deterministic verification policy in TypeScript inside an installed `packages/verification-mcp-server` package, and treat that implementation as the single source of truth.
2. Retire the bash scripts under `.github/skills/deterministic-verification/scripts/`; no script remains as a parallel executable contract.
3. Keep the policy core transport-agnostic and expose it through two thin surfaces - typed MCP tools over stdio, and a command-line surface for Git hooks, continuous integration, and editor tasks - so both produce identical outcomes and stable error identifiers.
4. Deliver the server as an installed package registered per MCP client, accepting an install step rather than self-contained delivery by copying `.github/`.

## Alternatives Considered

- **Keep the bash scripts and add the MCP server as a wrapper over them**: Rejected because two implementations of the same policy diverge, and the server would inherit the shell-escaping and mute-exit problems it exists to remove.
- **Keep the bash scripts as the source of truth for hooks and CI, MCP for agents only**: Rejected for the same duplication reason; hooks and CI must fail closed on exactly the policy agents are held to.
- **Ship the server as self-contained files under `.github/` with no install step**: Rejected because a Node/TypeScript package needs dependency resolution and a build; pretending otherwise reintroduces ad hoc execution and defeats typed contracts.
- **Rewrite the scripts in a portable non-shell scripting language without MCP**: Rejected because it fixes escaping but not the core problems - untyped argument contracts, no schema discovery, and agent-authored evidence.

## Consequences

- Policy exists once; a rule change lands in one typed implementation and is immediately consistent across agents, hooks, CI, and editor tasks.
- Agents discover argument shape from tool schemas instead of prose, and evidence and outcome status become server-captured or server-derived rather than asserted.
- Adopting repositories now require a real install and per-client MCP registration; copying `.github/` is no longer sufficient to onboard.
- Verification behavior gains a Node.js runtime and build dependency it did not previously have.
- Until the TypeScript core reaches parity, the scripts cannot be deleted, so the retirement must be sequenced after parity rather than alongside it.
