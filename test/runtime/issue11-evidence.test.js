import test from "node:test";
import assert from "node:assert/strict";

import {
  formatIssue11Evidence,
  runIssue11Evidence
} from "../../src/runtime/issue11-evidence.js";

test("formatIssue11Evidence includes the canonical issue #11 packet fields", () => {
  const markdown = formatIssue11Evidence({
    summary: {
      command: "npm run smoke:dispatch",
      scenarios: [
        {
          name: "happy-path",
          status: "PASS",
          taskId: "task_00000001",
          bidId: "bid_00000001",
          proofId: "proof_00000001",
          policyTraceId: "policytrace_00000001",
          decisionTraceHash: "sha256:happy",
          awardAuditId: "audit_00000005",
          verificationResult: "PASS"
        },
        {
          name: "invalid-signature",
          status: "PASS",
          result: "PROOF_VERIFY_FAILED",
          reasonCodes: ["TRACE_SIGNATURE_INVALID"]
        },
        {
          name: "negative-paths",
          status: "PASS",
          revealWithoutCommit: "BID_REVEAL_COMMIT_NOT_FOUND",
          proofFail: "PROOF_VERIFY_FAILED",
          awardBlocked: "TASK_AWARD_PRECONDITION_FAILED",
          proofFailReasonCodes: [
            "QUALITY_SCORE_BELOW_MINIMUM",
            "HASHCASH_BITS_BELOW_MINIMUM"
          ]
        }
      ]
    },
    logLines: ["[happy-path] PASS task-awarded", "[negative-paths] PASS award-blocked"],
    signature: "avery"
  });

  assert.match(markdown, /## Issue #11 executable smoke evidence/);
  assert.match(markdown, /Evidence command: `npm run --silent smoke:issue11 -- --signature avery`/);
  assert.match(markdown, /Underlying smoke suite: `npm run smoke:dispatch`/);
  assert.match(markdown, /`proof_00000001`/);
  assert.match(markdown, /`policytrace_00000001`/);
  assert.match(markdown, /TRACE_SIGNATURE_INVALID/);
  assert.match(markdown, /QUALITY_SCORE_BELOW_MINIMUM/);
  assert.match(markdown, /--avery/);
});

test("runIssue11Evidence returns the smoke markdown packet", async () => {
  const outputs = [];
  const result = await runIssue11Evidence({
    signature: "avery",
    log: (line) => {
      outputs.push(line);
    }
  });

  assert.equal(result.summary.status, "ok");
  assert.ok(result.logLines.some((line) => line.includes("PASS task-awarded")));
  assert.match(result.markdown, /## Issue #11 executable smoke evidence/);
  assert.match(result.markdown, /```json/);
  assert.match(result.markdown, /Evidence command: `npm run --silent smoke:issue11 -- --signature avery`/);
  assert.match(outputs[0], /## Issue #11 executable smoke evidence/);
});
