import test from "node:test";
import assert from "node:assert/strict";
import { runDispatchSmoke, runDispatchSmokeSuite } from "../../src/runtime/dispatch-smoke.js";

test("runDispatchSmoke executes the publish to award flow", async () => {
  const logLines = [];
  const result = await runDispatchSmoke({
    log: (line) => {
      logLines.push(line);
    }
  });

  assert.equal(result.taskId, "task_00000001");
  assert.equal(result.bidId, "bid_00000001");
  assert.equal(result.proofId, "proof_00000001");
  assert.equal(result.policyTraceId, "policytrace_00000001");
  assert.equal(result.verificationResult, "PASS");
  assert.match(result.decisionTraceHash, /^sha256:/);
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

test("runDispatchSmokeSuite executes happy-path and negative smoke scenarios", async () => {
  const logLines = [];
  const result = await runDispatchSmokeSuite({
    log: (line) => {
      logLines.push(line);
    }
  });

  assert.equal(result.status, "ok");
  assert.equal(result.command, "npm run smoke:dispatch");
  assert.deepEqual(
    result.scenarios.map((scenario) => scenario.name),
    ["happy-path", "invalid-signature", "negative-paths"]
  );
  assert.deepEqual(
    result.scenarios.map((scenario) => scenario.status),
    ["PASS", "PASS", "PASS"]
  );
  assert.deepEqual(result.scenarios[0].eventTypes, [
    "TASK_CREATED",
    "BID_COMMITTED",
    "BID_REVEALED",
    "POMW_VERIFIED",
    "TASK_AWARDED"
  ]);
  assert.equal(result.scenarios[0].proofId, "proof_00000001");
  assert.equal(result.scenarios[0].policyTraceId, "policytrace_00000001");
  assert.match(result.scenarios[0].decisionTraceHash, /^sha256:/);
  assert.deepEqual(result.scenarios[1].reasonCodes, ["TRACE_SIGNATURE_INVALID"]);
  assert.equal(result.scenarios[2].revealWithoutCommit, "BID_REVEAL_COMMIT_NOT_FOUND");
  assert.equal(result.scenarios[2].proofFail, "PROOF_VERIFY_FAILED");
  assert.equal(result.scenarios[2].awardBlocked, "TASK_AWARD_PRECONDITION_FAILED");
  assert.equal(result.scenarios[2].proofId, "proof_00000002");
  assert.equal(result.scenarios[2].policyTraceId, "policytrace_00000001");
  assert.deepEqual(result.scenarios[2].proofFailReasonCodes, [
    "QUALITY_SCORE_BELOW_MINIMUM",
    "HASHCASH_BITS_BELOW_MINIMUM"
  ]);
  assert.match(result.scenarios[2].decisionTraceHash, /^sha256:/);
  assert.ok(logLines.some((line) => line.includes("[happy-path] PASS task-awarded")));
  assert.ok(
    logLines.some((line) => line.includes("[invalid-signature] PASS invalid-signature-rejected"))
  );
  assert.ok(
    logLines.some((line) => line.includes("[negative-paths] PASS reveal-without-commit-rejected"))
  );
});
