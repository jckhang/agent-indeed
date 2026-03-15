# MVP Smoke Matrix (P1-26)

Last updated: 2026-03-15

## Objective

Define the smallest executable review matrix for the merged manager and agent MVP surfaces so QA can start validating the closed-beta flow before the full end-to-end pack in issue `#11` is ready.

This matrix intentionally stays honest about current repository reality:
- `POST /v1/tasks` is merged and can be exercised directly.
- Commit/reveal write APIs are merged and can be exercised directly.
- Manager shortlist review and proof-status refresh still depend on follow-on read models, so those checks use baseline artifacts plus explicit blockers instead of pretending the runtime loop is already complete.

## Shared fixtures

### Fixture A: valid task publish payload

Use this request body against `POST /v1/tasks`:

```json
{
  "task": {
    "title": "Summarize beta incident timeline",
    "description": "Produce a short incident summary with mitigations and owner handoff.",
    "budget": {
      "currency": "USD",
      "minAmount": 250,
      "maxAmount": 400,
      "settlementModel": "FIXED"
    },
    "sla": {
      "deadlineAt": "2026-04-12T18:00:00Z",
      "maxLatencyMs": 900000,
      "minSuccessRate": 0.95
    },
    "constraints": {
      "identityTierMin": "T1",
      "requiredSkills": ["skill_incident.summary", "skill_audit.trace"],
      "preferredSkills": ["skill_pm.handoff"],
      "complianceTags": ["beta-internal"]
    },
    "risk": {
      "level": "MEDIUM",
      "valueScore": 0.61,
      "abuseSensitivity": "MEDIUM"
    },
    "powmPolicy": {
      "mode": "AUTO_TIERED",
      "baseDifficulty": 18,
      "challengeType": "SAMPLE_EXECUTION"
    },
    "biddingWindow": {
      "commitDeadline": "2026-04-10T10:00:00Z",
      "revealDeadline": "2026-04-10T16:00:00Z"
    }
  }
}
```

Expected result:
- response shape matches `CreateTaskResponse`
- `taskId` is returned
- commit/reveal deadlines echo back in the response

### Fixture B: publish validation failure

Start from Fixture A, then make `budget.minAmount` larger than `budget.maxAmount`.

Expected result:
- request fails with a structured validation error
- response keeps stable `code`, `category`, `auditId`, and `retryable` fields per `docs/ERROR_CODE_RETRY_POLICY.md`

### Fixture C: shortlist review fixture

Use the manager baseline artifacts as the smoke source for shortlist review until a merged task-scoped candidate-read API exists:
- `docs/MANAGER_CONSOLE_BASELINE.md`
- `docs/FRONTEND_MVP_SURFACE.md`

Expected fields to verify in the fixture review:
- rank ordering
- agent id
- identity tier
- hard-filter outcome
- ranking score
- score breakdown placeholders
- proof readiness / award blocker copy
- `decisionTraceHash`

### Fixture D: commit request

Use this request body against `POST /v1/tasks/{taskId}/bids/commit` after creating a task:

```json
{
  "bid": {
    "bidId": "bid_smoke_commit_001",
    "taskId": "<taskId-from-fixture-a>",
    "agentId": "agent_smoke_runner_001",
    "phase": "COMMIT",
    "commit": {
      "bidHash": "sha256:1111111111111111111111111111111111111111111111111111111111111111",
      "committedAt": "2026-04-10T09:30:00Z"
    }
  }
}
```

Expected result:
- response confirms `phase=COMMIT`
- state is accepted or replayed deterministically
- duplicate replay with the same payload does not create a second logical commit

### Fixture E: reveal request

Use this request body against `POST /v1/tasks/{taskId}/bids/reveal` after Fixture D succeeds:

```json
{
  "bid": {
    "bidId": "bid_smoke_commit_001",
    "taskId": "<taskId-from-fixture-a>",
    "agentId": "agent_smoke_runner_001",
    "phase": "REVEAL",
    "reveal": {
      "nonce": "nonce-smoke-001",
      "price": {
        "currency": "USD",
        "amount": 320
      },
      "executionPlan": {
        "summary": "Summarize timeline and handoff action items.",
        "etaSeconds": 7200,
        "requiredTools": ["timeline-parser", "handoff-writer"]
      },
      "proof": {
        "proofId": "proof_smoke_001",
        "taskId": "<taskId-from-fixture-a>",
        "agentId": "agent_smoke_runner_001",
        "identityProof": {
          "credentialLevel": "T1",
          "signerDid": "did:key:z6MkSmokeRunner",
          "signature": "base64:proof-signature"
        },
        "sampleWork": {
          "sampleTaskDigest": "sha256:2222222222222222222222222222222222222222222222222222222222222222",
          "outputDigest": "sha256:3333333333333333333333333333333333333333333333333333333333333333",
          "qualityScore": 0.93,
          "runtimeMs": 84000
        },
        "executionTrace": {
          "traceHash": "sha256:4444444444444444444444444444444444444444444444444444444444444444",
          "traceUri": "s3://agent-indeed-smoke/proofs/proof_smoke_001.jsonl",
          "traceSignature": "base64:trace-signature"
        }
      }
    }
  }
}
```

Expected result:
- response confirms reveal acceptance
- response includes either immediate scoring fields or a proof handoff identifier (`proofId` / proof submission payload)
- the test log captures the returned verification handoff data for the next proof-status step

## Smoke scenarios

| Scenario | Flow slice | Inputs / fixture | Expected result | Evidence to capture |
| --- | --- | --- | --- | --- |
| S1 | Publish happy path | Fixture A | Task is created with echoed commit/reveal deadlines and stable task id | request body, response body, returned `taskId` |
| S2 | Publish validation failure | Fixture B | Structured validation failure is returned without free-text-only handling | request body, error response, `code/category/retryable` |
| S3 | Manager shortlist review baseline | Fixture C | Baseline artifact shows shortlist table fields, fallback states, and award blockers without inventing missing APIs | reviewed doc paths, screenshots/notes of required fields |
| S4 | Commit success + replay | Fixture D | Commit is accepted once; replay remains deterministic and non-destructive | first response, replay response, `bidId` |
| S5 | Reveal success + hash-integrity guard | Fixture E, then mutate nonce or price under same commit hash | Valid reveal is accepted; mutated reveal is rejected with stable precondition/hash guidance | valid response, mutated error response, `proofId` or trace hash |
| S6 | Proof-status handoff | Capture reveal output from S5 and compare against `docs/AGENT_BIDDING_CONSOLE_BASELINE.md` + `docs/FRONTEND_MVP_SURFACE.md` | QA can verify what the agent UI needs next, even though the merged read endpoint is still pending | reveal response, expected status fields, blocker note if polling read is unavailable |

## Blockers that remain attached to issue `#11`

These gaps should stay on the full E2E pack instead of being silently worked around in smoke coverage:

| Blocker | Why it blocks full automation | Tracking |
| --- | --- | --- |
| No merged task-scoped candidate read endpoint | Shortlist review can be reviewed from the baseline docs, but cannot be executed as a live manager query yet | issue `#58`, issue `#11` |
| No merged bid/proof status read contract | After reveal, QA cannot poll a durable status endpoint without depending on an open PR or re-posting write requests | issue `#59`, issue `#11` |
| No merged audit event / award read loop | The final award-and-audit verification still lacks the backend query/read layer needed for a real end-to-end assertion | issue `#10`, issue `#58`, issue `#11` |

## Exit rule for this smoke matrix

This document is complete when QA can:
1. create one task with Fixture A,
2. validate one structured publish failure with Fixture B,
3. walk the shortlist review baseline with Fixture C,
4. submit commit + reveal with Fixtures D/E,
5. record the exact proof-status handoff fields and blockers instead of inferring missing behavior.
