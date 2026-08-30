import assert from 'node:assert/strict';
import fs, { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
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

const findingContext = {
  ruleId: 'simple-constructor',
  slice: 'Slice 04',
  location: 'src/Widget.cs:18',
  rationale: 'The Finding has been reviewed against the selected Rule.',
};

test('appends specific Fix Once and Dismiss decisions for numbered Findings', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    recordDecision(journalPath, rulesDirectory, {
      ...findingContext,
      findingNumber: 1,
      disposition: 'fix-once',
    });
    recordDecision(journalPath, rulesDirectory, {
      ...findingContext,
      findingNumber: 2,
      disposition: 'dismiss',
    });

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
    assert.deepEqual(
      decisions.map(({ ruleId, slice, location, disposition, rationale }) => ({
        ruleId, slice, location, disposition, rationale,
      })),
      [
        { ...findingContext, disposition: 'fix-once' },
        { ...findingContext, disposition: 'dismiss' },
      ],
    );
    assert.equal('rulePath' in decisions[1], false);
  });
});

test('adopting a Rule appends its decision and creates an active complete Rule', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    recordDecision(journalPath, rulesDirectory, {
      ...findingContext,
      findingNumber: 3,
      disposition: 'adopt-rule-and-fix',
      rule: adoptedRule,
    });

    const [decision] = readJournal(journalPath);
    assert.equal(decision.findingNumber, 3);
    assert.equal(decision.disposition, 'adopt-rule-and-fix');
    assert.equal(decision.rulePath, '.github/review-gate/rules/prefer-named-options.md');
    assert.deepEqual(
      {
        ruleId: decision.ruleId,
        slice: decision.slice,
        location: decision.location,
        disposition: decision.disposition,
        rationale: decision.rationale,
      },
      { ...findingContext, disposition: 'adopt-rule-and-fix' },
    );

    const rule = loadActiveRule(rulesDirectory, adoptedRule.id);
    assert.equal(rule.status, 'active');
    assert.equal(rule.title, adoptedRule.title);
    assert.equal(rule.criteria, adoptedRule.criteria);
    assert.equal(rule.reviewGuidance, adoptedRule.reviewGuidance);
  });
});

test('a dismissal does not suppress a later matching Finding', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    recordDecision(journalPath, rulesDirectory, {
      ...findingContext,
      findingNumber: 4,
      disposition: 'dismiss',
    });
    recordDecision(journalPath, rulesDirectory, {
      ...findingContext,
      findingNumber: 5,
      disposition: 'fix-once',
    });

    assert.deepEqual(
      readJournal(journalPath).map((decision) => decision.findingNumber),
      [4, 5],
    );
  });
});

test('rejects malformed decisions without appending them', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        ...findingContext,
        findingNumber: 0,
        disposition: 'dismiss',
      }),
      /findingNumber must be a positive integer/,
    );
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        ...findingContext,
        findingNumber: 1,
        disposition: 'unknown',
      }),
      /unsupported disposition/,
    );
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        ...findingContext,
        findingNumber: 1,
        disposition: 'adopt-rule-and-fix',
        rule: { ...adoptedRule, title: '' },
      }),
      /title must be a non-empty string/,
    );
    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        ...findingContext,
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
      ...findingContext,
      findingNumber: 1,
      disposition: 'adopt-rule-and-fix',
      rule: adoptedRule,
    });

    assert.throws(
      () => recordDecision(journalPath, rulesDirectory, {
        ...findingContext,
        findingNumber: 2,
        disposition: 'adopt-rule-and-fix',
        rule: adoptedRule,
      }),
      /already exists/,
    );
    assert.deepEqual(readJournal(journalPath).map((decision) => decision.findingNumber), [1]);
  });
});

test('rejects decisions missing required audit context without appending them', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    for (const field of ['ruleId', 'slice', 'location', 'rationale']) {
      const decision = { ...findingContext, findingNumber: 1, disposition: 'dismiss' };
      delete decision[field];
      assert.throws(
        () => recordDecision(journalPath, rulesDirectory, decision),
        new RegExp(`${field} must be a non-empty string`),
      );
    }
    assert.throws(() => readFileSync(journalPath, 'utf8'), /ENOENT/);
  });
});

test('rolls back an adopted Rule when writing its journal record fails', () => {
  withRepository(({ journalPath, rulesDirectory }) => {
    const appendFileSync = fs.appendFileSync;
    fs.appendFileSync = () => {
      throw new Error('journal is unavailable');
    };
    syncBuiltinESMExports();

    try {
      assert.throws(
        () => recordDecision(journalPath, rulesDirectory, {
          ...findingContext,
          findingNumber: 1,
          disposition: 'adopt-rule-and-fix',
          rule: adoptedRule,
        }),
        /journal is unavailable/,
      );
    } finally {
      fs.appendFileSync = appendFileSync;
      syncBuiltinESMExports();
    }

    assert.equal(existsSync(journalPath) ? readFileSync(journalPath, 'utf8') : '', '');
    assert.equal(existsSync(path.join(rulesDirectory, `${adoptedRule.id}.md`)), false);
  });
});

function readJournal(journalPath) {
  return readFileSync(journalPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}
