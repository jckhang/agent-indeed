# Backend API example packet

This packet turns the merged `npm run smoke:dispatch` runtime path on `main` into one
backend-owned request/response reference for QA, beta consumers, and issue
[#11](https://github.com/jckhang/agent-indeed/issues/11).

## Source of truth

- Runtime command: `npm run smoke:dispatch`
- Runtime implementation: `src/runtime/dispatch-smoke.js`
- API contracts: `src/api/openapi.yaml`, `src/api/contracts.ts`
- Final issue-evidence handoff: `npm run --silent smoke:issue11 -- --signature <agent-name>`
- Optional issue-evidence artifact export: `npm run --silent smoke:issue11 -- --signature <agent-name> --output-dir <dir>`
- Final E2E aggregation thread: issue [#11](https://github.com/jckhang/agent-indeed/issues/11)

The examples below use the deterministic IDs and payload shapes exercised by the local
runtime smoke flow. They are meant to be copied as canonical examples, not treated as
new contract definitions. The `smoke:issue11` formatter remains the single runnable
evidence command; this packet only covers request/response and minimal Node `fetch`
usage that the evidence output references. When a PR or local archive also needs files,
the same command can emit `issue11-evidence.md`, `issue11-summary.json`, and a
self-describing `issue11-artifacts-manifest.json` via `--output-dir <dir>` without
changing the stdout packet that gets pasted into issue
[#11](https://github.com/jckhang/agent-indeed/issues/11). That manifest also records the
generation timestamp, git branch/commit, and exported file paths so PR comments and local
archives can point back to one exact smoke run.

## Happy path packet

### 1. Publish task

Route/type links:
- `POST /v1/tasks`
- `CreateTaskRequest`, `CreateTaskResponse`

Request:
```json
{
  "task": {
    "title": "Dispatch smoke task",
    "description": "Exercise the runtime publish to award flow in one command",
    "budget": {
      "currency": "USD",
      "minAmount": 100,
      "maxAmount": 300
    },
    "sla": {
      "deadlineAt": "2026-03-20T00:00:00Z",
      "maxLatencyMs": 5000
    },
    "constraints": {
      "identityTierMin": "T1",
      "requiredSkills": ["backend", "api"],
      "complianceTags": ["soc2"]
    },
    "risk": {
      "level": "LOW",
      "valueScore": 0.2
    },
    "powmPolicy": {
      "mode": "AUTO_TIERED",
      "baseDifficulty": 2
    },
    "biddingWindow": {
      "commitDeadline": "2026-03-19T00:00:00Z",
      "revealDeadline": "2026-03-20T00:00:00Z"
    }
  }
}
```

Response `201 Created`:
```json
{
  "taskId": "task_00000001",
  "status": "OPEN_FOR_MATCHING",
  "commitDeadline": "2026-03-19T00:00:00Z",
  "revealDeadline": "2026-03-20T00:00:00Z"
}
```

### 2. Match candidates

Route/type links:
- `GET /v1/tasks/{taskId}/candidates`
- shortlist response types in `src/api/contracts.ts`

First read can return the stable retry signal:

Response `409 Conflict`:
```json
{
  "code": "TASK_MATCH_NOT_READY",
  "category": "MATCHING",
  "message": "candidate matching snapshot is not ready for task task_00000001",
  "auditId": "audit_task_match_not_ready",
  "retryable": true,
  "retryAfterSeconds": 1
}
```

Retry response `200 OK`:
```json
{
  "taskId": "task_00000001",
  "status": "MATCHED",
  "generatedAt": "2026-03-18T09:06:09.694Z",
  "candidates": [
    {
      "agentId": "agent_kestrel_alpha",
      "identityTier": "T1",
      "matchedSkills": ["backend", "api"],
      "complianceStatus": "PASSED",
      "eligibilityChecks": [
        { "gate": "IDENTITY_TIER", "status": "PASSED" },
        { "gate": "REQUIRED_SKILL", "status": "PASSED" },
        { "gate": "COMPLIANCE", "status": "PASSED" }
      ],
      "eligible": true,
      "rank": 1,
      "matchingTraceId": "matchtrace_00000001"
    },
    {
      "agentId": "agent_kestrel_beta",
      "identityTier": "T0",
      "matchedSkills": ["backend", "api"],
      "complianceStatus": "PASSED",
      "eligibilityChecks": [
        { "gate": "IDENTITY_TIER", "status": "PASSED" },
        { "gate": "REQUIRED_SKILL", "status": "PASSED" },
        { "gate": "COMPLIANCE", "status": "PASSED" }
      ],
      "eligible": true,
      "rank": 2,
      "matchingTraceId": "matchtrace_00000001"
    },
    {
      "agentId": "agent_kestrel_gamma",
      "identityTier": "T2",
      "matchedSkills": ["backend", "api"],
      "complianceStatus": "FAILED",
      "eligibilityChecks": [
        {
          "gate": "IDENTITY_TIER",
          "status": "FAILED",
          "detail": "requires minimum T1"
        },
        { "gate": "REQUIRED_SKILL", "status": "PASSED" },
        {
          "gate": "COMPLIANCE",
          "status": "FAILED",
          "detail": "missing soc2"
        }
      ],
      "eligible": false,
      "matchingTraceId": "matchtrace_00000001"
    }
  ]
}
```

### 3. Commit bid

Route/type links:
- `POST /v1/tasks/{taskId}/bids/commit`
- bid write/response contracts in `src/api/contracts.ts`

Request:
```json
{
  "idempotencyKey": "idem-commit-smoke-001",
  "commit": {
    "bidId": "bid_00000001",
    "taskId": "task_00000001",
    "agentId": "agent_kestrel_alpha",
    "bidHash": "sha256:45de640566a262fd4f293ae58837cb37900190c7492ee2c2ddfb11df6fefc2bd",
    "committedAt": "2026-03-16T00:10:00.000Z"
  }
}
```

Response `202 Accepted`:
```json
{
  "bidId": "bid_00000001",
  "taskId": "task_00000001",
  "agentId": "agent_kestrel_alpha",
  "phase": "COMMIT",
  "status": "COMMITTED",
  "result": "COMMITTED",
  "commit": {
    "bidId": "bid_00000001",
    "taskId": "task_00000001",
    "agentId": "agent_kestrel_alpha",
    "bidHash": "sha256:45de640566a262fd4f293ae58837cb37900190c7492ee2c2ddfb11df6fefc2bd",
    "committedAt": "2026-03-16T00:10:00.000Z"
  },
  "window": {
    "currentPhase": "COMMIT_OPEN",
    "commitDeadline": "2026-03-19T00:00:00Z",
    "revealDeadline": "2026-03-20T00:00:00Z",
    "serverTime": "2026-03-16T00:00:00.000Z",
    "nextAction": "WAIT_FOR_REVEAL_WINDOW"
  }
}
```

### 4. Issue proof policy

Route/type links:
- `POST /v1/tasks/{taskId}/proof-policy`
- policy response types in `src/api/contracts.ts`

Request:
```json
{
  "agentId": "agent_kestrel_alpha",
  "identityTier": "T1",
  "trustScore": 0.84
}
```

Response `200 OK`:
```json
{
  "taskId": "task_00000001",
  "agentId": "agent_kestrel_alpha",
  "requiredProofStrength": "LOW",
  "challengeProfile": "SAMPLE_EXECUTION",
  "verifierParams": {
    "minSampleCount": 1,
    "minQualityScore": 0.383,
    "maxRuntimeMs": 180000
  },
  "inputSnapshot": {
    "taskRiskLevel": "LOW",
    "taskValueScore": 0.2,
    "identityTier": "T1",
    "trustScore": 0.84
  },
  "rationale": [
    "task risk LOW drives the base verifier threshold",
    "identity tier T1 adjusts the challenge profile",
    "trust score 0.84 reduces repeated manual review for proven agents"
  ],
  "persistedAt": "2026-03-16T00:00:00.000Z",
  "policyTraceId": "policytrace_00000001"
}
```

### 5. Reveal bid

Route/type links:
- `POST /v1/tasks/{taskId}/bids/reveal`
- reveal/proof contracts in `src/api/contracts.ts`

Request:
```json
{
  "idempotencyKey": "idem-reveal-smoke-001",
  "reveal": {
    "bidId": "bid_00000001",
    "taskId": "task_00000001",
    "agentId": "agent_kestrel_alpha",
    "nonce": "nonce-001",
    "price": {
      "currency": "USD",
      "amount": 180
    },
    "executionPlan": {
      "summary": "Execute with cached backend workflow",
      "etaSeconds": 240,
      "requiredTools": ["node", "openssl"]
    },
    "proof": {
      "proofSchemaVersion": "1.0",
      "proofId": "proof_00000001",
      "taskId": "task_00000001",
      "agentId": "agent_kestrel_alpha",
      "capturedAt": "2026-03-19T00:30:00Z",
      "identityProof": {
        "credentialLevel": "T1",
        "signerDid": "did:key:agent_kestrel_alpha",
        "signature": "sig-proof-001"
      },
      "sampleWork": {
        "sampleTaskDigest": "sha256:sample-task-001",
        "outputDigest": "sha256:sample-output-001",
        "qualityScore": 0.9,
        "runtimeMs": 1200
      },
      "executionTrace": {
        "traceHash": "sha256:trace-001",
        "traceUri": "s3://proofs/trace-001.json",
        "traceSignature": "sig-trace-001",
        "toolCallCount": 4
      }
    }
  }
}
```

Response `200 OK`:
```json
{
  "bidId": "bid_00000001",
  "taskId": "task_00000001",
  "agentId": "agent_kestrel_alpha",
  "phase": "REVEAL",
  "status": "REVEALED",
  "result": "REVEALED",
  "rankingScore": 0.881,
  "decisionTraceHash": "sha256:6033d33c9b1936c7ee3f0bbdaf85bdedf734488e62f72f788ae7a9dcc37d8843",
  "revealAcceptedAt": "2026-03-18T09:06:09.699Z",
  "proofSubmission": {
    "proofId": "proof_00000001",
    "verificationStatus": "PENDING_VERIFY"
  },
  "window": {
    "currentPhase": "REVEAL_OPEN",
    "commitDeadline": "2026-03-19T00:00:00Z",
    "revealDeadline": "2026-03-20T00:00:00Z",
    "serverTime": "2026-03-19T00:10:00.000Z",
    "nextAction": "TRACK_PROOF_VERIFICATION"
  }
}
```

### 6. Verify proof

Route/type links:
- `POST /v1/tasks/{taskId}/proofs/verify`
- `VerifyProofPackRequest`, `ProofVerificationResponse`

Request:
```json
{
  "policyTraceId": "policytrace_00000001",
  "proof": {
    "proofSchemaVersion": "1.0",
    "proofId": "proof_00000001",
    "taskId": "task_00000001",
    "agentId": "agent_kestrel_alpha",
    "capturedAt": "2026-03-19T00:30:00Z",
    "identityProof": {
      "credentialLevel": "T1",
      "signerDid": "did:key:agent_kestrel_alpha",
      "signature": "sig-proof-001"
    },
    "sampleWork": {
      "sampleTaskDigest": "sha256:sample-task-001",
      "outputDigest": "sha256:sample-output-001",
      "qualityScore": 0.9,
      "runtimeMs": 1200
    },
    "executionTrace": {
      "traceHash": "sha256:trace-001",
      "traceUri": "s3://proofs/trace-001.json",
      "traceSignature": "sig-trace-001",
      "toolCallCount": 4
    }
  }
}
```

Response `200 OK`:
```json
{
  "proofId": "proof_00000001",
  "result": "PASS",
  "policyTraceId": "policytrace_00000001",
  "requiredPolicy": {
    "taskId": "task_00000001",
    "agentId": "agent_kestrel_alpha",
    "requiredProofStrength": "LOW",
    "challengeProfile": "SAMPLE_EXECUTION",
    "verifierParams": {
      "minSampleCount": 1,
      "minQualityScore": 0.383,
      "maxRuntimeMs": 180000
    },
    "inputSnapshot": {
      "taskRiskLevel": "LOW",
      "taskValueScore": 0.2,
      "identityTier": "T1",
      "trustScore": 0.84
    },
    "rationale": [
      "task risk LOW drives the base verifier threshold",
      "identity tier T1 adjusts the challenge profile",
      "trust score 0.84 reduces repeated manual review for proven agents"
    ],
    "persistedAt": "2026-03-16T00:00:00.000Z",
    "policyTraceId": "policytrace_00000001"
  },
  "requiredDifficulty": 0.383,
  "achievedDifficulty": 0.9,
  "decisionTraceHash": "sha256:24620d1afadc305678befd30f34b754893ca11c0db48d902211163873460ba49",
  "reasonCodes": [],
  "verifiedAt": "2026-03-19T00:10:00.000Z",
  "bidId": "bid_00000001"
}
```

### 7. Award readiness read

Route/type links:
- `GET /v1/tasks/{taskId}/award`
- award read contracts in `src/api/contracts.ts`

Response `200 OK`:
```json
{
  "taskId": "task_00000001",
  "status": "READY_TO_AWARD",
  "statusMessage": "Proof passed and shortlist evidence is complete.",
  "shortlistedBidId": "bid_00000001",
  "awardedAgentId": "agent_kestrel_alpha",
  "shortlistAuditId": "audit_00000003",
  "proofAuditId": "audit_00000004",
  "proofSummary": {
    "proofId": "proof_00000001",
    "result": "PASS",
    "reasonCodes": [],
    "requiredDifficulty": 0.383,
    "achievedDifficulty": 0.9,
    "verifiedAt": "2026-03-19T00:10:00.000Z",
    "auditId": "audit_00000004"
  },
  "decisionTraceHash": "sha256:24620d1afadc305678befd30f34b754893ca11c0db48d902211163873460ba49",
  "handoff": {
    "status": "READY",
    "handoffChannel": "API",
    "checklist": ["publish award event", "notify winner"]
  },
  "reviewedAt": "2026-03-19T00:10:00.000Z"
}
```

### 8. Award write

Route/type links:
- `POST /v1/tasks/{taskId}/award`
- award write/response contracts in `src/api/contracts.ts`

Request:
```json
{
  "idempotencyKey": "idem-award-smoke-001",
  "award": {
    "bidId": "bid_00000001",
    "awardReason": "Best verified fit for the backend vertical slice.",
    "shortlistAuditId": "audit_00000003",
    "proofAuditId": "audit_00000004"
  }
}
```

Response `200 OK`:
```json
{
  "taskId": "task_00000001",
  "status": "AWARDED",
  "statusMessage": "Award confirmed and ready for downstream handoff.",
  "shortlistedBidId": "bid_00000001",
  "awardedBidId": "bid_00000001",
  "awardedAgentId": "agent_kestrel_alpha",
  "awardReason": "Best verified fit for the backend vertical slice.",
  "shortlistAuditId": "audit_00000003",
  "proofAuditId": "audit_00000004",
  "proofSummary": {
    "proofId": "proof_00000001",
    "result": "PASS",
    "reasonCodes": [],
    "requiredDifficulty": 0.383,
    "achievedDifficulty": 0.9,
    "verifiedAt": "2026-03-19T00:10:00.000Z",
    "auditId": "audit_00000004"
  },
  "decisionTraceHash": "sha256:24620d1afadc305678befd30f34b754893ca11c0db48d902211163873460ba49",
  "auditEventId": "audit_00000005",
  "handoff": {
    "status": "READY",
    "handoffChannel": "API",
    "checklist": ["publish award event", "notify winner"]
  },
  "reviewedAt": "2026-03-19T00:10:00.000Z",
  "awardedAt": "2026-03-19T00:10:00.000Z"
}
```

### Audit replay identifiers

For issue [#11](https://github.com/jckhang/agent-indeed/issues/11), the happy-path run yields:

- `taskId`: `task_00000001`
- `bidId`: `bid_00000001`
- `proofId`: `proof_00000001`
- `policyTraceId`: `policytrace_00000001`
- `decisionTraceHash`: `sha256:24620d1afadc305678befd30f34b754893ca11c0db48d902211163873460ba49`
- final `auditEventId`: `audit_00000005`
- task event sequence: `TASK_CREATED`, `BID_COMMITTED`, `BID_REVEALED`, `POMW_VERIFIED`, `TASK_AWARDED`

## Negative-path packet

### Reveal without commit

Route/type links:
- `POST /v1/tasks/{taskId}/bids/reveal`
- bid error contracts in `src/api/openapi.yaml`

Response `400 Bad Request`:
```json
{
  "code": "BID_REVEAL_COMMIT_NOT_FOUND",
  "category": "PRECONDITION",
  "message": "no prior commit exists for bid bid_00000077",
  "auditId": "audit_bid_reveal_commit_not_found",
  "retryable": false,
  "details": {
    "bidId": "bid_00000077",
    "taskId": "task_00000002"
  }
}
```

### Proof FAIL

Route/type links:
- `POST /v1/tasks/{taskId}/proofs/verify`
- `ProofVerificationResponse` and verify error contracts

Response `422 Unprocessable Entity`:
```json
{
  "code": "PROOF_VERIFY_FAILED",
  "category": "POLICY",
  "message": "proof difficulty 0.4 is below required threshold 0.876",
  "auditId": "audit_proof_verify_failed",
  "retryable": false,
  "details": {
    "proofId": "proof_00000002",
    "taskId": "task_00000002",
    "policyTraceId": "policytrace_00000002",
    "requiredDifficulty": 0.876,
    "achievedDifficulty": 0.4,
    "decisionTraceHash": "sha256:e1a09d2dcdffebda3c16feab17abb064901893e7699e012009e81ab105dd8ca0",
    "reasonCodes": [
      "QUALITY_SCORE_BELOW_MINIMUM",
      "HASHCASH_BITS_BELOW_MINIMUM"
    ]
  }
}
```

### Award blocked after failed proof

Read response `200 OK` from `GET /v1/tasks/{taskId}/award`:
```json
{
  "taskId": "task_00000002",
  "status": "BLOCKED",
  "statusMessage": "Bid bid_00000002 is not awardable because proof result is FAIL.",
  "shortlistedBidId": "bid_00000002",
  "awardedAgentId": "agent_kestrel_gamma",
  "shortlistAuditId": "audit_00000008",
  "proofAuditId": "audit_00000009",
  "proofSummary": {
    "proofId": "proof_00000002",
    "result": "FAIL",
    "reasonCodes": [
      "QUALITY_SCORE_BELOW_MINIMUM",
      "HASHCASH_BITS_BELOW_MINIMUM"
    ],
    "requiredDifficulty": 0.876,
    "achievedDifficulty": 0.4,
    "verifiedAt": "2026-03-19T00:10:00.000Z",
    "auditId": "audit_00000009"
  },
  "decisionTraceHash": "sha256:e1a09d2dcdffebda3c16feab17abb064901893e7699e012009e81ab105dd8ca0",
  "handoff": {
    "status": "PENDING",
    "checklist": ["wait for proof verification", "refresh award readiness"]
  },
  "reviewedAt": "2026-03-19T00:10:00.000Z"
}
```

Write response `422 Unprocessable Entity` from `POST /v1/tasks/{taskId}/award`:
```json
{
  "code": "TASK_AWARD_PRECONDITION_FAILED",
  "category": "PRECONDITION",
  "message": "bid bid_00000002 is not awardable because proof result is FAIL",
  "auditId": "audit_task_award_precondition_failed",
  "retryable": false,
  "details": {
    "bidId": "bid_00000002",
    "taskId": "task_00000002",
    "proofId": "proof_00000002",
    "proofResult": "FAIL"
  }
}
```

## How QA and beta consumers should use this packet

1. Treat `docs/BACKEND_API_EXAMPLE_PACKET.md` as the reusable API packet for issue
   [#11](https://github.com/jckhang/agent-indeed/issues/11) instead of rebuilding payloads from review comments.
2. Treat `src/api/openapi.yaml` and `src/api/contracts.ts` as the contract source of truth; if this packet and those files diverge, update the packet in the same PR that changed the contract.
3. Use `npm run smoke:dispatch` as the executable proof that these examples still match the merged runtime behavior.
