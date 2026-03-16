import { createHash } from "node:crypto";
import { readJson, sendJson, sendNotFound } from "./lib/http.js";
import {
  InMemoryControlPlaneStore,
  buildCandidateSnapshot
} from "./store/in-memory-control-plane-store.js";

const TASK_ID_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})$/;
const TASK_CANDIDATES_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/candidates$/;
const TASK_EVENTS_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/events$/;
const TASK_AUDIT_EVENTS_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/audit-events$/;
const TASK_BID_COMMIT_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/bids\/commit$/;
const TASK_BID_REVEAL_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/bids\/reveal$/;
const TASK_PROOF_POLICY_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/proof-policy$/;
const TASK_PROOF_VERIFY_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/proofs\/verify$/;
const TASK_AWARD_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/award$/;
const BID_EVENTS_PATTERN = /^\/v1\/bids\/(bid_[a-zA-Z0-9_-]{1,64})\/events$/;

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function round(value) {
  return Number(value.toFixed(3));
}

function buildError(code, category, message, { auditId, retryable = false, retryAfterSeconds, details } = {}) {
  return {
    code,
    category,
    message,
    auditId,
    retryable,
    ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    ...(details ? { details } : {})
  };
}

function buildTaskValidationError(message, details = {}) {
  return {
    statusCode: 400,
    body: buildError("TASK_SPEC_CONSTRAINTS_MISSING", "VALIDATION", message, {
      auditId: "audit_task_spec_invalid",
      details
    })
  };
}

function validateTaskSpec(task) {
  if (!task || typeof task !== "object") {
    return buildTaskValidationError("task payload is required", { field: "task" });
  }

  const requiredObjects = [
    "budget",
    "sla",
    "constraints",
    "risk",
    "powmPolicy",
    "biddingWindow"
  ];

  if (!task.title || !task.description) {
    return buildTaskValidationError("task.title and task.description are required", {
      fields: ["task.title", "task.description"]
    });
  }

  for (const field of requiredObjects) {
    if (!task[field] || typeof task[field] !== "object") {
      return buildTaskValidationError(`${field} is required`, { field: `task.${field}` });
    }
  }

  if (!task.constraints.identityTierMin) {
    return buildTaskValidationError("constraints.identityTierMin is required", {
      field: "task.constraints.identityTierMin"
    });
  }

  if (!Array.isArray(task.constraints.requiredSkills)) {
    return buildTaskValidationError("constraints.requiredSkills must be an array", {
      field: "task.constraints.requiredSkills"
    });
  }

  if (!task.biddingWindow.commitDeadline || !task.biddingWindow.revealDeadline) {
    return buildTaskValidationError("biddingWindow deadlines are required", {
      fields: ["task.biddingWindow.commitDeadline", "task.biddingWindow.revealDeadline"]
    });
  }

  return null;
}

function validateCommitPayload(taskId, payload) {
  const commit = payload?.commit;
  if (!commit || typeof commit !== "object") {
    return buildError("BID_COMMIT_PAYLOAD_INVALID", "VALIDATION", "commit payload is required", {
      auditId: "audit_bid_commit_payload_invalid",
      details: { field: "commit" }
    });
  }

  const requiredFields = ["bidId", "taskId", "agentId", "bidHash"];
  for (const field of requiredFields) {
    if (!commit[field]) {
      return buildError(
        "BID_COMMIT_PAYLOAD_INVALID",
        "VALIDATION",
        `commit.${field} is required`,
        {
          auditId: "audit_bid_commit_payload_invalid",
          details: { field: `commit.${field}` }
        }
      );
    }
  }

  if (commit.taskId !== taskId) {
    return buildError(
      "BID_COMMIT_TASK_MISMATCH",
      "PRECONDITION",
      `commit.taskId ${commit.taskId} does not match route task ${taskId}`,
      {
        auditId: "audit_bid_commit_task_mismatch",
        details: { taskId, commitTaskId: commit.taskId, bidId: commit.bidId }
      }
    );
  }

  if (!payload?.idempotencyKey) {
    return buildError(
      "BID_COMMIT_PAYLOAD_INVALID",
      "VALIDATION",
      "idempotencyKey is required",
      {
        auditId: "audit_bid_commit_payload_invalid",
        details: { field: "idempotencyKey" }
      }
    );
  }

  return null;
}

function validateRevealPayload(taskId, payload) {
  const reveal = payload?.reveal;
  if (!reveal || typeof reveal !== "object") {
    return buildError("BID_REVEAL_PAYLOAD_INVALID", "VALIDATION", "reveal payload is required", {
      auditId: "audit_bid_reveal_payload_invalid",
      details: { field: "reveal" }
    });
  }

  const requiredFields = ["bidId", "taskId", "agentId", "nonce", "price", "executionPlan", "proof"];
  for (const field of requiredFields) {
    if (!reveal[field]) {
      return buildError(
        "BID_REVEAL_PAYLOAD_INVALID",
        "VALIDATION",
        `reveal.${field} is required`,
        {
          auditId: "audit_bid_reveal_payload_invalid",
          details: { field: `reveal.${field}` }
        }
      );
    }
  }

  if (reveal.taskId !== taskId) {
    return buildError(
      "BID_REVEAL_PAYLOAD_INVALID",
      "VALIDATION",
      `reveal.taskId ${reveal.taskId} does not match route task ${taskId}`,
      {
        auditId: "audit_bid_reveal_payload_invalid",
        details: { field: "reveal.taskId" }
      }
    );
  }

  if (!payload?.idempotencyKey) {
    return buildError(
      "BID_REVEAL_PAYLOAD_INVALID",
      "VALIDATION",
      "idempotencyKey is required",
      {
        auditId: "audit_bid_reveal_payload_invalid",
        details: { field: "idempotencyKey" }
      }
    );
  }

  return null;
}

function validateProofPolicyPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return buildError("PROOF_POLICY_INPUT_INVALID", "POLICY", "request body is required", {
      auditId: "audit_proof_policy_input_invalid"
    });
  }

  if (!payload.agentId || !payload.identityTier) {
    return buildError(
      "PROOF_POLICY_INPUT_INVALID",
      "POLICY",
      "agentId and identityTier are required",
      {
        auditId: "audit_proof_policy_input_invalid",
        details: { fields: ["agentId", "identityTier"] }
      }
    );
  }

  if (
    payload.trustScore !== undefined &&
    (typeof payload.trustScore !== "number" || payload.trustScore < 0 || payload.trustScore > 1)
  ) {
    return buildError("PROOF_POLICY_INPUT_INVALID", "POLICY", "trustScore must be between 0 and 1", {
      auditId: "audit_proof_policy_input_invalid"
    });
  }

  return null;
}

function validateVerifyPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return buildError("PROOF_VERIFY_PAYLOAD_INVALID", "VALIDATION", "request body is required", {
      auditId: "audit_proof_verify_payload_invalid"
    });
  }

  if (!payload.policyTraceId) {
    return buildError("PROOF_POLICY_TRACE_MISSING", "POLICY", "policyTraceId is required", {
      auditId: "audit_proof_policy_trace_missing"
    });
  }

  const proof = payload.proof;
  const requiredProofFields = [
    "proofSchemaVersion",
    "proofId",
    "taskId",
    "agentId",
    "capturedAt",
    "identityProof",
    "sampleWork",
    "executionTrace"
  ];
  for (const field of requiredProofFields) {
    if (!proof?.[field]) {
      return buildError(
        "PROOF_VERIFY_PAYLOAD_INVALID",
        "VALIDATION",
        `proof.${field} is required`,
        {
          auditId: "audit_proof_verify_payload_invalid",
          details: { field: `proof.${field}` }
        }
      );
    }
  }

  return null;
}

function validateAwardPayload(payload) {
  if (!payload || typeof payload !== "object" || !payload.bidId) {
    return buildError(
      "TASK_AWARD_PRECONDITION_FAILED",
      "PRECONDITION",
      "bidId is required to award a task",
      {
        auditId: "audit_task_award_invalid_payload",
        details: { field: "bidId" }
      }
    );
  }

  return null;
}

function buildTaskDetailResponse(record) {
  return {
    taskId: record.taskId,
    workspaceId: record.workspaceId,
    status: record.status,
    createdAt: record.createdAt,
    commitDeadline: record.commitDeadline,
    revealDeadline: record.revealDeadline,
    task: record.task
  };
}

function buildAuditEventListResponse({ taskId, bidId, events }) {
  return {
    taskId,
    ...(bidId ? { bidId } : {}),
    count: events.length,
    hasMore: false,
    events
  };
}

function buildWindow(task, serverTime) {
  if (serverTime < task.commitDeadline) {
    return {
      currentPhase: "COMMIT_OPEN",
      commitDeadline: task.commitDeadline,
      revealDeadline: task.revealDeadline,
      serverTime,
      nextAction: "WAIT_FOR_REVEAL_WINDOW"
    };
  }

  if (serverTime < task.revealDeadline) {
    return {
      currentPhase: "REVEAL_OPEN",
      commitDeadline: task.commitDeadline,
      revealDeadline: task.revealDeadline,
      serverTime,
      nextAction: "SUBMIT_REVEAL"
    };
  }

  return {
    currentPhase: "CLOSED",
    commitDeadline: task.commitDeadline,
    revealDeadline: task.revealDeadline,
    serverTime,
    nextAction: "NO_FURTHER_ACTION"
  };
}

function buildRevealHash(reveal) {
  return sha256(
    JSON.stringify({
      taskId: reveal.taskId,
      agentId: reveal.agentId,
      bidId: reveal.bidId,
      nonce: reveal.nonce,
      price: reveal.price,
      executionPlan: reveal.executionPlan,
      proof: reveal.proof
    })
  );
}

function resolveProofPolicy(task, payload, nowValue) {
  const risk = task.task.risk.level;
  const baseByRisk = { LOW: 0.45, MEDIUM: 0.62, HIGH: 0.78, CRITICAL: 0.9 };
  const tierModifier = { T0: -0.12, T1: 0, T2: 0.14 };
  const trustScore = payload.trustScore ?? (payload.identityTier === "T0" ? 0.95 : payload.identityTier === "T1" ? 0.84 : 0.55);
  const requiredDifficulty = Math.min(
    0.95,
    Math.max(0.2, baseByRisk[risk] + tierModifier[payload.identityTier] - trustScore * 0.08)
  );
  const challengeProfile = requiredDifficulty >= 0.85
    ? "HYBRID"
    : requiredDifficulty >= 0.72
      ? "HASHCASH"
      : "SAMPLE_EXECUTION";

  return {
    agentId: payload.agentId,
    requiredProofStrength:
      requiredDifficulty >= 0.85
        ? "VERY_HIGH"
        : requiredDifficulty >= 0.72
          ? "HIGH"
          : requiredDifficulty >= 0.58
            ? "MEDIUM"
            : "LOW",
    challengeProfile,
    verifierParams: {
      minSampleCount: requiredDifficulty >= 0.72 ? 2 : 1,
      minQualityScore: round(requiredDifficulty),
      maxRuntimeMs: requiredDifficulty >= 0.85 ? 120000 : 180000,
      ...(challengeProfile === "HASHCASH" || challengeProfile === "HYBRID"
        ? { hashcashBits: requiredDifficulty >= 0.85 ? 18 : 14 }
        : {}),
      ...(challengeProfile === "HYBRID" ? { stakeMinAmount: 25 } : {})
    },
    inputSnapshot: {
      taskRiskLevel: risk,
      taskValueScore: task.task.risk.valueScore,
      identityTier: payload.identityTier,
      trustScore
    },
    rationale: [
      `task risk ${risk} drives the base verifier threshold`,
      `identity tier ${payload.identityTier} adjusts the challenge profile`,
      `trust score ${trustScore} reduces repeated manual review for proven agents`
    ],
    persistedAt: nowValue
  };
}

function verifyProofAgainstPolicy(policy, proof) {
  const requiredDifficulty = policy.verifierParams.minQualityScore ?? 0;
  const qualityScore = proof.sampleWork.qualityScore ?? 0;
  const runtimeMs = proof.sampleWork.runtimeMs ?? Number.MAX_SAFE_INTEGER;
  const reasonCodes = [];

  if (proof.identityProof.credentialLevel !== policy.inputSnapshot.identityTier) {
    reasonCodes.push("IDENTITY_TIER_MISMATCH");
  }

  if (qualityScore < requiredDifficulty) {
    reasonCodes.push("QUALITY_SCORE_BELOW_MINIMUM");
  }

  if (policy.verifierParams.maxRuntimeMs && runtimeMs > policy.verifierParams.maxRuntimeMs) {
    reasonCodes.push("RUNTIME_EXCEEDED");
  }

  if (policy.verifierParams.hashcashBits && !proof.antiSybil?.challengeOutput) {
    reasonCodes.push("HASHCASH_BITS_BELOW_MINIMUM");
  }

  const achievedDifficulty = round(Math.min(1, qualityScore));
  const result = reasonCodes.length === 0 ? "PASS" : "FAIL";

  return {
    result,
    requiredDifficulty: round(requiredDifficulty),
    achievedDifficulty,
    reasonCodes
  };
}

function buildAwardResponse({ awardId, taskId, bidId, agentId, awardedAt, decisionTraceHash, scoreSummary, proofSummary, awardReason }) {
  return {
    awardId,
    taskId,
    status: "AWARDED",
    awardedBidId: bidId,
    awardedAgentId: agentId,
    awardedAt,
    decisionTraceHash,
    scoreSummary,
    proofSummary,
    ...(awardReason ? { awardReason } : {})
  };
}

function logRequest({ logger, config, method, pathname, statusCode, durationMs, workspaceId }) {
  logger({
    service: config.serviceName,
    method,
    path: pathname,
    statusCode,
    durationMs,
    workspaceId
  });
}

export function createApp({
  config,
  store = new InMemoryControlPlaneStore(),
  now = () => new Date().toISOString(),
  startedAt = Date.now(),
  logger = (entry) => console.log(JSON.stringify(entry))
} = {}) {
  return async function app(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? "127.0.0.1"}`);
    const requestStartedAt = Date.now();
    const workspaceId = req.headers["x-workspace-id"] ?? null;

    function reply(statusCode, payload) {
      logRequest({
        logger,
        config,
        method: req.method,
        pathname: requestUrl.pathname,
        statusCode,
        durationMs: Date.now() - requestStartedAt,
        workspaceId
      });
      return sendJson(res, statusCode, payload);
    }

    const nowValue = now();

    if (req.method === "GET" && requestUrl.pathname === "/healthz") {
      return reply(200, {
        status: "ok",
        service: config.serviceName,
        now: nowValue,
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
      });
    }

    if (req.method === "GET" && requestUrl.pathname === "/readyz") {
      return reply(200, {
        status: "ready",
        service: config.serviceName,
        checks: [
          { name: "config", status: "ok" },
          { name: "storage", status: "ok" }
        ],
        storage: store.summary()
      });
    }

    if (req.method === "GET" && requestUrl.pathname === "/v1/runtime/summary") {
      return reply(200, {
        service: config.serviceName,
        generatedAt: nowValue,
        storage: store.summary()
      });
    }

    if (req.method === "POST" && requestUrl.pathname === "/v1/tasks") {
      if (!workspaceId) {
        return reply(
          400,
          buildError("TASK_SPEC_CONSTRAINTS_MISSING", "VALIDATION", "X-Workspace-Id header is required", {
            auditId: "audit_task_workspace_missing",
            details: { header: "X-Workspace-Id" }
          })
        );
      }

      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(
          400,
          buildError("TASK_SPEC_CONSTRAINTS_MISSING", "VALIDATION", "Request body must be valid JSON", {
            auditId: "audit_task_body_invalid_json"
          })
        );
      }

      const validationError = validateTaskSpec(payload?.task);
      if (validationError) {
        return reply(validationError.statusCode, validationError.body);
      }

      const { record } = store.createTask({
        workspaceId,
        task: payload.task
      });

      return reply(201, {
        taskId: record.taskId,
        status: record.status,
        commitDeadline: record.commitDeadline,
        revealDeadline: record.revealDeadline
      });
    }

    const taskDetailMatch = requestUrl.pathname.match(TASK_ID_PATTERN);
    if (req.method === "GET" && taskDetailMatch) {
      const record = store.getTask(taskDetailMatch[1]);
      if (!record) {
        return reply(
          404,
          buildError("AUDIT_QUERY_NOT_FOUND", "AUDIT", `Task ${taskDetailMatch[1]} was not found`, {
            auditId: "audit_task_not_found"
          })
        );
      }

      return reply(200, buildTaskDetailResponse(record));
    }

    const candidatesMatch = requestUrl.pathname.match(TASK_CANDIDATES_PATTERN);
    if (req.method === "GET" && candidatesMatch) {
      const taskId = candidatesMatch[1];
      const task = store.getTask(taskId);
      if (!task) {
        return reply(
          404,
          buildError("TASK_MATCH_TASK_NOT_FOUND", "MATCHING", `task_id ${taskId} was not found`, {
            auditId: "audit_task_match_not_found"
          })
        );
      }

      const limitRaw = requestUrl.searchParams.get("limit") ?? "10";
      const limit = Number.parseInt(limitRaw, 10);
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        return reply(
          400,
          buildError("TASK_MATCH_LIMIT_INVALID", "MATCHING", "limit must be between 1 and 50", {
            auditId: "audit_task_match_limit_invalid"
          })
        );
      }

      const includeScoreBreakdown = requestUrl.searchParams.get("includeScoreBreakdown") !== "false";
      if (store.isMatchingPending(taskId)) {
        const seededSnapshot = buildCandidateSnapshot({
          taskId,
          task: task.task,
          includeScoreBreakdown,
          limit
        });
        store.createMatchingSnapshot(taskId, seededSnapshot.candidates);
        return reply(
          409,
          buildError(
            "TASK_MATCH_NOT_READY",
            "MATCHING",
            `candidate matching snapshot is not ready for task ${taskId}`,
            {
              auditId: "audit_task_match_not_ready",
              retryable: true,
              retryAfterSeconds: 1
            }
          )
        );
      }

      const snapshot = store.getMatchingSnapshot(taskId);
      return reply(200, {
        taskId,
        status: snapshot.status,
        generatedAt: snapshot.generatedAt,
        candidates: snapshot.candidates.map((candidate) => ({
          ...candidate,
          ...(includeScoreBreakdown ? {} : { scoreBreakdown: undefined })
        }))
      });
    }

    const commitMatch = requestUrl.pathname.match(TASK_BID_COMMIT_PATTERN);
    if (req.method === "POST" && commitMatch) {
      const taskId = commitMatch[1];
      const task = store.getTask(taskId);
      if (!task) {
        return reply(
          404,
          buildError("TASK_MATCH_TASK_NOT_FOUND", "MATCHING", `task_id ${taskId} was not found`, {
            auditId: "audit_task_match_not_found"
          })
        );
      }

      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(
          400,
          buildError("BID_COMMIT_PAYLOAD_INVALID", "VALIDATION", "Request body must be valid JSON", {
            auditId: "audit_bid_commit_payload_invalid"
          })
        );
      }

      const validationError = validateCommitPayload(taskId, payload);
      if (validationError) {
        return reply(400, validationError);
      }

      const window = buildWindow(task, nowValue);
      if (window.currentPhase !== "COMMIT_OPEN") {
        return reply(
          409,
          buildError(
            "BID_COMMIT_WINDOW_CLOSED",
            "WINDOW",
            `commit window already closed for task ${taskId}`,
            {
              auditId: "audit_bid_commit_window_closed",
              details: {
                bidId: payload.commit.bidId,
                taskId,
                currentPhase: window.currentPhase,
                commitDeadline: window.commitDeadline,
                revealDeadline: window.revealDeadline,
                serverTime: window.serverTime
              }
            }
          )
        );
      }

      const outcome = store.createBidCommit({
        taskId,
        agentId: payload.commit.agentId,
        idempotencyKey: payload.idempotencyKey,
        commit: payload.commit,
        window
      });

      if (!outcome.created && !outcome.idempotentReplay) {
        return reply(
          409,
          buildError("BID_COMMIT_DUPLICATE", "IDEMPOTENCY", `bid ${payload.commit.bidId} already exists`, {
            auditId: "audit_bid_commit_duplicate",
            details: {
              bidId: payload.commit.bidId,
              taskId,
              existingCommitAuditId: outcome.record.auditRefs.commit
            }
          })
        );
      }

      return reply(202, {
        bidId: outcome.record.bidId,
        taskId,
        agentId: outcome.record.agentId,
        phase: "COMMIT",
        status: "COMMITTED",
        result: outcome.created ? "COMMITTED" : "RETURNED_EXISTING",
        commit: outcome.record.commit,
        window
      });
    }

    const revealMatch = requestUrl.pathname.match(TASK_BID_REVEAL_PATTERN);
    if (req.method === "POST" && revealMatch) {
      const taskId = revealMatch[1];
      const task = store.getTask(taskId);
      if (!task) {
        return reply(
          404,
          buildError("TASK_MATCH_TASK_NOT_FOUND", "MATCHING", `task_id ${taskId} was not found`, {
            auditId: "audit_task_match_not_found"
          })
        );
      }

      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(
          400,
          buildError("BID_REVEAL_PAYLOAD_INVALID", "VALIDATION", "Request body must be valid JSON", {
            auditId: "audit_bid_reveal_payload_invalid"
          })
        );
      }

      const validationError = validateRevealPayload(taskId, payload);
      if (validationError) {
        return reply(400, validationError);
      }

      const bid = store.getBidForTask(taskId, payload.reveal.bidId);
      if (!bid) {
        return reply(
          400,
          buildError(
            "BID_REVEAL_COMMIT_NOT_FOUND",
            "PRECONDITION",
            `no prior commit exists for bid ${payload.reveal.bidId}`,
            {
              auditId: "audit_bid_reveal_commit_not_found",
              details: { bidId: payload.reveal.bidId, taskId }
            }
          )
        );
      }

      const window = buildWindow(task, nowValue);
      if (window.currentPhase !== "REVEAL_OPEN") {
        return reply(
          409,
          buildError(
            "BID_REVEAL_WINDOW_CLOSED",
            "WINDOW",
            `reveal window is not open for task ${taskId}`,
            {
              auditId: "audit_bid_reveal_window_closed",
              details: {
                bidId: payload.reveal.bidId,
                taskId,
                currentPhase: window.currentPhase,
                revealDeadline: window.revealDeadline,
                commitRecordedAt: bid.commit.committedAt
              }
            }
          )
        );
      }

      const expectedHash = bid.commit.bidHash;
      const actualHash = buildRevealHash(payload.reveal);
      if (expectedHash !== actualHash) {
        return reply(
          400,
          buildError(
            "BID_REVEAL_HASH_MISMATCH",
            "PRECONDITION",
            "reveal payload does not match the committed bid hash",
            {
              auditId: "audit_bid_reveal_hash_mismatch",
              details: {
                bidId: payload.reveal.bidId,
                taskId,
                currentPhase: window.currentPhase,
                revealDeadline: window.revealDeadline,
                expectedBidHash: expectedHash
              }
            }
          )
        );
      }

      const matchingSnapshot = store.getMatchingSnapshot(taskId);
      const shortlistedCandidate = matchingSnapshot?.candidates.find(
        (candidate) => candidate.agentId === payload.reveal.agentId && candidate.eligible
      );
      const rankingScore = shortlistedCandidate?.scoreBreakdown?.totalScore ?? 0.5;
      const proofId = payload.reveal.proof.proofId;
      const decisionTraceHash = sha256(
        JSON.stringify({ taskId, bidId: payload.reveal.bidId, agentId: payload.reveal.agentId, rankingScore })
      );

      const outcome = store.setBidReveal({
        taskId,
        bidId: payload.reveal.bidId,
        agentId: payload.reveal.agentId,
        idempotencyKey: payload.idempotencyKey,
        reveal: payload.reveal,
        proofId,
        rankingScore,
        decisionTraceHash
      });

      return reply(200, {
        bidId: outcome.record.bidId,
        taskId,
        agentId: outcome.record.agentId,
        phase: "REVEAL",
        status: "REVEALED",
        result: "REVEALED",
        rankingScore,
        decisionTraceHash,
        revealAcceptedAt: outcome.record.statusChangedAt,
        proofSubmission: {
          proofId,
          verificationStatus: "PENDING_VERIFY"
        },
        window: {
          ...window,
          nextAction: "TRACK_PROOF_VERIFICATION"
        }
      });
    }

    const policyMatch = requestUrl.pathname.match(TASK_PROOF_POLICY_PATTERN);
    if (req.method === "POST" && policyMatch) {
      const taskId = policyMatch[1];
      const task = store.getTask(taskId);
      if (!task) {
        return reply(
          404,
          buildError("TASK_MATCH_TASK_NOT_FOUND", "MATCHING", `task_id ${taskId} was not found`, {
            auditId: "audit_task_match_not_found"
          })
        );
      }

      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(
          400,
          buildError("PROOF_POLICY_INPUT_INVALID", "POLICY", "Request body must be valid JSON", {
            auditId: "audit_proof_policy_input_invalid"
          })
        );
      }

      const validationError = validateProofPolicyPayload(payload);
      if (validationError) {
        return reply(400, validationError);
      }

      const decision = resolveProofPolicy(task, payload, nowValue);
      const stored = store.savePolicyDecision({ taskId, agentId: payload.agentId, decision });
      return reply(200, {
        taskId,
        agentId: payload.agentId,
        ...stored
      });
    }

    const verifyMatch = requestUrl.pathname.match(TASK_PROOF_VERIFY_PATTERN);
    if (req.method === "POST" && verifyMatch) {
      const taskId = verifyMatch[1];
      const task = store.getTask(taskId);
      if (!task) {
        return reply(
          404,
          buildError("TASK_MATCH_TASK_NOT_FOUND", "MATCHING", `task_id ${taskId} was not found`, {
            auditId: "audit_task_match_not_found"
          })
        );
      }

      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(
          400,
          buildError("PROOF_VERIFY_PAYLOAD_INVALID", "VALIDATION", "Request body must be valid JSON", {
            auditId: "audit_proof_verify_payload_invalid"
          })
        );
      }

      const validationError = validateVerifyPayload(payload);
      if (validationError) {
        return reply(validationError.code === "PROOF_POLICY_TRACE_MISSING" ? 400 : 400, validationError);
      }

      const policy = store.getPolicyDecision(payload.policyTraceId);
      if (!policy || policy.taskId !== taskId) {
        return reply(
          404,
          buildError(
            "PROOF_POLICY_TRACE_NOT_FOUND",
            "POLICY",
            `policyTraceId ${payload.policyTraceId} was not found for task ${taskId}`,
            {
              auditId: "audit_proof_policy_trace_not_found"
            }
          )
        );
      }

      const bid = store.getBid(payload.proof.bidId ?? payload.proof.proofId.replace(/^proof/, "bid"));
      const submittedProof = store.getProof(payload.proof.proofId);
      if (!submittedProof) {
        return reply(
          400,
          buildError("PROOF_VERIFY_PAYLOAD_INVALID", "VALIDATION", `proof ${payload.proof.proofId} was not submitted by a reveal`, {
            auditId: "audit_proof_verify_payload_invalid",
            details: { proofId: payload.proof.proofId }
          })
        );
      }

      const verdict = verifyProofAgainstPolicy(policy, payload.proof);
      const verification = {
        ...verdict,
        proofId: payload.proof.proofId,
        policyTraceId: policy.policyTraceId,
        requiredPolicy: policy,
        decisionTraceHash: sha256(JSON.stringify({ proofId: payload.proof.proofId, verdict, policyTraceId: policy.policyTraceId })),
        verifiedAt: nowValue,
        actorRole: req.headers["x-audit-reason"] ? "OPERATOR" : "VERIFIER_SERVICE",
        actorId: req.headers["x-audit-reason"] ? "operator_manual_override" : "verifier_policy_engine"
      };

      const proofRecord = submittedProof;
      const bidRecord = store.getBid(proofRecord.bidId);
      store.recordProofVerification({
        taskId,
        bidId: proofRecord.bidId,
        proofId: payload.proof.proofId,
        verification
      });

      if (verification.result === "FAIL") {
        return reply(
          422,
          buildError(
            "PROOF_VERIFY_FAILED",
            "POLICY",
            `proof difficulty ${verification.achievedDifficulty} is below required threshold ${verification.requiredDifficulty}`,
            {
              auditId: "audit_proof_verify_failed",
              details: {
                proofId: payload.proof.proofId,
                taskId,
                policyTraceId: policy.policyTraceId,
                requiredDifficulty: verification.requiredDifficulty,
                achievedDifficulty: verification.achievedDifficulty,
                decisionTraceHash: verification.decisionTraceHash,
                reasonCodes: verification.reasonCodes
              }
            }
          )
        );
      }

      return reply(200, {
        proofId: payload.proof.proofId,
        result: verification.result,
        policyTraceId: policy.policyTraceId,
        requiredPolicy: policy,
        requiredDifficulty: verification.requiredDifficulty,
        achievedDifficulty: verification.achievedDifficulty,
        decisionTraceHash: verification.decisionTraceHash,
        reasonCodes: verification.reasonCodes,
        verifiedAt: verification.verifiedAt,
        bidId: bidRecord?.bidId
      });
    }

    const awardMatch = requestUrl.pathname.match(TASK_AWARD_PATTERN);
    if (req.method === "POST" && awardMatch) {
      const taskId = awardMatch[1];
      const task = store.getTask(taskId);
      if (!task) {
        return reply(
          404,
          buildError("TASK_MATCH_TASK_NOT_FOUND", "MATCHING", `task_id ${taskId} was not found`, {
            auditId: "audit_task_match_not_found"
          })
        );
      }

      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(
          400,
          buildError("TASK_AWARD_PRECONDITION_FAILED", "PRECONDITION", "Request body must be valid JSON", {
            auditId: "audit_task_award_invalid_payload"
          })
        );
      }

      const validationError = validateAwardPayload(payload);
      if (validationError) {
        return reply(400, validationError);
      }

      const bid = store.getBidForTask(taskId, payload.bidId);
      if (!bid) {
        return reply(
          404,
          buildError("AUDIT_QUERY_NOT_FOUND", "AUDIT", `bid ${payload.bidId} was not found for task ${taskId}`, {
            auditId: "audit_task_award_bid_not_found"
          })
        );
      }

      if (!bid.proofId || !bid.verification) {
        return reply(
          409,
          buildError(
            "TASK_AWARD_PROOF_NOT_VERIFIED",
            "PRECONDITION",
            `award is blocked until proof verification reaches a terminal result for bid ${payload.bidId}`,
            {
              auditId: "audit_task_award_proof_not_verified",
              retryable: true,
              retryAfterSeconds: 1,
              details: {
                bidId: payload.bidId,
                taskId,
                proofId: bid.proofId
              }
            }
          )
        );
      }

      if (bid.verification.result !== "PASS") {
        return reply(
          409,
          buildError(
            "TASK_AWARD_PRECONDITION_FAILED",
            "PRECONDITION",
            `bid ${payload.bidId} is not awardable because proof result is ${bid.verification.result}`,
            {
              auditId: "audit_task_award_precondition_failed",
              details: {
                bidId: payload.bidId,
                taskId,
                proofId: bid.proofId,
                proofResult: bid.verification.result
              }
            }
          )
        );
      }

      const awardReason = payload.awardReason ?? "Highest score among fully verified candidates.";
      const award = store.createAward({
        taskId,
        bidId: bid.bidId,
        award: {
          agentId: bid.agentId,
          awardedAt: nowValue,
          awardReason,
          actorId: workspaceId,
          decisionTraceHash: bid.decisionTraceHash ?? bid.verification.decisionTraceHash,
          scoreSummary: {
            rankingScore: bid.rankingScore ?? 0,
            budgetFitScore: bid.rankingScore ? round(Math.max(0.4, bid.rankingScore - 0.05)) : undefined,
            latencyScore: bid.rankingScore ? round(Math.max(0.4, bid.rankingScore - 0.02)) : undefined
          },
          proofSummary: {
            proofId: bid.proofId,
            result: bid.verification.result,
            decisionTraceHash: bid.verification.decisionTraceHash,
            reasonCodes: bid.verification.reasonCodes,
            policyTraceId: bid.verification.policyTraceId
          }
        }
      });

      return reply(
        200,
        buildAwardResponse({
          awardId: award.record.awardId,
          taskId,
          bidId: bid.bidId,
          agentId: bid.agentId,
          awardedAt: award.record.awardedAt,
          decisionTraceHash: award.record.award.decisionTraceHash,
          scoreSummary: award.record.award.scoreSummary,
          proofSummary: award.record.award.proofSummary,
          awardReason
        })
      );
    }

    const taskEventsMatch = requestUrl.pathname.match(TASK_EVENTS_PATTERN) ?? requestUrl.pathname.match(TASK_AUDIT_EVENTS_PATTERN);
    if (req.method === "GET" && taskEventsMatch) {
      const taskId = taskEventsMatch[1];
      const task = store.getTask(taskId);
      if (!task) {
        return reply(
          404,
          buildError("AUDIT_QUERY_NOT_FOUND", "AUDIT", `no audit timeline exists for task ${taskId}`, {
            auditId: "audit_query_not_found_001",
            retryable: true,
            retryAfterSeconds: 1
          })
        );
      }

      const bidId = requestUrl.searchParams.get("bidId") ?? undefined;
      const events = store.listAuditEventsForTask(taskId, { bidId });
      return reply(200, buildAuditEventListResponse({ taskId, bidId, events }));
    }

    const bidEventsMatch = requestUrl.pathname.match(BID_EVENTS_PATTERN);
    if (req.method === "GET" && bidEventsMatch) {
      const bidId = bidEventsMatch[1];
      const events = store.listAuditEventsForBid(bidId);
      if (events.length === 0) {
        return reply(
          404,
          buildError("AUDIT_QUERY_NOT_FOUND", "AUDIT", `no audit timeline exists for bid ${bidId}`, {
            auditId: "audit_query_not_found_001",
            retryable: true,
            retryAfterSeconds: 1
          })
        );
      }

      return reply(200, buildAuditEventListResponse({ taskId: events[0].taskId, bidId, events }));
    }

    logRequest({
      logger,
      config,
      method: req.method,
      pathname: requestUrl.pathname,
      statusCode: 404,
      durationMs: Date.now() - requestStartedAt,
      workspaceId
    });
    return sendNotFound(res, requestUrl.pathname);
  };
}
