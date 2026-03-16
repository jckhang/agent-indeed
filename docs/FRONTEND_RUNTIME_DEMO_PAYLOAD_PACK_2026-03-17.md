# Frontend Runtime Demo Payload Pack - 2026-03-17

Last updated: 2026-03-17

Related issue: [#130](https://github.com/jckhang/agent-indeed/issues/130)
QA consumer issue: [#111](https://github.com/jckhang/agent-indeed/issues/111)
Source PRs: [#122](https://github.com/jckhang/agent-indeed/pull/122), [#125](https://github.com/jckhang/agent-indeed/pull/125)

## Goal

Turn the runtime wiring target and fixture-pack docs into one compact replay pack that QA and backend can use against the local service as soon as PR [#126](https://github.com/jckhang/agent-indeed/pull/126) and PR [#129](https://github.com/jckhang/agent-indeed/pull/129) land.

This pack stays inside the current merged contract baseline on `main`:
`publish -> match -> commit -> reveal -> pending-verify -> award-read blocked`

## Canonical sources

- merged contract baseline: `src/api/openapi.yaml`, `src/api/contracts.ts`
- frontend runtime sequencing source: PR [#122](https://github.com/jckhang/agent-indeed/pull/122)
- frontend fixture vocabulary source: PR [#125](https://github.com/jckhang/agent-indeed/pull/125)
- runnable backend dependency: PR [#126](https://github.com/jckhang/agent-indeed/pull/126)
- smoke-command dependency: PR [#129](https://github.com/jckhang/agent-indeed/pull/129)

## Replay sequence at a glance

| Step | Endpoint | What to assert now | Contract status on `main` |
| --- | --- | --- | --- |
| 1. Publish | `POST /v1/tasks` | task is accepted and returns `taskId` plus bidding deadlines | Stable |
| 2. Match | `GET /v1/tasks/{taskId}/candidates` | shortlist is returned or `TASK_MATCH_NOT_READY` includes retry guidance | Stable |
| 3. Commit | `POST /v1/tasks/{taskId}/bids/commit` | server-authored `window` snapshot drives next action | Stable |
| 4. Reveal | `POST /v1/tasks/{taskId}/bids/reveal` | reveal returns `rankingScore`, `decisionTraceHash`, and `proofSubmission.verificationStatus=PENDING_VERIFY` | Stable |
| 5. Pending verify | no frontend-readable status endpoint on `main` | frontend keeps `PENDING_VERIFY` from reveal and does not call verifier-only APIs | Blocked on [#59](https://github.com/jckhang/agent-indeed/issues/59) / [#66](https://github.com/jckhang/agent-indeed/pull/66) |
| 6. Award read | no merged manager award-read endpoint on `main` | frontend keeps award summary explicitly blocked | Blocked on [#58](https://github.com/jckhang/agent-indeed/issues/58) / [#68](https://github.com/jckhang/agent-indeed/pull/68) |

## Step 1 - Publish task

Request:

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

Response:

```json
{
  "taskId": "task_ops_triage_001",
  "status": "OPEN_FOR_MATCHING",
  "commitDeadline": "2026-03-14T13:30:00Z",
  "revealDeadline": "2026-03-14T15:00:00Z"
}
```

QA/backend notes:
- treat `status` as the only post-submit route handoff
- do not add task-create idempotency expectations that are not yet on `main`

## Step 2 - Fetch shortlist

Request:

```http
GET /v1/tasks/task_ops_triage_001/candidates?limit=5&includeScoreBreakdown=true
Authorization: Bearer <manager-session>
```

Matched response:

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

Pending response:

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

QA/backend notes:
- `TASK_MATCH_NOT_READY` is a retryable loading state, not an empty shortlist
- only eligible rows should carry `rank`

## Step 3 - Commit bid

Request:

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

Response:

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

QA/backend notes:
- use `window.serverTime` for countdown recovery
- keep `window.nextAction` as the canonical CTA hint

## Step 4 - Reveal bid

Request:

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

Response:

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

QA/backend notes:
- `proofSubmission.verificationStatus` is the only frontend-readable verify handoff on `main`
- keep proof details behind the authenticated agent flow; do not invent read models here

## Step 5 - Pending verify stays blocked on reveal-only state

No frontend-readable proof-status endpoint is merged on `main`.

Replay assertion:

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

QA/backend notes:
- manager and agent UI must not call `POST /v1/tasks/{taskId}/proofs/verify`; it is verifier/operator scope only
- do not fabricate queued timestamps, terminal result enums, or refresh metadata
- issue [#111](https://github.com/jckhang/agent-indeed/issues/111) can reuse this handoff as the expected smoke assertion until the read model from [#59](https://github.com/jckhang/agent-indeed/issues/59) lands

## Step 6 - Award read stays explicitly blocked

No merged manager award-read endpoint is available on `main`.

Blocked-state fixture:

```json
{
  "awardRead": {
    "status": "BLOCKED",
    "reason": "AWARD_READ_MODEL_PENDING",
    "followUp": "issue #58 / PR #68"
  }
}
```

QA/backend notes:
- do not substitute `GET /v1/tasks/{taskId}/events` for manager award-read
- keep award summary blocked even if shortlist or proof data is already visible in the same session
- issue [#111](https://github.com/jckhang/agent-indeed/issues/111) should assert this blocked manager state until the award read model merges

## Stable vs blocked ledger

| Surface | What is stable now | What remains blocked |
| --- | --- | --- |
| Publish | create request and deadline-bearing success response | task-create idempotency follow-up |
| Match | shortlist payload and `TASK_MATCH_NOT_READY` retry signal | none for this replay pack |
| Commit | commit request plus server-authored `window` | none for this replay pack |
| Reveal | reveal request plus `proofSubmission.verificationStatus=PENDING_VERIFY` | refresh-safe proof-status reads |
| Verify | reveal handoff copy and pending-state assertion | frontend-readable proof result model |
| Award | explicit blocked-state fixture | manager winner summary and award history read model |

## Validation use

When PR [#126](https://github.com/jckhang/agent-indeed/pull/126) and PR [#129](https://github.com/jckhang/agent-indeed/pull/129) merge, QA issue [#111](https://github.com/jckhang/agent-indeed/issues/111) should be able to replay this sequence with these pass/fail checks:

1. publish returns a real `taskId` and deadlines
2. shortlist returns either ranked candidates or `TASK_MATCH_NOT_READY`
3. commit and reveal both echo a server `window` snapshot
4. reveal exposes only `PENDING_VERIFY` to frontend callers
5. award-read remains blocked until the dedicated read model lands
