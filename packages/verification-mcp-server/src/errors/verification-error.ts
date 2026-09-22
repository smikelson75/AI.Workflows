import type { ErrorCode } from "./error-codes.js";

export interface VerificationErrorOptions {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Fail-closed error carrying a stable identifier and structured details.
 */
export class VerificationError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown>;

  constructor(options: VerificationErrorOptions) {
    super(options.message);
    this.name = "VerificationError";
    this.code = options.code;
    this.details = options.details ?? {};
  }
}
