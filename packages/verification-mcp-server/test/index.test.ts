import assert from "node:assert/strict";
import { test } from "node:test";
import { ping } from "../src/index.js";

test("ping returns pong", () => {
  assert.equal(ping(), "pong");
});
