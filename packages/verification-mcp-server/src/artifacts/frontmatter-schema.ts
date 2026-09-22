import { z } from "zod";
import { ERROR_CODES } from "../errors/error-codes.js";
import { VerificationError } from "../errors/verification-error.js";

const nonEmptyString = z.string().min(1);
const nonEmptyStringArray = z.array(nonEmptyString);

export const PHASE_FRONTMATTER_SCHEMA = z
  .object({
    phaseId: nonEmptyString,
    sliceIds: nonEmptyStringArray,
    acceptanceChecks: nonEmptyStringArray,
  })
  .strict();

export const SLICE_FRONTMATTER_SCHEMA = z
  .object({
    sliceId: nonEmptyString,
    phaseId: nonEmptyString,
    kind: z.enum(["behavior", "non_behavior"]),
    filesInScope: nonEmptyStringArray,
    unitVerificationCommand: nonEmptyString,
    integrationVerificationCommand: nonEmptyString.optional(),
    acceptanceChecks: nonEmptyStringArray,
  })
  .strict();

/**
 * Validates raw frontmatter data against a typed contract, failing closed on the
 * first unknown field or the first missing/wrongly-typed required field.
 */
export function validateFrontmatter<T>(
  schema: z.ZodType<T>,
  data: unknown,
  artifactPath: string,
): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const unknownFieldIssue = result.error.issues.find(
    (issue): issue is z.ZodIssue & { code: "unrecognized_keys"; keys: string[] } =>
      issue.code === "unrecognized_keys",
  );
  if (unknownFieldIssue) {
    const field = unknownFieldIssue.keys[0];
    throw new VerificationError({
      code: ERROR_CODES.ARTIFACT_FIELD_UNKNOWN,
      message: `Artifact frontmatter has an unknown field "${field}": ${artifactPath}`,
      details: { artifactPath, field },
    });
  }

  const firstIssue = result.error.issues[0];
  const field = firstIssue.path.join(".") || "(root)";
  throw new VerificationError({
    code: ERROR_CODES.ARTIFACT_FIELD_INVALID,
    message: `Artifact frontmatter field "${field}" is missing or has the wrong type: ${artifactPath}`,
    details: { artifactPath, field },
  });
}
