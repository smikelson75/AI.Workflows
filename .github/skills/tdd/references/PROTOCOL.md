# TDD Protocol

Core rule: not done until all tests pass.

Red: one failing test, one behavior, minimal setup.
Green: smallest production change to pass; no broad generalization mid-loop.
Refactor: improve readability post-green; keep tests passing.
Repeat: small slices until behavior complete.

Execution: test before code change; focused tests per loop; full test suite before done; never done with failing tests.

Commands: take the focused-run and full-suite commands from the repository, per `STACK-DISCOVERY.md`. This protocol never names a framework.
