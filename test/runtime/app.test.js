import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "../../src/runtime/app.js";

function buildTask(overrides = {}) {
  return {
    title: "Run dispatch loop baseline",
    description: "Bootstrap the first runnable backend route",
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
    },
    ...overrides
  };
}

function buildProof({
  proofId = "proof_00000001",
  taskId,
  agentId = "agent_kestrel_alpha",
  qualityScore = 0.9,
  credentialLevel = "T1",
  antiSybil
} = {}) {
  return {
    proofSchemaVersion: "1.0",
    proofId,
    taskId,
    agentId,
    capturedAt: "2026-03-19T00:30:00Z",
    identityProof: {
      credentialLevel,
      signerDid: `did:key:${agentId}`,
      signature: "sig-proof-001"
    },
    sampleWork: {
      sampleTaskDigest: "sha256:sample-task-001",
      outputDigest: "sha256:sample-output-001",
      qualityScore,
      runtimeMs: 1200
    },
    executionTrace: {
      traceHash: "sha256:trace-001",
      traceUri: "s3://proofs/trace-001.json",
      traceSignature: "sig-trace-001",
      toolCallCount: 4
    },
    ...(antiSybil ? { antiSybil } : {})
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

async function startTestServer({ now } = {}) {
  let currentTime = "2026-03-16T00:00:00.000Z";
  const logEntries = [];
  const app = createApp({
    config: {
      serviceName: "test-control-plane"
    },
    now: () => (typeof now === "function" ? now() : currentTime),
    startedAt: Date.now(),
    logger: (entry) => {
      logEntries.push(entry);
    }
  });
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    server,
    baseUrl,
    logEntries,
    setNow(value) {
      currentTime = value;
    }
  };
}

async function createTaskRecord(baseUrl, task = buildTask()) {
  const response = await fetch(`${baseUrl}/v1/tasks`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-workspace-id": "workspace-kestrel"
    },
    body: JSON.stringify({ task })
  });
  assert.equal(response.status, 201);
  return response.json();
}

test("healthz and readyz return runtime status", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const healthResponse = await fetch(`${baseUrl}/healthz`);
    assert.equal(healthResponse.status, 200);
    const healthBody = await healthResponse.json();
    assert.equal(healthBody.status, "ok");
    assert.equal(healthBody.service, "test-control-plane");

    const readyResponse = await fetch(`${baseUrl}/readyz`);
    assert.equal(readyResponse.status, 200);
    const readyBody = await readyResponse.json();
    assert.equal(readyBody.status, "ready");
    assert.equal(readyBody.storage.tasks, 0);
    assert.deepEqual(
      logEntries.map((entry) => ({
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode
      })),
      [
        { method: "GET", path: "/healthz", statusCode: 200 },
        { method: "GET", path: "/readyz", statusCode: 200 }
      ]
    );
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("POST /v1/tasks persists a task and updates runtime summary", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const createBody = await createTaskRecord(baseUrl);
    assert.equal(createBody.taskId, "task_00000001");
    assert.equal(createBody.status, "OPEN_FOR_MATCHING");

    const summaryResponse = await fetch(`${baseUrl}/v1/runtime/summary`);
    assert.equal(summaryResponse.status, 200);
    const summaryBody = await summaryResponse.json();
    assert.equal(summaryBody.storage.tasks, 1);
    assert.equal(summaryBody.storage.auditEvents, 1);
    assert.equal(summaryBody.storage.latestTaskId, "task_00000001");
    assert.equal(logEntries[0].workspaceId, "workspace-kestrel");
    assert.equal(logEntries[0].statusCode, 201);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("POST /v1/tasks rejects requests without a workspace header", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/v1/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ task: buildTask() })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.code, "TASK_SPEC_CONSTRAINTS_MISSING");
    assert.equal(body.details.header, "X-Workspace-Id");
    assert.equal(logEntries.at(-1)?.statusCode, 400);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("GET /v1/tasks/:taskId returns the persisted task payload", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const createBody = await createTaskRecord(baseUrl, buildTask({
      title: "Inspect a stored task",
      description: "Read back the runtime bootstrap record"
    }));

    const detailResponse = await fetch(`${baseUrl}/v1/tasks/${createBody.taskId}`);
    assert.equal(detailResponse.status, 200);
    const detailBody = await detailResponse.json();
    assert.equal(detailBody.taskId, createBody.taskId);
    assert.equal(detailBody.workspaceId, "workspace-kestrel");
    assert.equal(detailBody.task.title, "Inspect a stored task");
    assert.equal(logEntries.at(-1)?.path, `/v1/tasks/${createBody.taskId}`);
    assert.equal(logEntries.at(-1)?.statusCode, 200);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("GET /v1/tasks/:taskId returns 404 for unknown ids", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/v1/tasks/task_99999999`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.code, "AUDIT_QUERY_NOT_FOUND");
    assert.equal(logEntries.at(-1)?.path, "/v1/tasks/task_99999999");
    assert.equal(logEntries.at(-1)?.statusCode, 404);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("dispatch vertical slice publishes, matches, bids, verifies, awards, and exposes audit trails", async () => {
  let currentTime = "2026-03-16T00:00:00.000Z";
  const { server, baseUrl, setNow, logEntries } = await startTestServer({
    now: () => currentTime
  });

  try {
    const created = await createTaskRecord(baseUrl);
    const taskId = created.taskId;

    const firstMatchResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/candidates?limit=2`);
    assert.equal(firstMatchResponse.status, 409);
    const firstMatchBody = await firstMatchResponse.json();
    assert.equal(firstMatchBody.code, "TASK_MATCH_NOT_READY");
    assert.equal(firstMatchBody.retryable, true);

    const secondMatchResponse = await fetch(
      `${baseUrl}/v1/tasks/${taskId}/candidates?limit=2&includeScoreBreakdown=false`
    );
    assert.equal(secondMatchResponse.status, 200);
    const shortlist = await secondMatchResponse.json();
    assert.equal(shortlist.status, "MATCHED");
    assert.equal(shortlist.candidates.length, 3);
    assert.equal(shortlist.candidates[0].agentId, "agent_kestrel_alpha");
    assert.equal(shortlist.candidates[0].eligible, true);
    assert.equal(shortlist.candidates[2].eligible, false);
    assert.equal("scoreBreakdown" in shortlist.candidates[0], false);

    const proof = buildProof({ taskId });
    const reveal = {
      bidId: "bid_00000001",
      taskId,
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

    const commitResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/bids/commit`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey: "idem-commit-001",
        commit: {
          bidId: reveal.bidId,
          taskId,
          agentId: reveal.agentId,
          bidHash: buildRevealHash(reveal),
          committedAt: "2026-03-16T00:10:00.000Z"
        }
      })
    });
    assert.equal(commitResponse.status, 202);
    const commitBody = await commitResponse.json();
    assert.equal(commitBody.result, "COMMITTED");
    assert.equal(commitBody.window.currentPhase, "COMMIT_OPEN");

    const replayCommitResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/bids/commit`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey: "idem-commit-001",
        commit: {
          bidId: reveal.bidId,
          taskId,
          agentId: reveal.agentId,
          bidHash: buildRevealHash(reveal),
          committedAt: "2026-03-16T00:10:00.000Z"
        }
      })
    });
    assert.equal(replayCommitResponse.status, 202);
    const replayCommitBody = await replayCommitResponse.json();
    assert.equal(replayCommitBody.result, "RETURNED_EXISTING");

    const blockedAwardResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/award`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({ bidId: reveal.bidId })
    });
    assert.equal(blockedAwardResponse.status, 409);
    const blockedAwardBody = await blockedAwardResponse.json();
    assert.equal(blockedAwardBody.code, "TASK_AWARD_PROOF_NOT_VERIFIED");

    const policyResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/proof-policy`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        agentId: reveal.agentId,
        identityTier: "T1",
        trustScore: 0.84
      })
    });
    assert.equal(policyResponse.status, 200);
    const policyBody = await policyResponse.json();
    assert.match(policyBody.policyTraceId, /^policytrace_/);
    assert.equal(policyBody.requiredProofStrength, "LOW");

    currentTime = "2026-03-19T00:10:00.000Z";
    setNow(currentTime);

    const revealResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/bids/reveal`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey: "idem-reveal-001",
        reveal
      })
    });
    assert.equal(revealResponse.status, 200);
    const revealBody = await revealResponse.json();
    assert.equal(revealBody.status, "REVEALED");
    assert.equal(revealBody.proofSubmission.verificationStatus, "PENDING_VERIFY");
    assert.equal(revealBody.window.currentPhase, "REVEAL_OPEN");

    const verifyResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/proofs/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        policyTraceId: policyBody.policyTraceId,
        proof
      })
    });
    assert.equal(verifyResponse.status, 200);
    const verifyBody = await verifyResponse.json();
    assert.equal(verifyBody.result, "PASS");
    assert.equal(verifyBody.policyTraceId, policyBody.policyTraceId);
    assert.equal(verifyBody.reasonCodes.length, 0);

    const awardResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/award`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({
        bidId: reveal.bidId,
        awardReason: "Best verified fit for the backend vertical slice."
      })
    });
    assert.equal(awardResponse.status, 200);
    const awardBody = await awardResponse.json();
    assert.equal(awardBody.status, "AWARDED");
    assert.equal(awardBody.awardedBidId, reveal.bidId);
    assert.equal(awardBody.awardedAgentId, reveal.agentId);

    const eventsResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/events`);
    assert.equal(eventsResponse.status, 200);
    const eventsBody = await eventsResponse.json();
    assert.equal(eventsBody.count, 5);
    assert.deepEqual(
      eventsBody.events.map((event) => event.eventType),
      [
        "TASK_CREATED",
        "BID_COMMITTED",
        "BID_REVEALED",
        "POMW_VERIFIED",
        "TASK_AWARDED"
      ]
    );
    assert.equal(eventsBody.events[0].actorRole, "MANAGER");
    assert.match(eventsBody.events[0].eventId, /^aev_/);
    assert.equal(eventsBody.events.at(-1).payload.awardedBidId, reveal.bidId);

    const bidEventsResponse = await fetch(`${baseUrl}/v1/bids/${reveal.bidId}/events`);
    assert.equal(bidEventsResponse.status, 200);
    const bidEventsBody = await bidEventsResponse.json();
    assert.equal(bidEventsBody.bidId, reveal.bidId);
    assert.deepEqual(
      bidEventsBody.events.map((event) => event.eventType),
      ["BID_COMMITTED", "BID_REVEALED", "POMW_VERIFIED", "TASK_AWARDED"]
    );
    assert.equal(logEntries.at(-1)?.statusCode, 200);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("reveal without a commit and failed verification return stable errors", async () => {
  let currentTime = "2026-03-16T00:00:00.000Z";
  const { server, baseUrl, setNow } = await startTestServer({
    now: () => currentTime
  });

  try {
    const created = await createTaskRecord(baseUrl, buildTask({
      risk: {
        level: "HIGH",
        valueScore: 88
      }
    }));
    const taskId = created.taskId;

    await fetch(`${baseUrl}/v1/tasks/${taskId}/candidates`);
    await fetch(`${baseUrl}/v1/tasks/${taskId}/candidates`);

    currentTime = "2026-03-19T00:10:00.000Z";
    setNow(currentTime);

    const missingCommitProof = buildProof({
      taskId,
      proofId: "proof_00000077",
      agentId: "agent_kestrel_beta",
      qualityScore: 0.4,
      credentialLevel: "T2"
    });
    const missingCommitReveal = {
      bidId: "bid_00000077",
      taskId,
      agentId: "agent_kestrel_beta",
      nonce: "nonce-missing-commit",
      price: {
        currency: "USD",
        amount: 260
      },
      executionPlan: {
        summary: "Attempt reveal without a prior commit",
        etaSeconds: 420
      },
      proof: missingCommitProof
    };

    const missingCommitResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/bids/reveal`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey: "idem-reveal-missing-commit",
        reveal: missingCommitReveal
      })
    });
    assert.equal(missingCommitResponse.status, 400);
    const missingCommitBody = await missingCommitResponse.json();
    assert.equal(missingCommitBody.code, "BID_REVEAL_COMMIT_NOT_FOUND");

    currentTime = "2026-03-16T00:10:00.000Z";
    setNow(currentTime);

    const failingProof = buildProof({
      taskId,
      proofId: "proof_00000002",
      agentId: "agent_kestrel_gamma",
      qualityScore: 0.4,
      credentialLevel: "T2"
    });
    const failingReveal = {
      bidId: "bid_00000002",
      taskId,
      agentId: "agent_kestrel_gamma",
      nonce: "nonce-fail-verify",
      price: {
        currency: "USD",
        amount: 250
      },
      executionPlan: {
        summary: "High-risk candidate path",
        etaSeconds: 360,
        requiredTools: ["node"]
      },
      proof: failingProof
    };

    const commitResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/bids/commit`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey: "idem-commit-fail-verify",
        commit: {
          bidId: failingReveal.bidId,
          taskId,
          agentId: failingReveal.agentId,
          bidHash: buildRevealHash(failingReveal),
          committedAt: "2026-03-16T00:10:00.000Z"
        }
      })
    });
    assert.equal(commitResponse.status, 202);

    const policyResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/proof-policy`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        agentId: failingReveal.agentId,
        identityTier: "T2",
        trustScore: 0.55
      })
    });
    assert.equal(policyResponse.status, 200);
    const policyBody = await policyResponse.json();
    assert.equal(policyBody.requiredProofStrength, "VERY_HIGH");

    currentTime = "2026-03-19T00:10:00.000Z";
    setNow(currentTime);

    const revealResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/bids/reveal`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey: "idem-reveal-fail-verify",
        reveal: failingReveal
      })
    });
    assert.equal(revealResponse.status, 200);

    const verifyResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/proofs/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        policyTraceId: policyBody.policyTraceId,
        proof: failingProof
      })
    });
    assert.equal(verifyResponse.status, 422);
    const verifyBody = await verifyResponse.json();
    assert.equal(verifyBody.code, "PROOF_VERIFY_FAILED");
    assert.deepEqual(verifyBody.details.reasonCodes, [
      "QUALITY_SCORE_BELOW_MINIMUM",
      "HASHCASH_BITS_BELOW_MINIMUM"
    ]);

    const awardResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}/award`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({ bidId: failingReveal.bidId })
    });
    assert.equal(awardResponse.status, 409);
    const awardBody = await awardResponse.json();
    assert.equal(awardBody.code, "TASK_AWARD_PRECONDITION_FAILED");
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("unknown routes are logged as 404s", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/does-not-exist`);
    assert.equal(response.status, 404);
    assert.equal(logEntries.at(-1)?.path, "/does-not-exist");
    assert.equal(logEntries.at(-1)?.statusCode, 404);
  } finally {
    server.close();
    await once(server, "close");
  }
});
