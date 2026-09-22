import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ERROR_CODES } from "../../src/errors/error-codes.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(dirname, "../../src");
const errorCodesFile = path.join(srcDir, "errors", "error-codes.ts");

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
    } else if (entry.name.endsWith(".ts") && fullPath !== errorCodesFile) {
      files.push(fullPath);
    }
  }
  return files;
}

test("error code registry has no duplicate identifiers", () => {
  const values = Object.values(ERROR_CODES);
  assert.equal(values.length, new Set(values).size);
});

test("every registered error code is used somewhere in src outside the registry", async () => {
  const files = await collectSourceFiles(srcDir);
  const contents = await Promise.all(files.map((file) => fs.readFile(file, "utf8")));
  const combined = contents.join("\n");

  for (const code of Object.values(ERROR_CODES)) {
    assert.ok(combined.includes(code), `error code ${code} is not used anywhere in src`);
  }
});
