#!/usr/bin/env node
import { getLoadedRules } from '../session-store.mjs';
import { readStdin, writeOutput } from './hook-io.mjs';

const RULE_CITATION_PATTERN = /\bRule ID:\s*`?([a-z0-9][a-z0-9-]*)`?/gi;

/**
 * `subagentStop` hook: prevents a Review Subagent response from reaching its
 * parent when a Finding cites a Rule that was not loaded through preToolUse.
 */
async function main() {
  const raw = await readStdin();

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    block('subagentStop hook received malformed JSON input');
    return;
  }

  if (typeof input.sessionId !== 'string' || input.sessionId === '') {
    block('subagentStop hook received input without a sessionId');
    return;
  }
  if (typeof input.response !== 'string') {
    block('subagentStop hook received input without a final response');
    return;
  }

  let loadedRules;
  try {
    loadedRules = getLoadedRules(input.sessionId);
  } catch (error) {
    block(`subagentStop hook could not read loaded Rules: ${error.message}`);
    return;
  }
  if (!Array.isArray(loadedRules)) {
    block('subagentStop hook found invalid loaded Rule session state');
    return;
  }

  const citedRules = [...input.response.matchAll(RULE_CITATION_PATTERN)].map((match) => match[1]);
  const unloadedRule = citedRules.find((ruleId) => !loadedRules.includes(ruleId));
  if (unloadedRule) {
    block(`Finding cites Rule ID ${unloadedRule}, which was not loaded through the hook path. `
      + 'Load the Rule before citing it, then return the complete Finding report again.');
    return;
  }

  writeOutput({});
}

function block(reason) {
  writeOutput({ decision: 'block', reason });
}

await main();
