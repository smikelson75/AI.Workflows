/**
 * Resolved, validated repository root. Pure data; no filesystem or process access.
 */
export interface RepoRoot {
  readonly path: string;
}
