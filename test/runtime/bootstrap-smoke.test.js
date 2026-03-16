import test from "node:test";
import assert from "node:assert/strict";
import { runBootstrapSmoke } from "../../src/runtime/bootstrap-smoke.js";

test("bootstrap smoke command exercises the local runtime bootstrap path", async () => {
  const lines = [];
  const result = await runBootstrapSmoke({
    serviceName: "test-bootstrap-smoke",
    log: (message) => lines.push(message)
  });

  assert.match(result.taskId, /^task_/);
  assert.equal(result.auditEventCount, 1);
  assert.equal(result.storage.tasks, 1);
  assert.equal(result.storage.auditEvents, 1);
  assert.ok(lines.some((line) => line.includes("PASS /healthz")));
  assert.ok(lines.some((line) => line.includes("PASS POST /v1/tasks")));
});
