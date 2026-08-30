---
id: complex-constructor
title: Prefer a Builder or Value Object for Complex Constructors
status: active
scope: object construction
triggers:
  - five or more required parameters
  - multiple same-typed values
  - boolean flags
  - numerous optional values
summary: Keep construction calls understandable when constructor parameters become complex or ambiguous.
tags:
  - construction
  - constructor
---

# Prefer a Builder or Value Object for Complex Constructors

## Decision criteria

Treat a constructor as complex when it has five or more required parameters. Also
review constructors with ambiguous combinations, including multiple same-typed
values, boolean flags, or numerous optional values, even when they have fewer
than five required parameters.

## Rationale

Long or ambiguous parameter lists make call sites difficult to read and easy to
misorder. They also conceal which values belong together in the construction
model.

## Exceptions

Keep a constructor when its parameters remain small, distinct, and readily
understood at the call site. Do not infer an exception merely because a complex
constructor already exists.

## Examples

```text
new ConnectionOptions(host, port, user, password, timeout)
new SearchRequest(query, page, pageSize, includeArchived, sortOrder)
```

Use a Builder when callers need to choose or stage many values. Use a Value
Object when several values form one coherent concept.

## Review guidance

Identify the required parameter count and any ambiguous combinations. Recommend
a builder or value object as appropriate, then leave the Finding disposition to
the Developer.
