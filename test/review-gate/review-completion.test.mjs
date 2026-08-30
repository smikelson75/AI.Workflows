import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { recordLoadedRule, resetLoadedRules } from '../../.github/review-gate/runtime/session-store.mjs';

const subagentStopScript = fileURLToPath(
  new URL('../../.github/review-gate/runtime/hooks/subagent-stop.mjs', import.meta.url),
);

function runHook(input, sessionDirectory) {
  const result = spawnSync(process.execPath, [subagentStopScript], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, REVIEW_GATE_SESSION_DIR: sessionDirectory },
  });
  assert.equal(result.status, 0, `hook exited non-zero: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function withSessionDirectory(run) {
  const sessionDirectory = mkdtempSync(path.join(tmpdir(), 'review-gate-completion-test-'));
  try {
    return run(sessionDirectory);
  } finally {
    rmSync(sessionDirectory, { recursive: true, force: true });
  }
}

test('subagentStop blocks a Finding that cites a Rule not loaded for its session', () => {
  withSessionDirectory((sessionDirectory) => {
    process.env.REVIEW_GATE_SESSION_DIR = sessionDirectory;
    resetLoadedRules('review-1');
    delete process.env.REVIEW_GATE_SESSION_DIR;
    const output = runHook(
      {
        sessionId: 'review-1',
        response: '1. `src/widget.cs`: unnecessary factory. Rule ID: simple-constructor',
      },
      sessionDirectory,
    );

    assert.equal(output.decision, 'block');
    assert.match(output.reason, /simple-constructor/);
    assert.match(output.reason, /not loaded/);
  });
});

test('subagentStop permits a clean review and a Finding citing a loaded Rule', () => {
  withSessionDirectory((sessionDirectory) => {
    process.env.REVIEW_GATE_SESSION_DIR = sessionDirectory;
    resetLoadedRules('review-2');
    delete process.env.REVIEW_GATE_SESSION_DIR;
    assert.deepEqual(
      runHook({ sessionId: 'review-2', response: 'No Findings' }, sessionDirectory),
      {},
    );

    process.env.REVIEW_GATE_SESSION_DIR = sessionDirectory;
    recordLoadedRule('review-2', 'simple-constructor');
    delete process.env.REVIEW_GATE_SESSION_DIR;
    assert.deepEqual(
      runHook(
        {
          sessionId: 'review-2',
          response: '1. `src/widget.cs`: unnecessary factory. Rule ID: simple-constructor',
        },
        sessionDirectory,
      ),
      {},
    );
  });
});

test('subagentStop blocks completion for a session not initialized by subagentStart', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook({ sessionId: 'review-uninitialized', response: 'No Findings' }, sessionDirectory);

    assert.equal(output.decision, 'block');
    assert.match(output.reason, /not initialized/);
  });
});

test('subagentStop fails closed when it cannot determine the session or response', () => {
  withSessionDirectory((sessionDirectory) => {
    const malformed = runHook('not json', sessionDirectory);
    assert.equal(malformed.decision, 'block');
    assert.match(malformed.reason, /malformed JSON input/);

    const missingSession = runHook({ response: 'No Findings' }, sessionDirectory);
    assert.equal(missingSession.decision, 'block');
    assert.match(missingSession.reason, /sessionId/);

    const missingResponse = runHook({ sessionId: 'review-3' }, sessionDirectory);
    assert.equal(missingResponse.decision, 'block');
    assert.match(missingResponse.reason, /final response/);
  });
});
