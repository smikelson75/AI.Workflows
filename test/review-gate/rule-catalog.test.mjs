import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadActiveRule,
  loadActiveRuleMetadata,
} from '../../scripts/review-gate/rule-catalog.mjs';

const seededRulesDirectory = new URL('../../.github/review-gate/rules/', import.meta.url);
const invalidRulesDirectory = new URL('./fixtures/invalid-active-rules/', import.meta.url);

test('discovers only compact metadata for active seeded Rules', () => {
  const rules = loadActiveRuleMetadata(seededRulesDirectory);

  assert.deepEqual(rules, [
    {
      id: 'complex-constructor',
      title: 'Prefer a Builder or Value Object for Complex Constructors',
      status: 'active',
      scope: 'object construction',
      triggers: [
        'five or more required parameters',
        'multiple same-typed values',
        'boolean flags',
        'numerous optional values',
      ],
      summary: 'Keep construction calls understandable when constructor parameters become complex or ambiguous.',
      tags: ['construction', 'constructor'],
    },
    {
      id: 'simple-constructor',
      title: 'Prefer a Simple Constructor for Ordinary Object Creation',
      status: 'active',
      scope: 'object construction',
      triggers: ['static factory methods', 'ordinary object creation'],
      summary: 'Use a direct constructor when a static factory adds no meaningful construction decision.',
      tags: ['construction', 'static-factory'],
    },
  ]);

  for (const rule of rules) {
    assert.equal('body' in rule, false);
    assert.deepEqual(
      Object.keys(rule).sort(),
      ['id', 'scope', 'status', 'summary', 'tags', 'title', 'triggers'],
    );
  }
});

test('fails closed when an active Rule omits required metadata', () => {
  assert.throws(
    () => loadActiveRuleMetadata(invalidRulesDirectory),
    /Invalid active Rule metadata in broken-rule\.md: missing title/,
  );
});

test('loads every policy section for the selected Simple Constructor Rule', () => {
  const rule = loadActiveRule(seededRulesDirectory, 'simple-constructor');

  assert.equal(rule.id, 'simple-constructor');
  assert.match(rule.criteria, /direct constructor/);
  assert.match(rule.rationale, /unnecessary Static Factory/);
  assert.match(rule.exceptions, /Named-state factories/);
  assert.match(rule.examples, /Result\.Success\(data\)/);
  assert.match(rule.reviewGuidance, /meaningful\s+selection/);
});

test('loads the Complex Constructor threshold and ambiguous combinations', () => {
  const rule = loadActiveRule(seededRulesDirectory, 'complex-constructor');

  assert.match(rule.criteria, /five or more required parameters/);
  assert.match(
    rule.criteria,
    /multiple same-typed\s+values, boolean flags, or numerous optional\s+values/,
  );
});

test('fails closed when loading an invalid active Rule', () => {
  assert.throws(
    () => loadActiveRule(invalidRulesDirectory, 'broken-rule'),
    /Invalid active Rule metadata in broken-rule\.md: missing title/,
  );
});

test('fails when the selected active Rule cannot be loaded', () => {
  assert.throws(
    () => loadActiveRule(seededRulesDirectory, 'missing-rule'),
    /Active Rule missing-rule was not found/,
  );
});
