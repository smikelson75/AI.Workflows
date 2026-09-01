# TDD Protocol

Core rule: not done until all tests pass.

The loop is four steps, in this order, repeated for one behavior at a time:

1. **Red.** Write the smallest possible test for one missing piece of behavior. Run it and confirm it fails for the expected reason before writing any production code. A test that passes immediately, or that was never run before the production code existed, is not Red.
2. **Green.** Write the bare-minimum production code that makes that one test pass — no more. Do not implement adjacent behaviors, handle cases the test doesn't cover, or generalize ahead of the next test. Run the focused test and confirm it passes.
3. **Refactor.** With the suite green, clean up the code just written and anything nearby it touches: remove duplication, rename for clarity, break up large functions. Re-run tests after each refactor step; the passing suite is what makes this safe. Do not add behavior here — if you need new behavior, that's the next Red.
4. **Repeat.** Return to step 1 for the next smallest slice of missing behavior. Continue until the full feature is covered by tests written this way.

## Anti-patterns (reject these outright)

- Writing production code first, then writing a test afterward to match what it does. This is not TDD even if the test passes; it verifies existing behavior instead of driving new behavior.
- Writing one large test that exercises an entire workstream or feature, then writing all the production code to satisfy it in one pass. Each loop covers one behavior; a multi-behavior test is a sign the work wasn't sliced small enough.
- Skipping the Red confirmation (i.e., not running the test before the code exists) — you cannot know the test would have failed, so you cannot trust that it is testing anything.
- Batching several Green steps before refactoring, or refactoring while a test is red.

Execution: test before code change; focused tests per loop; full test suite before done; never done with failing tests.

Commands: take the focused-run and full-suite commands from the repository, per `STACK-DISCOVERY.md`. This protocol never names a framework.

## Test Level

TDD applies regardless of test level. Choose the smallest practical test at the nearest boundary where the behavior is observable:

- unit for behavior isolated within one component;
- integration or contract for behavior across components or dependency boundaries;
- process or end-to-end for behavior observable only through a deployed, executable, UI, Console, or other external boundary.

Every production behavior change still begins with an observed Red at that level. A verification-only test for behavior implemented by earlier work may pass initially because it is not driving a production change. If that test exposes missing behavior, do not repair production code under verification-only scope; reclassify the repair as a behavior change and begin its Red-Green-Refactor loop.

## Loop Evidence

Retain one chronological evidence entry for every behavior loop:

1. behavior intent;
2. focused Red command and the smallest verbatim output excerpt that identifies the failing test and proves it failed for the expected reason;
3. final focused Green command and decisive passing output after any refactoring.

A generic summary such as `Failed: 1` does not establish the expected Red reason. Missing Red evidence after production code exists cannot be recreated by rerunning or weakening a test; report the behavior as unproven TDD compliance.
