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
const TASK_BID_STATUS_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/bids\/(bid_[a-zA-Z0-9_-]{8,64})$/;
const TASK_PROOF_POLICY_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/proof-policy$/;
const TASK_PROOF_VERIFY_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/proofs\/verify$/;
const TASK_PROOF_STATUS_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/proofs\/(proof_[a-zA-Z0-9_-]{8,64})$/;
const TASK_AWARD_PATTERN = /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/award$/;
const BID_EVENTS_PATTERN = /^\/v1\/bids\/(bid_[a-zA-Z0-9_-]{8,64})\/events$/;
const SUPPORTED_AGENT_BUNDLE_SCHEMA_VERSION = "1.0";
const AGENT_BUNDLE_AUDIT_IDS = {
  invalidJson: "audit_bundle_upload_invalid_json",
  schemaInvalid: "audit_bundle_upload_schema_invalid",
  unsupportedSchema: "audit_bundle_upload_unsupported_schema",
  signerMismatch: "audit_bundle_upload_signer_mismatch",
  payloadHashMismatch: "audit_bundle_upload_payload_hash_mismatch",
  signatureInvalid: "audit_bundle_upload_signature_invalid",
  versionConflict: "audit_bundle_upload_version_conflict"
};

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function round(value) {
  return Number(value.toFixed(3));
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function canonicalBundlePayloadHash(bundle) {
  const { signature: _signature, ...unsignedBundle } = bundle;
  return sha256(stableSerialize(unsignedBundle));
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

function projectCandidateSnapshot(snapshot, { limit, includeScoreBreakdown }) {
  const projectCandidate = (candidate) => ({
    ...candidate,
    ...(includeScoreBreakdown ? {} : { scoreBreakdown: undefined })
  });

  const eligibleCandidates = snapshot.candidates
    .filter((candidate) => candidate.eligible)
    .slice(0, limit)
    .map(projectCandidate);
  const ineligibleCandidates = snapshot.candidates
    .filter((candidate) => !candidate.eligible)
    .map(projectCandidate);

  return {
    taskId: snapshot.taskId,
    status: snapshot.status,
    generatedAt: snapshot.generatedAt,
    candidates: [...eligibleCandidates, ...ineligibleCandidates]
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

function buildAgentBundleError(code, category, message, { auditId, details, conflict } = {}) {
  return {
    code,
    category,
    message,
    auditId,
    retryable: false,
    ...(details ? { details } : {}),
    ...(conflict ? { conflict } : {})
  };
}

function validateAgentBundleSignature(payload) {
  if (!payload || typeof payload !== "object") {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "request body is required",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "body",
          rule: "required",
          expected: "object",
          actual: "missing"
        }
      }
    );
  }

  if (!payload.idempotencyKey) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "idempotencyKey is required",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "idempotencyKey",
          rule: "required",
          expected: "present",
          actual: "missing"
        }
      }
    );
  }

  const bundle = payload.bundle;
  if (!bundle || typeof bundle !== "object") {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "bundle is required",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "bundle",
          rule: "required",
          expected: "object",
          actual: "missing"
        }
      }
    );
  }

  if (!bundle.identity?.did) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "bundle.identity.did is required",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "bundle.identity.did",
          rule: "required",
          expected: "present",
          actual: "missing"
        }
      }
    );
  }

  if (!bundle.signature?.signerDid) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "bundle.signature.signerDid is required",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "bundle.signature.signerDid",
          rule: "required",
          expected: "present",
          actual: "missing"
        }
      }
    );
  }

  if (bundle.signature.signerDid !== bundle.identity.did) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SIGNATURE_SIGNER_MISMATCH",
      "SIGNATURE",
      "signature.signerDid must match bundle.identity.did",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.signerMismatch,
        details: {
          fieldPath: "bundle.signature.signerDid",
          rule: "signer_matches_identity",
          expected: bundle.identity.did,
          actual: bundle.signature.signerDid
        }
      }
    );
  }

  const canonicalPayloadHash = canonicalBundlePayloadHash(bundle);
  if (!bundle.signature?.payloadHash || bundle.signature.payloadHash !== canonicalPayloadHash) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH",
      "SIGNATURE",
      "signature.payloadHash must match the canonical bundle payload hash",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.payloadHashMismatch,
        details: {
          fieldPath: "bundle.signature.payloadHash",
          rule: "payload_hash_matches_bundle",
          expected: canonicalPayloadHash,
          actual: bundle.signature?.payloadHash ?? "missing"
        }
      }
    );
  }

  if (
    typeof bundle.signature.signature !== "string" ||
    !/^(base64:|sig-).+/.test(bundle.signature.signature)
  ) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SIGNATURE_INVALID",
      "SIGNATURE",
      "signature.signature must contain a verifiable signature payload",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.signatureInvalid,
        details: {
          fieldPath: "bundle.signature.signature",
          rule: "signature_format",
          expected: "base64:<signature>",
          actual: String(bundle.signature.signature ?? "missing")
        }
      }
    );
  }

  return null;
}

function validateAgentBundleSchema(payload) {
  const bundle = payload.bundle;

  if (bundle.schemaVersion !== SUPPORTED_AGENT_BUNDLE_SCHEMA_VERSION) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_UNSUPPORTED_VERSION",
      "SCHEMA",
      `bundle.schemaVersion ${bundle.schemaVersion ?? "missing"} is not supported`,
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.unsupportedSchema,
        details: {
          fieldPath: "bundle.schemaVersion",
          rule: "supported_schema_version",
          expected: SUPPORTED_AGENT_BUNDLE_SCHEMA_VERSION,
          actual: String(bundle.schemaVersion ?? "missing")
        }
      }
    );
  }

  const requiredStringFields = [
    ["bundle.manifest.name", bundle.manifest?.name],
    ["bundle.manifest.version", bundle.manifest?.version],
    ["bundle.manifest.runtime", bundle.manifest?.runtime],
    ["bundle.manifest.entrypoint", bundle.manifest?.entrypoint],
    ["bundle.identity.publicKey", bundle.identity?.publicKey],
    ["bundle.identity.credentialLevel", bundle.identity?.credentialLevel],
    ["bundle.memoryRef.mode", bundle.memoryRef?.mode],
    ["bundle.memoryRef.summaryHash", bundle.memoryRef?.summaryHash],
    ["bundle.signature.algorithm", bundle.signature?.algorithm]
  ];

  for (const [fieldPath, value] of requiredStringFields) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return buildAgentBundleError(
        "AGENT_BUNDLE_SCHEMA_INVALID",
        "SCHEMA",
        `${fieldPath} is required`,
        {
          auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
          details: {
            fieldPath,
            rule: "required",
            expected: "present",
            actual: "missing"
          }
        }
      );
    }
  }

  if (!Array.isArray(bundle.skills) || bundle.skills.length === 0) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "bundle.skills must include at least one skill",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "bundle.skills",
          rule: "min_items",
          expected: ">= 1",
          actual: Array.isArray(bundle.skills) ? "0" : "missing"
        }
      }
    );
  }

  for (let index = 0; index < bundle.skills.length; index += 1) {
    const skill = bundle.skills[index];
    const requiredSkillFields = [
      ["skillId", skill?.skillId],
      ["version", skill?.version],
      ["inputSchema", skill?.inputSchema],
      ["outputSchema", skill?.outputSchema]
    ];

    for (const [fieldName, value] of requiredSkillFields) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim().length === 0)
      ) {
        return buildAgentBundleError(
          "AGENT_BUNDLE_SCHEMA_INVALID",
          "SCHEMA",
          `bundle.skills[${index}].${fieldName} is required`,
          {
            auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
            details: {
              fieldPath: `bundle.skills[${index}].${fieldName}`,
              rule: "required",
              expected: "present",
              actual: "missing"
            }
          }
        );
      }
    }
  }

  if (bundle.memoryRef.mode === "INDEX_ONLY" && !bundle.memoryRef.vectorIndexUri) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "bundle.memoryRef.vectorIndexUri is required for INDEX_ONLY mode",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "bundle.memoryRef.vectorIndexUri",
          rule: "required_for_mode",
          expected: "present",
          actual: "missing"
        }
      }
    );
  }

  if (
    (bundle.memoryRef.mode === "ENCRYPTED_REF" || bundle.memoryRef.mode === "FULL") &&
    !bundle.memoryRef.encryptedBlobUri
  ) {
    return buildAgentBundleError(
      "AGENT_BUNDLE_SCHEMA_INVALID",
      "SCHEMA",
      "bundle.memoryRef.encryptedBlobUri is required for encrypted memory modes",
      {
        auditId: AGENT_BUNDLE_AUDIT_IDS.schemaInvalid,
        details: {
          fieldPath: "bundle.memoryRef.encryptedBlobUri",
          rule: "required_for_mode",
          expected: "present",
          actual: "missing"
        }
      }
    );
  }

  return null;
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
  if (!payload || typeof payload !== "object") {
    return buildError(
      "TASK_AWARD_PRECONDITION_FAILED",
      "PRECONDITION",
      "award payload is required",
      {
        auditId: "audit_task_award_invalid_payload",
        details: { field: "body" }
      }
    );
  }

  if (!payload.idempotencyKey) {
    return buildError(
      "TASK_AWARD_PRECONDITION_FAILED",
      "PRECONDITION",
      "idempotencyKey is required to award a task",
      {
        auditId: "audit_task_award_invalid_payload",
        details: { field: "idempotencyKey" }
      }
    );
  }

  if (!payload.award || typeof payload.award !== "object") {
    return buildError(
      "TASK_AWARD_PRECONDITION_FAILED",
      "PRECONDITION",
      "award payload is required",
      {
        auditId: "audit_task_award_invalid_payload",
        details: { field: "award" }
      }
    );
  }

  const requiredFields = ["bidId", "awardReason", "shortlistAuditId", "proofAuditId"];
  for (const field of requiredFields) {
    if (!payload.award[field]) {
      return buildError(
        "TASK_AWARD_PRECONDITION_FAILED",
        "PRECONDITION",
        `award.${field} is required`,
        {
          auditId: "audit_task_award_invalid_payload",
          details: { field: `award.${field}` }
        }
      );
    }
  }

  return null;
}

function pickPrimaryAwardBid(bids) {
  return [...bids]
    .filter((bid) => bid.reveal)
    .sort((left, right) => {
    const leftPass = left.verification?.result === "PASS" ? 1 : 0;
    const rightPass = right.verification?.result === "PASS" ? 1 : 0;
    if (leftPass !== rightPass) {
      return rightPass - leftPass;
    }

    const leftScore = left.rankingScore ?? -1;
    const rightScore = right.rankingScore ?? -1;
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return (left.statusChangedAt ?? "").localeCompare(right.statusChangedAt ?? "");
    })[0] ?? null;
}

function buildAwardProofSummary(bid) {
  if (!bid?.proofId || !bid.verification) {
    return undefined;
  }

  return {
    proofId: bid.proofId,
    result: bid.verification.result,
    reasonCodes: bid.verification.reasonCodes,
    requiredDifficulty: bid.verification.requiredDifficulty,
    achievedDifficulty: bid.verification.achievedDifficulty,
    verifiedAt: bid.verification.verifiedAt,
    auditId: bid.auditRefs?.verify
  };
}

function buildAwardDecisionDetail({ task, bid, award }) {
  if (award && bid) {
    return {
      taskId: task.taskId,
      status: "AWARDED",
      statusMessage: "Award confirmed and ready for downstream handoff.",
      shortlistedBidId: award.bidId,
      awardedBidId: award.bidId,
      awardedAgentId: bid.agentId,
      awardReason: award.award.awardReason,
      ...(award.award.managerDecisionNote ? { managerDecisionNote: award.award.managerDecisionNote } : {}),
      shortlistAuditId: award.award.shortlistAuditId,
      proofAuditId: award.award.proofAuditId,
      proofSummary: buildAwardProofSummary(bid),
      decisionTraceHash: award.award.decisionTraceHash,
      auditEventId: bid.auditRefs?.award,
      handoff: {
        status: "READY",
        handoffChannel: "API",
        checklist: ["publish award event", "notify winner"]
      },
      reviewedAt: award.awardedAt,
      awardedAt: award.awardedAt
    };
  }

  if (bid?.verification?.result === "PASS") {
    return {
      taskId: task.taskId,
      status: "READY_TO_AWARD",
      statusMessage: "Proof passed and shortlist evidence is complete.",
      shortlistedBidId: bid.bidId,
      awardedAgentId: bid.agentId,
      shortlistAuditId: bid.auditRefs?.reveal ?? bid.auditRefs?.commit,
      proofAuditId: bid.auditRefs?.verify,
      proofSummary: buildAwardProofSummary(bid),
      decisionTraceHash: bid.decisionTraceHash ?? bid.verification.decisionTraceHash,
      handoff: {
        status: "READY",
        handoffChannel: "API",
        checklist: ["publish award event", "notify winner"]
      },
      reviewedAt: bid.verification.verifiedAt
    };
  }

  if (bid) {
    const blockedMessage = !bid.proofId || !bid.verification
      ? "Award is blocked until proof verification reaches a terminal result."
      : `Bid ${bid.bidId} is not awardable because proof result is ${bid.verification.result}.`;

    return {
      taskId: task.taskId,
      status: "BLOCKED",
      statusMessage: blockedMessage,
      shortlistedBidId: bid.bidId,
      awardedAgentId: bid.agentId,
      shortlistAuditId: bid.auditRefs?.reveal ?? bid.auditRefs?.commit,
      proofAuditId: bid.auditRefs?.verify,
      ...(buildAwardProofSummary(bid) ? { proofSummary: buildAwardProofSummary(bid) } : {}),
      ...(bid.decisionTraceHash ? { decisionTraceHash: bid.decisionTraceHash } : {}),
      handoff: {
        status: "PENDING",
        checklist: ["wait for proof verification", "refresh award readiness"]
      },
      reviewedAt: bid.statusChangedAt
    };
  }

  return {
    taskId: task.taskId,
    status: "PENDING_REVIEW",
    statusMessage: "No shortlisted bid is ready for award yet.",
    handoff: {
      status: "PENDING",
      checklist: ["materialize shortlist", "complete bid reveal", "verify proof"]
    }
  };
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

function toLegacyAuditEventRecord(event, store) {
  if (event.eventType === "TASK_CREATED") {
    return {
      auditId: event.auditId,
      eventType: event.eventType,
      entityType: "task",
      entityId: event.taskId,
      taskId: event.taskId,
      summary: event.summary,
      recordedAt: event.occurredAt
    };
  }

  if (event.eventType === "TASK_AWARDED") {
    const award = event.bidId ? store.findAwardForTaskBid(event.taskId, event.bidId) : null;
    return {
      auditId: event.auditId,
      eventType: event.eventType,
      entityType: "award",
      entityId: award?.awardId ?? event.bidId ?? event.taskId,
      taskId: event.taskId,
      summary: event.summary,
      recordedAt: event.occurredAt
    };
  }

  if (event.eventType === "POMW_VERIFIED") {
    return {
      auditId: event.auditId,
      eventType: event.eventType,
      entityType: "proof",
      entityId: event.proofId ?? event.bidId ?? event.taskId,
      taskId: event.taskId,
      summary: event.summary,
      recordedAt: event.occurredAt
    };
  }

  return {
    auditId: event.auditId,
    eventType: event.eventType,
    entityType: "bid",
    entityId: event.bidId ?? event.taskId,
    taskId: event.taskId,
    summary: event.summary,
    recordedAt: event.occurredAt
  };
}

function buildLegacyTaskAuditEventListResponse({ taskId, events, store }) {
  return {
    taskId,
    count: events.length,
    events: events.map((event) => toLegacyAuditEventRecord(event, store))
  };
}

function buildAuditEventListResponse({ taskId, bidId, events }) {
  return {
    taskId,
    ...(bidId ? { bidId } : {}),
    hasMore: events.hasMore,
    ...(events.nextCursor ? { nextCursor: events.nextCursor } : {}),
    events: events.records
  };
}

function parseAuditPagination(searchParams) {
  const cursor = searchParams.get("cursor") ?? undefined;
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw === null ? 50 : Number.parseInt(limitRaw, 10);

  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    return {
      error: buildError("AUDIT_QUERY_LIMIT_INVALID", "AUDIT", "limit must be between 1 and 200", {
        auditId: "audit_query_limit_invalid"
      })
    };
  }

  return {
    cursor,
    limit
  };
}

function paginateAuditEvents(events, { cursor, limit }) {
  if (!cursor) {
    const records = events.slice(0, limit);
    return {
      records,
      hasMore: events.length > records.length,
      nextCursor: events.length > records.length ? records.at(-1)?.eventId : undefined
    };
  }

  const cursorIndex = events.findIndex((event) => event.eventId === cursor);
  if (cursorIndex === -1) {
    return {
      error: buildError("AUDIT_CURSOR_INVALID", "AUDIT", `cursor ${cursor} was not found`, {
        auditId: "audit_query_cursor_invalid"
      })
    };
  }

  const records = events.slice(cursorIndex + 1, cursorIndex + 1 + limit);
  return {
    records,
    hasMore: cursorIndex + 1 + limit < events.length,
    nextCursor:
      cursorIndex + 1 + limit < events.length && records.length > 0
        ? records.at(-1)?.eventId
        : undefined
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

function buildRefreshPolicy({ lastUpdatedAt, pollAfterSeconds = 2, manualRefreshAllowed = true }) {
  return {
    mode: "POLL",
    pollAfterSeconds,
    manualRefreshAllowed,
    lastUpdatedAt
  };
}

function isTerminalProofState(result) {
  return result === "PASS" || result === "FAIL" || result === "MANUAL_REVIEW";
}

function mapProofStatusReasonCodes(verification) {
  if (!verification?.result) {
    return undefined;
  }

  if (verification.result === "FAIL") {
    return ["PROOF_VERIFY_FAILED"];
  }

  if (verification.result === "MANUAL_REVIEW") {
    return ["PROOF_VERIFY_NEEDS_REVIEW"];
  }

  return undefined;
}

function buildBidStatusResponse({ task, bid, proof, award, nowValue }) {
  const window = buildWindow(task, nowValue);
  const proofReasonCodes = mapProofStatusReasonCodes(bid.verification);
  let revealState = "REVEALED";
  if (!bid.reveal) {
    if (window.currentPhase === "COMMIT_OPEN") {
      revealState = "WAITING_FOR_WINDOW";
    } else if (window.currentPhase === "REVEAL_OPEN") {
      revealState = "READY";
    } else {
      revealState = "REJECTED";
    }
  }

  let proofState = "NOT_SUBMITTED";
  if (proof) {
    proofState = proof.verification?.result ?? "QUEUED";
  }

  let awardState = "NOT_DECIDED";
  if (award?.bidId === bid.bidId) {
    awardState = "AWARDED";
  } else if (award?.bidId && award.bidId !== bid.bidId) {
    awardState = "NOT_SELECTED";
  } else if (bid.verification?.result === "PASS") {
    awardState = "SHORTLISTED";
  } else if (bid.verification?.result === "FAIL") {
    awardState = "NOT_SELECTED";
  }

  const failureReasonCodes = [];
  if (!bid.reveal && window.currentPhase === "CLOSED") {
    failureReasonCodes.push("BID_REVEAL_WINDOW_CLOSED");
  }
  if (proofReasonCodes?.length) {
    failureReasonCodes.push(...proofReasonCodes);
  }

  const lastUpdatedAt = award?.awardedAt ?? bid.statusChangedAt ?? bid.commit?.committedAt ?? task.createdAt;
  return {
    bidId: bid.bidId,
    taskId: bid.taskId,
    agentId: bid.agentId,
    latestPhase: bid.phase,
    commitState: bid.commit ? "COMMITTED" : "PENDING",
    revealState,
    proofState,
    awardState,
    deadlines: {
      commitDeadline: task.commitDeadline,
      revealDeadline: task.revealDeadline
    },
    ...(proof
      ? {
          proof: {
            proofId: proof.proofId,
            ...(proof.verification?.result ? { result: proof.verification.result } : {}),
            ...(proofReasonCodes?.length ? { reasonCodes: proofReasonCodes } : {}),
            ...(proof.verification?.verifiedAt ? { verifiedAt: proof.verification.verifiedAt } : {}),
            ...(proof.verification?.decisionTraceHash
              ? { decisionTraceHash: proof.verification.decisionTraceHash }
              : {})
          }
        }
      : {}),
    ...(failureReasonCodes.length ? { failureReasonCodes } : {}),
    auditRefs: {
      ...(bid.auditRefs?.reveal || bid.auditRefs?.commit
        ? { bidAuditId: bid.auditRefs.reveal ?? bid.auditRefs.commit }
        : {}),
      ...(bid.auditRefs?.verify ? { proofAuditId: bid.auditRefs.verify } : {}),
      ...(bid.decisionTraceHash ? { decisionTraceHash: bid.decisionTraceHash } : {})
    },
    refresh: buildRefreshPolicy({
      lastUpdatedAt,
      pollAfterSeconds:
        awardState === "AWARDED" || awardState === "NOT_SELECTED" || isTerminalProofState(proofState)
          ? 30
          : 2
    })
  };
}

function buildProofStatusResponse({ proof, nowValue }) {
  const reasonCodes = mapProofStatusReasonCodes(proof.verification);
  const verificationState = proof.verification?.result ?? "QUEUED";
  const lastUpdatedAt = proof.verification?.verifiedAt ?? proof.submittedAt ?? nowValue;

  return {
    proofId: proof.proofId,
    taskId: proof.taskId,
    bidId: proof.bidId,
    agentId: proof.agentId,
    verificationState,
    ...(proof.verification?.requiredDifficulty !== undefined
      ? { requiredDifficulty: proof.verification.requiredDifficulty }
      : {}),
    ...(proof.verification?.achievedDifficulty !== undefined
      ? { achievedDifficulty: proof.verification.achievedDifficulty }
      : {}),
    ...(reasonCodes?.length ? { reasonCodes } : {}),
    ...(proof.verification?.result === "MANUAL_REVIEW" ? { needsManualReview: true } : {}),
    ...(proof.verification?.decisionTraceHash
      ? { decisionTraceHash: proof.verification.decisionTraceHash }
      : {}),
    ...(proof.verification?.verifiedAt ? { verifiedAt: proof.verification.verifiedAt } : {}),
    refresh: buildRefreshPolicy({
      lastUpdatedAt,
      pollAfterSeconds: isTerminalProofState(verificationState) ? 30 : 2
    })
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
  const expectedSignerDid = `did:key:${proof.agentId}`;
  const hasValidSignature =
    typeof proof.identityProof.signature === "string" &&
    proof.identityProof.signature.startsWith("sig-");

  if (proof.identityProof.signerDid !== expectedSignerDid || !hasValidSignature) {
    reasonCodes.push("TRACE_SIGNATURE_INVALID");
  }

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

    if (req.method === "POST" && requestUrl.pathname === "/v1/agents/bundles") {
      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(
          400,
          buildAgentBundleError(
            "AGENT_BUNDLE_SCHEMA_INVALID",
            "SCHEMA",
            "Request body must be valid JSON",
            {
              auditId: AGENT_BUNDLE_AUDIT_IDS.invalidJson,
              details: {
                fieldPath: "body",
                rule: "valid_json",
                expected: "valid JSON object",
                actual: "invalid"
              }
            }
          )
        );
      }

      const signatureError = validateAgentBundleSignature(payload);
      if (signatureError) {
        return reply(400, signatureError);
      }

      const schemaError = validateAgentBundleSchema(payload);
      if (schemaError) {
        return reply(400, schemaError);
      }

      const payloadHash = canonicalBundlePayloadHash(payload.bundle);
      const outcome = store.saveAgentBundle({
        idempotencyKey: payload.idempotencyKey,
        bundle: payload.bundle,
        payloadHash
      });

      if (outcome.conflict) {
        return reply(
          409,
          buildAgentBundleError(
            "AGENT_BUNDLE_VERSION_CONFLICT",
            "VERSION",
            `${outcome.record.agentId}@${outcome.record.version} already exists with a different payload hash`,
            {
              auditId: AGENT_BUNDLE_AUDIT_IDS.versionConflict,
              conflict: {
                strategy: "REJECT_ON_HASH_MISMATCH",
                existingAgentId: outcome.record.agentId,
                existingVersion: outcome.record.version,
                existingPayloadHash: outcome.record.payloadHash,
                incomingPayloadHash: payloadHash
              }
            }
          )
        );
      }

      if (outcome.replay) {
        return reply(200, {
          agentId: outcome.record.agentId,
          version: outcome.record.version,
          status: "EXISTING",
          result: "RETURNED_EXISTING",
          indexing: outcome.record.indexing,
          replay: {
            strategy: "RETURN_EXISTING_ON_HASH_MATCH",
            existingAgentId: outcome.record.agentId,
            existingVersion: outcome.record.version,
            existingPayloadHash: outcome.record.payloadHash,
            incomingPayloadHash: payloadHash
          },
          indexedAt: outcome.record.indexedAt
        });
      }

      return reply(201, {
        agentId: outcome.record.agentId,
        version: outcome.record.version,
        status: "ACCEPTED",
        result: "CREATED",
        indexing: outcome.record.indexing,
        indexedAt: outcome.record.indexedAt
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
          task: task.task
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
      return reply(200, projectCandidateSnapshot(snapshot, { limit, includeScoreBreakdown }));
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

    const bidStatusMatch = requestUrl.pathname.match(TASK_BID_STATUS_PATTERN);
    if (req.method === "GET" && bidStatusMatch) {
      const taskId = bidStatusMatch[1];
      const bidId = bidStatusMatch[2];
      const task = store.getTask(taskId);
      const bid = store.getBidForTask(taskId, bidId);
      if (!task || !bid) {
        return reply(
          404,
          buildError(
            "BID_STATUS_NOT_FOUND",
            "AUDIT",
            `no bid status projection exists for bid ${bidId} on task ${taskId}`,
            {
              auditId: "audit_bid_status_not_found",
              retryable: true,
              retryAfterSeconds: 2,
              details: { taskId, bidId }
            }
          )
        );
      }

      const proof = bid.proofId ? store.getProof(bid.proofId) : null;
      const award = store.findAwardForTask(taskId);
      return reply(200, buildBidStatusResponse({ task, bid, proof, award, nowValue }));
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

    const proofStatusMatch = requestUrl.pathname.match(TASK_PROOF_STATUS_PATTERN);
    if (req.method === "GET" && proofStatusMatch) {
      const taskId = proofStatusMatch[1];
      const proofId = proofStatusMatch[2];
      const proof = store.getProof(proofId);
      if (!proof || proof.taskId !== taskId) {
        return reply(
          404,
          buildError(
            "PROOF_STATUS_NOT_FOUND",
            "AUDIT",
            `no proof status projection exists for proof ${proofId} on task ${taskId}`,
            {
              auditId: "audit_proof_status_not_found",
              retryable: true,
              retryAfterSeconds: 2,
              details: { taskId, proofId }
            }
          )
        );
      }

      return reply(200, buildProofStatusResponse({ proof, nowValue }));
    }

    const awardMatch = requestUrl.pathname.match(TASK_AWARD_PATTERN);
    if (req.method === "GET" && awardMatch) {
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

      const award = store.findAwardForTask(taskId);
      const bids = store.listBidsForTask(taskId);
      const bid = award ? store.getBid(award.bidId) : pickPrimaryAwardBid(bids);

      return reply(200, buildAwardDecisionDetail({ task, bid, award }));
    }

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

      const awardRequest = payload.award;
      const bid = store.getBidForTask(taskId, awardRequest.bidId);
      if (!bid) {
        return reply(
          404,
          buildError("AUDIT_QUERY_NOT_FOUND", "AUDIT", `bid ${awardRequest.bidId} was not found for task ${taskId}`, {
            auditId: "audit_task_award_bid_not_found"
          })
        );
      }

      const expectedShortlistAuditId = bid.auditRefs?.reveal ?? bid.auditRefs?.commit;
      const expectedProofAuditId = bid.auditRefs?.verify;
      if (
        awardRequest.shortlistAuditId !== expectedShortlistAuditId ||
        awardRequest.proofAuditId !== expectedProofAuditId
      ) {
        return reply(
          409,
          buildError(
            "TASK_AWARD_PRECONDITION_FAILED",
            "PRECONDITION",
            "award evidence references do not match the current shortlist/proof audit trail",
            {
              auditId: "audit_task_award_precondition_failed",
              details: {
                bidId: awardRequest.bidId,
                taskId,
                expectedShortlistAuditId,
                expectedProofAuditId
              }
            }
          )
        );
      }

      if (!bid.proofId || !bid.verification) {
        return reply(
          409,
          buildError(
            "TASK_AWARD_PROOF_NOT_VERIFIED",
            "PRECONDITION",
            `award is blocked until proof verification reaches a terminal result for bid ${awardRequest.bidId}`,
            {
              auditId: "audit_task_award_proof_not_verified",
              retryable: true,
              retryAfterSeconds: 1,
              details: {
                bidId: awardRequest.bidId,
                taskId,
                proofId: bid.proofId
              }
            }
          )
        );
      }

      if (bid.verification.result !== "PASS") {
        return reply(
          422,
          buildError(
            "TASK_AWARD_PRECONDITION_FAILED",
            "PRECONDITION",
            `bid ${awardRequest.bidId} is not awardable because proof result is ${bid.verification.result}`,
            {
              auditId: "audit_task_award_precondition_failed",
              details: {
                bidId: awardRequest.bidId,
                taskId,
                proofId: bid.proofId,
                proofResult: bid.verification.result
              }
            }
          )
        );
      }

      const awardReason = awardRequest.awardReason;
      const award = store.createAward({
        taskId,
        bidId: bid.bidId,
        idempotencyKey: payload.idempotencyKey,
        award: {
          agentId: bid.agentId,
          awardedAt: nowValue,
          awardReason,
          managerDecisionNote: awardRequest.managerDecisionNote,
          shortlistAuditId: awardRequest.shortlistAuditId,
          proofAuditId: awardRequest.proofAuditId,
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

      if (award.idempotencyConflict) {
        return reply(
          409,
          buildError(
            "TASK_AWARD_IDEMPOTENCY_CONFLICT",
            "IDEMPOTENCY",
            "idempotencyKey was already used with a different award payload",
            {
              auditId: "audit_task_award_idempotency_conflict",
              details: {
                taskId,
                bidId: awardRequest.bidId
              }
            }
          )
        );
      }

      if (award.alreadyAwarded) {
        return reply(
          409,
          buildError(
            "TASK_AWARD_PRECONDITION_FAILED",
            "PRECONDITION",
            `task ${taskId} has already been awarded`,
            {
              auditId: bid.auditRefs?.award ?? "audit_task_award_precondition_failed",
              details: {
                taskId,
                awardedBidId: award.record.bidId
              }
            }
          )
        );
      }

      const awardedBid = store.getBid(award.record.bidId);
      return reply(
        200,
        buildAwardDecisionDetail({
          task,
          bid: awardedBid,
          award: award.record
        })
      );
    }

    const taskEventsMatch = requestUrl.pathname.match(TASK_EVENTS_PATTERN);
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
      const pagination = parseAuditPagination(requestUrl.searchParams);
      if (pagination.error) {
        return reply(400, pagination.error);
      }

      const pagedEvents = paginateAuditEvents(events, pagination);
      if (pagedEvents.error) {
        return reply(400, pagedEvents.error);
      }

      return reply(200, buildAuditEventListResponse({ taskId, bidId, events: pagedEvents }));
    }

    const taskAuditEventsMatch = requestUrl.pathname.match(TASK_AUDIT_EVENTS_PATTERN);
    if (req.method === "GET" && taskAuditEventsMatch) {
      const taskId = taskAuditEventsMatch[1];
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

      const events = store.listAuditEventsForTask(taskId);
      return reply(200, buildLegacyTaskAuditEventListResponse({ taskId, events, store }));
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

      const pagination = parseAuditPagination(requestUrl.searchParams);
      if (pagination.error) {
        return reply(400, pagination.error);
      }

      const pagedEvents = paginateAuditEvents(events, pagination);
      if (pagedEvents.error) {
        return reply(400, pagedEvents.error);
      }

      return reply(
        200,
        buildAuditEventListResponse({ taskId: events[0].taskId, bidId, events: pagedEvents })
      );
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
