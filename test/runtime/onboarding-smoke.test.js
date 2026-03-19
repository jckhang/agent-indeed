import test from "node:test";
import assert from "node:assert/strict";
import { runOnboardingSmoke } from "../../src/runtime/onboarding-smoke.js";

test("onboarding smoke command exercises agent bundle upload happy and replay paths", async () => {
  const lines = [];
  const result = await runOnboardingSmoke({
    serviceName: "test-onboarding-smoke",
    log: (message) => lines.push(message)
  });

  assert.equal(result.agentId, "agent_support_triage_agent");
  assert.equal(result.version, "1.2.0");
  assert.equal(result.replayStrategy, "RETURN_EXISTING_ON_HASH_MATCH");
  assert.equal(result.mismatchCode, "AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH");
  assert.ok(lines.some((line) => line.includes("PASS POST /v1/agents/bundles")));
  assert.ok(lines.some((line) => line.includes("PASS replay /v1/agents/bundles")));
});
