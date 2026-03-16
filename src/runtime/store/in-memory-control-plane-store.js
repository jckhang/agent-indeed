import { createHash } from "node:crypto";
import { IdSequence } from "../lib/id-sequence.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hashPayload(value) {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function roundScore(value) {
  return Number(value.toFixed(3));
}

export class InMemoryControlPlaneStore {
  constructor({ now = () => new Date().toISOString() } = {}) {
    this.now = now;
    this.tasks = new Map();
    this.bids = new Map();
    this.proofs = new Map();
    this.awards = new Map();
    this.policyDecisions = new Map();
    this.auditEvents = [];
    this.taskIds = new IdSequence("task");
    this.bidIds = new IdSequence("bid");
    this.proofIds = new IdSequence("proof");
    this.awardIds = new IdSequence("award");
    this.auditIds = new IdSequence("audit");
    this.eventIds = new IdSequence("aev");
    this.matchingTraceIds = new IdSequence("matchtrace");
    this.policyTraceIds = new IdSequence("policytrace");
  }

  createTask({ workspaceId, task }) {
    const taskId = this.taskIds.next();
    const createdAt = this.now();
    const riskLevel = task.risk?.level ?? "LOW";
    const proofPolicyMode = task.powmPolicy?.mode ?? "AUTO_TIERED";
    const record = {
      taskId,
      workspaceId,
      task: clone(task),
      status: "OPEN_FOR_MATCHING",
      createdAt,
      commitDeadline: task.biddingWindow.commitDeadline,
      revealDeadline: task.biddingWindow.revealDeadline,
      matchingSnapshot: null,
      matchingPending: true,
      proofPolicyMode,
      awardedBidId: null
    };

    this.tasks.set(taskId, record);
    this.appendAuditEvent({
      eventType: "TASK_CREATED",
      taskId,
      actorRole: "MANAGER",
      actorId: workspaceId,
      summary: `Task ${task.title} published for candidate matching.`,
      payload: {
        taskStatus: record.status,
        riskLevel,
        proofPolicyMode
      }
    });

    return {
      record: clone(record)
    };
  }

  getTask(taskId) {
    const record = this.tasks.get(taskId);
    return record ? clone(record) : null;
  }

  setCandidateSnapshot(taskId, snapshot) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    task.matchingSnapshot = clone(snapshot);
    task.matchingPending = false;
    task.status = snapshot.candidates.some((candidate) => candidate.eligible)
      ? "OPEN_FOR_BIDDING"
      : "CLOSED_NO_AWARD";
    return clone(task.matchingSnapshot);
  }

  markCandidateSnapshotReady(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    task.matchingPending = false;
    return clone(task);
  }

  createMatchingSnapshot(taskId, candidates) {
    const generatedAt = this.now();
    const matchingTraceId = this.matchingTraceIds.next();
    const ranked = candidates.map((candidate) => ({
      ...clone(candidate),
      matchingTraceId
    }));
    const snapshot = {
      taskId,
      generatedAt,
      status: ranked.some((candidate) => candidate.eligible)
        ? "MATCHED"
        : "NO_ELIGIBLE_CANDIDATES",
      candidates: ranked
    };
    return this.setCandidateSnapshot(taskId, snapshot);
  }

  getMatchingSnapshot(taskId) {
    const task = this.tasks.get(taskId);
    return task?.matchingSnapshot ? clone(task.matchingSnapshot) : null;
  }

  isMatchingPending(taskId) {
    return this.tasks.get(taskId)?.matchingPending ?? false;
  }

  createBidCommit({ taskId, agentId, idempotencyKey, commit, window }) {
    const bidId = commit.bidId ?? this.bidIds.next();
    const committedAt = commit.committedAt ?? this.now();
    const existing = this.bids.get(bidId);

    if (existing) {
      return {
        record: clone(existing),
        created: false,
        idempotentReplay:
          existing.idempotencyKeys.commit === idempotencyKey &&
          existing.commit?.bidHash === commit.bidHash
      };
    }

    const record = {
      bidId,
      taskId,
      agentId,
      phase: "COMMIT",
      status: "COMMITTED",
      commit: {
        ...clone(commit),
        bidId,
        taskId,
        agentId,
        committedAt
      },
      reveal: null,
      proofId: null,
      policyTraceId: null,
      verification: null,
      rankingScore: null,
      decisionTraceHash: null,
      statusChangedAt: committedAt,
      idempotencyKeys: {
        commit: idempotencyKey,
        reveal: null
      },
      auditRefs: {
        commit: null,
        reveal: null,
        verify: null,
        award: null
      }
    };

    this.bids.set(bidId, record);
    const auditEvent = this.appendAuditEvent({
      eventType: "BID_COMMITTED",
      taskId,
      bidId,
      actorRole: "AGENT",
      actorId: agentId,
      summary: `Bid ${bidId} committed during the open commit window.`,
      payload: {
        bidHash: record.commit.bidHash,
        windowPhase: window.currentPhase,
        commitDeadline: window.commitDeadline
      }
    });
    record.auditRefs.commit = auditEvent.auditId;

    return {
      record: clone(record),
      created: true,
      idempotentReplay: false
    };
  }

  getBid(bidId) {
    const record = this.bids.get(bidId);
    return record ? clone(record) : null;
  }

  getBidForTask(taskId, bidId) {
    const record = this.bids.get(bidId);
    if (!record || record.taskId !== taskId) {
      return null;
    }

    return clone(record);
  }

  setBidReveal({ taskId, bidId, agentId, idempotencyKey, reveal, proofId, rankingScore, decisionTraceHash }) {
    const record = this.bids.get(bidId);
    if (!record) {
      return null;
    }

    const revealAcceptedAt = this.now();
    record.phase = "REVEAL";
    record.status = "REVEALED";
    record.agentId = agentId;
    record.reveal = {
      ...clone(reveal),
      bidId,
      taskId,
      agentId,
      proof: {
        ...clone(reveal.proof),
        proofId
      }
    };
    record.proofId = proofId;
    record.idempotencyKeys.reveal = idempotencyKey;
    record.rankingScore = rankingScore;
    record.decisionTraceHash = decisionTraceHash;
    record.statusChangedAt = revealAcceptedAt;

    this.proofs.set(proofId, {
      proofId,
      taskId,
      bidId,
      agentId,
      status: "PENDING_VERIFY",
      proof: clone(record.reveal.proof),
      submittedAt: revealAcceptedAt,
      verification: null
    });

    const auditEvent = this.appendAuditEvent({
      eventType: "BID_REVEALED",
      taskId,
      bidId,
      proofId,
      actorRole: "AGENT",
      actorId: agentId,
      summary: `Bid ${bidId} revealed with proof ${proofId}.`,
      payload: {
        price: clone(record.reveal.price),
        proofId,
        rankingScore,
        decisionTraceHash
      }
    });
    record.auditRefs.reveal = auditEvent.auditId;

    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "VERIFYING";
    }

    return {
      record: clone(record),
      proof: clone(this.proofs.get(proofId))
    };
  }

  getProof(proofId) {
    const record = this.proofs.get(proofId);
    return record ? clone(record) : null;
  }

  savePolicyDecision({ taskId, agentId, decision }) {
    const policyTraceId = decision.policyTraceId ?? this.policyTraceIds.next();
    const record = {
      taskId,
      agentId,
      ...clone(decision),
      policyTraceId,
      persistedAt: decision.persistedAt ?? this.now()
    };

    this.policyDecisions.set(policyTraceId, record);
    const bid = Array.from(this.bids.values()).find(
      (candidate) => candidate.taskId === taskId && candidate.agentId === agentId
    );
    if (bid) {
      bid.policyTraceId = policyTraceId;
    }

    return clone(record);
  }

  getPolicyDecision(policyTraceId) {
    const record = this.policyDecisions.get(policyTraceId);
    return record ? clone(record) : null;
  }

  recordProofVerification({ taskId, bidId, proofId, verification }) {
    const proof = this.proofs.get(proofId);
    if (!proof) {
      return null;
    }

    proof.status = verification.result;
    proof.verification = clone(verification);

    const bid = this.bids.get(bidId);
    if (bid) {
      bid.verification = clone(verification);
      bid.status = verification.result === "PASS" ? "SCORED" : "REJECTED";
      bid.statusChangedAt = verification.verifiedAt;
      bid.decisionTraceHash = verification.decisionTraceHash;
    }

    const auditEvent = this.appendAuditEvent({
      eventType: "POMW_VERIFIED",
      taskId,
      bidId,
      proofId,
      actorRole: verification.actorRole ?? "VERIFIER_SERVICE",
      actorId: verification.actorId ?? "verifier_policy_engine",
      summary: `Proof ${proofId} verified with result ${verification.result}.`,
      payload: {
        result: verification.result,
        policyTraceId: verification.policyTraceId,
        requiredDifficulty: verification.requiredDifficulty,
        achievedDifficulty: verification.achievedDifficulty,
        decisionTraceHash: verification.decisionTraceHash,
        reasonCodes: verification.reasonCodes,
        manualReviewRequired: verification.result === "MANUAL_REVIEW"
      }
    });

    if (bid) {
      bid.auditRefs.verify = auditEvent.auditId;
    }

    return {
      proof: clone(proof),
      bid: bid ? clone(bid) : null,
      auditEvent
    };
  }

  createAward({ taskId, bidId, award }) {
    const awardId = this.awardIds.next();
    const awardedAt = award.awardedAt ?? this.now();
    const record = {
      awardId,
      taskId,
      bidId,
      status: "AWARDED",
      awardedAt,
      award: clone(award)
    };

    this.awards.set(awardId, record);

    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "AWARDED";
      task.awardedBidId = bidId;
    }

    const bid = this.bids.get(bidId);
    if (bid) {
      bid.auditRefs.award = null;
    }

    const auditEvent = this.appendAuditEvent({
      eventType: "TASK_AWARDED",
      taskId,
      bidId,
      proofId: award.proofSummary?.proofId,
      actorRole: "MANAGER",
      actorId: award.actorId ?? task?.workspaceId,
      summary: `Task ${taskId} awarded to bid ${bidId}.`,
      payload: {
        awardedBidId: bidId,
        awardedAgentId: award.agentId,
        taskStatus: "AWARDED",
        awardReason: award.awardReason,
        decisionTraceHash: award.decisionTraceHash,
        scoreSummary: clone(award.scoreSummary),
        proofSummary: clone(award.proofSummary)
      }
    });

    if (bid) {
      bid.auditRefs.award = auditEvent.auditId;
    }

    return {
      record: clone(record),
      auditEvent
    };
  }

  listAuditEventsForTask(taskId, { bidId } = {}) {
    return this.auditEvents
      .filter((event) => event.taskId === taskId)
      .filter((event) => !bidId || event.bidId === bidId)
      .map((event) => clone(event));
  }

  listAuditEventsForBid(bidId) {
    return this.auditEvents
      .filter((event) => event.bidId === bidId)
      .map((event) => clone(event));
  }

  findAwardForTaskBid(taskId, bidId) {
    for (const award of this.awards.values()) {
      if (award.taskId === taskId && award.bidId === bidId) {
        return clone(award);
      }
    }

    return null;
  }

  appendAuditEvent({ eventType, taskId, bidId = null, proofId = null, actorRole, actorId, summary, payload }) {
    const auditId = this.auditIds.next();
    const eventId = this.eventIds.next();
    const occurredAt = this.now();
    const event = {
      eventId,
      eventType,
      taskId,
      ...(bidId ? { bidId } : {}),
      ...(proofId ? { proofId } : {}),
      actorRole,
      ...(actorId ? { actorId } : {}),
      occurredAt,
      auditId,
      traceHash: hashPayload({ eventType, taskId, bidId, proofId, actorRole, actorId, payload }),
      payloadVersion: "1.0",
      summary,
      completeness: "COMPLETE",
      payload: clone(payload)
    };

    this.auditEvents.push(event);
    return clone(event);
  }

  summary() {
    return {
      tasks: this.tasks.size,
      bids: this.bids.size,
      proofs: this.proofs.size,
      awards: this.awards.size,
      auditEvents: this.auditEvents.length,
      latestTaskId: Array.from(this.tasks.keys()).at(-1) ?? null,
      latestAuditId: this.auditEvents.at(-1)?.auditId ?? null
    };
  }
}

export function buildCandidateSnapshot({ taskId, task, includeScoreBreakdown = true, limit = 10 }) {
  const tierRank = { T0: 3, T1: 2, T2: 1 };
  const agentCatalog = [
    {
      agentId: "agent_kestrel_alpha",
      identityTier: "T1",
      skills: ["backend", "api", "workflow", "routing"],
      complianceTags: ["gdpr-eu", "soc2"],
      metrics: {
        successRate: 0.92,
        latency: 0.81,
        budgetFit: 0.86,
        historicalSimilarity: 0.9
      }
    },
    {
      agentId: "agent_kestrel_beta",
      identityTier: "T0",
      skills: ["backend", "api", "ops"],
      complianceTags: ["soc2"],
      metrics: {
        successRate: 0.88,
        latency: 0.79,
        budgetFit: 0.71,
        historicalSimilarity: 0.77
      }
    },
    {
      agentId: "agent_kestrel_gamma",
      identityTier: "T2",
      skills: ["backend", "api"],
      complianceTags: ["gdpr-eu"],
      metrics: {
        successRate: 0.74,
        latency: 0.67,
        budgetFit: 0.8,
        historicalSimilarity: 0.72
      }
    }
  ];

  const requiredSkills = task.constraints.requiredSkills ?? [];
  const complianceTags = task.constraints.complianceTags ?? [];
  const minTier = task.constraints.identityTierMin;
  const rankingFactors = [
    ["SUCCESS_RATE", 0.35, "successRate"],
    ["LATENCY", 0.2, "latency"],
    ["BUDGET_FIT", 0.2, "budgetFit"],
    ["HISTORICAL_SIMILARITY", 0.25, "historicalSimilarity"]
  ];

  const candidates = agentCatalog.map((candidate) => {
    const matchedSkills = candidate.skills.filter((skill) => requiredSkills.includes(skill));
    const missingRequiredSkills = requiredSkills.filter((skill) => !candidate.skills.includes(skill));
    const complianceMissing = complianceTags.filter((tag) => !candidate.complianceTags.includes(tag));
    const identityPassed = tierRank[candidate.identityTier] >= tierRank[minTier];
    const skillsPassed = missingRequiredSkills.length === 0;
    const compliancePassed = complianceMissing.length === 0;
    const eligible = identityPassed && skillsPassed && compliancePassed;
    const factors = rankingFactors.map(([factor, weight, metricKey]) => {
      const rawScore = candidate.metrics[metricKey];
      return {
        factor,
        weight,
        rawScore: roundScore(rawScore),
        weightedScore: roundScore(rawScore * weight),
        ...(factor === "SUCCESS_RATE"
          ? { rationale: `historical ${metricKey} baseline for ${candidate.agentId}` }
          : {})
      };
    });
    const scoreBreakdown = {
      totalScore: roundScore(factors.reduce((sum, factor) => sum + factor.weightedScore, 0)),
      factors
    };

    return {
      agentId: candidate.agentId,
      identityTier: candidate.identityTier,
      matchedSkills,
      ...(missingRequiredSkills.length ? { missingRequiredSkills } : {}),
      complianceStatus: compliancePassed ? "PASSED" : "FAILED",
      eligibilityChecks: [
        {
          gate: "IDENTITY_TIER",
          status: identityPassed ? "PASSED" : "FAILED",
          ...(identityPassed ? {} : { detail: `requires minimum ${minTier}` })
        },
        {
          gate: "REQUIRED_SKILL",
          status: skillsPassed ? "PASSED" : "FAILED",
          ...(skillsPassed ? {} : { detail: `missing ${missingRequiredSkills.join(",")}` })
        },
        {
          gate: "COMPLIANCE",
          status: complianceTags.length === 0 ? "NOT_REQUESTED" : compliancePassed ? "PASSED" : "FAILED",
          ...(compliancePassed || complianceTags.length === 0
            ? {}
            : { detail: `missing ${complianceMissing.join(",")}` })
        }
      ],
      eligible,
      ...(eligible && includeScoreBreakdown ? { scoreBreakdown } : {}),
      _totalScore: scoreBreakdown.totalScore
    };
  });

  const eligible = candidates
    .filter((candidate) => candidate.eligible)
    .sort((left, right) => right._totalScore - left._totalScore)
    .slice(0, limit)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1
    }));
  const ineligible = candidates
    .filter((candidate) => !candidate.eligible)
    .map(({ _totalScore, ...candidate }) => candidate);

  return {
    taskId,
    status: eligible.length > 0 ? "MATCHED" : "NO_ELIGIBLE_CANDIDATES",
    candidates: [
      ...eligible.map(({ _totalScore, ...candidate }) => candidate),
      ...ineligible
    ]
  };
}
