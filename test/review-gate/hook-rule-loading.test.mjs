import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { getLoadedRules } from '../../.github/review-gate/runtime/session-store.mjs';

const seededRulesDirectory = fileURLToPath(new URL('../../.github/review-gate/rules/', import.meta.url));
const invalidRulesDirectory = fileURLToPath(new URL('./fixtures/invalid-active-rules/', import.meta.url));

const subagentStartScript = fileURLToPath(
  new URL('../../.github/review-gate/runtime/hooks/subagent-start.mjs', import.meta.url),
);
const preToolUseScript = fileURLToPath(
  new URL('../../.github/review-gate/runtime/hooks/pre-tool-use.mjs', import.meta.url),
);

function runHook(scriptPath, input, {
  rulesDirectory = seededRulesDirectory,
  sessionDirectory,
} = {}) {
  const result = spawnSync(process.execPath, [scriptPath], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: {
      ...process.env,
      REVIEW_GATE_RULES_DIR: rulesDirectory,
      ...(sessionDirectory ? { REVIEW_GATE_SESSION_DIR: sessionDirectory } : {}),
    },
  });
  assert.equal(result.status, 0, `hook exited non-zero: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function withSessionDirectory(run) {
  const sessionDirectory = mkdtempSync(path.join(tmpdir(), 'review-gate-hook-test-'));
  try {
    return run(sessionDirectory);
  } finally {
    rmSync(sessionDirectory, { recursive: true, force: true });
  }
}

test('subagentStart injects only compact active Rule Metadata', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook(
      subagentStartScript,
      { sessionId: 'session-1', timestamp: 1, cwd: '/repo', agentName: 'review-subagent' },
      { sessionDirectory },
    );

    assert.match(output.additionalContext, /"id":"simple-constructor"/);
    assert.match(output.additionalContext, /"id":"complex-constructor"/);
    assert.doesNotMatch(output.additionalContext, /Decision criteria/);
    assert.doesNotMatch(output.additionalContext, /Rationale/);
    assert.deepEqual(getLoadedRulesFrom(sessionDirectory, 'session-1'), []);
  });
});

test('subagentStart fails closed on malformed JSON input', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook(subagentStartScript, 'not json', { sessionDirectory });
    assert.match(output.additionalContext, /REVIEW GATE CONFIGURATION ERROR/);
    assert.match(output.additionalContext, /malformed JSON input/);
  });
});

test('subagentStart fails closed when the Rule Catalog cannot load metadata', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook(
      subagentStartScript,
      { sessionId: 'session-1', timestamp: 1, cwd: '/repo', agentName: 'review-subagent' },
      { rulesDirectory: invalidRulesDirectory, sessionDirectory },
    );

    assert.match(output.additionalContext, /REVIEW GATE CONFIGURATION ERROR/);
    assert.match(output.additionalContext, /missing title/);
  });
});

test('subagentStart fails closed when it cannot initialize session state', () => {
  const repository = mkdtempSync(path.join(tmpdir(), 'review-gate-session-store-failure-'));
  const sessionDirectory = path.join(repository, 'sessions');
  writeFileSync(sessionDirectory, 'not a directory');

  try {
    const output = runHook(
      subagentStartScript,
      { sessionId: 'session-1', timestamp: 1, cwd: '/repo', agentName: 'review-subagent' },
      { sessionDirectory },
    );

    assert.match(output.additionalContext, /REVIEW GATE CONFIGURATION ERROR/);
    assert.match(output.additionalContext, /session state/);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

test('preToolUse denies a direct Rule view, returns its full policy, and records the load', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook(
      preToolUseScript,
      {
        sessionId: 'session-2',
        timestamp: 1,
        cwd: '/repo',
        toolName: 'view',
        toolArgs: { path: path.join(seededRulesDirectory, 'simple-constructor.md') },
      },
      { sessionDirectory },
    );

    assert.equal(output.permissionDecision, 'deny');
    assert.match(output.permissionDecisionReason, /unnecessary Static Factory/);
    assert.match(output.permissionDecisionReason, /Result\.Success\(data\)/);

    assert.deepEqual(getLoadedRulesFrom(sessionDirectory, 'session-2'), ['simple-constructor']);
  });
});

test('preToolUse denies a Rule view through a symbolic-link alias and records the load', () => {
  const repository = mkdtempSync(path.join(tmpdir(), 'review-gate-rule-alias-'));
  const sessionDirectory = path.join(repository, 'sessions');
  const aliasDirectory = path.join(repository, 'rule-alias');
  symlinkSync(seededRulesDirectory, aliasDirectory, 'dir');

  try {
    const output = runHook(
      preToolUseScript,
      {
        sessionId: 'session-alias',
        timestamp: 1,
        cwd: repository,
        toolName: 'view',
        toolArgs: { path: path.join(aliasDirectory, 'simple-constructor.md') },
      },
      { sessionDirectory },
    );

    assert.equal(output.permissionDecision, 'deny');
    assert.match(output.permissionDecisionReason, /Rule simple-constructor loaded through the hook-enforced path/);
    assert.deepEqual(getLoadedRulesFrom(sessionDirectory, 'session-alias'), ['simple-constructor']);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

test('preToolUse fails closed for an unknown Rule ID', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook(
      preToolUseScript,
      {
        sessionId: 'session-3',
        timestamp: 1,
        cwd: '/repo',
        toolName: 'view',
        toolArgs: { path: path.join(seededRulesDirectory, 'no-such-rule.md') },
      },
      { sessionDirectory },
    );

    assert.equal(output.permissionDecision, 'deny');
    assert.match(output.permissionDecisionReason, /no-such-rule/);
    assert.deepEqual(getLoadedRulesFrom(sessionDirectory, 'session-3'), []);
  });
});

test('preToolUse fails closed when the Rule Catalog cannot load a malformed Rule', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook(
      preToolUseScript,
      {
        sessionId: 'session-4',
        timestamp: 1,
        cwd: '/repo',
        toolName: 'view',
        toolArgs: { path: path.join(invalidRulesDirectory, 'broken-rule.md') },
      },
      { rulesDirectory: invalidRulesDirectory, sessionDirectory },
    );

    assert.equal(output.permissionDecision, 'deny');
    assert.match(output.permissionDecisionReason, /missing title/);
    assert.deepEqual(getLoadedRulesFrom(sessionDirectory, 'session-4'), []);
  });
});

test('preToolUse fails closed when it cannot record a loaded Rule', () => {
  const repository = mkdtempSync(path.join(tmpdir(), 'review-gate-session-store-failure-'));
  const sessionDirectory = path.join(repository, 'sessions');
  writeFileSync(sessionDirectory, 'not a directory');

  try {
    const output = runHook(
      preToolUseScript,
      {
        sessionId: 'session-4',
        timestamp: 1,
        cwd: '/repo',
        toolName: 'view',
        toolArgs: { path: path.join(seededRulesDirectory, 'simple-constructor.md') },
      },
      { sessionDirectory },
    );

    assert.equal(output.permissionDecision, 'deny');
    assert.match(output.permissionDecisionReason, /could not record loaded Rule/);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

test('preToolUse fails closed on malformed JSON input', () => {
  withSessionDirectory((sessionDirectory) => {
    const output = runHook(preToolUseScript, 'not json', { sessionDirectory });
    assert.equal(output.permissionDecision, 'deny');
    assert.match(output.permissionDecisionReason, /malformed JSON input/);
  });
});

test('preToolUse takes no action, and reads no Rule body, for unrelated tool calls', () => {
  withSessionDirectory((sessionDirectory) => {
    const bashCall = runHook(
      preToolUseScript,
      { sessionId: 'session-5', timestamp: 1, cwd: '/repo', toolName: 'bash', toolArgs: { command: 'ls' } },
      { sessionDirectory },
    );
    assert.deepEqual(bashCall, {});

    const outsideRulesDirectory = runHook(
      preToolUseScript,
      {
        sessionId: 'session-5',
        timestamp: 1,
        cwd: '/repo',
        toolName: 'view',
        toolArgs: { path: path.join(seededRulesDirectory, '../../README.md') },
      },
      { sessionDirectory },
    );
    assert.deepEqual(outsideRulesDirectory, {});

    assert.deepEqual(getLoadedRulesFrom(sessionDirectory, 'session-5'), []);
  });
});

function getLoadedRulesFrom(sessionDirectory, sessionId) {
  process.env.REVIEW_GATE_SESSION_DIR = sessionDirectory;
  try {
    return getLoadedRules(sessionId);
  } finally {
    delete process.env.REVIEW_GATE_SESSION_DIR;
  }
}
