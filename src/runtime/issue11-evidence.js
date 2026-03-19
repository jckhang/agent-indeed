import { pathToFileURL } from "node:url";
import { runDispatchSmokeSuite } from "./dispatch-smoke.js";

function findScenario(summary, name) {
  return summary.scenarios.find((scenario) => scenario.name === name);
}

function buildEvidenceCommand(signature) {
  return signature
    ? `npm run --silent smoke:issue11 -- --signature ${signature}`
    : "npm run --silent smoke:issue11";
}

export function formatIssue11Evidence({ summary, logLines, signature } = {}) {
  const happyPath = findScenario(summary, "happy-path");
  const invalidSignature = findScenario(summary, "invalid-signature");
  const negativePaths = findScenario(summary, "negative-paths");
  const evidenceLog = logLines.join("\n");
  const signedNote = signature ? `\n--${signature}` : "";
  const evidenceCommand = summary.evidenceCommand ?? buildEvidenceCommand(signature);
  const underlyingCommand = summary.underlyingCommand ?? summary.command;

  return [
    "## Issue #11 executable smoke evidence",
    "",
    `- Evidence command: \`${evidenceCommand}\``,
    `- Underlying smoke suite: \`${underlyingCommand}\``,
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

export async function runIssue11Evidence({ log = console.log, signature } = {}) {
  const logLines = [];
  const dispatchSummary = await runDispatchSmokeSuite({
    command: "npm run smoke:dispatch",
    log: (line) => {
      logLines.push(line);
    }
  });
  const summary = {
    ...dispatchSummary,
    evidenceCommand: buildEvidenceCommand(signature),
    underlyingCommand: dispatchSummary.command
  };
  const markdown = formatIssue11Evidence({
    summary,
    logLines,
    signature
  });

  log(markdown);

  return {
    summary,
    logLines,
    markdown
  };
}

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--signature") {
      options.signature = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));

  runIssue11Evidence(options).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
