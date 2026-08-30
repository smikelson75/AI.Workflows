import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Tracks, per review session, which Rule IDs were loaded through the
 * hook-enforced `preToolUse` path. State is ephemeral (not the durable
 * Decision Journal) and lives outside the repository by default.
 */

function storePathFor(sessionId) {
  const baseDirectory = process.env.REVIEW_GATE_SESSION_DIR
    ?? path.join(os.tmpdir(), 'review-gate-sessions');
  return path.join(baseDirectory, `${sessionId}.json`);
}

function readState(filePath) {
  if (!existsSync(filePath)) {
    return { loadedRuleIds: [] };
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeState(filePath, state) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(state));
}

/**
 * Starts (or restarts) tracking for a review session with no Rules loaded.
 *
 * @param {string} sessionId
 */
export function resetLoadedRules(sessionId) {
  writeState(storePathFor(sessionId), { loadedRuleIds: [] });
}

/**
 * Records that a Rule's full body was loaded through the hook-enforced path
 * for this review session.
 *
 * @param {string} sessionId
 * @param {string} ruleId
 */
export function recordLoadedRule(sessionId, ruleId) {
  const filePath = storePathFor(sessionId);
  const state = readState(filePath);
  if (!state.loadedRuleIds.includes(ruleId)) {
    state.loadedRuleIds.push(ruleId);
  }
  writeState(filePath, state);
}

/**
 * Returns the Rule IDs loaded through the hook-enforced path for this
 * review session.
 *
 * @param {string} sessionId
 * @returns {string[]}
 */
export function getLoadedRules(sessionId) {
  return readState(storePathFor(sessionId)).loadedRuleIds;
}
