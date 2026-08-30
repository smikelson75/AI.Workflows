import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const DISPOSITIONS = new Set(['fix-once', 'adopt-rule-and-fix', 'dismiss']);
const DECISION_STRING_FIELDS = ['ruleId', 'slice', 'location', 'rationale'];
const RULE_STRING_FIELDS = [
  'id',
  'title',
  'scope',
  'summary',
  'criteria',
  'rationale',
  'exceptions',
  'examples',
  'reviewGuidance',
];
const RULE_METADATA_STRING_FIELDS = ['id', 'title', 'scope', 'summary'];
const RULE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Appends a durable disposition for one numbered Finding. Rule adoption
 * creates an active Rule and records its decision together. If recording
 * fails, the newly created Rule is removed.
 *
 * @param {string} journalPath
 * @param {string} rulesDirectory
 * @param {object} decision
 */
export function recordDecision(journalPath, rulesDirectory, decision) {
  validateDecision(decision);
  prepareJournalDestination(journalPath);

  const record = {
    findingNumber: decision.findingNumber,
    ruleId: decision.ruleId,
    slice: decision.slice,
    location: decision.location,
    disposition: decision.disposition,
    rationale: decision.rationale,
    recordedAt: new Date().toISOString(),
  };

  let createdRule;
  if (decision.disposition === 'adopt-rule-and-fix') {
    createdRule = createActiveRule(rulesDirectory, decision.rule);
    record.rulePath = createdRule.journalPath;
  }

  try {
    appendFileSync(journalPath, `${JSON.stringify(record)}\n`);
  } catch (error) {
    if (createdRule) {
      rmSync(createdRule.filePath);
    }
    throw error;
  }
}

function prepareJournalDestination(journalPath) {
  mkdirSync(path.dirname(journalPath), { recursive: true });
  const journalFile = openSync(journalPath, 'a');
  closeSync(journalFile);
}

function validateDecision(decision) {
  if (decision == null || typeof decision !== 'object' || Array.isArray(decision)) {
    throw new Error('Decision must be an object');
  }
  if (!Number.isInteger(decision.findingNumber) || decision.findingNumber < 1) {
    throw new Error('Decision findingNumber must be a positive integer');
  }
  if (!DISPOSITIONS.has(decision.disposition)) {
    throw new Error('Decision has an unsupported disposition');
  }
  for (const field of DECISION_STRING_FIELDS) {
    if (typeof decision[field] !== 'string' || decision[field].trim() === '') {
      throw new Error(`Decision ${field} must be a non-empty string`);
    }
  }
  if (decision.disposition === 'adopt-rule-and-fix') {
    validateRule(decision.rule);
  } else if (Object.hasOwn(decision, 'rule')) {
    throw new Error('Only Adopt Rule and Fix decisions may include a Rule');
  }
}

function validateRule(rule) {
  if (rule == null || typeof rule !== 'object' || Array.isArray(rule)) {
    throw new Error('Rule generation failed: Rule must be an object');
  }
  for (const field of RULE_STRING_FIELDS) {
    if (typeof rule[field] !== 'string' || rule[field].trim() === '') {
      throw new Error(`Rule generation failed: ${field} must be a non-empty string`);
    }
  }
  for (const field of RULE_METADATA_STRING_FIELDS) {
    if (/[\r\n]/.test(rule[field])) {
      throw new Error(`Rule generation failed: ${field} must not contain line breaks`);
    }
  }
  if (!RULE_ID_PATTERN.test(rule.id)) {
    throw new Error('Rule generation failed: id must use lowercase letters, numbers, and hyphens');
  }
  if (!Array.isArray(rule.triggers) || rule.triggers.length === 0
    || rule.triggers.some((trigger) => typeof trigger !== 'string'
      || trigger.trim() === '' || /[\r\n]/.test(trigger))) {
    throw new Error('Rule generation failed: triggers must be a non-empty string list');
  }
}

function createActiveRule(rulesDirectory, rule) {
  const filename = `${rule.id}.md`;
  const rulePath = path.join(rulesDirectory, filename);
  if (existsSync(rulePath)) {
    throw new Error(`Rule generation failed: ${filename} already exists`);
  }

  mkdirSync(rulesDirectory, { recursive: true });
  writeFileSync(rulePath, renderRule(rule), { flag: 'wx' });
  return {
    filePath: rulePath,
    journalPath: path.posix.join('.github', 'review-gate', 'rules', filename),
  };
}

function renderRule(rule) {
  return [
    '---',
    `id: ${rule.id}`,
    `title: ${rule.title}`,
    'status: active',
    `scope: ${rule.scope}`,
    'triggers:',
    ...rule.triggers.map((trigger) => `  - ${trigger}`),
    `summary: ${rule.summary}`,
    '---',
    '',
    '## Decision criteria',
    '',
    rule.criteria,
    '',
    '## Rationale',
    '',
    rule.rationale,
    '',
    '## Exceptions',
    '',
    rule.exceptions,
    '',
    '## Examples',
    '',
    rule.examples,
    '',
    '## Review guidance',
    '',
    rule.reviewGuidance,
    '',
  ].join('\n');
}
