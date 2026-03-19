import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function parseSmokeOutput(stdout) {
  const lines = stdout.trim().split("\n");
  const jsonStart = lines.findIndex((line) => line.trim() === "{");
  assert.notEqual(jsonStart, -1, "expected JSON summary in stdout");

  return {
    lines: lines.slice(0, jsonStart),
    summary: JSON.parse(lines.slice(jsonStart).join("\n"))
  };
}

test("dispatch smoke CLI emits PASS lines and a machine-readable summary", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, ["src/runtime/dispatch-smoke.js"], {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024
  });

  assert.equal(stderr, "");

  const { lines, summary } = parseSmokeOutput(stdout);

  assert.ok(lines.some((line) => line.includes("[happy-path] PASS task-awarded")));
  assert.ok(
    lines.some((line) => line.includes("[invalid-signature] PASS invalid-signature-rejected"))
  );
  assert.ok(
    lines.some((line) => line.includes("[negative-paths] PASS reveal-without-commit-rejected"))
  );

  assert.equal(summary.status, "ok");
  assert.equal(summary.command, "npm run smoke:dispatch");
  assert.deepEqual(
    summary.scenarios.map((scenario) => scenario.name),
    ["happy-path", "invalid-signature", "negative-paths"]
  );
  assert.deepEqual(
    summary.scenarios.map((scenario) => scenario.status),
    ["PASS", "PASS", "PASS"]
  );
});
