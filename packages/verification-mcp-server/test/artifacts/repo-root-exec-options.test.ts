import assert from "node:assert/strict";
import { mock, test } from "node:test";

/**
 * Verifies the exact child_process.execFile options and stdout normalization used by
 * resolveRepoRoot, since these are not otherwise observable via a real git invocation.
 */
test("invokes git rev-parse with shell disabled, the console window hidden, and normalizes backslashes", async () => {
  const capturedOptions: unknown[] = [];
  let nextStdout = "/tmp/repo\n";
  mock.module("node:child_process", {
    namedExports: {
      execFile: (
        _file: string,
        _args: string[],
        options: Record<string, unknown>,
        callback: (error: Error | null, result?: { stdout: string; stderr: string }) => void,
      ) => {
        capturedOptions.push(options);
        callback(null, { stdout: nextStdout, stderr: "" });
      },
    },
  });

  const { resolveRepoRoot } = await import("../../src/artifacts/repo-root.js");

  const result = await resolveRepoRoot(process.cwd());
  assert.equal(result.path, "/tmp/repo");
  assert.equal(capturedOptions.length, 1);
  assert.deepEqual(capturedOptions[0], {
    cwd: process.cwd(),
    shell: false,
    windowsHide: true,
  });

  nextStdout = "C:\\Users\\repo\n";
  const windowsResult = await resolveRepoRoot(process.cwd());
  assert.equal(windowsResult.path, "C:/Users/repo");
});
