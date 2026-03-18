import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { createApp } from "./app.js";

function buildTask(overrides = {}) {
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
    },
    ...overrides
  };
}

function buildProof({ taskId, proofId = "proof_00000001", agentId = "agent_kestrel_alpha", signerDid, signature = "sig-proof-001", qualityScore = 0.9, credentialLevel = "T1", antiSybil } = {}) {
  return {
    proofSchemaVersion: "1.0",
    proofId,
    taskId,
    agentId,
    capturedAt: "2026-03-19T00:30:00Z",
    identityProof: {
      credentialLevel,
      signerDid: signerDid ?? `did:key:${agentId}`,
      signature
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

function logStep(log, label, details) {
  log(`PASS ${label}${details ? ` :: ${details}` : ""}`);
}

async function expectJson(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  return response.json();
}

async function withRuntime(logic) {
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
    return await logic({
      baseUrl,
      getCurrentTime: () => currentTime,
      setCurrentTime(value) {
        currentTime = value;
      }
    });
  } finally {
    server.close();
    await once(server, "close");
  }
}

async function createTask(baseUrl, task = buildTask()) {
  return expectJson(
    await fetch(`${baseUrl}/v1/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({ task })
    }),
    201
  );
}

async function shortlistTask(baseUrl, taskId) {
  const blockedMatch = await expectJson(
    await fetch(`${baseUrl}/v1/tasks/${taskId}/candidates?limit=2`),
    409
  );
  assert.equal(blockedMatch.code, "TASK_MATCH_NOT_READY");

  const shortlist = await expectJson(
    await fetch(`${baseUrl}/v1/tasks/${taskId}/candidates?limit=2&includeScoreBreakdown=false`),
    200
  );
  assert.equal(shortlist.status, "MATCHED");
  return {
    blockedMatch,
    shortlist
  };
}

async function createCommit(baseUrl, reveal, idempotencyKey, committedAt = "2026-03-16T00:10:00.000Z") {
  return expectJson(
    await fetch(`${baseUrl}/v1/tasks/${reveal.taskId}/bids/commit`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey,
        commit: {
          bidId: reveal.bidId,
          taskId: reveal.taskId,
          agentId: reveal.agentId,
          bidHash: buildRevealHash(reveal),
          committedAt
        }
      })
    }),
    202
  );
}

async function createPolicy(baseUrl, { taskId, agentId, identityTier = "T1", trustScore = 0.84 }) {
  return expectJson(
    await fetch(`${baseUrl}/v1/tasks/${taskId}/proof-policy`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        agentId,
        identityTier,
        trustScore
      })
    }),
    200
  );
}

async function revealBid(baseUrl, reveal, idempotencyKey, expectedStatus = 200) {
  return expectJson(
    await fetch(`${baseUrl}/v1/tasks/${reveal.taskId}/bids/reveal`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        idempotencyKey,
        reveal
      })
    }),
    expectedStatus
  );
}

async function verifyProof(baseUrl, { taskId, policyTraceId, proof, expectedStatus = 200 }) {
  return expectJson(
    await fetch(`${baseUrl}/v1/tasks/${taskId}/proofs/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        policyTraceId,
        proof
      })
    }),
    expectedStatus
  );
}

async function getAwardDetail(baseUrl, taskId) {
  return expectJson(
    await fetch(`${baseUrl}/v1/tasks/${taskId}/award`),
    200
  );
}

async function awardTask(baseUrl, taskId, award, idempotencyKey, expectedStatus = 200) {
  return expectJson(
    await fetch(`${baseUrl}/v1/tasks/${taskId}/award`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({
        idempotencyKey,
        award
      })
    }),
    expectedStatus
  );
}

export async function runDispatchSmoke({ log = console.log } = {}) {
  return withRuntime(async ({ baseUrl, setCurrentTime }) => {
    const created = await createTask(baseUrl);
    logStep(log, "task-created", created.taskId);

    const { blockedMatch, shortlist } = await shortlistTask(baseUrl, created.taskId);
    logStep(log, "first-match-blocked", blockedMatch.code);
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

    const commit = await createCommit(baseUrl, reveal, "idem-commit-smoke-001");
    assert.equal(commit.result, "COMMITTED");
    logStep(log, "bid-committed", commit.result);

    const policy = await createPolicy(baseUrl, {
      taskId: created.taskId,
      agentId: reveal.agentId
    });
    logStep(log, "proof-policy-issued", policy.policyTraceId);

    setCurrentTime("2026-03-19T00:10:00.000Z");

    const revealResult = await revealBid(baseUrl, reveal, "idem-reveal-smoke-001");
    assert.equal(revealResult.status, "REVEALED");
    logStep(log, "bid-revealed", revealResult.proofSubmission.verificationStatus);

    const verified = await verifyProof(baseUrl, {
      taskId: created.taskId,
      policyTraceId: policy.policyTraceId,
      proof
    });
    assert.equal(verified.result, "PASS");
    logStep(log, "proof-verified", verified.result);

    const awardDetail = await getAwardDetail(baseUrl, created.taskId);
    assert.equal(awardDetail.status, "READY_TO_AWARD");
    logStep(log, "award-ready", awardDetail.shortlistedBidId);

    const awarded = await awardTask(
      baseUrl,
      created.taskId,
      {
        bidId: reveal.bidId,
        awardReason: "Best verified fit for the backend vertical slice.",
        shortlistAuditId: awardDetail.shortlistAuditId,
        proofAuditId: awardDetail.proofAuditId
      },
      "idem-award-smoke-001"
    );
    assert.equal(awarded.status, "AWARDED");
    logStep(log, "task-awarded", awarded.auditEventId);

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
      awardAuditId: awarded.auditEventId,
      policyTraceId: policy.policyTraceId,
      verificationResult: verified.result,
      eventTypes: events.events.map((event) => event.eventType)
    };
  });
}

async function runInvalidSignatureScenario({ log = console.log } = {}) {
  return withRuntime(async ({ baseUrl, setCurrentTime }) => {
    const created = await createTask(baseUrl, buildTask({
      title: "Dispatch invalid signature smoke task"
    }));
    await shortlistTask(baseUrl, created.taskId);

    const proof = buildProof({
      taskId: created.taskId,
      proofId: "proof_00000011",
      agentId: "agent_kestrel_alpha",
      signerDid: "did:key:agent_kestrel_tampered"
    });
    const reveal = {
      bidId: "bid_00000011",
      taskId: created.taskId,
      agentId: "agent_kestrel_alpha",
      nonce: "nonce-invalid-signature",
      price: {
        currency: "USD",
        amount: 180
      },
      executionPlan: {
        summary: "Attempt verify with a tampered signerDid",
        etaSeconds: 240,
        requiredTools: ["node"]
      },
      proof
    };

    await createCommit(baseUrl, reveal, "idem-commit-invalid-signature");
    const policy = await createPolicy(baseUrl, {
      taskId: created.taskId,
      agentId: reveal.agentId
    });
    setCurrentTime("2026-03-19T00:10:00.000Z");
    await revealBid(baseUrl, reveal, "idem-reveal-invalid-signature");

    const failedVerification = await verifyProof(baseUrl, {
      taskId: created.taskId,
      policyTraceId: policy.policyTraceId,
      proof,
      expectedStatus: 422
    });
    assert.equal(failedVerification.code, "PROOF_VERIFY_FAILED");
    assert.deepEqual(failedVerification.details.reasonCodes, ["TRACE_SIGNATURE_INVALID"]);
    logStep(log, "invalid-signature-rejected", failedVerification.code);

    const proofStatus = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/proofs/${proof.proofId}`),
      200
    );
    assert.equal(proofStatus.verificationState, "FAIL");
    assert.deepEqual(proofStatus.reasonCodes, ["PROOF_VERIFY_FAILED"]);

    return {
      scenario: "invalid-signature",
      taskId: created.taskId,
      bidId: reveal.bidId,
      proofId: proof.proofId,
      result: failedVerification.code,
      reasonCodes: failedVerification.details.reasonCodes
    };
  });
}

async function runNegativeScenarioSuite({ log = console.log } = {}) {
  return withRuntime(async ({ baseUrl, setCurrentTime }) => {
    const created = await createTask(baseUrl, buildTask({
      title: "Dispatch negative smoke task",
      risk: {
        level: "HIGH",
        valueScore: 0.88
      }
    }));
    await shortlistTask(baseUrl, created.taskId);

    setCurrentTime("2026-03-19T00:10:00.000Z");

    const missingCommitProof = buildProof({
      taskId: created.taskId,
      proofId: "proof_00000077",
      agentId: "agent_kestrel_beta",
      qualityScore: 0.4,
      credentialLevel: "T2"
    });
    const missingCommitReveal = {
      bidId: "bid_00000077",
      taskId: created.taskId,
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

    const missingCommitResponse = await revealBid(
      baseUrl,
      missingCommitReveal,
      "idem-reveal-missing-commit",
      400
    );
    assert.equal(missingCommitResponse.code, "BID_REVEAL_COMMIT_NOT_FOUND");
    logStep(log, "reveal-without-commit-rejected", missingCommitResponse.code);

    setCurrentTime("2026-03-16T00:10:00.000Z");

    const failingProof = buildProof({
      taskId: created.taskId,
      proofId: "proof_00000002",
      agentId: "agent_kestrel_gamma",
      qualityScore: 0.4,
      credentialLevel: "T2"
    });
    const failingReveal = {
      bidId: "bid_00000002",
      taskId: created.taskId,
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

    await createCommit(baseUrl, failingReveal, "idem-commit-fail-verify");
    const policy = await createPolicy(baseUrl, {
      taskId: created.taskId,
      agentId: failingReveal.agentId,
      identityTier: "T2",
      trustScore: 0.55
    });
    assert.equal(policy.requiredProofStrength, "VERY_HIGH");

    setCurrentTime("2026-03-19T00:10:00.000Z");
    await revealBid(baseUrl, failingReveal, "idem-reveal-fail-verify");

    const verifyResponse = await verifyProof(baseUrl, {
      taskId: created.taskId,
      policyTraceId: policy.policyTraceId,
      proof: failingProof,
      expectedStatus: 422
    });
    assert.equal(verifyResponse.code, "PROOF_VERIFY_FAILED");
    assert.deepEqual(verifyResponse.details.reasonCodes, [
      "QUALITY_SCORE_BELOW_MINIMUM",
      "HASHCASH_BITS_BELOW_MINIMUM"
    ]);
    logStep(log, "proof-fail-rejected", verifyResponse.code);

    const awardDetail = await getAwardDetail(baseUrl, created.taskId);
    assert.equal(awardDetail.status, "BLOCKED");
    logStep(log, "award-blocked", awardDetail.status);

    const awardResponse = await awardTask(
      baseUrl,
      created.taskId,
      {
        bidId: failingReveal.bidId,
        awardReason: "Proof failed verification and should not award.",
        shortlistAuditId: awardDetail.shortlistAuditId,
        proofAuditId: awardDetail.proofAuditId
      },
      "idem-award-fail-verify",
      422
    );
    assert.equal(awardResponse.code, "TASK_AWARD_PRECONDITION_FAILED");

    return {
      scenario: "negative-paths",
      taskId: created.taskId,
      revealWithoutCommit: missingCommitResponse.code,
      proofFail: verifyResponse.code,
      awardBlocked: awardResponse.code,
      proofFailReasonCodes: verifyResponse.details.reasonCodes
    };
  });
}

export async function runDispatchSmokeSuite({ log = console.log } = {}) {
  const happyPath = await runDispatchSmoke({
    log: (line) => log(`[happy-path] ${line}`)
  });
  const invalidSignature = await runInvalidSignatureScenario({
    log: (line) => log(`[invalid-signature] ${line}`)
  });
  const negativePaths = await runNegativeScenarioSuite({
    log: (line) => log(`[negative-paths] ${line}`)
  });

  return {
    status: "ok",
    command: "npm run smoke:dispatch",
    scenarios: [
      {
        name: "happy-path",
        status: "PASS",
        verificationResult: happyPath.verificationResult,
        taskId: happyPath.taskId,
        bidId: happyPath.bidId
      },
      {
        name: "invalid-signature",
        status: "PASS",
        result: invalidSignature.result,
        reasonCodes: invalidSignature.reasonCodes,
        taskId: invalidSignature.taskId,
        proofId: invalidSignature.proofId
      },
      {
        name: "negative-paths",
        status: "PASS",
        revealWithoutCommit: negativePaths.revealWithoutCommit,
        proofFail: negativePaths.proofFail,
        awardBlocked: negativePaths.awardBlocked,
        taskId: negativePaths.taskId
      }
    ]
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDispatchSmokeSuite()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
