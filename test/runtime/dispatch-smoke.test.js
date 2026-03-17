import test from "node:test";
import assert from "node:assert/strict";
import { runDispatchSmoke } from "../../src/runtime/dispatch-smoke.js";

test("runDispatchSmoke executes the publish to award flow", async () => {
  const logLines = [];
  const result = await runDispatchSmoke({
    log: (line) => {
      logLines.push(line);
    }
  });

  assert.equal(result.taskId, "task_00000001");
  assert.equal(result.bidId, "bid_00000001");
  assert.equal(result.verificationResult, "PASS");
  assert.deepEqual(result.eventTypes, [
    "TASK_CREATED",
    "BID_COMMITTED",
    "BID_REVEALED",
    "POMW_VERIFIED",
    "TASK_AWARDED"
  ]);
  assert.deepEqual(logLines.map((line) => line.split(" :: ")[0]), [
    "PASS task-created",
    "PASS first-match-blocked",
    "PASS candidates-ranked",
    "PASS bid-committed",
    "PASS proof-policy-issued",
    "PASS bid-revealed",
    "PASS proof-verified",
    "PASS award-ready",
    "PASS task-awarded",
    "PASS task-audit-timeline",
    "PASS bid-audit-timeline"
  ]);
});
