#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const OWNER = "jckhang";
const REPO = "agent-indeed";
const REQUIRED_PREFIXES = ["owner:", "priority/", "status/", "work/"];
const REQUIRED_STREAM_PREFIX = "stream/";
const TRACKED_DEPARTMENTS = new Set(["dept/planning", "dept/qa"]);

function parseArgs(argv) {
  return {
    assert: argv.includes("--assert")
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

function findMissing(labels, milestoneTitle) {
  const missing = [];

  for (const prefix of REQUIRED_PREFIXES) {
    if (!labels.some((label) => label.startsWith(prefix))) {
      missing.push(prefix);
    }
  }

  if (!labels.some((label) => label.startsWith(REQUIRED_STREAM_PREFIX))) {
    missing.push(REQUIRED_STREAM_PREFIX);
  }

  if (!milestoneTitle) {
    missing.push("milestone");
  }

  return missing;
}

function formatResult(issue) {
  const labels = issue.labels.map((label) => label.name);
  const milestoneTitle = issue.milestone?.title ?? "";
  const missing = findMissing(labels, milestoneTitle);
  const department = labels.find((label) => TRACKED_DEPARTMENTS.has(label));

  return {
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    department,
    labels,
    milestoneTitle,
    missing
  };
}

function printBucket(title, results) {
  console.log(`${title}: ${results.length}`);
  for (const result of results) {
    const milestone = result.milestoneTitle || "missing";
    const missingSummary = result.missing.length > 0 ? result.missing.join(", ") : "none";
    console.log(
      `- PR #${result.number} [${result.department}] milestone=${milestone} missing=${missingSummary}`
    );
    console.log(`  ${result.url}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = readGitHubToken();
  const pulls = await githubFetch("/pulls?state=open&per_page=100", token);
  const tracked = [];

  for (const pull of pulls) {
    const issue = await githubFetch(`/issues/${pull.number}`, token);
    const result = formatResult(issue);

    if (result.department) {
      tracked.push(result);
    }
  }

  const missing = tracked.filter((result) => result.missing.length > 0);
  const healthy = tracked.filter((result) => result.missing.length === 0);

  console.log(`Tracked planning/QA PRs: ${tracked.length}`);
  printBucket("Healthy", healthy);
  printBucket("Missing metadata", missing);

  if (args.assert && missing.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
