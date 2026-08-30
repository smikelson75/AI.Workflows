# Ubiquitous Language

- `Developer` - repository standard owner who decides a Finding's disposition; avoid: user, reviewer.
- `Engineer Slice` - scoped implementation work completed by Engineer and submitted to Review Gate; avoid: change, task.
- `Review Gate` - blocking post-Engineer workflow that evaluates an Engineer Slice before it completes; avoid: code review, check.
- `Review Subagent` - agent that evaluates the Engineer Slice against active Rules and creates Findings; avoid: reviewer.
- `Rule` - a durable, user-adopted repository policy for reviewing code; avoid: guideline, preference, check.
- `Rule Catalog` - JavaScript loader that validates and exposes Rule metadata; avoid: registry, index.
- `Rule Metadata` - compact YAML frontmatter used to select potentially relevant Rules without loading their full bodies; avoid: header, summary.
- `Finding` - an evidence-backed potential Rule violation that blocks an Engineer Slice until decided; avoid: issue, warning.
- `Fix Once` - disposition that returns one Finding to Engineer for a focused revision without adopting a Rule.
- `Adopt Rule and Fix` - disposition that creates or activates a durable Rule and returns the Finding to Engineer for a focused revision.
- `Dismiss` - disposition that accepts one Finding and records its rationale without creating an exception or suppressing future matches.
- `Construction Path` - code path that creates an object, including constructors and static factories; avoid: creation flow.
- `Simple Constructor` - ordinary object creation path that should expose a public constructor rather than an unnecessary static factory.
- `Static Factory` - named object-creation method appropriate when it deliberately selects values or represents a named state.
- `Complex Constructor` - constructor with five or more required parameters, or ambiguous combinations such as multiple same-typed values, booleans, or numerous optional values.
