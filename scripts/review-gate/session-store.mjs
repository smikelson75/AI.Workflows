import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SAFE_SESSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/**
 * Tracks, per review session, which Rule IDs were loaded through the
 * hook-enforced `preToolUse` path. State is ephemeral (not the durable
 * Decision Journal) and lives outside the repository by default.
 */

function storePathFor(sessionId) {
  if (typeof sessionId !== 'string' || !SAFE_SESSION_ID_PATTERN.test(sessionId)) {
    throw new TypeError('sessionId must be an opaque identifier containing only letters, numbers, hyphens, or underscores');
  }

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
  writeState(storePathFor(sessionId), { initialized: true, loadedRuleIds: [] });
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
 * Records a configuration failure that blocks the review session.
 *
 * @param {string} sessionId
 * @param {string} reason
 */
export function recordConfigurationFailure(sessionId, reason) {
  const filePath = storePathFor(sessionId);
  const state = readState(filePath);
  state.configurationFailure = reason;
  // A marker-write failure must leave no valid initialized state for stop.
  rmSync(filePath, { force: true });
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

/**
 * Returns whether subagentStart initialized this review session.
 *
 * @param {string} sessionId
 * @returns {boolean}
 */
export function isSessionInitialized(sessionId) {
  return readState(storePathFor(sessionId)).initialized === true;
}

/**
 * Returns the configuration failure blocking a review session, if any.
 *
 * @param {string} sessionId
 * @returns {string | undefined}
 */
export function getConfigurationFailure(sessionId) {
  return readState(storePathFor(sessionId)).configurationFailure;
}
