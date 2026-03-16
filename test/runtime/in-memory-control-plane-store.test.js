import test from "node:test";
import assert from "node:assert/strict";
import {
  InMemoryControlPlaneStore,
  buildCandidateSnapshot
} from "../../src/runtime/store/in-memory-control-plane-store.js";

test("store assigns deterministic ids across the dispatch lifecycle", () => {
  const store = new InMemoryControlPlaneStore({
    now: () => "2026-03-16T00:00:00.000Z"
  });

  const taskSpec = {
    title: "Bootstrap store coverage",
    description: "Exercise the dispatch persistence abstractions",
    budget: {
      currency: "USD",
      minAmount: 100,
      maxAmount: 300
    },
    sla: {
      deadlineAt: "2026-03-20T00:00:00Z",
      maxLatencyMs: 5000
    },
    constraints: {
      identityTierMin: "T1",
      requiredSkills: ["backend", "api"],
      complianceTags: ["soc2"]
    },
    risk: {
      level: "LOW",
      valueScore: 20
    },
    powmPolicy: {
      mode: "AUTO_TIERED",
      baseDifficulty: 2
    },
    biddingWindow: {
      commitDeadline: "2026-03-19T00:00:00Z",
      revealDeadline: "2026-03-20T00:00:00Z"
    }
  };

  const task = store.createTask({
    workspaceId: "workspace-kestrel",
    task: taskSpec
  });
  const snapshot = buildCandidateSnapshot({
    taskId: task.record.taskId,
    task: taskSpec,
    limit: 2
  });
  store.createMatchingSnapshot(task.record.taskId, snapshot.candidates);

  const bid = store.createBidCommit({
    taskId: task.record.taskId,
    agentId: "agent_kestrel_alpha",
    idempotencyKey: "idem-commit-001",
    commit: {
      bidId: "bid_00000001",
      taskId: task.record.taskId,
      agentId: "agent_kestrel_alpha",
      bidHash: "sha256:123",
      committedAt: "2026-03-16T00:00:00.000Z"
    },
    window: {
      currentPhase: "COMMIT_OPEN",
      commitDeadline: task.record.commitDeadline,
      revealDeadline: task.record.revealDeadline,
      serverTime: "2026-03-16T00:00:00.000Z",
      nextAction: "WAIT_FOR_REVEAL_WINDOW"
    }
  });
  const reveal = store.setBidReveal({
    taskId: task.record.taskId,
    bidId: bid.record.bidId,
    agentId: "agent_kestrel_alpha",
    idempotencyKey: "idem-reveal-001",
    proofId: "proof_00000001",
    rankingScore: 0.914,
    decisionTraceHash: "sha256:decision-001",
    reveal: {
      bidId: bid.record.bidId,
      taskId: task.record.taskId,
      agentId: "agent_kestrel_alpha",
      nonce: "nonce-001",
      price: {
        currency: "USD",
        amount: 180
      },
      executionPlan: {
        summary: "Run with backend baseline",
        etaSeconds: 240
      },
      proof: {
        proofSchemaVersion: "1.0",
        proofId: "proof_00000001",
        taskId: task.record.taskId,
        agentId: "agent_kestrel_alpha",
        capturedAt: "2026-03-19T00:10:00.000Z",
        identityProof: {
          credentialLevel: "T1",
          signerDid: "did:key:agent_kestrel_alpha",
          signature: "sig-proof-001"
        },
        sampleWork: {
          sampleTaskDigest: "sha256:sample-task-001",
          outputDigest: "sha256:sample-output-001",
          qualityScore: 0.9,
          runtimeMs: 1200
        },
        executionTrace: {
          traceHash: "sha256:trace-001",
          traceUri: "s3://proofs/trace-001.json",
          traceSignature: "sig-trace-001"
        }
      }
    }
  });
  const policy = store.savePolicyDecision({
    taskId: task.record.taskId,
    agentId: "agent_kestrel_alpha",
    decision: {
      requiredProofStrength: "LOW",
      challengeProfile: "SAMPLE_EXECUTION",
      verifierParams: {
        minSampleCount: 1,
        minQualityScore: 0.55,
        maxRuntimeMs: 180000
      },
      inputSnapshot: {
        taskRiskLevel: "LOW",
        taskValueScore: 20,
        identityTier: "T1",
        trustScore: 0.84
      },
      rationale: ["baseline low-risk verifier threshold"],
      persistedAt: "2026-03-16T00:00:00.000Z"
    }
  });
  const verification = store.recordProofVerification({
    taskId: task.record.taskId,
    bidId: bid.record.bidId,
    proofId: reveal.proof.proofId,
    verification: {
      result: "PASS",
      policyTraceId: policy.policyTraceId,
      requiredDifficulty: 0.55,
      achievedDifficulty: 0.9,
      decisionTraceHash: "sha256:decision-001",
      reasonCodes: [],
      verifiedAt: "2026-03-19T00:15:00.000Z"
    }
  });
  const award = store.createAward({
    taskId: task.record.taskId,
    bidId: bid.record.bidId,
    award: {
      agentId: "agent_kestrel_alpha",
      actorId: "workspace-kestrel",
      awardReason: "Best verified fit",
      decisionTraceHash: "sha256:decision-001",
      scoreSummary: {
        rankingScore: 0.914,
        budgetFitScore: 0.864,
        latencyScore: 0.894
      },
      proofSummary: {
        proofId: reveal.proof.proofId,
        result: verification.proof.verification.result,
        decisionTraceHash: "sha256:decision-001",
        reasonCodes: [],
        policyTraceId: policy.policyTraceId
      }
    }
  });

  assert.equal(task.record.taskId, "task_00000001");
  assert.equal(bid.record.bidId, "bid_00000001");
  assert.equal(reveal.proof.proofId, "proof_00000001");
  assert.equal(award.record.awardId, "award_00000001");
  assert.match(policy.policyTraceId, /^policytrace_/);

  const auditEvents = store.listAuditEventsForTask(task.record.taskId);
  assert.deepEqual(
    auditEvents.map((event) => event.auditId),
    [
      "audit_00000001",
      "audit_00000002",
      "audit_00000003",
      "audit_00000004",
      "audit_00000005"
    ]
  );
  assert.deepEqual(
    auditEvents.map((event) => event.eventType),
    [
      "TASK_CREATED",
      "BID_COMMITTED",
      "BID_REVEALED",
      "POMW_VERIFIED",
      "TASK_AWARDED"
    ]
  );
  assert.deepEqual(store.summary(), {
    tasks: 1,
    bids: 1,
    proofs: 1,
    awards: 1,
    auditEvents: 5,
    latestTaskId: "task_00000001",
    latestAuditId: "audit_00000005"
  });
});
