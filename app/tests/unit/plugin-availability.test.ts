// Lane D 2026-10-21 — backoff schedule for the pinned web-research plugin (src/lib/ondemand/plugin-availability.ts).
// Run: node --experimental-strip-types tests/unit/plugin-availability.test.ts   (or node node_modules/tsx/dist/cli.mjs … when tsx is installed)
import assert from "node:assert/strict";
import { backoffMinutes, recordPluginFailure, recordPluginSuccess, pluginAvailability, shouldAttachPlugin, resetPluginAvailability, BACKOFF_MAX_MIN } from "../../src/lib/ondemand/plugin-availability.ts";

const ID = "plugin-1722260873";
resetPluginAvailability();
// schedule 1 → 2 → 4 → 8 → 16 → 30 (cap)
assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 12].map(backoffMinutes), [1, 2, 4, 8, 16, 30, 30, 30]);
assert.equal(backoffMinutes(0), 1);
assert.equal(BACKOFF_MAX_MIN, 30);
// fresh → available
assert.equal(shouldAttachPlugin(ID), true);
assert.equal(pluginAvailability(ID).reason, "ok");
// 1st failure at T → window 1 min
const T = Date.parse("2026-10-21T13:00:00Z");
let a = recordPluginFailure(ID, "Not enough credits", T);
assert.equal(a.available, false); assert.equal(a.reason, "backoff"); assert.equal(a.failures, 1); assert.equal(a.backoffMinutes, 1);
assert.equal(a.nextRetryAt, "2026-10-21T13:01:00.000Z");
assert.equal(shouldAttachPlugin(ID, T + 59_000), false);
assert.equal(shouldAttachPlugin(ID, T + 60_000), true); // window elapsed → probe run allowed
assert.equal(pluginAvailability(ID, T + 60_000).reason, "retry-window");
// 2nd..6th failures double, capped at 30
a = recordPluginFailure(ID, "Not enough credits", T + 60_000); assert.equal(a.backoffMinutes, 2); assert.equal(a.nextRetryAt, "2026-10-21T13:03:00.000Z");
// a burst of failures within 30 s (parallel runs hitting the same outage) is ONE step
a = recordPluginFailure(ID, "x", T + 61_000); assert.equal(a.failures, 2); assert.equal(a.backoffMinutes, 2);
a = recordPluginFailure(ID, "x", T + 180_000); assert.equal(a.backoffMinutes, 4);
a = recordPluginFailure(ID, "x", T + 420_000); assert.equal(a.backoffMinutes, 8);
a = recordPluginFailure(ID, "x", T + 900_000); assert.equal(a.backoffMinutes, 16);
a = recordPluginFailure(ID, "x", T + 1_900_000); assert.equal(a.backoffMinutes, 30); assert.equal(a.nextRetryAt, new Date(T + 1_900_000 + 30 * 60_000).toISOString());
a = recordPluginFailure(ID, "x", T + 3_800_000); assert.equal(a.backoffMinutes, 30); assert.equal(a.failures, 7);
// success resets everything
recordPluginSuccess(ID);
assert.equal(pluginAvailability(ID).failures, 0); assert.equal(shouldAttachPlugin(ID), true);
// reason text is bounded (no payload leaks)
a = recordPluginFailure(ID, "y".repeat(2000)); assert.equal(a.lastError!.length, 400);
resetPluginAvailability();
console.log("plugin-availability.test.ts: all assertions passed");
