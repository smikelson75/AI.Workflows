---
id: simple-constructor
title: Prefer a Simple Constructor for Ordinary Object Creation
status: active
scope: object construction
triggers:
  - static factory methods
  - ordinary object creation
summary: Use a direct constructor when a static factory adds no meaningful construction decision.
tags:
  - construction
  - static-factory
---

# Prefer a Simple Constructor for Ordinary Object Creation

## Decision criteria

Prefer a direct constructor when callers create an ordinary instance and a static
factory would only forward the same values to that constructor. The construction
path should make the created type and its required values immediately clear.

## Rationale

An unnecessary Static Factory adds another name and navigation point without
expressing a construction decision. A Simple Constructor keeps ordinary object
creation direct and reduces API surface.

## Exceptions

A Static Factory is appropriate when it deliberately selects different values or
models a named state. Named-state factories such as `Result.Success(data)`,
`NotFound()`, and `Failure(error)` communicate meaning that a bare constructor
does not.

## Examples

```text
new User(id, name)
Result.Success(data)
NotFound()
Failure(error)
```

## Review guidance

When a Static Factory is found, determine whether it performs a meaningful
selection, establishes a named state, or simply forwards ordinary construction
values. Raise a Finding only for the forwarding case; leave its disposition to
the Developer.
