import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { recordDecision } from '../../scripts/review-gate/decision-journal.mjs';
import { loadActiveRule } from '../../scripts/review-gate/rule-catalog.mjs';

function withRepository(run) {
  const repository = mkdtempSync(path.join(tmpdir(), 'review-gate-decision-test-'));
  try {
    return run({
      journalPath: path.join(repository, '.github/review-gate/decision-journal.jsonl'),
      rulesDirectory: path.join(repository, '.github/review-gate/rules'),
    });
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
}

const adoptedRule = {
  id: 'prefer-named-options',
  title: 'Prefer Named Options for Multi-Value Calls',
  scope: 'function calls',
  triggers: ['three or more related arguments'],
  summary: 'Keep related call arguments named at the call site.',
  criteria: 'Review calls with three or more related arguments.',
  rationale: 'Named options make related values easier to understand.',
  exceptions: 'Keep positional calls when each argument is distinct.',
  examples: 'create({ host, port, timeout })',
  reviewGuidance: 'Report ambiguous positional calls.',
};

test('appends specific Fix Once and Dismiss decisions for numbered Findings', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    recordDecision(journalPath, rulesDirectory, { findingNumber: 1, disposition: 'fix-once' });
    recordDecision(journalPath, rulesDirectory, { findingNumber: 2, disposition: 'dismiss' });

    const decisions = readJournal(journalPath);
    assert.equal(decisions.length, 2);
    assert.deepEqual(
      decisions.map(({ findingNumber, disposition }) => ({ findingNumber, disposition })),
      [
        { findingNumber: 1, disposition: 'fix-once' },
        { findingNumber: 2, disposition: 'dismiss' },
      ],
    );
    assert.match(decisions[0].recordedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal('rulePath' in decisions[1], false);
  });
});

test('adopting a Rule appends its decision and creates an active complete Rule', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    recordDecision(journalPath, rulesDirectory, {
      findingNumber: 3,
      disposition: 'adopt-rule-and-fix',
      rule: adoptedRule,
    });

    const [decision] = readJournal(journalPath);
    assert.equal(decision.findingNumber, 3);
    assert.equal(decision.disposition, 'adopt-rule-and-fix');
    assert.equal(decision.rulePath, '.github/review-gate/rules/prefer-named-options.md');

    const rule = loadActiveRule(rulesDirectory, adoptedRule.id);
    assert.equal(rule.status, 'active');
    assert.equal(rule.title, adoptedRule.title);
    assert.equal(rule.criteria, adoptedRule.criteria);
    assert.equal(rule.reviewGuidance, adoptedRule.reviewGuidance);
  });
});

test('a dismissal does not suppress a later matching Finding', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    recordDecision(journalPath, rulesDirectory, { findingNumber: 4, disposition: 'dismiss' });
    recordDecision(journalPath, rulesDirectory, { findingNumber: 5, disposition: 'fix-once' });

    assert.deepEqual(
      readJournal(journalPath).map((decision) => decision.findingNumber),
      [4, 5],
    );
  });
});

test('rejects malformed decisions without appending them', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, { findingNumber: 0, disposition: 'dismiss' }),
      /findingNumber must be a positive integer/,
    );
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, { findingNumber: 1, disposition: 'unknown' }),
      /unsupported disposition/,
    );
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        findingNumber: 1,
        disposition: 'adopt-rule-and-fix',
        rule: { ...adoptedRule, title: '' },
      }),
      /title must be a non-empty string/,
    );
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        findingNumber: 1,
        disposition: 'adopt-rule-and-fix',
        rule: { ...adoptedRule, title: 'First line\nSecond line' },
      }),
      /title must not contain line breaks/,
    );
    assert.throws(() => readFileSync(journalPath, 'utf8'), /ENOENT/);
  });
});

test('surfaces Rule-generation failures without recording an adoption', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    recordDecision(journalPath, rulesDirectory, {
      findingNumber: 1,
      disposition: 'adopt-rule-and-fix',
      rule: adoptedRule,
    });

    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        findingNumber: 2,
        disposition: 'adopt-rule-and-fix',
        rule: adoptedRule,
      }),
      /already exists/,
    );
    assert.deepEqual(readJournal(journalPath).map((decision) => decision.findingNumber), [1]);
  });
});

function readJournal(journalPath) {
  return readFileSync(journalPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}
