import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  getLoadedRules,
  recordLoadedRule,
  resetLoadedRules,
} from '../../.github/review-gate/runtime/session-store.mjs';

function withSessionDirectory(run) {
  const sessionDirectory = mkdtempSync(path.join(tmpdir(), 'review-gate-session-store-test-'));
  process.env.REVIEW_GATE_SESSION_DIR = sessionDirectory;
  try {
    return run(sessionDirectory);
  } finally {
    delete process.env.REVIEW_GATE_SESSION_DIR;
    rmSync(sessionDirectory, { recursive: true, force: true });
  }
}

test('session-store rejects traversal session IDs before filesystem access', () => {
  withSessionDirectory((sessionDirectory) => {
    const outsideSessionId = `outside-session-${path.basename(sessionDirectory)}`;
    assert.throws(() => resetLoadedRules(`../${outsideSessionId}`), /sessionId/);
    assert.equal(existsSync(path.join(path.dirname(sessionDirectory), `${outsideSessionId}.json`)), false);
  });
});

test('session-store rejects path aliases so sessions cannot share state', () => {
  withSessionDirectory(() => {
    resetLoadedRules('review-b');
    recordLoadedRule('review-b', 'simple-constructor');

    assert.throws(() => recordLoadedRule('review-a/../review-b', 'complex-constructor'), /sessionId/);
    assert.deepEqual(getLoadedRules('review-b'), ['simple-constructor']);
  });
});
