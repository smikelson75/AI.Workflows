# Slice 01 - Package toolchain and verify gate

- **User-visible outcome:** `packages/verification-mcp-server` exists as an installable ESM TypeScript package that builds, type-checks, lints, formats, and runs an empty-but-real test suite clean, and carries a StrykerJS configuration so later slices can run phase-scoped mutation testing.
- **Backend/data slice:** Create the package manifest, TypeScript configurations, ESLint flat config, Prettier config, and test wiring, mirroring `packages/git-mcp-server` conventions: ESM (`"type": "module"`), Node `>=22.12.0`, strict TypeScript, `@modelcontextprotocol/sdk` and `zod` as dependencies, native `node:test` via `tsx`, and scripts for `build`, `typecheck`, `lint`, `format`, `format:check`, `test`, and `verify`. Add StrykerJS configuration scoped to this package's unit tests with a recorded threshold, following the `stryker-js` skill; add the corresponding `test:mutation` script. Add a single placeholder module and its test so the suite is non-empty and the toolchain is genuinely exercised.
- **UI/workflow slice:** None.
- **Files/modules in scope:** `packages/verification-mcp-server/package.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`, `.prettierrc`, `stryker.config.json`, `src/index.ts`, `test/**`. Do not modify any file outside `packages/verification-mcp-server/`.
- **Verification command:**
  - static: `npm --prefix packages/verification-mcp-server run verify`
  - unit: `npm --prefix packages/verification-mcp-server test`
- **Acceptance checks:**
  - `npm --prefix packages/verification-mcp-server install` succeeds from a clean state.
  - `npm --prefix packages/verification-mcp-server run verify` exits zero with zero TypeScript errors, zero ESLint warnings, and zero Prettier diffs.
  - `npm --prefix packages/verification-mcp-server test` discovers and passes at least one real test.
  - `npm --prefix packages/verification-mcp-server run build` emits `dist/` output and type declarations.
  - `npm --prefix packages/verification-mcp-server run test:mutation` executes and reports a score against the configured threshold.
  - The package declares `"type": "module"` and `engines.node` of `>=22.12.0`.
- **Useful-if-stopped statement:** The repository gains a second verified package skeleton that every later slice can build inside without re-litigating toolchain choices.
