# Slice 01 - Package and toolchain setup

- **User-visible outcome:** The `packages/git-mcp-server` directory is initialized as a standalone TypeScript package with dependencies installed, strict build configuration, ESLint flat config, Prettier formatting, and a working `verify` npm script.
- **Backend/data slice:** `packages/git-mcp-server/package.json`, `packages/git-mcp-server/tsconfig.json`, `packages/git-mcp-server/eslint.config.js`, `packages/git-mcp-server/.prettierrc`, `packages/git-mcp-server/.gitignore`.
- **UI/workflow slice:** Package scripts: `build`, `typecheck`, `lint`, `format:check`, `test`, `verify`.
- **Files/modules in scope:**
  - `packages/git-mcp-server/package.json`
  - `packages/git-mcp-server/tsconfig.json`
  - `packages/git-mcp-server/eslint.config.js`
  - `packages/git-mcp-server/.prettierrc`
  - `packages/git-mcp-server/.prettierignore`
  - `packages/git-mcp-server/src/index.ts`
- **Verification command:** `npm --prefix packages/git-mcp-server run verify`
- **Acceptance checks:**
  - `npm --prefix packages/git-mcp-server run build` compiles TypeScript to `dist/` with declaration maps without errors.
  - `npm --prefix packages/git-mcp-server run lint` runs ESLint without warnings or errors.
  - `npm --prefix packages/git-mcp-server run format:check` runs Prettier check cleanly.
  - `npm --prefix packages/git-mcp-server run verify` combines typecheck, lint, and formatting check and exits with code 0.
- **Useful-if-stopped statement:** Establishes the standard, reproducible project baseline and developer tooling required for all subsequent development.
