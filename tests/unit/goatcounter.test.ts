import test from "node:test";
import assert from "node:assert/strict";
import {
  goatCounterIsConfigured,
  trackGoatCounterPage,
} from "../../src/services/analytics/goatcounter.ts";

test("GoatCounter is disabled when no endpoint is configured", () => {
  assert.equal(goatCounterIsConfigured(), false);
  assert.doesNotThrow(() => trackGoatCounterPage("/dataQuery"));
});
