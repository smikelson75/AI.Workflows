import yaml from "js-yaml";
import { ERROR_CODES } from "../errors/error-codes.js";
import { VerificationError } from "../errors/verification-error.js";

const FRONTMATTER_DELIMITER = "---";

export interface SplitDocument {
  readonly frontmatterText: string;
  readonly body: string;
}

/**
 * Splits a document's leading YAML frontmatter block from its body.
 * Fails closed if the document does not open with a frontmatter block.
 */
export function splitFrontmatter(content: string, artifactPath: string): SplitDocument {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== FRONTMATTER_DELIMITER) {
    throw new VerificationError({
      code: ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING,
      message: `Artifact has no YAML frontmatter block: ${artifactPath}`,
      details: { artifactPath },
    });
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === FRONTMATTER_DELIMITER,
  );
  if (closingIndex === -1) {
    throw new VerificationError({
      code: ERROR_CODES.ARTIFACT_FRONTMATTER_MISSING,
      message: `Artifact frontmatter block is not closed: ${artifactPath}`,
      details: { artifactPath },
    });
  }

  const frontmatterText = lines.slice(1, closingIndex).join("\n");
  const body = lines.slice(closingIndex + 1).join("\n");
  return { frontmatterText, body };
}

/**
 * Parses a YAML frontmatter block into raw data. Fails closed on unparsable YAML.
 */
export function parseFrontmatterYaml(frontmatterText: string, artifactPath: string): unknown {
  try {
    return yaml.load(frontmatterText);
  } catch {
    throw new VerificationError({
      code: ERROR_CODES.ARTIFACT_FRONTMATTER_UNPARSABLE,
      message: `Artifact frontmatter is not valid YAML: ${artifactPath}`,
      details: { artifactPath },
    });
  }
}
