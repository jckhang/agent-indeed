import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  formatIssue11Evidence,
  parseIssue11EvidenceArgs,
  runIssue11Evidence,
  writeIssue11Artifacts
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
          proofId: "proof_00000001",
          policyTraceId: "policytrace_00000001",
          decisionTraceHash: "sha256:happy-path-trace",
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
          proofFailReasonCodes: [
            "QUALITY_SCORE_BELOW_MINIMUM",
            "HASHCASH_BITS_BELOW_MINIMUM"
          ],
          awardBlocked: "TASK_AWARD_PRECONDITION_FAILED"
        }
      ]
    },
    logLines: ["[happy-path] PASS task-awarded", "[negative-paths] PASS award-blocked"],
    signature: "avery"
  });

  assert.match(markdown, /## Issue #11 executable smoke evidence/);
  assert.match(markdown, /`npm run --silent smoke:issue11 -- --signature avery`/);
  assert.match(markdown, /`npm run smoke:dispatch`/);
  assert.match(markdown, /`task_00000001`/);
  assert.match(markdown, /`proof_00000001`/);
  assert.match(markdown, /`policytrace_00000001`/);
  assert.match(markdown, /`sha256:happy-path-trace`/);
  assert.match(markdown, /`audit_00000005`/);
  assert.match(markdown, /TRACE_SIGNATURE_INVALID/);
  assert.match(markdown, /QUALITY_SCORE_BELOW_MINIMUM, HASHCASH_BITS_BELOW_MINIMUM/);
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
  assert.match(result.markdown, /`npm run --silent smoke:issue11 -- --signature avery`/);
  assert.match(result.markdown, /`proof_00000001`/);
  assert.match(result.markdown, /`policytrace_00000001`/);
  assert.match(result.markdown, /```json/);
  assert.match(outputs[0], /## Issue #11 executable smoke evidence/);
});

test("runIssue11Evidence writes markdown and summary artifacts when requested", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "issue11-evidence-"));
  const result = await runIssue11Evidence({
    signature: "avery",
    outputDir,
    log: () => {}
  });

  assert.equal(result.artifactPaths.markdownPath, path.join(outputDir, "issue11-evidence.md"));
  assert.equal(result.artifactPaths.summaryPath, path.join(outputDir, "issue11-summary.json"));
  assert.equal(
    result.artifactPaths.manifestPath,
    path.join(outputDir, "issue11-artifacts-manifest.json")
  );

  const markdown = await readFile(result.artifactPaths.markdownPath, "utf8");
  const summary = JSON.parse(await readFile(result.artifactPaths.summaryPath, "utf8"));
  const manifest = JSON.parse(await readFile(result.artifactPaths.manifestPath, "utf8"));

  assert.match(markdown, /## Issue #11 executable smoke evidence/);
  assert.match(markdown, /--avery/);
  assert.equal(summary.status, "ok");
  assert.equal(summary.scenarios[0].name, "happy-path");
  assert.equal(manifest.evidenceIssue, 11);
  assert.equal(
    manifest.evidenceCommand,
    `npm run --silent smoke:issue11 -- --signature avery --output-dir ${outputDir}`
  );
  assert.equal(manifest.generatedArtifacts.markdownPath, result.artifactPaths.markdownPath);
  assert.equal(manifest.generatedArtifacts.summaryPath, result.artifactPaths.summaryPath);
});

test("writeIssue11Artifacts persists a self-describing manifest alongside exported files", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "issue11-manifest-"));
  const artifactPaths = await writeIssue11Artifacts({
    markdown: "## Issue #11 executable smoke evidence\n--avery",
    outputDir,
    signature: "avery",
    summary: {
      command: "npm run smoke:dispatch",
      status: "ok",
      scenarios: []
    }
  });

  const manifest = JSON.parse(await readFile(artifactPaths.manifestPath, "utf8"));

  assert.equal(manifest.artifactVersion, 1);
  assert.equal(manifest.signature, "avery");
  assert.equal(manifest.smokeCommand, "npm run smoke:dispatch");
  assert.equal(manifest.generatedArtifacts.markdownPath, artifactPaths.markdownPath);
  assert.equal(manifest.generatedArtifacts.summaryPath, artifactPaths.summaryPath);
});

test("parseIssue11EvidenceArgs accepts signature and output directory flags", () => {
  assert.deepEqual(parseIssue11EvidenceArgs([
    "--signature",
    "avery",
    "--output-dir",
    "./artifacts/issue11"
  ]), {
    signature: "avery",
    outputDir: "./artifacts/issue11"
  });
});

test("parseIssue11EvidenceArgs rejects missing flag values and unknown arguments", () => {
  assert.throws(
    () => parseIssue11EvidenceArgs(["--signature"]),
    /missing value for --signature/
  );
  assert.throws(
    () => parseIssue11EvidenceArgs(["--output-dir", "--signature"]),
    /missing value for --output-dir/
  );
  assert.throws(
    () => parseIssue11EvidenceArgs(["--bogus"]),
    /unknown argument: --bogus/
  );
});

test("issue11 evidence CLI exits non-zero for invalid flags", () => {
  const cliPath = fileURLToPath(
    new URL("../../src/runtime/issue11-evidence.js", import.meta.url)
  );
  const result = spawnSync(
    process.execPath,
    [cliPath, "--output-dir", "--signature", "avery"],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing value for --output-dir/);
});
