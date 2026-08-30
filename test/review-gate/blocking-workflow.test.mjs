import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { recordDecision } from '../../.github/review-gate/runtime/decision-journal.mjs';

import {
  adoptedRule,
  cleanCompletion,
  matchingFinding,
  unloadedCitation,
} from './fixtures/blocking-workflow.mjs';

const seededRulesDirectory = fileURLToPath(new URL('../../.github/review-gate/rules/', import.meta.url));
const invalidRulesDirectory = fileURLToPath(new URL('./fixtures/invalid-active-rules/', import.meta.url));
const hookDirectory = fileURLToPath(new URL('../../.github/review-gate/runtime/hooks/', import.meta.url));
const failAfterFirstSessionWrite = fileURLToPath(
  new URL('./fixtures/fail-after-first-session-write.mjs', import.meta.url),
);

function withReviewGate(run) {
  const repository = mkdtempSync(path.join(tmpdir(), 'review-gate-workflow-test-'));
  const rulesDirectory = path.join(repository, '.github/review-gate/rules');
  const sessionDirectory = path.join(repository, 'sessions');
  const journalPath = path.join(repository, '.github/review-gate/decision-journal.jsonl');
  cpSync(seededRulesDirectory, rulesDirectory, { recursive: true });

  try {
    return run({ repository, rulesDirectory, sessionDirectory, journalPath });
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
}

function runHook(name, input, {
  rulesDirectory,
  sessionDirectory,
  cwd = '/reviewed-slice',
  preload,
} = {}) {
  const result = spawnSync(
    process.execPath,
    [...(preload ? ['--import', preload] : []), path.join(hookDirectory, `${name}.mjs`)],
    {
      input: typeof input === 'string' ? input : JSON.stringify(input),
      encoding: 'utf8',
      env: {
        ...process.env,
        REVIEW_GATE_RULES_DIR: rulesDirectory,
        REVIEW_GATE_SESSION_DIR: sessionDirectory,
      },
    },
  );

  assert.equal(result.status, 0, `${name} exited non-zero: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function startReview(sessionId, gate, rulesDirectory = gate.rulesDirectory) {
  return runHook('subagent-start', {
    sessionId,
    timestamp: 1,
    cwd: gate.repository,
    agentName: 'review-subagent',
  }, { ...gate, rulesDirectory });
}

function loadRule(sessionId, ruleId, gate) {
  return runHook('pre-tool-use', {
    sessionId,
    timestamp: 2,
    cwd: gate.repository,
    toolName: 'view',
    toolArgs: { path: path.join(gate.rulesDirectory, `${ruleId}.md`) },
  }, gate);
}

function stopReview(sessionId, response, gate) {
  return runHook('subagent-stop', { sessionId, response }, gate);
}

function metadataFrom(startOutput) {
  return JSON.parse(startOutput.additionalContext.split('\n').at(-1));
}

function readJournal(journalPath) {
  return readFileSync(journalPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

function decisionContext(findingNumber) {
  return {
    ruleId: 'simple-constructor',
    slice: 'Slice 04',
    location: `src/Widget.cs:${findingNumber}`,
    rationale: 'The Developer reviewed this Finding and selected its disposition.',
  };
}

test('a clean review loads selected policy after compact metadata injection and completes', () => {
  withReviewGate((gate) => {
    const started = startReview(cleanCompletion.sessionId, gate);
    const metadata = metadataFrom(started);

    assert.deepEqual(
      metadata.map((rule) => rule.id),
      ['complex-constructor', 'simple-constructor'],
    );
    assert.equal('criteria' in metadata[0], false);

    const loaded = loadRule(cleanCompletion.sessionId, cleanCompletion.selectedRuleId, gate);
    assert.equal(loaded.permissionDecision, 'deny');
    assert.match(loaded.permissionDecisionReason, /direct constructor/);

    assert.deepEqual(
      stopReview(cleanCompletion.sessionId, cleanCompletion.finalResponse, gate),
      {},
    );
  });
});

test('a matching Finding is evidence-backed, fixed once, and re-reviewed before completion', () => {
  withReviewGate((gate) => {
    startReview(matchingFinding.sessionId, gate);
    loadRule(matchingFinding.sessionId, matchingFinding.selectedRuleId, gate);

    assert.match(matchingFinding.finalResponse, /src\/Widget\.cs:18/);
    assert.match(matchingFinding.finalResponse, /only forwards/);
    assert.deepEqual(
      stopReview(matchingFinding.sessionId, matchingFinding.finalResponse, gate),
      {},
    );

    recordDecision(gate.journalPath, gate.rulesDirectory, {
      ...decisionContext(1),
      findingNumber: 1,
      disposition: 'fix-once',
    });
    assert.deepEqual(
      readJournal(gate.journalPath).map(({ findingNumber, disposition }) => ({ findingNumber, disposition })),
      [{ findingNumber: 1, disposition: 'fix-once' }],
    );

    const revisionSession = 'matching-review-revision';
    startReview(revisionSession, gate);
    loadRule(revisionSession, matchingFinding.selectedRuleId, gate);
    assert.deepEqual(stopReview(revisionSession, cleanCompletion.finalResponse, gate), {});
  });
});

test('an unloaded Rule citation is blocked independently at subagentStop', () => {
  withReviewGate((gate) => {
    startReview(unloadedCitation.sessionId, gate);

    const output = stopReview(
      unloadedCitation.sessionId,
      unloadedCitation.finalResponse,
      gate,
    );

    assert.equal(output.decision, 'block');
    assert.match(output.reason, /simple-constructor/);
    assert.match(output.reason, /not loaded through the hook path/);
  });
});

test('adoption activates a repository Rule, while dismissal remains limited to its Finding', () => {
  withReviewGate((gate) => {
    recordDecision(gate.journalPath, gate.rulesDirectory, {
      ...decisionContext(2),
      findingNumber: 2,
      disposition: 'adopt-rule-and-fix',
      rule: adoptedRule,
    });
    recordDecision(gate.journalPath, gate.rulesDirectory, {
      ...decisionContext(3),
      findingNumber: 3,
      disposition: 'dismiss',
    });
    recordDecision(gate.journalPath, gate.rulesDirectory, {
      ...decisionContext(4),
      findingNumber: 4,
      disposition: 'fix-once',
    });

    const decisions = readJournal(gate.journalPath);
    assert.deepEqual(
      decisions.map(({ findingNumber, disposition }) => ({ findingNumber, disposition })),
      [
        { findingNumber: 2, disposition: 'adopt-rule-and-fix' },
        { findingNumber: 3, disposition: 'dismiss' },
        { findingNumber: 4, disposition: 'fix-once' },
      ],
    );
    assert.equal(decisions[0].rulePath, '.github/review-gate/rules/prefer-named-options.md');

    const adoptionReview = 'adoption-review';
    const metadata = metadataFrom(startReview(adoptionReview, gate));
    assert.equal(metadata.some((rule) => rule.id === adoptedRule.id), true);
    const loaded = loadRule(adoptionReview, adoptedRule.id, gate);
    assert.match(loaded.permissionDecisionReason, /Named options make related values/);
    assert.deepEqual(stopReview(adoptionReview, cleanCompletion.finalResponse, gate), {});
  });
});

test('malformed hook input and Rule Catalog failures fail closed in the composed workflow', () => {
  withReviewGate((gate) => {
    const malformedStart = runHook('subagent-start', 'not json', gate);
    assert.match(malformedStart.additionalContext, /REVIEW GATE CONFIGURATION ERROR/);

    const catalogFailure = startReview('catalog-failure', gate, invalidRulesDirectory);
    assert.match(catalogFailure.additionalContext, /REVIEW GATE CONFIGURATION ERROR/);
    assert.match(catalogFailure.additionalContext, /missing title/);
    const blockedCatalogFailure = stopReview('catalog-failure', 'No Findings', gate);
    assert.equal(blockedCatalogFailure.decision, 'block');
    assert.match(blockedCatalogFailure.reason, /Rule Catalog failed to load active Rule Metadata/);

    startReview('rule-load-failure', gate);
    const ruleLoadFailure = runHook('pre-tool-use', {
      sessionId: 'rule-load-failure',
      timestamp: 2,
      cwd: gate.repository,
      toolName: 'view',
      toolArgs: { path: path.join(invalidRulesDirectory, 'broken-rule.md') },
    }, { ...gate, rulesDirectory: invalidRulesDirectory });
    assert.equal(ruleLoadFailure.permissionDecision, 'deny');
    assert.match(ruleLoadFailure.permissionDecisionReason, /missing title/);

    const blockedRuleLoadFailure = stopReview('rule-load-failure', 'No Findings', gate);
    assert.equal(blockedRuleLoadFailure.decision, 'block');
    assert.match(blockedRuleLoadFailure.reason, /Rule broken-rule could not be loaded/);

    const malformedStop = runHook('subagent-stop', 'not json', gate);
    assert.equal(malformedStop.decision, 'block');
    assert.match(malformedStop.reason, /malformed JSON input/);
  });
});

test('a failed configuration marker invalidates a session initialized before a Rule Catalog failure', () => {
  withReviewGate((gate) => {
    const start = runHook('subagent-start', {
      sessionId: 'unrecorded-catalog-failure',
      timestamp: 1,
      cwd: gate.repository,
      agentName: 'review-subagent',
    }, {
      ...gate,
      rulesDirectory: invalidRulesDirectory,
      preload: failAfterFirstSessionWrite,
    });

    assert.match(start.additionalContext, /REVIEW GATE CONFIGURATION ERROR/);
    assert.match(start.additionalContext, /Could not record the review session configuration failure/);

    const stopped = stopReview('unrecorded-catalog-failure', 'No Findings', gate);
    assert.equal(stopped.decision, 'block');
    assert.match(stopped.reason, /not initialized/);
  });
});
