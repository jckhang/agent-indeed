# MVP API QA Handoff Pack

Last updated: 2026-03-16

## Objective

Turn the MVP API example outline into one reviewer-ready handoff pack for the closed-beta happy path:
`publish -> match -> commit -> reveal -> verify -> award`.

This pack is the contract-facing companion to the smoke materials. Use it when QA, planning, or reviewers
need one place that names the current request/response surfaces, the canonical enum vocabulary, and the open
contract blockers that still prevent full end-to-end execution.

## How QA Should Use This Pack

1. Start with the sequence table below and confirm each step against the named source of truth.
2. Treat any step marked `Blocked` as documentation-only until the listed PR(s) merge.
3. Reuse the exact field and enum names listed here in smoke assertions and future E2E cases.
4. Pair this pack with the active beta-readiness gate review and `docs/PHASE1_EPIC_STATUS.md` when updating
   issue #87 or issue #11.

## Canonical Vocabulary To Reuse Verbatim

| Surface | Canonical values | Source of truth |
| --- | --- | --- |
| Identity tier | `T0`, `T1`, `T2` | `openspec/changes/agent-dispatch-platform/design.md`, `src/api/openapi.yaml`, `src/api/contracts.ts` |
| Bid window phase | `COMMIT_OPEN`, `REVEAL_OPEN`, `CLOSED` | `src/api/openapi.yaml`, `src/api/contracts.ts` |
| Reveal proof tracking status | `PENDING_VERIFY`, `PASS`, `FAIL`, `MANUAL_REVIEW` | `src/api/openapi.yaml`, `src/api/contracts.ts` |
| Verification terminal result | `PASS`, `FAIL`, `MANUAL_REVIEW` | `openspec/changes/agent-dispatch-platform/specs/task-marketplace-bidding-powm/spec.md`, `src/api/openapi.yaml`, `src/api/contracts.ts` |
| Proof policy strength | `LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH` | `openspec/changes/agent-dispatch-platform/design.md`, `src/api/openapi.yaml`, `src/api/contracts.ts` |
| Proof challenge profile | `SAMPLE_EXECUTION`, `HASHCASH`, `STAKE`, `HYBRID` | `openspec/changes/agent-dispatch-platform/design.md`, `src/api/openapi.yaml`, `src/api/contracts.ts` |

## Happy-Path Sequence

| Step | API / artifact | Minimum request facts QA should expect | Minimum response / evidence QA should expect | Current source of truth | Status | Blocking contract thread |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Publish task | `POST /v1/tasks` | `workspaceId` header plus `task.title`, `task.description`, `task.budget`, `task.sla`, `task.constraints`, `task.risk`, `task.powmPolicy`, `task.biddingWindow` | `201` create response proving the task entered marketplace with stable task payload fields | `src/api/openapi.yaml`, `src/api/contracts.ts`, OpenSpec task-marketplace spec | Ready now | None |
| 2. Match candidates | Publish-side shortlist kickoff after `POST /v1/tasks` | Same publish payload must carry `constraints.identityTierMin`, `constraints.requiredSkills`, risk, and PoMW inputs so matching can run deterministically | Candidate shortlist/ranking evidence is still expected to come from the matching contract rather than ad hoc docs | OpenSpec task-marketplace spec, `src/api/openapi.yaml`, open PR #55 | Blocked | PR #55 / issue #6 |
| 3. Commit bid | `POST /v1/tasks/{taskId}/bids/commit` | `commit.bidId`, `commit.taskId`, `commit.agentId`, `commit.bidHash`, `idempotencyKey` | `202` with `status=COMMITTED`, echoed commit payload, and `window.currentPhase`, `commitDeadline`, `revealDeadline`, `serverTime`, `nextAction` | `src/api/openapi.yaml`, `src/api/contracts.ts`, OpenSpec task-marketplace spec | Ready now | None |
| 4. Reveal bid | `POST /v1/tasks/{taskId}/bids/reveal` | `reveal.bidId`, `reveal.taskId`, `reveal.agentId`, commercial fields, and `proof` payload tied to the commit hash | `200` with `status=REVEALED`, `rankingScore`, `decisionTraceHash`, `proofSubmission.proofId`, `proofSubmission.verificationStatus`, and updated window snapshot | `src/api/openapi.yaml`, `src/api/contracts.ts`, OpenSpec task-marketplace spec | Partially ready | Proof read freshness still depends on PR #66 |
| 5. Resolve proof policy | `POST /v1/tasks/{taskId}/proof-policy` | `agentId`, `identityTier`, optional `trustScore` | `policyTraceId`, `requiredProofStrength`, `challengeProfile`, `verifierParams`, `inputSnapshot`, `persistedAt` | `src/api/openapi.yaml`, `src/api/contracts.ts`, OpenSpec design/spec | Ready now | None |
| 6. Verify proof | `POST /v1/tasks/{taskId}/proofs/verify` | `policyTraceId` from the persisted policy step plus full `proof` payload | `200` response with `proofId`, `result`, `policyTraceId`, `requiredPolicy`, `requiredDifficulty`, `achievedDifficulty`, optional `reasonCodes`; error path may return `PROOF_VERIFY_FAILED` or `PROOF_VERIFY_NEEDS_REVIEW` | `src/api/openapi.yaml`, `src/api/contracts.ts`, OpenSpec task-marketplace spec, open PR #83 | Blocked | PR #83 / issue #9 and PR #66 / issue #59 |
| 7. Award decision | Manager shortlist/award read models plus audit trace follow-through | Award flow must preserve shortlist evidence, proof result summary, and audit linkage instead of inventing manager-side fields | QA should expect stable shortlist/award evidence, explicit blockers before award, and audit-ready identifiers (`audit_id`, proof result summary, score trace) | OpenSpec task-marketplace spec, `docs/MVP_TELEMETRY_HANDOFF.md`, open PR #68, open PR #92 | Blocked | PR #68 / issue #58 and PR #92 / issue #10 |

## Step-by-Step Notes For QA

### 1. Publish -> Match handoff

- The publish contract already defines the manager write surface, but it does not yet give QA a merged shortlist/ranking read contract.
- Treat the publish request as stable enough to validate required inputs now.
- Do not hard-code shortlist response fields until PR #55 merges.

### 2. Commit -> Reveal handoff

- The commit/reveal write path is the most stable part of the current happy path.
- Reuse the exact error names already present in the API draft for negative-path prep: `BID_COMMIT_WINDOW_CLOSED`, `BID_REVEAL_COMMIT_NOT_FOUND`, and `BID_REVEAL_HASH_MISMATCH`.
- Keep `proofSubmission.verificationStatus` distinct from the later verifier `result`; the reveal response can surface `PENDING_VERIFY` before a terminal verifier result exists.

### 3. Proof policy -> verify handoff

- QA should always pair `POST /v1/tasks/{taskId}/proof-policy` with `POST /v1/tasks/{taskId}/proofs/verify`.
- The verifier request is not valid without the persisted `policyTraceId` from the policy step.
- Until PR #66 merges, any refresh-safe readback of queued/verifying proof state remains dependency-bounded rather than fully merged contract surface.

### 4. Award handoff

- The award step is still documentation-first because the shortlist read model and audit trace outputs are both under review.
- For now, QA should assert that award remains blocked until the shortlisted candidate evidence, proof result summary, and audit identifiers come from the same contract set.
- Treat `docs/MVP_TELEMETRY_HANDOFF.md` as the current checklist for the audit identifiers that cannot be dropped once award surfaces merge.

## Blocker Map

| Step blocked today | Why QA cannot close it yet | Owning thread |
| --- | --- | --- |
| Match evidence | Candidate shortlist/ranking response is still being finalized | PR #55 / issue #6 |
| Verification refresh/readback | Refresh-safe proof status reads are not merged yet | PR #66 / issue #59 |
| Verifier terminal contract | Final verifier/result-code contract is still under review | PR #83 / issue #9 |
| Award review fields | Manager shortlist and award-read model is not merged yet | PR #68 / issue #58 |
| Audit-backed award trace | Audit/event surface needed for final beta sign-off is not merged yet | PR #92 / issue #10 |

## Immediate Follow-Through For Issue #87 And Issue #11

- Issue #87 should use this pack as the source for happy-path step ordering and shared enum names.
- Issue #11 should keep the same sequence but convert only the `Ready now` steps into executable checks until the blocked contract PRs merge.
- When any blocker merges, update this pack and `docs/PHASE1_EPIC_STATUS.md` in the same review window so QA and planning stay aligned.
