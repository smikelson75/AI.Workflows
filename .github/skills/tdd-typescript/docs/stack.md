# TypeScript / JavaScript Stack Specifics

## Test Runner Discovery

Discover the actual test runner from `package.json` scripts and devDependencies before selecting commands. Never guess or invent an undocumented test runner:

1. **Check `package.json` scripts:** Inspect `scripts.test`, `scripts.test:unit`, etc.
2. **Check devDependencies:** Identify runner dependencies:
   - `tsx` / `@types/node` using native Node test runner (`node:test`).
   - `vitest`
   - `jest` / `ts-jest`
   - `mocha` / `ts-node`

## Common Runner Command Patterns

### Node Test Runner (`node:test` + `tsx`)
- **Focused test:** `node --import tsx --test <path/to/test-file.test.ts>`
- **Test name filter:** `node --import tsx --test --test-name-pattern="<pattern>" <path/to/test-file.test.ts>`
- **Full package suite:** `npm test` or `npm --prefix <package-dir> test`

### Vitest
- **Focused test:** `npx vitest run <path/to/test-file.test.ts>` (or `npm test -- <path/to/test-file.test.ts>`)
- **Test name filter:** `npx vitest run -t "<pattern>" <path/to/test-file.test.ts>`
- **Full package suite:** `npm test` or `npx vitest run`

### Jest
- **Focused test:** `npx jest <path/to/test-file.test.ts>` (or `npm test -- <path/to/test-file.test.ts>`)
- **Test name filter:** `npx jest -t "<pattern>" <path/to/test-file.test.ts>`
- **Full package suite:** `npm test`

### Mocha
- **Focused test:** `npx mocha <path/to/test-file.test.ts>`
- **Full package suite:** `npm test`

## Test-Bearing Versus Static Verification

- **Behavior tests:** Commands that execute automated tests (`node:test`, Vitest, Jest, Mocha). Slices with `changeKind: "behavior"` must run and report a test-bearing verification command.
- **Static verification:** Typecheck (`tsc --noEmit`), linting (`eslint .`), and formatting (`prettier --check .`). Static verification (e.g. `npm run verify`) runs in addition to tests, never as a replacement for automated tests.

## Deterministic Seams And Hygiene

- **Filesystem fixtures:** Use temporary directories isolated per test run; clean up in `afterEach` or `finally`.
- **Subprocesses & Git:** Isolate repository fixtures; do not mutate global git configuration.
- **Time and Timers:** Use runner-provided fake timers (`clock.mock()`, `vi.useFakeTimers()`, `jest.useFakeTimers()`) when time-dependent behavior is under test.
- **Process and Network:** Mock or stub external network and process boundaries to ensure tests are deterministic and offline-capable.
