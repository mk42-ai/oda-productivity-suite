// Lane D 2026-10-21 cycle 5 — backoff recovery & schedule verification (tests/unit/plugin-availability-recovery.test.ts).
// Run: node --experimental-strip-types tests/unit/plugin-availability-recovery.test.ts
import assert from "node:assert/strict";
import {
  backoffMinutes,
  recordPluginFailure,
  recordPluginSuccess,
  pluginAvailability,
  shouldAttachPlugin,
  resetPluginAvailability,
  BACKOFF_MAX_MIN,
  BACKOFF_SCHEDULE_MIN,
} from "../../src/lib/ondemand/plugin-availability.ts";

const ID = "plugin-1722260873";

// 1. Clean slate
resetPluginAvailability();
assert.equal(shouldAttachPlugin(ID), true);
assert.deepEqual(pluginAvailability(ID), {
  id: ID,
  available: true,
  reason: "ok",
  lastError: null,
  lastFailureAt: null,
  failures: 0,
  backoffMinutes: null,
  nextRetryAt: null,
});

// 2. Schedule pure function check: 1 -> 2 -> 4 -> 8 -> 16 -> 30, capped at 30
assert.deepEqual(BACKOFF_SCHEDULE_MIN, [1, 2, 4, 8, 16, 30]);
assert.equal(BACKOFF_MAX_MIN, 30);
const expectedGrowth = [1, 2, 4, 8, 16, 30, 30, 30, 30];
for (let i = 0; i < expectedGrowth.length; i++) {
  assert.equal(backoffMinutes(i + 1), expectedGrowth[i], `backoffMinutes(${i + 1}) should equal ${expectedGrowth[i]}`);
}

// 3. Timed failure progression: 1 -> 2 -> 4 -> 8 -> 16 -> 30 min (capped at 30)
const T0 = Date.parse("2026-10-21T12:00:00.000Z");
let t = T0;

// Progression array: [failureNumber, expectedBackoffMinutes, expectedWaitMs]
const steps = [
  { failure: 1, mins: 1 },
  { failure: 2, mins: 2 },
  { failure: 3, mins: 4 },
  { failure: 4, mins: 8 },
  { failure: 5, mins: 16 },
  { failure: 6, mins: 30 },
  { failure: 7, mins: 30 }, // capped at 30
  { failure: 8, mins: 30 }, // capped at 30
];

for (const step of steps) {
  // Advance simulated clock past burst window (e.g. 60s) to count as a new failure step
  t += 60_000;
  const state = recordPluginFailure(ID, `Credit failure step ${step.failure}`, t);

  assert.equal(state.failures, step.failure);
  assert.equal(state.backoffMinutes, step.mins);
  assert.equal(state.available, false);
  assert.equal(state.reason, "backoff");

  const expectedRetry = new Date(t + step.mins * 60_000).toISOString();
  assert.equal(state.nextRetryAt, expectedRetry);

  // Proving: after N failures the plugin is skipped until nextRetryAt
  const nextRetryMs = t + step.mins * 60_000;
  assert.equal(shouldAttachPlugin(ID, nextRetryMs - 1_000), false);
  assert.equal(pluginAvailability(ID, nextRetryMs - 1_000).available, false);
  assert.equal(pluginAvailability(ID, nextRetryMs - 1_000).reason, "backoff");

  // Proving: at nextRetryAt exactly one probe is allowed (shouldAttachPlugin true)
  assert.equal(shouldAttachPlugin(ID, nextRetryMs), true);
  const probeState = pluginAvailability(ID, nextRetryMs);
  assert.equal(probeState.available, true);
  assert.equal(probeState.reason, "retry-window");
  assert.equal(probeState.failures, step.failure);
  assert.equal(probeState.nextRetryAt, expectedRetry);
}

// 4. Proving: recordPluginSuccess resets to available/ok with failures 0 and nextRetryAt null
recordPluginSuccess(ID);
const clearedState = pluginAvailability(ID);
assert.equal(clearedState.available, true);
assert.equal(clearedState.reason, "ok");
assert.equal(clearedState.failures, 0);
assert.equal(clearedState.backoffMinutes, null);
assert.equal(clearedState.nextRetryAt, null);
assert.equal(clearedState.lastError, null);
assert.equal(clearedState.lastFailureAt, null);
assert.equal(shouldAttachPlugin(ID), true);

// 5. Subsequent failure starts back at 1 minute
t += 120_000;
const freshFailure = recordPluginFailure(ID, "Subsequent credit error", t);
assert.equal(freshFailure.failures, 1);
assert.equal(freshFailure.backoffMinutes, 1);
assert.equal(freshFailure.nextRetryAt, new Date(t + 60_000).toISOString());

resetPluginAvailability();
console.log("plugin-availability-recovery.test.ts: all recovery & schedule assertions passed");
