import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  formatEpic2OnboardingEvidence,
  parseEpic2OnboardingEvidenceArgs,
  writeEpic2OnboardingArtifacts
} from "../../src/runtime/onboarding-evidence.js";

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

test("writeEpic2OnboardingArtifacts persists markdown, summary, and contract-drift files", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "onboarding-evidence-"));
  const artifactPaths = await writeEpic2OnboardingArtifacts({
    markdown: "## Epic #2 onboarding smoke evidence\n--avery",
    outputDir,
    summary: {
      status: "ok",
      agentId: "agent_support_triage_agent"
    },
    contractDrift: {
      command: "npm run check:contract-drift",
      route: "/v1/agents/bundles"
    }
  });

  assert.equal(
    artifactPaths.markdownPath,
    path.join(outputDir, "epic2-onboarding-evidence.md")
  );
  assert.equal(
    artifactPaths.summaryPath,
    path.join(outputDir, "onboarding-smoke-summary.json")
  );
  assert.equal(
    artifactPaths.contractDriftPath,
    path.join(outputDir, "onboarding-contract-drift.json")
  );

  const markdown = await readFile(artifactPaths.markdownPath, "utf8");
  const summary = JSON.parse(await readFile(artifactPaths.summaryPath, "utf8"));
  const contractDrift = JSON.parse(await readFile(artifactPaths.contractDriftPath, "utf8"));

  assert.match(markdown, /## Epic #2 onboarding smoke evidence/);
  assert.match(markdown, /--avery/);
  assert.equal(summary.agentId, "agent_support_triage_agent");
  assert.equal(contractDrift.route, "/v1/agents/bundles");
});

test("parseEpic2OnboardingEvidenceArgs accepts signature and output directory flags", () => {
  assert.deepEqual(
    parseEpic2OnboardingEvidenceArgs([
      "--signature",
      "avery",
      "--output-dir",
      "./artifacts/onboarding"
    ]),
    {
      signature: "avery",
      outputDir: "./artifacts/onboarding"
    }
  );
});

test("parseEpic2OnboardingEvidenceArgs rejects missing flag values and unknown flags", () => {
  assert.throws(
    () => parseEpic2OnboardingEvidenceArgs(["--signature"]),
    /missing value for --signature/
  );
  assert.throws(
    () => parseEpic2OnboardingEvidenceArgs(["--output-dir", "--signature"]),
    /missing value for --output-dir/
  );
  assert.throws(
    () => parseEpic2OnboardingEvidenceArgs(["--unknown"]),
    /unknown argument: --unknown/
  );
});

test("onboarding-evidence CLI exits non-zero for invalid args", () => {
  const cliPath = fileURLToPath(
    new URL("../../src/runtime/onboarding-evidence.js", import.meta.url)
  );
  const result = spawnSync(process.execPath, [cliPath, "--output-dir", "--signature", "avery"], {
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing value for --output-dir/);
});
