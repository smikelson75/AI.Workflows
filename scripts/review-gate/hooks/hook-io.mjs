import path from 'node:path';

/**
 * Shared stdin/stdout and path-resolution helpers for Copilot CLI command
 * hooks. Hook scripts receive one JSON payload on stdin and must write
 * exactly one JSON decision object to stdout.
 */

/**
 * Reads and returns the full stdin payload as a UTF-8 string.
 *
 * @returns {Promise<string>}
 */
export async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Writes a hook decision object to stdout as a single JSON line.
 *
 * @param {object} output
 */
export function writeOutput(output) {
  process.stdout.write(JSON.stringify(output));
}

/**
 * Resolves the active Rules directory for a hook invocation. Tests override
 * this with `REVIEW_GATE_RULES_DIR`; real invocations resolve it from the
 * session's working directory.
 *
 * @param {string | undefined} cwd
 * @returns {string}
 */
export function rulesDirectoryFor(cwd) {
  if (process.env.REVIEW_GATE_RULES_DIR) {
    return process.env.REVIEW_GATE_RULES_DIR;
  }
  return path.join(cwd ?? process.cwd(), '.github/review-gate/rules');
}
