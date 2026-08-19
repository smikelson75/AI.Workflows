# TDD Protocol

Core rule: not done until all tests pass.

Red: one failing test, one behavior, `Given_When_Then` name, minimal setup.
Green: smallest production change to pass; no broad generalization mid-loop.
Refactor: improve readability post-green; keep tests passing.
Repeat: small slices until behavior complete.

Execution: test before code change; focused tests per loop; full `dotnet test` before done; never done with failing tests.
