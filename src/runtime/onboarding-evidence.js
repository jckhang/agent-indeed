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

export async function runEpic2OnboardingEvidence({ log = console.log, signature } = {}) {
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

  log(markdown);

  return {
    summary,
    logLines,
    contractDrift,
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

  runEpic2OnboardingEvidence(options).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
