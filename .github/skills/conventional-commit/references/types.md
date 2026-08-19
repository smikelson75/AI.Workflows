# Commit Types

Use exactly one lowercase type per commit. These are the Angular/commitlint convention types:

| Type | Use for |
| --- | --- |
| `build` | Build system or external dependency changes |
| `chore` | Routine maintenance and tooling |
| `ci` | CI configuration and scripts |
| `docs` | Documentation only |
| `feat` | A new feature |
| `fix` | A bug fix |
| `perf` | A performance improvement |
| `refactor` | Code changes that add no feature or fix |
| `revert` | Reverting a previous commit; add `Refs: <sha>` |
| `style` | Non-semantic formatting changes |
| `test` | Adding or correcting tests |

## Decision Guide

1. New functionality: `feat`
2. Incorrect behavior: `fix`
3. Tests only: `test`
4. Docs only: `docs`
5. CI: `ci`; build or dependencies: `build`
6. No behavior change: `refactor`; performance: `perf`
7. Revert: `revert`; formatting: `style`; other maintenance: `chore`

## Breaking Changes

Any type can carry a breaking change. Append `!` and/or add a `BREAKING CHANGE:` footer.

```
refactor(Token)!: rename Position to ByteOffset

BREAKING CHANGE: Token.Position has been renamed to Token.ByteOffset.
Update all call sites accordingly.
```
