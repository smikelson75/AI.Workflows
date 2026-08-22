---
name: conventional-commit
description: "Journal coherent work with commitlint-compatible Conventional Commits."
argument-hint: "Optional: describe your change to override the diff-based suggestion"
---

# Conventional Commit

Invoke as `/conventional-commit` to journal work: prepare each coherent, reviewable commit by default. Read the diff, stage only its files, and create a Conventional Commits 1.0.0 message. Always ask for explicit user approval before executing `git commit`. Ask before staging when scope is unclear, changes are mixed, or the user explicitly requests review first.

## Workflow

1. Inspect `git status --short`, then `git diff` and `git diff --staged`.
2. Keep unrelated changes separate. Stage one coherent slice or group of files; preserve existing staged scope unless it is mixed. Repeat for additional groups.
3. Choose one type from [./references/types.md](./references/types.md) based on primary intent and an optional noun scope.
4. Propose the commit message below and ask for explicit user approval before running `git commit`.
5. Report the commit output and resulting SHA. If hooks reject it, fix the issue and retry.

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

## Message Rules

- Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.
- Type is lowercase; subject is imperative, concise, lowercase, and has no trailing period.
- Header, body, and footer lines are at most 100 characters.
- `feat` adds functionality; `fix` corrects behavior. Use the other types as defined in the reference.
- Breaking changes use `!` before `:` and/or an uppercase `BREAKING CHANGE: <description>` footer.
- Body and footers each follow a blank line. Footers use `Token: value` or `Token #value`.
- Prefer one commit per coherent change; split mixed intent when practical.

## Commit

Run `git commit -m "<subject>"` and add additional `-m` arguments for the body or footer.

```
<type>[(<scope>)][!]: <description>

[optional bulleted body]

[optional footer(s)]
```

Examples:
```
feat(Parser): add support for unary negation operator

fix!: correct token offset calculation for multi-byte characters

BREAKING CHANGE: Token.Position is now a byte offset, not a character index.

chore: add .gitignore for C# and macOS

docs(design): update plan with evaluator design notes
- clarify the evaluator rollout sequence
- capture the parser follow-up needed before phase 2
```
