# MVP E2E Assertion Matrix

Last updated: 2026-03-16

Related issue: [#101](https://github.com/jckhang/agent-indeed/issues/101)

## Objective

Prewrite the MVP end-to-end assertions that QA should carry forward into the smoke follow-through in issue [#87](https://github.com/jckhang/agent-indeed/issues/87) and the later executable coverage in issue [#11](https://github.com/jckhang/agent-indeed/issues/11).

This matrix converts the current merged planning, UX, telemetry, security, and contract docs into one assertion list for:
`upload -> publish -> match -> commit -> reveal -> verify -> award`.

Use this document to separate:
- assertions that are testable now from merged docs and current contract drafts
- assertions that stay blocked on open backend contract PRs
- negative-path checks that must reuse the current error-code and verifier vocabulary verbatim

## Merged sources of truth used to derive assertions

- `docs/MANAGER_CONSOLE_BASELINE.md`
- `docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md`
- `docs/AGENT_BIDDING_CONSOLE_BASELINE.md`
- `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`
- `docs/AGENT_VERIFICATION_TIMELINE_BASELINE.md`
- `docs/OBSERVABILITY_BASELINE.md`
- `docs/MVP_TELEMETRY_HANDOFF.md`
- `docs/CLOSED_BETA_SECURITY_READINESS.md`
- `docs/ERROR_CODE_RETRY_POLICY.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`

## Open PR dependency

- PR `#103` proposes `docs/MVP_API_QA_HANDOFF_PACK.md`, but that handoff pack is not on `main` yet.
- Until PR `#103` merges, treat this matrix plus the merged docs above as the canonical source for ready-now QA assertions.

## How QA should use this matrix

1. Start with the happy-path sequence assertions in this document; when PR `#103` merges, keep the same ordering as `docs/MVP_API_QA_HANDOFF_PACK.md`.
2. Implement `Ready now` assertions first in issue `#87` and carry them forward into issue `#11`.
3. Treat `Blocked` assertions as prewritten acceptance targets; do not invent substitute fields while the owning PR is still open.
4. Reuse the exact enum values, error codes, and identifier names listed here in smoke and E2E coverage.

## Shared vocabulary QA should reuse verbatim

| Surface | Canonical values / fields | Source of truth |
| --- | --- | --- |
| Identity tier | `T0`, `T1`, `T2` | `src/api/openapi.yaml`, `src/api/contracts.ts`, OpenSpec design |
| Bid window phase | `COMMIT_OPEN`, `REVEAL_OPEN`, `CLOSED` | `src/api/openapi.yaml`, `src/api/contracts.ts` |
| Reveal proof tracking status | `PENDING_VERIFY`, `PASS`, `FAIL`, `MANUAL_REVIEW` | `src/api/openapi.yaml`, `src/api/contracts.ts` |
| Verification result | `PASS`, `FAIL`, `MANUAL_REVIEW` | `src/api/openapi.yaml`, `src/api/contracts.ts`, OpenSpec spec |
| Required identifiers | `trace_id`, `request_id`, `task_id`, `bid_id`, `proof_id`, `audit_id`, `job_id` | `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` |
| Negative-path codes called out by current docs | `AGENT_BUNDLE_SIGNATURE_INVALID`, `BID_REVEAL_COMMIT_NOT_FOUND`, `PROOF_VERIFY_FAILED`, `PROOF_VERIFY_NEEDS_REVIEW`, `TASK_AWARD_PRECONDITION_FAILED`, `TASK_AWARD_PROOF_NOT_VERIFIED` | `docs/ERROR_CODE_RETRY_POLICY.md` |

## Happy-path sequence assertion matrix

| Step | Assertion focus | Ready now assertions | Blocked assertions / why | Owning contract thread |
| --- | --- | --- | --- | --- |
| 1. Upload bundle | Upload/auth baseline | Assert the upload actor is the agent principal, raw memory is not accepted, and signature failure uses stable signature codes with an `auditId`-capable error shape. | Durable indexing correlation and async indexing evidence still depend on backend implementation details rather than a merged read surface. | Issue `#30` / PR `#90` |
| 2. Publish task | Manager write contract | Assert `POST /v1/tasks` requires manager auth, workspace scoping, complete `TaskSpec` fields, valid deadline ordering, and idempotency guidance from the shared error catalog. | Candidate shortlist evidence is not yet merged, so the publish step cannot assert shortlist rows or ranking freshness as live backend fields. | Issue `#6` / PR `#55` |
| 3. Match candidates | Shortlist/ranking evidence | Prewrite that candidate review must show rank, agent id, identity tier, score breakdown, proof readiness, and missing-data fallback copy instead of hiding incomplete rows. | The shortlist read model and score-breakdown payload are still pending backend merge. | Issue `#6` / PR `#55` and issue `#58` / PR `#68` |
| 4. Commit bid | Agent write contract | Assert commit requires `idempotencyKey`, `commit.bidId`, `commit.taskId`, `commit.agentId`, `commit.bidHash`, and returns window snapshot fields plus replay-safe duplicate handling. | A durable bid read surface after refresh is still pending, so this step cannot yet assert readback from `GET` endpoints. | Issue `#59` / PR `#66` |
| 5. Reveal bid | Agent reveal + proof handoff | Assert reveal requires a prior commit, preserves hash integrity, accepts the current `ProofPack` sections, and returns `proofSubmission.proofId`, `verificationStatus`, and `decisionTraceHash` when present. | Refresh-safe bid/proof reads remain pending, so queued/verifying state cannot be asserted as durable read-model truth yet. | Issue `#59` / PR `#66` |
| 6. Verify proof | Terminal verifier result | Prewrite that verify must carry the persisted `policyTraceId`, and terminal outcomes use only `PASS`, `FAIL`, or `MANUAL_REVIEW` with stable reason-code handling. | The final verifier/result contract and async status refresh surface are still under review, so queued/verifying recovery and final code set remain blocked. | Issue `#9` / PR `#83` and issue `#59` / PR `#66` |
| 7. Award readiness / award | Manager award gating + audit | Prewrite that award remains blocked until shortlist evidence, proof result summary, and audit linkage are present together, and manager copy must explain blockers rather than imply a writable award flow. | Award read/write contracts and audit-backed award trace identifiers are still not merged. | Issue `#58` / PR `#68` and issue `#10` / PR `#92` |

## Ready-now assertions QA can implement immediately

| Area | Assertion | Evidence source |
| --- | --- | --- |
| Upload security | Upload accepts only agent-authenticated bundle writes and rejects raw memory payload handling in favor of `memoryRef` metadata. | `docs/CLOSED_BETA_SECURITY_READINESS.md`, `src/api/openapi.yaml` |
| Upload negative path | Invalid signature uses the stable signature family (`AGENT_BUNDLE_SIGNATURE_INVALID`, signer mismatch, or payload mismatch) and is not treated as a retryable blind retry. | `docs/ERROR_CODE_RETRY_POLICY.md` |
| Publish validation | Task create rejects incomplete constraints/policy combinations with stable validation or policy codes instead of generic copy. | `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/MANAGER_CONSOLE_BASELINE.md` |
| Commit write path | Commit returns accepted status plus the server-authored bidding window snapshot (`currentPhase`, deadlines, `serverTime`, `nextAction`). | `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`, PR `#103` (`docs/MVP_API_QA_HANDOFF_PACK.md`) |
| Reveal prerequisite | Reveal without a valid commit must use `BID_REVEAL_COMMIT_NOT_FOUND` and direct QA back to the commit prerequisite. | `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/AGENT_BIDDING_CONSOLE_BASELINE.md` |
| Reveal hash integrity | Reveal hash mismatch remains a terminal precondition failure, not a generic payload validation error. | `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md` |
| Verify failure semantics | Terminal proof failure reuses `PROOF_VERIFY_FAILED` and manual-review follow-through reuses `PROOF_VERIFY_NEEDS_REVIEW`; neither should masquerade as transport failure. | `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/AGENT_VERIFICATION_TIMELINE_BASELINE.md` |
| Telemetry baseline | Lifecycle assertions should require the shared correlation IDs (`trace_id`, `task_id`, `bid_id`, `proof_id`, `audit_id`) whenever the named stage emits events or operator/audit evidence. | `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` |
| Security redaction | Agent-facing and operator-facing assertions must verify that sensitive fields are redacted by default and that actor attribution/rationale are required for override-style flows. | `docs/CLOSED_BETA_SECURITY_READINESS.md` |

## Minimum negative-path assertion matrix

| Scenario | Expected assertion | Status | Blocking PR / issue |
| --- | --- | --- | --- |
| Invalid signature | Upload rejects the bundle with a stable signature code, keeps actor binding explicit, and does not permit blind retry without re-signing. | Ready now | None |
| No commit before reveal | Reveal fails with `BID_REVEAL_COMMIT_NOT_FOUND`, and the workflow stays blocked until a valid commit exists. | Ready now | None |
| Proof fails verification | Verifier returns terminal `FAIL` semantics and QA records reason-code handling instead of generic reveal-form failure. | Partially ready | PR `#83` / issue `#9` for the final verifier/result contract |
| Proof routed to manual review | Verifier returns terminal `MANUAL_REVIEW` semantics, and UI copy avoids promising operator SLA or hidden resolution fields. | Partially ready | PR `#83` / issue `#9` plus PR `#66` / issue `#59` for durable refresh |
| Award blocked | Manager award-readiness stays blocked until shortlist evidence, proof summary, and audit references exist together; blocked copy stays visible instead of implying award can proceed. | Blocked | PR `#68` / issue `#58` and PR `#92` / issue `#10` |

## Blocked assertions QA should keep prewritten

| Blocked assertion | Why it stays blocked | Owning thread |
| --- | --- | --- |
| Candidate ranking table asserts merged shortlist freshness timestamp and score-breakdown fields | Matching + shortlist read model is still under review | PR `#55` / issue `#6`, PR `#68` / issue `#58` |
| Verification timeline asserts durable `queued` and `verifying` reads after refresh | Async bid/proof status read contract is not merged yet | PR `#66` / issue `#59` |
| Proof verification asserts the final result-code surface | Verifier/result contract is still under review | PR `#83` / issue `#9` |
| Award summary asserts live recommended winner, blocker list, audit id, and award command behavior | Award read/write contracts and audit-backed trace fields are still pending | PR `#68` / issue `#58`, PR `#92` / issue `#10` |

## Implementation handoff for issue #87 and issue #11

- Issue `#87` should treat this document as the assertion backlog for the current smoke pass and implement only the `Ready now` rows.
- Issue `#11` should reuse the same matrix ordering once blocked contracts merge rather than deriving a second set of names or statuses.
- When PR `#55`, PR `#66`, PR `#68`, PR `#83`, or PR `#92` merges, update this matrix, `docs/MVP_API_QA_HANDOFF_PACK.md`, and `docs/PHASE1_EPIC_STATUS.md` in the same review window.
