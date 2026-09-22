/**
 * Machine-readable frontmatter contract for phase and slice workflow artifacts.
 * Field set is derived from the deterministic-verification report schemas and
 * fail-closed rules under .github/skills/deterministic-verification/.
 */

export type SliceKind = "behavior" | "non_behavior";

export interface PhaseFrontmatter {
  readonly phaseId: string;
  readonly sliceIds: readonly string[];
  readonly acceptanceChecks: readonly string[];
}

export interface SliceFrontmatter {
  readonly sliceId: string;
  readonly phaseId: string;
  readonly kind: SliceKind;
  readonly filesInScope: readonly string[];
  readonly unitVerificationCommand: string;
  readonly integrationVerificationCommand?: string;
  readonly acceptanceChecks: readonly string[];
}

export interface PhaseArtifact {
  readonly path: string;
  readonly frontmatter: PhaseFrontmatter;
  /** The document body, unchanged, with no machine-readable field derived from it. */
  readonly body: string;
}

export interface SliceArtifact {
  readonly path: string;
  readonly frontmatter: SliceFrontmatter;
  /** The document body, unchanged, with no machine-readable field derived from it. */
  readonly body: string;
}
