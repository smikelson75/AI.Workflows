# Test Design Standards (generic)

## Test Structure And Hygiene
- Arrange/Act/Assert structure.
- One behavior intent per test.
- Assert observable outcomes and contracts, not internal implementation or private methods.
- Deterministic execution: control seams for time, random values, network, subprocesses, and filesystem fixtures.
- Clean up test fixtures and temporary state deterministically after every run.

## Behavior Matrix
For each changed behavior, consider the applicable outcome partitions:

| Partition | Question To Consider |
| --- | --- |
| Success | What valid request and expected result define normal behavior? |
| Invalid input | What malformed, missing, or unsupported input is rejected? |
| Precondition | What required system or domain state may be absent? |
| Boundary | What minimum, maximum, empty, traversal, or wildcard condition matters? |
| Dependency failure | What happens when the filesystem, process, network, or external tool fails? |
| State preservation | What state (files, index, database) must remain unchanged after rejection or failure? |
| Diagnostic contract | Which specific error code, category, or actionable message must callers observe? |

This matrix is a consideration checklist, not a mandate to produce redundant tests for every row. Implement tests for materially distinct observable contracts and record any omitted material risks.

## Requirement Outcomes Versus Implementation Branches
- **Requirement-derived outcomes:** Externally observable contracts defined by the PRD or acceptance scenarios (valid calls, safety rejections, domain errors, caller-visible error codes).
- **Implementation-informed branches:** Discovered while coding (parser paths, exception variants, timeout mechanisms, edge-case internal branching). Test these with focused unit tests.
- When an implementation discovery reveals an unspecified caller-facing contract or changes an existing promise, surface the gap to `prd-writer` and `qa-design` rather than deciding caller contracts unilaterally.
