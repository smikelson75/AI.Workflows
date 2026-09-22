import assert from "node:assert/strict";
import { test } from "node:test";
import { ERROR_CODES } from "../../src/errors/error-codes.js";
import { VerificationError } from "../../src/errors/verification-error.js";

test("sets its name to VerificationError and carries the given code/message/details", () => {
  const error = new VerificationError({
    code: ERROR_CODES.ARTIFACT_NOT_FOUND,
    message: "example message",
    details: { key: "value" },
  });

  assert.equal(error.name, "VerificationError");
  assert.equal(error.message, "example message");
  assert.equal(error.code, ERROR_CODES.ARTIFACT_NOT_FOUND);
  assert.deepEqual(error.details, { key: "value" });
});

test("defaults details to an empty object when omitted", () => {
  const error = new VerificationError({
    code: ERROR_CODES.ARTIFACT_NOT_FOUND,
    message: "example message",
  });

  assert.deepEqual(error.details, {});
});
