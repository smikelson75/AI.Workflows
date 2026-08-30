# Context

## Problem
- Generated code can introduce indirect or fragile construction patterns.
- Developers need evidence-based decisions before an Engineer slice completes, without loading every rule's detail into each review.

## Users
- `Developer` - owns repository standards and decides whether a finding is fixed once, adopted as a rule, or dismissed.

## Workflow
- Engineer completes a slice.
- Review Gate loads compact metadata for active Rules, reviews the slice diff and directly affected construction paths, and loads full Rules only for plausible matches.
- An unresolved Finding blocks slice completion until the Developer dismisses it or Engineer completes the required revision and re-review.

## Ubiquitous Language
- See `UBIQUITOUS-LANGUAGE.md` for the canonical glossary.
- `Review Gate` - blocking post-Engineer review and decision workflow.
- `Rule` - user-adopted, repository-wide review policy stored independently.
- `Finding` - evidence-backed potential Rule violation requiring a Developer decision.
- `Rule Catalog` - JavaScript metadata loader for independently stored Rules.

## Scope Guardrails
- in: user decisions to fix once, adopt a Rule and fix, or dismiss; lazy Rule loading; construction-pattern candidates.
- out: automatic fixes, automatic Rule promotion, whole-repository debt scans, and dismissal-based suppression.
- adopted Rules apply repository-wide by default; dismissals apply only to the specific Finding.

## Success
- v1 succeeds when no Engineer slice completes with an unresolved Finding, and each adopted Rule is user-decided, independently readable, and loaded in full only when relevant.
