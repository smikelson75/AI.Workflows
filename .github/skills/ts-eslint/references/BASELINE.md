# TypeScript/Node Baseline

Industry-default configuration for a greenfield TypeScript project on the current Node LTS. Every value below is a deliberate default; the walkthrough exists to change them, not to rediscover them.

Re-check the Node release state before using the versions in this file. See the skill's Node targeting rule.

## Dependencies

```bash
npm i -D typescript @types/node \
  eslint @eslint/js typescript-eslint globals \
  eslint-plugin-n eslint-config-prettier \
  prettier
```

`typescript-eslint` is the single package that supplies the parser, plugin, and config presets. Do not install `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` separately.

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es2024",
    "lib": ["ES2024"],
    "types": ["node"],

    "module": "nodenext",
    "moduleResolution": "nodenext",
    "moduleDetection": "force",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,

    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Why these, beyond `strict`:

| Flag | Catches |
| --- | --- |
| `noUncheckedIndexedAccess` | `arr[i]` and `map[key]` typed as defined when they may be `undefined`. The single highest-value flag above `strict`. |
| `exactOptionalPropertyTypes` | Assigning explicit `undefined` where a property is merely optional. |
| `verbatimModuleSyntax` | Type-only imports surviving into emitted JS and breaking Node ESM. Forces explicit `import type`. |
| `erasableSyntaxOnly` | `enum`, `namespace`, and parameter properties — syntax Node's native type stripping cannot run. Required if the project runs `.ts` directly. |
| `module: nodenext` | ESM/CJS interop resolved the way Node actually resolves it, not the way a bundler would. |

`noUnusedLocals` and `noUnusedParameters` are deliberately **absent**. ESLint's equivalent rule allows an `_` prefix escape hatch for intentionally unused bindings; the compiler flags have no such escape and push people toward `// @ts-ignore`.

Drop `erasableSyntaxOnly` only if the project compiles with `tsc` and genuinely needs `enum`. Drop `declaration`/`declarationMap` if the package is an application rather than a library.

## `eslint.config.js`

```js
import js from "@eslint/js";
import n from "eslint-plugin-n";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";

export default tseslint.config(
  // Flat config has no .eslintignore; ignores live here and must come first.
  { ignores: ["dist/**", "coverage/**", "**/*.d.ts"] },

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  n.configs["flat/recommended-module"],

  {
    languageOptions: {
      globals: globals.nodeBuiltin,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // TypeScript resolves module paths; the Node plugin re-resolves them wrongly.
      "n/no-missing-import": "off",
    },
  },

  // Config and plain-JS files are outside the type-checked program.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Must stay last: turns off every rule Prettier owns.
  prettier,
);
```

Notes on the choices:

- **`strictTypeChecked`, not `recommended`.** Type-aware linting is the only reason to run ESLint on TypeScript at all; without it you get a slower, weaker `tsc`. It brings `no-floating-promises`, `no-misused-promises`, and the `no-unsafe-*` family — the rules that catch real production bugs. On an existing codebase start at `recommendedTypeChecked` and ramp.
- **`projectService: true`.** Replaces the older `project: "./tsconfig.json"`. It resolves the right `tsconfig.json` per file automatically and handles files outside `include` without the "was not found by the project service" error.
- **`stylisticTypeChecked` is omitted.** It is largely formatting, which Prettier owns.
- **`eslint-plugin-n`** enforces `engines` against the Node APIs actually used, so a `node:` builtin newer than the declared floor fails lint rather than production.
- **`prettier` last** is load-bearing. Placed earlier, later configs re-enable formatting rules and the two tools fight.

Cost: type-aware linting needs a full type build. On a large repository expect lint to take roughly as long as `tsc`. That is the trade for the rule set above.

## `.prettierrc`

```json
{
  "printWidth": 100
}
```

That is the whole file, and the shortness is the point. Prettier's defaults are the community standard precisely because they are not negotiated per repository — `printWidth: 80`, `tabWidth: 2`, `semi: true`, `singleQuote: false`, `trailingComma: "all"`, `endOfLine: "lf"`, `arrowParens: "always"`.

The single deviation is `printWidth: 100`, because 80 forces heavy wrapping on typical TypeScript generics and import lists.

Every further deviation is a cost with no correctness benefit. In the walkthrough, ask for each one individually and default to "no".

## `.prettierignore`

```
dist
coverage
*.min.js
package-lock.json
pnpm-lock.yaml
```

`node_modules` is ignored by default and does not need listing.

## `package.json`

```json
{
  "type": "module",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "verify": "npm run typecheck && eslint . --max-warnings=0 && prettier --check ."
  }
}
```

`"type": "module"` is the baseline. New Node code is ESM; CommonJS is an amendment-mode finding, not a choice to offer.

## Conditional `.editorconfig`

Written only when the repository holds files Prettier cannot parse.

```ini
root = true

[*]
end_of_line = lf
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true

[Makefile]
indent_style = tab

[*.md]
trim_trailing_whitespace = false
```

Deliberately silent on `indent_size` for every glob Prettier owns.

## Deliberately Not In The Baseline

Named so the walkthrough does not relitigate them:

- **`eslint-plugin-unicorn`** — valuable rules, high noise, strong opinions on naming. Offer it, never default to it.
- **`eslint-plugin-import-x`** — mostly redundant once `verbatimModuleSyntax` and `nodenext` are on. Add it only for `no-cycle`.
- **Import ordering** — a formatting concern ESLint should not own. Use a Prettier plugin if wanted.
- **`eslint-plugin-prettier`** — see the skill's boundary rules.
- **Biome** — a single fast tool replacing ESLint and Prettier. Real option, but its type-aware rule coverage does not yet match `strictTypeChecked`, so it is not the baseline. Revisit when the `no-floating-promises` class of rules is covered.
