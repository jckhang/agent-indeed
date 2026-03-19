import test from "node:test";
import assert from "node:assert/strict";

import {
  formatIssue11Evidence,
  runIssue11Evidence
} from "../../src/runtime/issue11-evidence.js";

test("formatIssue11Evidence includes the smoke summary, logs, and signature", () => {
  const markdown = formatIssue11Evidence({
    summary: {
      command: "npm run smoke:dispatch",
      scenarios: [
        {
          name: "happy-path",
          status: "PASS",
          taskId: "task_00000001",
          bidId: "bid_00000001",
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
          awardBlocked: "TASK_AWARD_PRECONDITION_FAILED"
        }
      ]
    },
    logLines: ["[happy-path] PASS task-awarded", "[negative-paths] PASS award-blocked"],
    signature: "avery"
  });

  assert.match(markdown, /## Issue #11 executable smoke evidence/);
  assert.match(markdown, /`task_00000001`/);
  assert.match(markdown, /TRACE_SIGNATURE_INVALID/);
  assert.match(markdown, /TASK_AWARD_PRECONDITION_FAILED/);
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
  assert.match(outputs[0], /## Issue #11 executable smoke evidence/);
});
