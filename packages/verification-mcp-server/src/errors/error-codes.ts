/**
 * Registry of every stable, machine-readable error identifier the package can emit.
 */
export const ERROR_CODES = {
  REPO_PATH_MISSING: "REPO_PATH_MISSING",
  REPO_PATH_NOT_FOUND: "REPO_PATH_NOT_FOUND",
  REPO_PATH_NOT_A_DIRECTORY: "REPO_PATH_NOT_A_DIRECTORY",
  REPO_PATH_NOT_A_GIT_REPOSITORY: "REPO_PATH_NOT_A_GIT_REPOSITORY",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
