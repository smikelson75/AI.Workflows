#!/usr/bin/env node
import path from 'node:path';
import { realpathSync } from 'node:fs';

import { loadActiveRule } from '../rule-catalog.mjs';
import { recordConfigurationFailure, recordLoadedRule } from '../session-store.mjs';
import { readStdin, rulesDirectoryFor, writeOutput } from './hook-io.mjs';

/**
 * `preToolUse` hook: the only path through which a full Rule body may be
 * loaded. The Review Subagent must not load Rule bodies directly, so a
 * `view` call targeting a Rule file under the active Rules directory is
 * always denied; the full policy is delivered instead in the deny reason,
 * and the Rule ID is recorded as loaded for the session. Any other tool
 * call is left to its normal permission flow (no-op output).
 */

const RULE_FILENAME_PATTERN = /^([a-z0-9][a-z0-9-]*)\.md$/;

async function main() {
  const raw = await readStdin();

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    deny('preToolUse hook received malformed JSON input');
    return;
  }

  if (input.toolName !== 'view' || input.toolArgs == null || typeof input.toolArgs.path !== 'string') {
    writeOutput({});
    return;
  }

  let rulesDirectory;
  const requestedTarget = path.resolve(input.cwd ?? process.cwd(), input.toolArgs.path);
  let resolvedTarget;
  try {
    rulesDirectory = realpathSync(rulesDirectoryFor(input.cwd));
  } catch {
    writeOutput({});
    return;
  }
  try {
    resolvedTarget = realpathSync(requestedTarget);
  } catch {
    try {
      resolvedTarget = path.join(realpathSync(path.dirname(requestedTarget)), path.basename(requestedTarget));
    } catch {
      writeOutput({});
      return;
    }
  }
  const relativeToRules = path.relative(rulesDirectory, resolvedTarget);

  if (relativeToRules.startsWith('..') || path.isAbsolute(relativeToRules)) {
    writeOutput({});
    return;
  }

  const match = RULE_FILENAME_PATTERN.exec(relativeToRules);
  if (!match) {
    writeOutput({});
    return;
  }

  const ruleId = match[1];

  if (typeof input.sessionId !== 'string' || input.sessionId === '') {
    deny('preToolUse hook could not determine the review session for this Rule load');
    return;
  }

  let rule;
  try {
    rule = loadActiveRule(rulesDirectory, ruleId);
  } catch (error) {
    deny(recordFailure(
      input.sessionId,
      `Rule ${ruleId} could not be loaded: ${error.message}`,
    ));
    return;
  }

  try {
    recordLoadedRule(input.sessionId, ruleId);
  } catch (error) {
    deny(recordFailure(
      input.sessionId,
      `could not record loaded Rule ${ruleId}: ${error.message}`,
    ));
    return;
  }
  deny(
    `Rule ${ruleId} loaded through the hook-enforced path. Review Subagent must not read Rule files `
    + `directly; cite only the following loaded policy:\n${JSON.stringify(rule)}`,
  );
}

function recordFailure(sessionId, detail) {
  try {
    recordConfigurationFailure(sessionId, detail);
    return detail;
  } catch (error) {
    return `${detail}. Could not record the review session configuration failure: ${error.message}`;
  }
}

function deny(reason) {
  writeOutput({ permissionDecision: 'deny', permissionDecisionReason: reason });
}

await main();
