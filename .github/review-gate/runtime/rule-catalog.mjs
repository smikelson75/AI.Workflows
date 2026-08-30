import { closeSync, openSync, readFileSync, readSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REQUIRED_FIELDS = ['id', 'title', 'status', 'scope', 'triggers', 'summary'];
const OPTIONAL_FIELDS = ['language', 'tags'];
const REQUIRED_SECTIONS = {
  'Decision criteria': 'criteria',
  Rationale: 'rationale',
  Exceptions: 'exceptions',
  Examples: 'examples',
  'Review guidance': 'reviewGuidance',
};

/**
 * Returns validated metadata for active Markdown Rules without reading their bodies.
 *
 * @param {string | URL} rulesDirectory
 * @returns {Array<object>}
 */
export function loadActiveRuleMetadata(rulesDirectory) {
  return readRuleMetadata(rulesDirectory)
    .filter((metadata) => metadata.status === 'active')
    .map(compactMetadata);
}

/**
 * Returns the complete policy content for one active Markdown Rule.
 *
 * @param {string | URL} rulesDirectory
 * @param {string} ruleId
 * @returns {object}
 */
export function loadActiveRule(rulesDirectory, ruleId) {
  const directory = normaliseDirectory(rulesDirectory);
  const selected = readRuleMetadata(directory)
    .find((rule) => rule.id === ruleId && rule.status === 'active');

  if (!selected) {
    throw new Error(`Active Rule ${ruleId} was not found`);
  }

  return {
    ...compactMetadata(selected),
    ...readRuleSections(`${directory}/${selected.filename}`),
  };
}

function readRuleMetadata(rulesDirectory) {
  const directory = normaliseDirectory(rulesDirectory);
  const entries = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .sort((left, right) => left.name.localeCompare(right.name));

  return entries.map((entry) => {
    const metadata = readFrontmatter(`${directory}/${entry.name}`);
    validateMetadata(metadata, entry.name);
    return { ...metadata, filename: entry.name };
  });
}

function normaliseDirectory(rulesDirectory) {
  return rulesDirectory instanceof URL
    ? fileURLToPath(rulesDirectory)
    : rulesDirectory;
}

function readFrontmatter(path) {
  const descriptor = openSync(path, 'r');

  try {
    const openingLine = readLine(descriptor, 0);
    if (openingLine.line !== '---') {
      throw new Error(`Rule ${path} must begin with YAML frontmatter`);
    }

    const lines = [];
    let position = openingLine.nextPosition;

    while (true) {
      const result = readLine(descriptor, position);
      if (result.line === null) {
        throw new Error(`Rule ${path} has unterminated YAML frontmatter`);
      }
      if (result.line === '---') {
        return parseFrontmatter(lines, path);
      }
      lines.push(result.line);
      position = result.nextPosition;
    }
  } finally {
    closeSync(descriptor);
  }
}

function readLine(descriptor, position) {
  const byte = Buffer.alloc(1);
  let line = '';
  let offset = position;

  while (readSync(descriptor, byte, 0, 1, offset) === 1) {
    offset += 1;
    if (byte[0] === 10) {
      return { line: line.endsWith('\r') ? line.slice(0, -1) : line, nextPosition: offset };
    }
    line += String.fromCharCode(byte[0]);
  }

  return line === '' ? { line: null, nextPosition: offset } : { line, nextPosition: offset };
}

function parseFrontmatter(lines, path) {
  const metadata = {};
  let listKey;

  for (const line of lines) {
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const listItem = /^  - (.+)$/.exec(line);
    if (listItem && listKey) {
      metadata[listKey].push(listItem[1]);
      continue;
    }

    const field = /^([A-Za-z][A-Za-z0-9_-]*):(?: (.*))?$/.exec(line);
    if (!field) {
      throw new Error(`Rule ${path} has invalid YAML frontmatter`);
    }

    const [, key, value] = field;
    if (Object.hasOwn(metadata, key)) {
      throw new Error(`Rule ${path} repeats metadata field ${key}`);
    }
    metadata[key] = value === undefined ? [] : unquote(value);
    listKey = value === undefined ? key : undefined;
  }

  return metadata;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function validateMetadata(metadata, filename) {
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(metadata, field)) {
      throw new Error(`Invalid active Rule metadata in ${filename}: missing ${field}`);
    }
  }

  for (const field of ['id', 'title', 'status', 'scope', 'summary']) {
    if (typeof metadata[field] !== 'string' || metadata[field] === '') {
      throw new Error(`Invalid active Rule metadata in ${filename}: ${field} must be a non-empty string`);
    }
  }

  if (!Array.isArray(metadata.triggers) || metadata.triggers.length === 0
    || metadata.triggers.some((trigger) => typeof trigger !== 'string' || trigger === '')) {
    throw new Error(`Invalid active Rule metadata in ${filename}: triggers must be a non-empty string list`);
  }

  if (Object.hasOwn(metadata, 'language')
    && (typeof metadata.language !== 'string' || metadata.language === '')) {
    throw new Error(`Invalid active Rule metadata in ${filename}: language must be a non-empty string`);
  }

  if (Object.hasOwn(metadata, 'tags')
    && (!Array.isArray(metadata.tags)
      || metadata.tags.some((tag) => typeof tag !== 'string' || tag === ''))) {
    throw new Error(`Invalid active Rule metadata in ${filename}: tags must be a string list`);
  }
}

function compactMetadata(metadata) {
  const compact = {};
  for (const field of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
    if (Object.hasOwn(metadata, field)) {
      compact[field] = metadata[field];
    }
  }
  return compact;
}

function readRuleSections(path) {
  const content = readFileSync(path, 'utf8');
  const bodyStart = content.indexOf('\n---', 3);
  const body = bodyStart === -1 ? '' : content.slice(bodyStart + 4);
  const headings = [...body.matchAll(/^## (.+?)\r?$/gm)];
  const sections = {};

  for (let index = 0; index < headings.length; index += 1) {
    const [, heading] = headings[index];
    const key = REQUIRED_SECTIONS[heading];
    if (!key) {
      continue;
    }

    const start = headings[index].index + headings[index][0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : body.length;
    sections[key] = body.slice(start, end).trim();
  }

  for (const [heading, key] of Object.entries(REQUIRED_SECTIONS)) {
    if (!sections[key]) {
      throw new Error(`Rule ${path} is missing ${heading}`);
    }
  }

  return sections;
}
