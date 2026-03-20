#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const OWNER = "jckhang";
const REPO = "agent-indeed";
const TRACKED_DEPARTMENTS = new Set(["dept/planning", "dept/qa"]);
const EXACTLY_ONE_RULES = [
  { name: "dept", match: (label) => label.startsWith("dept/") },
  { name: "type", match: (label) => label.startsWith("type/") },
  { name: "owner", match: (label) => label.startsWith("owner:") },
  { name: "priority", match: (label) => label.startsWith("priority/") },
  { name: "status", match: (label) => label.startsWith("status/") }
];
const REQUIRED_AT_LEAST_ONE_RULES = [
  { name: "stream", match: (label) => label.startsWith("stream/") },
  { name: "work", match: (label) => label.startsWith("work/") }
];

function parseArgs(argv) {
  const kindArg = argv.find((arg) => arg.startsWith("--kind="));
  const kind = kindArg ? kindArg.slice("--kind=".length) : "all";

  if (!["all", "prs", "issues"].includes(kind)) {
    throw new Error(`Unsupported --kind value: ${kind}`);
  }

  return {
    assert: argv.includes("--assert"),
    kind
  };
}

function readGitHubToken() {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  if (process.env.GH_TOKEN) {
    return process.env.GH_TOKEN;
  }

  try {
    const output = execFileSync(
      "git",
      ["credential", "fill"],
      {
        input: "protocol=https\nhost=github.com\n\n",
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"]
      }
    );
    const passwordLine = output
      .trim()
      .split("\n")
      .find((line) => line.startsWith("password="));
    return passwordLine ? passwordLine.slice("password=".length) : "";
  } catch {
    return "";
  }
}

async function githubFetch(path, token) {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "agent-indeed-metadata-audit",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }

  return response.json();
}

export function findMetadataProblems(labels, milestoneTitle) {
  const problems = [];

  for (const rule of EXACTLY_ONE_RULES) {
    const count = labels.filter(rule.match).length;
    if (count !== 1) {
      problems.push(`${rule.name}=${count}`);
    }
  }

  for (const rule of REQUIRED_AT_LEAST_ONE_RULES) {
    const count = labels.filter(rule.match).length;
    if (count < 1) {
      problems.push(`${rule.name}=0`);
    }
  }

  if (!milestoneTitle) {
    problems.push("milestone=0");
  }

  return problems;
}

export function formatResult(issue) {
  const labels = issue.labels.map((label) => label.name);
  const milestoneTitle = issue.milestone?.title ?? "";
  const problems = findMetadataProblems(labels, milestoneTitle);
  const department = labels.find((label) => TRACKED_DEPARTMENTS.has(label));

  return {
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    department,
    labels,
    milestoneTitle,
    problems
  };
}

function printBucket(title, results) {
  console.log(`${title}: ${results.length}`);
  for (const result of results) {
    const milestone = result.milestoneTitle || "missing";
    const problemSummary = result.problems.length > 0 ? result.problems.join(", ") : "none";
    console.log(
      `- ${result.kind.toUpperCase()} #${result.number} [${result.department}] milestone=${milestone} problems=${problemSummary}`
    );
    console.log(`  ${result.url}`);
  }
}

async function collectTrackedPulls(token) {
  const pulls = await githubFetch("/pulls?state=open&per_page=100", token);
  const tracked = [];

  for (const pull of pulls) {
    const issue = await githubFetch(`/issues/${pull.number}`, token);
    const result = formatResult(issue);

    if (result.department) {
      tracked.push({
        ...result,
        kind: "pr"
      });
    }
  }

  return tracked;
}

async function collectTrackedIssues(token) {
  const issues = await githubFetch("/issues?state=open&per_page=100", token);

  return issues
    .filter((issue) => !issue.pull_request)
    .map(formatResult)
    .filter((result) => result.department)
    .map((result) => ({
      ...result,
      kind: "issue"
    }));
}

export async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = readGitHubToken();
  const trackedPulls = args.kind === "issues" ? [] : await collectTrackedPulls(token);
  const trackedIssues = args.kind === "prs" ? [] : await collectTrackedIssues(token);
  const tracked = [...trackedPulls, ...trackedIssues];
  const unhealthy = tracked.filter((result) => result.problems.length > 0);
  const healthy = tracked.filter((result) => result.problems.length === 0);

  console.log(`Tracked planning/QA work items (${args.kind}): ${tracked.length}`);

  if (trackedPulls.length > 0) {
    printBucket("Healthy PRs", healthy.filter((result) => result.kind === "pr"));
    printBucket("PRs with metadata problems", unhealthy.filter((result) => result.kind === "pr"));
  }

  if (trackedIssues.length > 0) {
    printBucket("Healthy issues", healthy.filter((result) => result.kind === "issue"));
    printBucket("Issues with metadata problems", unhealthy.filter((result) => result.kind === "issue"));
  }

  if (args.assert && unhealthy.length > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
