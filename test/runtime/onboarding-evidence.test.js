import test from "node:test";
import assert from "node:assert/strict";

import { formatEpic2OnboardingEvidence } from "../../src/runtime/onboarding-evidence.js";

test("formatEpic2OnboardingEvidence includes the smoke summary, contract drift, and signature", () => {
  const markdown = formatEpic2OnboardingEvidence({
    summary: {
      status: "ok",
      baseUrl: "http://127.0.0.1:43123",
      agentId: "agent_support_triage_agent",
      version: "1.2.0",
      replayStrategy: "RETURN_EXISTING_ON_HASH_MATCH",
      mismatchCode: "AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH"
    },
    logLines: [
      "PASS POST /v1/agents/bundles -> agent_support_triage_agent@1.2.0",
      "PASS replay /v1/agents/bundles -> RETURN_EXISTING_ON_HASH_MATCH",
      "PASS payload hash mismatch -> AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH"
    ],
    contractDrift: {
      command: "npm run check:contract-drift",
      route: "/v1/agents/bundles",
      routeAnchor: "src/api/openapi.yaml:68"
    },
    signature: "avery"
  });

  assert.match(markdown, /## Epic #2 onboarding smoke evidence/);
  assert.match(markdown, /`#206`/);
  assert.match(markdown, /`npm run smoke:onboarding`/);
  assert.match(markdown, /`npm run --silent smoke:issue11 -- --signature avery`/);
  assert.match(markdown, /`http:\/\/127\.0\.0\.1:43123`/);
  assert.match(markdown, /`agent_support_triage_agent`/);
  assert.match(markdown, /RETURN_EXISTING_ON_HASH_MATCH/);
  assert.match(markdown, /AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH/);
  assert.match(markdown, /`\/v1\/agents\/bundles`/);
  assert.match(markdown, /`src\/api\/openapi\.yaml:68`/);
  assert.match(markdown, /--avery/);
});
