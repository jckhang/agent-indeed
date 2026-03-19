import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runDispatchSmokeSuite } from "./dispatch-smoke.js";

function findScenario(summary, name) {
  return summary.scenarios.find((scenario) => scenario.name === name);
}

export function formatIssue11Evidence({ summary, logLines, signature } = {}) {
  const happyPath = findScenario(summary, "happy-path");
  const invalidSignature = findScenario(summary, "invalid-signature");
  const negativePaths = findScenario(summary, "negative-paths");
  const evidenceLog = logLines.join("\n");
  const signedNote = signature ? `\n--${signature}` : "";
  const evidenceCommand = signature
    ? `npm run --silent smoke:issue11 -- --signature ${signature}`
    : "npm run --silent smoke:issue11";

  return [
    "## Issue #11 executable smoke evidence",
    "",
    `- Evidence command: \`${evidenceCommand}\``,
    `- Underlying smoke suite: \`${summary.command}\``,
    "- API examples: `docs/BACKEND_API_EXAMPLE_PACKET.md`",
    "- Handoff contract: `docs/RUNTIME_EXECUTION_HANDOFF.md`",
    "",
    "### Happy path",
    "",
    `- status: ${happyPath.status}`,
    `- taskId: \`${happyPath.taskId}\``,
    `- bidId: \`${happyPath.bidId}\``,
    `- proofId: \`${happyPath.proofId}\``,
    `- policyTraceId: \`${happyPath.policyTraceId}\``,
    `- decisionTraceHash: \`${happyPath.decisionTraceHash}\``,
    `- awardAuditId: \`${happyPath.awardAuditId}\``,
    `- verificationResult: \`${happyPath.verificationResult}\``,
    "",
    "### Negative checks",
    "",
    `- invalid signature: \`${invalidSignature.result}\` (${invalidSignature.reasonCodes.join(", ")})`,
    `- reveal without commit: \`${negativePaths.revealWithoutCommit}\``,
    `- proof fail: \`${negativePaths.proofFail}\` (${negativePaths.proofFailReasonCodes.join(", ")})`,
    `- award blocked: \`${negativePaths.awardBlocked}\``,
    "",
    "### Smoke log",
    "",
    "```text",
    evidenceLog,
    "```",
    "",
    "### Machine-readable summary",
    "",
    "```json",
    JSON.stringify(summary, null, 2),
    "```",
    signedNote
  ].join("\n");
}

export async function runIssue11Evidence({
  log = console.log,
  outputDir,
  signature
} = {}) {
  const logLines = [];
  const summary = await runDispatchSmokeSuite({
    command: "npm run smoke:dispatch",
    log: (line) => {
      logLines.push(line);
    }
  });
  const markdown = formatIssue11Evidence({
    summary,
    logLines,
    signature
  });
  const artifactPaths = await writeIssue11Artifacts({
    markdown,
    outputDir,
    signature,
    summary
  });

  log(markdown);

  return {
    artifactPaths,
    summary,
    logLines,
    markdown
  };
}

export async function writeIssue11Artifacts({
  markdown,
  outputDir,
  signature,
  summary
}) {
  if (!outputDir) {
    return null;
  }

  const resolvedOutputDir = path.resolve(outputDir);
  const markdownPath = path.join(resolvedOutputDir, "issue11-evidence.md");
  const summaryPath = path.join(resolvedOutputDir, "issue11-summary.json");
  const manifestPath = path.join(resolvedOutputDir, "issue11-artifacts-manifest.json");
  const evidenceCommand = signature
    ? `npm run --silent smoke:issue11 -- --signature ${signature} --output-dir ${outputDir}`
    : `npm run --silent smoke:issue11 -- --output-dir ${outputDir}`;
  const manifest = {
    artifactVersion: 1,
    evidenceIssue: 11,
    evidenceCommand,
    smokeCommand: summary.command,
    signature: signature ?? null,
    generatedArtifacts: {
      markdownPath,
      summaryPath
    }
  };

  await mkdir(resolvedOutputDir, { recursive: true });
  await Promise.all([
    writeFile(markdownPath, `${markdown}\n`, "utf8"),
    writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
    writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  ]);

  return {
    manifestPath,
    markdownPath,
    summaryPath
  };
}

export function parseIssue11EvidenceArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--signature" || arg === "--output-dir") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`missing value for ${arg}`);
      }

      if (arg === "--signature") {
        options.signature = value;
      } else {
        options.outputDir = value;
      }

      index += 1;
      continue;
    }

    throw new Error(`unknown argument: ${arg}`);
  }

  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseIssue11EvidenceArgs(process.argv.slice(2));

  runIssue11Evidence(options).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
