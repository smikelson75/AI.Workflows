#!/usr/bin/env node
import { loadActiveRuleMetadata } from '../rule-catalog.mjs';
import { recordConfigurationFailure, resetLoadedRules } from '../session-store.mjs';
import { readStdin, rulesDirectoryFor, writeOutput } from './hook-io.mjs';

/**
 * `subagentStart` hook: injects compact active Rule Metadata into the
 * Review Subagent's prompt before it runs. It cannot block subagent
 * creation, so a configuration failure is surfaced as blocking
 * `additionalContext` instead of a denial (see ADR 0001).
 */

async function main() {
  const raw = await readStdin();

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    writeOutput({ additionalContext: configurationError('received malformed JSON input') });
    return;
  }

  if (typeof input.sessionId !== 'string' || input.sessionId === '') {
    writeOutput({ additionalContext: configurationError('received input without a sessionId') });
    return;
  }

  try {
    resetLoadedRules(input.sessionId);
  } catch (error) {
    writeOutput({
      additionalContext: configurationError(
        recordFailure(input.sessionId, `could not initialize review session state: ${error.message}`),
      ),
    });
    return;
  }

  let rules;
  try {
    rules = loadActiveRuleMetadata(rulesDirectoryFor(input.cwd));
  } catch (error) {
    writeOutput({
      additionalContext: configurationError(recordFailure(
        input.sessionId,
        `Rule Catalog failed to load active Rule Metadata: ${error.message}`,
      )),
    });
    return;
  }

  writeOutput({
    additionalContext: [
      'Active Rule Metadata (compact). To cite a Rule, request its full body through the',
      'preToolUse-enforced load path; you must not load a Rule body directly.',
      JSON.stringify(rules),
    ].join('\n'),
  });
}

function configurationError(detail) {
  return `REVIEW GATE CONFIGURATION ERROR: subagentStart hook ${detail}. `
    + 'Report this as a blocking configuration Finding; review cannot rely on Rule Metadata until it is fixed.';
}

function recordFailure(sessionId, detail) {
  try {
    recordConfigurationFailure(sessionId, detail);
    return detail;
  } catch (error) {
    return `${detail}. Could not record the review session configuration failure: ${error.message}`;
  }
}

await main();
