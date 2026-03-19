import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildSnapshot, assertNoDrift } from "../../scripts/check-runtime-contract-drift.js";

const ONBOARDING_ROUTE = "/v1/agents/bundles";

function formatCompanionIssue11Command(signature) {
  return signature
    ? `npm run --silent smoke:issue11 -- --signature ${signature}`
    : "npm run --silent smoke:issue11";
}

function buildContractDriftEvidence() {
  const snapshot = buildSnapshot();
  assertNoDrift(snapshot);

  const routeAnchor = snapshot.runtimeRoutes.anchors[ONBOARDING_ROUTE];

  if (!snapshot.runtimeRoutes.published.includes(ONBOARDING_ROUTE) || !routeAnchor) {
    throw new Error(
      `${ONBOARDING_ROUTE} is not published in the current OpenAPI snapshot yet. ` +
        "Merge the onboarding upload route before posting epic #2 onboarding evidence."
    );
  }

  return {
    command: "npm run check:contract-drift",
    route: ONBOARDING_ROUTE,
    routeAnchor
  };
}

export function formatEpic2OnboardingEvidence({
  summary,
  logLines = [],
  contractDrift,
  signature
} = {}) {
  const signedNote = signature ? `\n--${signature}` : "";
  const onboardingCommand = "npm run smoke:onboarding";

  return [
    "## Epic #2 onboarding smoke evidence",
    "",
    "- Evidence issue: `#206`",
    `- Onboarding smoke command: \`${onboardingCommand}\``,
    `- Companion issue #11 command: \`${formatCompanionIssue11Command(signature)}\``,
    `- Contract drift check: \`${contractDrift.command}\``,
    "",
    "### Onboarding smoke summary",
    "",
    `- status: \`${summary.status}\``,
    `- baseUrl: \`${summary.baseUrl}\``,
    `- agentId: \`${summary.agentId}\``,
    `- version: \`${summary.version}\``,
    `- replay strategy: \`${summary.replayStrategy}\``,
    `- payload mismatch code: \`${summary.mismatchCode}\``,
    "",
    "### Contract drift confirmation",
    "",
    `- published route present: \`${contractDrift.route}\``,
    `- OpenAPI anchor: \`${contractDrift.routeAnchor}\``,
    "",
    "### Smoke log",
    "",
    "```text",
    logLines.join("\n"),
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

export async function runEpic2OnboardingEvidence({
  log = console.log,
  outputDir,
  signature
} = {}) {
  let onboardingSmokeModule;

  try {
    onboardingSmokeModule = await import("./onboarding-smoke.js");
  } catch (error) {
    if (error && error.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error(
        "src/runtime/onboarding-smoke.js is not available on this branch yet. " +
          "Run this helper after the onboarding upload smoke path lands on main."
      );
    }

    throw error;
  }

  const logLines = [];
  const summary = await onboardingSmokeModule.runOnboardingSmoke({
    log: (line) => {
      logLines.push(line);
    }
  });
  const contractDrift = buildContractDriftEvidence();
  const markdown = formatEpic2OnboardingEvidence({
    summary: {
      status: "ok",
      command: "npm run smoke:onboarding",
      ...summary
    },
    logLines,
    contractDrift,
    signature
  });
  const artifactPaths = await writeEpic2OnboardingArtifacts({
    markdown,
    outputDir,
    summary,
    contractDrift
  });

  log(markdown);

  return {
    artifactPaths,
    summary,
    logLines,
    contractDrift,
    markdown
  };
}

export async function writeEpic2OnboardingArtifacts({
  markdown,
  outputDir,
  summary,
  contractDrift
} = {}) {
  if (!outputDir) {
    return null;
  }

  const resolvedOutputDir = path.resolve(outputDir);
  const markdownPath = path.join(resolvedOutputDir, "epic2-onboarding-evidence.md");
  const summaryPath = path.join(resolvedOutputDir, "onboarding-smoke-summary.json");
  const contractDriftPath = path.join(resolvedOutputDir, "onboarding-contract-drift.json");

  await mkdir(resolvedOutputDir, { recursive: true });
  await Promise.all([
    writeFile(markdownPath, `${markdown}\n`, "utf8"),
    writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
    writeFile(contractDriftPath, `${JSON.stringify(contractDrift, null, 2)}\n`, "utf8")
  ]);

  return {
    markdownPath,
    summaryPath,
    contractDriftPath
  };
}

export function parseEpic2OnboardingEvidenceArgs(argv) {
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
  const options = parseEpic2OnboardingEvidenceArgs(process.argv.slice(2));

  runEpic2OnboardingEvidence(options).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
