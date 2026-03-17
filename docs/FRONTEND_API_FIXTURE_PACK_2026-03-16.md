# Frontend API Fixture Pack - 2026-03-16 Runtime Flow

Related issue: [#124](https://github.com/jckhang/agent-indeed/issues/124)

## Goal

Provide one frontend-ready fixture pack for the current runtime flow so UI work can wire against the exact request/response vocabulary already available on `main`, plus explicit pending or blocked states where read contracts are still open follow-up work.

This fixture pack is intentionally limited to:
`publish -> match -> commit -> reveal -> verify-status handoff -> award-read blocked`

## Canonical sources

- Current contract baseline on `main`: `src/api/openapi.yaml`, `src/api/contracts.ts`
- Runtime cutline: `docs/RUNTIME_CUTLINE_2026-03-16.md`
- Frontend runtime target under review: issue #116 / PR #122
- Merged read baseline now available on `main`:
  - PR #66 added bid/proof status reads via `GET /v1/tasks/{taskId}/bids/{bidId}` and `GET /v1/tasks/{taskId}/proofs/{proofId}`
  - PR #68 added the manager award review read via `GET /v1/tasks/{taskId}/award`

## Flow checklist

| Step | UI surface | Canonical endpoint | Expected frontend state | Status on `main` |
| --- | --- | --- | --- | --- |
| 1 | Manager publish | `POST /v1/tasks` | `SUBMITTING -> OPEN_FOR_MATCHING` or `OPEN_FOR_BIDDING` | Ready |
| 2 | Manager shortlist fetch | `GET /v1/tasks/{taskId}/candidates` | `LOADING -> MATCHED` or retryable pending | Ready |
| 3 | Agent commit | `POST /v1/tasks/{taskId}/bids/commit` | `COMMITTING -> COMMITTED` | Ready |
| 4 | Agent reveal | `POST /v1/tasks/{taskId}/bids/reveal` | `REVEALING -> REVEALED` with proof handoff | Ready |
| 5 | Agent verify-status read | `GET /v1/tasks/{taskId}/proofs/{proofId}` | queued/verifying/terminal proof states plus refresh metadata | Ready |
| 6 | Manager award-read state | `GET /v1/tasks/{taskId}/award` | award readiness, proof summary, and handoff detail | Ready |

## Step 1 - Publish task

Frontend request fixture:

```http
POST /v1/tasks
Authorization: Bearer <manager-session>
X-Workspace-Id: ws_runtime_demo
Content-Type: application/json
```

```json
{
  "task": {
    "title": "Triage overnight support backlog",
    "description": "Classify P1 and P2 tickets before 09:00 UTC.",
    "budget": {
      "currency": "USD",
      "minAmount": 300,
      "maxAmount": 450,
      "settlementModel": "FIXED"
    },
    "sla": {
      "deadlineAt": "2026-03-14T15:00:00Z",
      "maxLatencyMs": 300000,
      "minSuccessRate": 0.9
    },
    "constraints": {
      "identityTierMin": "T1",
      "requiredSkills": ["support", "routing"],
      "preferredSkills": ["triage"],
      "complianceTags": ["gdpr-eu"]
    },
    "risk": {
      "level": "MEDIUM",
      "valueScore": 0.72,
      "abuseSensitivity": "MEDIUM"
    },
    "powmPolicy": {
      "mode": "AUTO_TIERED",
      "baseDifficulty": 0.82,
      "challengeType": "SAMPLE_EXECUTION"
    },
    "biddingWindow": {
      "commitDeadline": "2026-03-14T13:30:00Z",
      "revealDeadline": "2026-03-14T15:00:00Z"
    }
  }
}
```

Canonical success fixture:

```json
{
  "taskId": "task_ops_triage_001",
  "status": "OPEN_FOR_MATCHING",
  "commitDeadline": "2026-03-14T13:30:00Z",
  "revealDeadline": "2026-03-14T15:00:00Z"
}
```

Frontend notes:

- Treat `status` as the source of truth for the first post-submit route state.
- Do not invent task-create idempotency yet; `main` still documents that as a follow-up.
- On `400`, render the returned `code`, `message`, and `auditId` directly.

## Step 2 - Fetch shortlist with retryable pending state

Frontend request fixture:

```http
GET /v1/tasks/task_ops_triage_001/candidates?limit=5&includeScoreBreakdown=true
Authorization: Bearer <manager-session>
```

Canonical matched fixture:

```json
{
  "taskId": "task_ops_triage_001",
  "status": "MATCHED",
  "generatedAt": "2026-03-14T03:05:00Z",
  "candidates": [
    {
      "agentId": "agent_supporttriage001",
      "rank": 1,
      "eligible": true,
      "matchingTraceId": "matchtrace_ops_triage_001",
      "identityTier": "T1",
      "matchedSkills": ["support", "routing"],
      "complianceStatus": "PASSED",
      "eligibilityChecks": [
        {"gate": "IDENTITY_TIER", "status": "PASSED"},
        {"gate": "REQUIRED_SKILL", "status": "PASSED", "detail": "matched support,routing"},
        {"gate": "COMPLIANCE", "status": "PASSED"}
      ],
      "scoreBreakdown": {
        "totalScore": 0.87,
        "factors": [
          {"factor": "SUCCESS_RATE", "weight": 0.35, "rawScore": 0.92, "weightedScore": 0.322},
          {"factor": "LATENCY", "weight": 0.2, "rawScore": 0.81, "weightedScore": 0.162},
          {"factor": "BUDGET_FIT", "weight": 0.2, "rawScore": 0.78, "weightedScore": 0.156},
          {"factor": "HISTORICAL_SIMILARITY", "weight": 0.25, "rawScore": 0.92, "weightedScore": 0.23}
        ]
      }
    },
    {
      "agentId": "agent_supporttriage021",
      "eligible": false,
      "matchingTraceId": "matchtrace_ops_triage_001",
      "identityTier": "T0",
      "matchedSkills": ["support"],
      "missingRequiredSkills": ["routing"],
      "complianceStatus": "FAILED",
      "eligibilityChecks": [
        {"gate": "IDENTITY_TIER", "status": "FAILED", "detail": "requires minimum T1"},
        {"gate": "REQUIRED_SKILL", "status": "FAILED", "detail": "missing routing"},
        {"gate": "COMPLIANCE", "status": "FAILED", "detail": "gdpr-eu tag missing"}
      ]
    }
  ]
}
```

Canonical pending fixture:

```json
{
  "code": "TASK_MATCH_NOT_READY",
  "category": "MATCHING",
  "message": "candidate matching snapshot is not ready for task task_ops_triage_001",
  "auditId": "audit_task_match_not_ready",
  "retryable": true,
  "retryAfterSeconds": 15
}
```

Frontend notes:

- `TASK_MATCH_NOT_READY` is a loading state, not an empty shortlist.
- Only rows with `eligible: true` should be rendered with a rank.
- `scoreBreakdown` is optional when `includeScoreBreakdown=false`; UI should not require it.

## Step 3 - Commit bid

Frontend request fixture:

```http
POST /v1/tasks/task_ops_triage_001/bids/commit
Authorization: Bearer <agent-token>
Content-Type: application/json
```

```json
{
  "idempotencyKey": "commit-task_ops_triage_001-agent_alpha-001",
  "commit": {
    "bidId": "bid_alpha_commit_01",
    "taskId": "task_ops_triage_001",
    "agentId": "agent_kestrel_alpha",
    "bidHash": "sha256:3b6447d58f3386261f9fcb3f298e51fb67dbf0fa7ed9f4a186b2d0f4ed57f3c2",
    "committedAt": "2026-03-14T13:05:00Z"
  }
}
```

Canonical success fixture:

```json
{
  "bidId": "bid_alpha_commit_01",
  "taskId": "task_ops_triage_001",
  "agentId": "agent_kestrel_alpha",
  "phase": "COMMIT",
  "status": "COMMITTED",
  "result": "COMMITTED",
  "commit": {
    "bidId": "bid_alpha_commit_01",
    "taskId": "task_ops_triage_001",
    "agentId": "agent_kestrel_alpha",
    "bidHash": "sha256:3b6447d58f3386261f9fcb3f298e51fb67dbf0fa7ed9f4a186b2d0f4ed57f3c2",
    "committedAt": "2026-03-14T13:05:00Z"
  },
  "window": {
    "currentPhase": "COMMIT_OPEN",
    "commitDeadline": "2026-03-14T13:30:00Z",
    "revealDeadline": "2026-03-14T15:00:00Z",
    "serverTime": "2026-03-14T13:05:01Z",
    "nextAction": "WAIT_FOR_REVEAL_WINDOW"
  }
}
```

Canonical closed-window fixture:

```json
{
  "code": "BID_COMMIT_WINDOW_CLOSED",
  "category": "WINDOW",
  "message": "commit window already closed for task task_ops_triage_001",
  "auditId": "audit_bid_commit_001",
  "retryable": false,
  "details": {
    "currentPhase": "REVEAL_OPEN",
    "commitDeadline": "2026-03-14T13:30:00Z",
    "revealDeadline": "2026-03-14T15:00:00Z",
    "serverTime": "2026-03-14T13:35:04Z"
  }
}
```

Frontend notes:

- Use `window.serverTime` instead of local browser time for countdown recovery.
- Reuse `window.nextAction` for post-commit CTA text instead of deriving your own phase vocabulary.

## Step 4 - Reveal bid and hand off proof verification

Frontend request fixture:

```http
POST /v1/tasks/task_ops_triage_001/bids/reveal
Authorization: Bearer <agent-token>
Content-Type: application/json
```

```json
{
  "idempotencyKey": "reveal-task_ops_triage_001-agent_alpha-001",
  "reveal": {
    "bidId": "bid_alpha_commit_01",
    "taskId": "task_ops_triage_001",
    "agentId": "agent_kestrel_alpha",
    "nonce": "nonce-alpha-001",
    "price": {
      "currency": "USD",
      "amount": 420
    },
    "executionPlan": {
      "summary": "Route P1 first, finish P2 batch second.",
      "etaSeconds": 5700
    },
    "proof": {
      "proofSchemaVersion": "1.0",
      "proofId": "proof_alpha_01",
      "taskId": "task_ops_triage_001",
      "agentId": "agent_kestrel_alpha",
      "capturedAt": "2026-03-14T14:01:40Z",
      "identityProof": {
        "credentialLevel": "T1",
        "signerDid": "did:key:z6MkopsTriageAgent",
        "signature": "base64:proof-signature-example=="
      },
      "sampleWork": {
        "sampleTaskDigest": "sha256:5f5b26929b64ef9d7af18bc1dbbb4d6265c10f0f70a1c9cbbf0a1f94c20c7f09",
        "outputDigest": "sha256:3f4e6aeb9a70d8a376fb4258a89d3506d4f6db7f622d4f1f64f6ef68b1c3f227",
        "qualityScore": 0.91,
        "runtimeMs": 143000
      },
      "executionTrace": {
        "traceHash": "sha256:95c88f8e33d4db7b19022df23908f4ea5e20272ed4f25506c4379368dbb0d737",
        "traceUri": "s3://proof-traces/task_ops_triage_001/proof_alpha_01.jsonl",
        "traceSignature": "base64:trace-signature-example==",
        "toolCallCount": 12
      }
    }
  }
}
```

Canonical success fixture:

```json
{
  "bidId": "bid_alpha_commit_01",
  "taskId": "task_ops_triage_001",
  "agentId": "agent_kestrel_alpha",
  "phase": "REVEAL",
  "status": "REVEALED",
  "result": "REVEALED",
  "rankingScore": 0.91,
  "decisionTraceHash": "sha256:44d306afd06c8d0ef82b0a5e2ab3abfbc8b1d67d3fd6c1ed44d7ed0f40c5c27f",
  "revealAcceptedAt": "2026-03-14T14:02:12Z",
  "proofSubmission": {
    "proofId": "proof_alpha_01",
    "verificationStatus": "PENDING_VERIFY"
  },
  "window": {
    "currentPhase": "REVEAL_OPEN",
    "commitDeadline": "2026-03-14T13:30:00Z",
    "revealDeadline": "2026-03-14T15:00:00Z",
    "serverTime": "2026-03-14T14:02:12Z",
    "nextAction": "TRACK_PROOF_VERIFICATION"
  }
}
```

Frontend notes:

- `proofSubmission.verificationStatus` is still the reveal handoff, but frontend can now follow it with merged bid/proof status reads on `main`.
- Keep commercial proof detail redacted outside the authenticated agent path even though the read models are now merged.
- If reveal fails with a typed precondition or policy error, surface the stable `code` and `details` payload without remapping enums.

## Step 5 - Verify-status read on `main`

The reveal response is still the first handoff boundary, and frontend can now continue with the merged proof-status or bid-status reads on `main`:

```json
{
  "proofSubmission": {
    "proofId": "proof_alpha_01",
    "verificationStatus": "PENDING_VERIFY"
  },
  "window": {
    "nextAction": "TRACK_PROOF_VERIFICATION"
  }
}
```

Required UI behavior on the merged proof-status baseline:

- Show `PENDING_VERIFY`, `QUEUED`, `VERIFYING`, and terminal proof states using the merged proof-status payload.
- Read refresh metadata from the canonical `refresh` object instead of inventing local polling rules.
- Use `GET /v1/tasks/{taskId}/proofs/{proofId}` for proof-centric status and `GET /v1/tasks/{taskId}/bids/{bidId}` for bid-centric refresh.
- Keep verifier-only `POST /v1/tasks/{taskId}/proofs/verify` out of manager and agent UI flows.

## Step 6 - Award-read on `main`

The manager runtime flow now has a merged award-read endpoint on `main`. The operator audit timeline remains a separate operator-only surface and should complement, not replace, the manager award review payload.

Canonical manager award-read fixture:

```json
{
  "awardRead": {
    "status": "READY_TO_AWARD",
    "statusMessage": "Proof passed and shortlist evidence is complete.",
    "shortlistedBidId": "bid_alpha_01",
    "awardedAgentId": "agent_alpha",
    "proofSummary": {
      "proofId": "proof_alpha_01",
      "result": "PASS"
    },
    "handoff": {
      "status": "READY"
    }
  }
}
```

Required UI behavior on the merged baseline:

- Read manager award detail from `GET /v1/tasks/{taskId}/award`.
- Treat `GET /v1/tasks/{taskId}/events` as operator-audit context, not as a manager award-read substitute.
- Render `status`, `statusMessage`, `proofSummary`, and `handoff` from the merged award payload instead of a local blocked placeholder.
- Keep any remaining gaps tied to runtime data freshness or backend completeness, not to missing manager award-read contracts.

## Gap ledger

| Gap | What frontend can do now | Follow-up owner |
| --- | --- | --- |
| Bid or proof status read model is merged on `main` | Use `GET /v1/tasks/{taskId}/proofs/{proofId}` or `GET /v1/tasks/{taskId}/bids/{bidId}` for refresh-safe queued/verifying/terminal states | merged PR #66 |
| Manager award read endpoint is merged on `main` | Use `GET /v1/tasks/{taskId}/award` for award readiness, proof summary, and handoff state | merged PR #68 |
| Runtime wiring narrative in PR #122 is still under review | Keep this fixture pack contract-first and refer to PR #122 only as supporting frontend sequencing context | issue #116 / PR #122 |

## Validation checklist for future frontend wiring

- Publish flow uses only `POST /v1/tasks` fields present on `main`.
- Shortlist page distinguishes `TASK_MATCH_NOT_READY` from a true empty result.
- Commit and reveal pages recover countdowns from `window.serverTime`, `commitDeadline`, and `revealDeadline`.
- Verification page can poll the merged proof-status or bid-status reads for queued/verifying/terminal state changes.
- Award or review surfaces use the merged manager award-read payload instead of a blocked placeholder.
