# MVP API Example Outline for QA Handoff

Last updated: 2026-03-15

Issue link: #93 (`[P1-29] Draft MVP API example outline for QA handoff`)

## Why this outline exists

Issue #11 still owns the full MVP API example pack and end-to-end QA flow, but it remains blocked on a few open backend contracts. This outline gives QA a stable prep surface now so request fixtures, expected transitions, and smoke checkpoints can be assembled in parallel instead of waiting for every M4 dependency to merge.

## Handoff target

Use this outline to prepare the bounded MVP request/response examples for the closed-loop flow:

`upload -> publish -> commit -> reveal -> verify -> award`

- Pair this outline with issue #11 for the eventual full example pack and E2E suite.
- Pair the ready-now steps with the smoke follow-through in issue #87 and PR #84 so QA can validate the next merged tranche without waiting for the entire blocked pack.
- Treat every `Blocked` note below as a contract gate, not a missing-docs TODO.

## Flow readiness at a glance

| Step | Endpoint / dependency | Status | What QA can do now | Open blocker |
| --- | --- | --- | --- | --- |
| 1. Upload agent bundle | `POST /v1/agents/bundles` | Ready now | Freeze request/response fixtures from the current draft API. | None |
| 2. Publish task | `POST /v1/tasks` | Ready now | Freeze a publish example that produces a task id plus bidding window timestamps. | None |
| 3. Commit bid | `POST /v1/tasks/{taskId}/bids/commit` | Ready now | Freeze commit-window success and replay/window-closed negative examples. | None |
| 4. Reveal bid + proof payload | `POST /v1/tasks/{taskId}/bids/reveal` | Ready now | Freeze reveal success plus hash-mismatch / missing-commit negatives. | None |
| 5. Resolve proof policy | `POST /v1/tasks/{taskId}/proof-policy` | Ready now | Prepare the policy snapshot fixture that verify must replay with `policyTraceId`. | None |
| 6. Verify proof pack | `POST /v1/tasks/{taskId}/proofs/verify` | Partial | Draft example structure now, but keep final status/reason-code expectations soft until verifier contract review lands. | PR #83 |
| 7. Review shortlist + award readiness | Proposed shortlist / award reads from issue #58 | Blocked | Record placeholder assertions only; do not freeze manager-facing award examples yet. | PR #68 |
| 8. Audit timeline / award trace evidence | Task/bid event stream and `TASK_AWARDED` trace payload | Blocked | Note required audit ids / trace refs, but do not finalize evidence examples yet. | PR #92 |
| 9. Award task | Proposed award command/read path | Blocked | Keep the final step as a dependency note in issue #11 rather than a locked example. | PR #68 and PR #92 |

## Example sequence

### 1. Upload an agent bundle

- Endpoint: `POST /v1/agents/bundles`
- Source of truth: `src/api/openapi.yaml`, `docs/ONBOARDING_PIPELINE.md`
- Goal: register one signed agent fixture that can be reused in downstream publish/bid examples.
- Minimum request fields to keep stable now:
  - `idempotencyKey`
  - `bundle.schemaVersion`
  - `bundle.manifest.*`
  - `bundle.identity.*`
  - `bundle.skills[]`
  - `bundle.memoryRef.*`
  - `bundle.signature.*`
- Minimum response fields to assert now:
  - `agentId`
  - `version`
  - `status`
  - `result`
  - `indexing.status`

```json
{
  "idempotencyKey": "idem_agentbundle_qa_001",
  "bundle": {
    "schemaVersion": "1.0",
    "manifest": {
      "name": "support_triage_agent",
      "version": "1.2.0"
    },
    "identity": {
      "did": "did:key:example-agent",
      "credentialLevel": "T1"
    },
    "skills": [
      {
        "skillId": "skill_support.triage",
        "version": "1.4.0"
      }
    ],
    "memoryRef": {
      "mode": "INDEX_ONLY"
    },
    "signature": {
      "algorithm": "ED25519",
      "payloadHash": "sha256:...",
      "signature": "base64:...",
      "signerDid": "did:key:example-agent"
    }
  }
}
```

### 2. Publish a task

- Endpoint: `POST /v1/tasks`
- Source of truth: `src/api/openapi.yaml`, `docs/MANAGER_TASK_COMPOSER_UI_SLICE.md`
- Goal: create one task fixture that yields `taskId`, `status`, `commitDeadline`, and `revealDeadline` for every later example.
- Minimum request sections to keep stable now:
  - `task.title`, `task.description`
  - `task.budget.*`
  - `task.sla.*`
  - `task.constraints.*`
  - `task.risk.*`
  - `task.powmPolicy.*`
  - `task.biddingWindow.*`
- Minimum response fields to assert now:
  - `taskId`
  - `status`
  - `commitDeadline`
  - `revealDeadline`

### 3. Commit a bid hash

- Endpoint: `POST /v1/tasks/{taskId}/bids/commit`
- Source of truth: `src/api/openapi.yaml`, `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`
- Goal: prove the commit window contract is stable enough for QA fixtures today.
- Minimum request fields to keep stable now:
  - `bid.bidId`
  - `bid.taskId`
  - `bid.agentId`
  - `bid.bidHash`
  - `bid.committedAt`
- Minimum response fields to assert now:
  - `bidId`
  - `phase`
  - `status`
  - `result`
  - `window.currentPhase`
  - `window.commitDeadline`
  - `window.revealDeadline`
- Also queue one negative example now:
  - `BID_COMMIT_WINDOW_CLOSED`

### 4. Reveal bid details and attach proof payload

- Endpoint: `POST /v1/tasks/{taskId}/bids/reveal`
- Source of truth: `src/api/openapi.yaml`, `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`
- Goal: lock the reveal request shape and the immediate post-submit verification handoff.
- Minimum request fields to keep stable now:
  - `reveal.bidId`
  - `reveal.taskId`
  - `reveal.agentId`
  - `reveal.nonce`
  - `reveal.price.*`
  - `reveal.executionPlan.*`
  - `reveal.proof.*`
- Minimum response fields to assert now:
  - `bidId`
  - `status`
  - `result`
  - `rankingScore`
  - `decisionTraceHash`
  - `proofSubmission.proofId`
  - `proofSubmission.verificationStatus`
- Also queue two negatives now:
  - `BID_REVEAL_HASH_MISMATCH`
  - reveal-without-valid-commit precondition failure

### 5. Resolve the proof policy snapshot

- Endpoint: `POST /v1/tasks/{taskId}/proof-policy`
- Source of truth: `src/api/openapi.yaml`
- Goal: create the persisted `policyTraceId` fixture that verify, audit, and award examples must all reuse.
- Minimum request/response fields to keep stable now:
  - request candidate/task snapshot fields required for policy resolution
  - response `taskId`
  - response `agentId`
  - response `policyTraceId`
  - response `requiredProofStrength`
  - response `challengeProfile`
  - response `verifierParams.*`
  - response `inputSnapshot.*`

### 6. Verify the proof pack

- Endpoint: `POST /v1/tasks/{taskId}/proofs/verify`
- Source of truth: `src/api/openapi.yaml`
- Current readiness: Partial
- Why partial:
  - The checked-in draft already requires `policyTraceId` and returns proof-verification fields.
  - PR #83 is still the active contract-review lane for stable verifier statuses, reason codes, and downstream vocabulary.
- QA prep to do now:
  - Draft the verify request with one reusable `proofId` and the same `policyTraceId` from step 5.
  - Keep assertions focused on the replay rule (`policyTraceId` must match the persisted policy snapshot) and core fields such as `proofId`, `policyTraceId`, `requiredDifficulty`, `achievedDifficulty`, and `verifiedAt`.
  - Do not freeze the final result-code matrix for issue #11 until PR #83 merges.

### 7. Shortlist and award-readiness review

- Dependency: issue #58 / PR #68
- Current readiness: Blocked
- Why blocked:
  - Full example handoff needs manager-facing shortlist rows, score breakdowns, proof readiness, and award-readiness visibility.
  - Those read contracts are still under review in PR #68 and are not available on the checked-out baseline.
- QA prep to do now:
  - Record the needed assertions only: ranked candidates, score breakdown, proof summary, blocker state, shortlist freshness, and decision/audit references.
  - Keep them as placeholders in issue #11 instead of publishing final JSON examples.

### 8. Audit timeline and award trace evidence

- Dependency: issue #10 / PR #92
- Current readiness: Blocked
- Why blocked:
  - The final award example must carry auditable event evidence, not only a winner id.
  - PR #92 is the contract lane for task/bid event streams and `TASK_AWARDED` trace payload expectations.
- QA prep to do now:
  - Reserve assertion slots for `eventType`, `eventId`, `actorRole`, `traceHash`, `decisionTraceHash`, `scoreSummary`, and `proofSummary`.
  - Do not mark the example pack complete until those audit fields are frozen.

### 9. Award the task

- Dependency: PR #68 plus PR #92
- Current readiness: Blocked
- Why blocked:
  - The current baseline does not yet provide the full manager award read/write contract.
  - The final step also depends on the audit event stream and decision trace defined in PR #92.
- QA prep to do now:
  - Keep the final `award` step in issue #11 as a dependency gate.
  - Avoid inventing a winner-selection payload before the shortlist/readiness and audit contracts merge.

## Ready-now example pack slices

QA can safely draft and review these slices immediately:

1. `upload success + replay/conflict`
2. `publish success`
3. `commit success + window-closed`
4. `reveal success + hash-mismatch`
5. `proof-policy resolution success`
6. `verify request shell with soft assertions on result vocabulary`

## Explicit blockers for issue #11

Issue #11 should stay blocked until these contracts land on `main`:

- PR #68: manager shortlist and award-readiness examples
- PR #83: final proof-verifier status / reason-code vocabulary
- PR #92: audit timeline evidence and award trace fields

Once those merge, QA can turn this outline into the final MVP example pack plus the fuller E2E scenario set.
