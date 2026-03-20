import test from "node:test";
import assert from "node:assert/strict";

import {
  findMetadataProblems,
  formatResult
} from "../../scripts/check-work-item-metadata.js";

test("findMetadataProblems accepts complete planning metadata", () => {
  const labels = [
    "dept/planning",
    "type/docs",
    "owner:albatross",
    "priority/P1",
    "status/in-review",
    "stream/planning-sync",
    "stream/review-burndown",
    "work/epic-gates"
  ];

  assert.deepEqual(findMetadataProblems(labels, "M1 Contract Freeze + Upload"), []);
});

test("findMetadataProblems reports duplicates and omissions", () => {
  const labels = [
    "dept/qa",
    "type/test",
    "owner:avery",
    "owner:albatross",
    "priority/P1",
    "stream/qa-handoff"
  ];

  assert.deepEqual(findMetadataProblems(labels, ""), [
    "owner=2",
    "status=0",
    "work=0",
    "milestone=0"
  ]);
});

test("formatResult includes the detected problems", () => {
  const result = formatResult({
    number: 999,
    title: "queue audit",
    html_url: "https://example.com/pr/999",
    labels: [
      { name: "dept/planning" },
      { name: "dept/qa" },
      { name: "type/chore" },
      { name: "owner:albatross" },
      { name: "priority/P1" },
      { name: "status/ready-next" },
      { name: "stream/planning-sync" },
      { name: "work/epic-gates" }
    ],
    milestone: null
  });

  assert.equal(result.department, "dept/planning");
  assert.deepEqual(result.problems, ["dept=2", "milestone=0"]);
});
