import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryControlPlaneStore } from "../../src/runtime/store/in-memory-control-plane-store.js";

test("store assigns deterministic ids across core lifecycle entities", () => {
  const store = new InMemoryControlPlaneStore({
    now: () => "2026-03-16T00:00:00.000Z"
  });

  const task = store.createTask({
    workspaceId: "workspace-kestrel",
    task: {
      title: "Bootstrap store coverage",
      description: "Exercise the baseline persistence abstractions",
      biddingWindow: {
        commitDeadline: "2026-03-19T00:00:00Z",
        revealDeadline: "2026-03-20T00:00:00Z"
      }
    }
  });
  const bid = store.createBid({
    taskId: task.record.taskId,
    agentId: "agent_kestrel_alpha",
    commit: {
      bidHash: "sha256:123"
    }
  });
  const proof = store.createProof({
    taskId: task.record.taskId,
    bidId: bid.record.bidId,
    proof: {
      proofBundleRef: "proof://bundle/123"
    }
  });
  const award = store.createAward({
    taskId: task.record.taskId,
    bidId: bid.record.bidId,
    award: {
      decision: "ACCEPT"
    }
  });

  assert.equal(task.record.taskId, "task_00000001");
  assert.equal(bid.record.bidId, "bid_00000001");
  assert.equal(proof.record.proofId, "proof_00000001");
  assert.equal(award.record.awardId, "award_00000001");

  const auditEvents = store.listAuditEventsForTask(task.record.taskId);
  assert.deepEqual(
    auditEvents.map((event) => event.auditId),
    [
      "audit_00000001",
      "audit_00000002",
      "audit_00000003",
      "audit_00000004"
    ]
  );
  assert.deepEqual(store.summary(), {
    tasks: 1,
    bids: 1,
    proofs: 1,
    awards: 1,
    auditEvents: 4,
    latestTaskId: "task_00000001",
    latestAuditId: "audit_00000004"
  });
});
