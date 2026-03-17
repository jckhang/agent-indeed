import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { createApp } from "./app.js";

function buildTask() {
  return {
    title: "Dispatch smoke task",
    description: "Exercise the runtime publish to award flow in one command",
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
      valueScore: 0.2
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
}

function buildProof({ taskId }) {
  return {
    proofSchemaVersion: "1.0",
    proofId: "proof_00000001",
    taskId,
    agentId: "agent_kestrel_alpha",
    capturedAt: "2026-03-19T00:30:00Z",
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
      traceSignature: "sig-trace-001",
      toolCallCount: 4
    }
  };
}

function buildRevealHash(reveal) {
  return `sha256:${createHash("sha256").update(JSON.stringify({
    taskId: reveal.taskId,
    agentId: reveal.agentId,
    bidId: reveal.bidId,
    nonce: reveal.nonce,
    price: reveal.price,
    executionPlan: reveal.executionPlan,
    proof: reveal.proof
  })).digest("hex")}`;
}

function logStep(log, label, details) {
  log(`PASS ${label}${details ? ` :: ${details}` : ""}`);
}

async function expectJson(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  return response.json();
}

export async function runDispatchSmoke({ log = console.log } = {}) {
  let currentTime = "2026-03-16T00:00:00.000Z";
  const app = createApp({
    config: {
      host: "127.0.0.1",
      port: 0,
      serviceName: "dispatch-smoke"
    },
    now: () => currentTime,
    logger: () => {}
  });
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const created = await expectJson(
      await fetch(`${baseUrl}/v1/tasks`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-workspace-id": "workspace-kestrel"
        },
        body: JSON.stringify({ task: buildTask() })
      }),
      201
    );
    logStep(log, "task-created", created.taskId);

    const blockedMatch = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/candidates?limit=2`),
      409
    );
    assert.equal(blockedMatch.code, "TASK_MATCH_NOT_READY");
    logStep(log, "first-match-blocked", blockedMatch.code);

    const shortlist = await expectJson(
      await fetch(
        `${baseUrl}/v1/tasks/${created.taskId}/candidates?limit=2&includeScoreBreakdown=false`
      ),
      200
    );
    assert.equal(shortlist.status, "MATCHED");
    logStep(log, "candidates-ranked", `${shortlist.candidates.length} candidates`);

    const proof = buildProof({ taskId: created.taskId });
    const reveal = {
      bidId: "bid_00000001",
      taskId: created.taskId,
      agentId: "agent_kestrel_alpha",
      nonce: "nonce-001",
      price: {
        currency: "USD",
        amount: 180
      },
      executionPlan: {
        summary: "Execute with cached backend workflow",
        etaSeconds: 240,
        requiredTools: ["node", "openssl"]
      },
      proof
    };

    const commit = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/bids/commit`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          idempotencyKey: "idem-commit-smoke-001",
          commit: {
            bidId: reveal.bidId,
            taskId: reveal.taskId,
            agentId: reveal.agentId,
            bidHash: buildRevealHash(reveal),
            committedAt: "2026-03-16T00:10:00.000Z"
          }
        })
      }),
      202
    );
    assert.equal(commit.result, "COMMITTED");
    logStep(log, "bid-committed", commit.result);

    const policy = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/proof-policy`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          agentId: reveal.agentId,
          identityTier: "T1",
          trustScore: 0.84
        })
      }),
      200
    );
    logStep(log, "proof-policy-issued", policy.policyTraceId);

    currentTime = "2026-03-19T00:10:00.000Z";

    const revealResult = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/bids/reveal`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          idempotencyKey: "idem-reveal-smoke-001",
          reveal
        })
      }),
      200
    );
    assert.equal(revealResult.status, "REVEALED");
    logStep(log, "bid-revealed", revealResult.proofSubmission.verificationStatus);

    const verified = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/proofs/verify`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          policyTraceId: policy.policyTraceId,
          proof
        })
      }),
      200
    );
    assert.equal(verified.result, "PASS");
    logStep(log, "proof-verified", verified.result);

    const awarded = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/award`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-workspace-id": "workspace-kestrel"
        },
        body: JSON.stringify({
          bidId: reveal.bidId,
          awardReason: "Best verified fit for the backend vertical slice."
        })
      }),
      200
    );
    assert.equal(awarded.status, "AWARDED");
    logStep(log, "task-awarded", awarded.awardId);

    const events = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/events`),
      200
    );
    assert.deepEqual(
      events.events.map((event) => event.eventType),
      ["TASK_CREATED", "BID_COMMITTED", "BID_REVEALED", "POMW_VERIFIED", "TASK_AWARDED"]
    );
    logStep(log, "task-audit-timeline", `${events.events.length} events`);

    const bidEvents = await expectJson(
      await fetch(`${baseUrl}/v1/bids/${reveal.bidId}/events`),
      200
    );
    assert.equal(bidEvents.bidId, reveal.bidId);
    logStep(log, "bid-audit-timeline", `${bidEvents.events.length} events`);

    return {
      taskId: created.taskId,
      bidId: reveal.bidId,
      awardId: awarded.awardId,
      policyTraceId: policy.policyTraceId,
      verificationResult: verified.result,
      eventTypes: events.events.map((event) => event.eventType)
    };
  } finally {
    server.close();
    await once(server, "close");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDispatchSmoke()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
