# Integration Gate Rules

Owner: `deterministic-verification`

The gate evaluates changed files and the Engineer A report. Integration is required when a changed file belongs to one of these categories:

| Category | Examples |
| --- | --- |
| `http` | handlers, controllers, routes, HTTP clients |
| `database` | repositories, migrations, query layers, database adapters |
| `filesystem` | file readers, writers, storage adapters |
| `queue` | producers, consumers, pub-sub handlers |
| `external_api` | SDK wrappers and third-party API adapters |
| `serialization` | serializers, protocol models, wire-format mapping |
| `documentation` | Markdown, MDX, reStructuredText, and plain-text documentation |

Documentation-only changes do not require integration verification. They are classified explicitly so they are not confused with an uncertain boundary. Mixed documentation and integration changes still require integration verification for the integration-boundary files.

If classification is uncertain, the gate requires integration. The gate output is authoritative and machine-readable. Suggested targets come from the report and are advisory scope for Pass B.

## Change-Set Authority

The gate derives the change set from Git, including staged, unstaged, and untracked files relative to `HEAD` when no `--diff-base` is supplied. The report's `changedFiles` must match that set, excluding the report file itself. A mismatch blocks completion so an omitted boundary file cannot bypass integration verification.

An uncommitted slice is valid when the report matches the current change set. If multiple slices or unrelated edits are present, commit or isolate the completed/unrelated work, provide a known `--diff-base`, or intentionally reconcile the combined scope in the report before rerunning the gate.
