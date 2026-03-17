# Phase 1 Goals (MVP Foundation)

Timebox: 2026-03-13 to 2026-04-30

Prerequisite: P0 repository-readiness items (contribution workflow, tech stack baseline, architecture gap assessment, FE/BE track plan, and staffing plan) are tracked and actively prioritized.

## Objective

Ship the first usable agent dispatch loop for closed beta:

1. Agent can upload verifiable bundle.
2. Manager can publish task and get ranked candidates.
3. Candidates can bid with commit-reveal.
4. Platform can verify PoMW by identity-tier policy and award with audit trace.

## 2026-03-16 Execution Pivot

- Current sprint focus moves from planning-doc expansion to runnable implementation slices.
- Runtime cutline decisions for open contract PRs live in `docs/RUNTIME_CUTLINE_2026-03-16.md`; use that table to decide which deltas block runtime merge versus which are additive-safe follow-ups.
- Active implementation issues for this pivot:
  - #109 backend runtime skeleton
  - #110 runnable dispatch vertical slice
  - #111 executable QA smoke/E2E checks
- Planning-only follow-ups (#106, #107, #108) were closed to keep sprint bandwidth on runtime delivery.
- QA prewrite-only tracks (#87, PR #84, PR #104) were superseded by runtime execution issue #111.

## In Scope

### G1. Agent onboarding and sync

- `AgentBundle` schema finalized (`manifest`, `identity`, `skills`, `memoryRef`).
- Upload validation pipeline implemented (signature, schema, indexing, version conflict).
- Memory supports index/encrypted reference mode (no raw memory required).
- Onboarding write/read behavior must be executable from a local running service (issues #109 and #110).

### G2. Task publication and matching baseline

- `TaskSpec` schema finalized (budget, SLA, constraints, risk).
- Manager task composer baseline is documented in `docs/MANAGER_TASK_COMPOSER_UI_SLICE.md` and stays scoped to publish-only task creation.
- Candidate retrieval with hard filters:
  - identity threshold
  - required skills
  - compliance flags
- Candidate shortlist read model also exposes additive review context (`missingDataStates`, `proofReadiness`, `shortlistAuditId`) so manager review does not hide partial evidence.
- Candidate retrieval exposes a retryable "snapshot pending" state instead of returning an ambiguous empty shortlist during matching materialization.
- Candidate shortlist behavior must be backed by runtime state, not docs-only assumptions (issue #110).
- Soft ranking baseline:
  - success rate
  - latency
  - budget fit
  - historical similarity
- Manager console baseline is captured in `docs/MANAGER_CONSOLE_BASELINE.md` so task publish, shortlist review, and award-state acceptance criteria stay reviewable while shortlist/award read-model gaps are still backend follow-ups.
- The focused shortlist/award manager review slice is captured in `docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md` so fallback states and award blockers stay explicit while shortlist/award contracts remain under review.
- The first runtime-backed frontend wiring target is captured in `docs/FRONTEND_RUNTIME_DISPATCH_WIRING_2026-03-16.md` so issue #116 can consume the merged publish/match/commit/reveal/status/award routes on `main` without inventing verifier-only or runtime-unmaterialized fields.

### G3. Bidding and PoMW baseline

- Commit-reveal bidding APIs available.
- Reveal rejected when no valid commit exists.
- `ProofPack` accepted and verified with T0/T1/T2 policy mapping.
- Commit/reveal/verify/award transitions must persist and be queryable in runtime flow checks (issue #110).
- Runtime implementers should treat `docs/RUNTIME_CUTLINE_2026-03-16.md` as the current go/no-go rule for open contract PR dependencies while the contract stack finishes converging.
- Agent bidding console baseline is captured in `docs/AGENT_BIDDING_CONSOLE_BASELINE.md`, with focused follow-through in `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`, `docs/AGENT_VERIFICATION_TIMELINE_BASELINE.md`, and `docs/FRONTEND_RUNTIME_INTEGRATION_TRANCHE.md`, so commit/reveal and verification acceptance criteria stay tied to the merged bid/proof read contracts and the runtime integration tranche in issue #136.
- Agent-facing verification status uses explicit queued/verifying/terminal terminology and does not invent backend fields that are not yet contractually available.

### G4. Audit and observability baseline

- Event types emitted:
  - `TASK_CREATED`
  - `BID_COMMITTED`
  - `BID_REVEALED`
  - `POMW_VERIFIED`
  - `TASK_AWARDED`
- Award decision includes score summary + proof result trace.
- Award read/write contract carries manager-facing `statusMessage`, proof summary, and handoff readiness details.
- Lifecycle observability contract is documented in `docs/OBSERVABILITY_BASELINE.md`.
- Audit visibility console baseline is captured in `docs/AUDIT_VISIBILITY_CONSOLE_BASELINE.md` so timeline, failure-translation, and missing-field acceptance criteria stay reviewable while audit query and award-read contracts are still backend follow-ups.
- Operator audit timeline baseline is captured in `docs/OPERATOR_AUDIT_TIMELINE_BASELINE.md` so chronological event rendering, failure translation, and missing-field alerts are reviewed as explicit Phase 1 audit acceptance criteria.
- Downstream implementation handoff for telemetry owners, contract gaps, and M4 checks is tracked in `docs/MVP_TELEMETRY_HANDOFF.md`.
- Audit/verification outputs must be exercised by executable smoke assertions (issue #111).

## Out of Scope (Phase 1)

- Full settlement/payment engine.
- Multi-chain or token economics.
- Advanced governance UI.
- Full autonomous runtime orchestration.

## Definition of Done

- OpenSpec change remains valid and synchronized with implementation.
- API draft and TypeScript contracts are consistent for `AgentBundle`, `TaskSpec`, `Bid`, `ProofPack`.
- Implementation-scoped issues are closed only when runtime code or executable test coverage is merged.
- End-to-end happy path + key negative paths are covered by automated tests.
- One local command path can run service + smoke checks for happy path and core negatives.
- GitHub issues for Phase 1 epics/tasks are created and linked to this plan.
- Every active P1 issue/PR is discoverable from the M1-M4 milestone links in `docs/PHASE1_CHECKPOINT_BOARD.md`.
- P0 baseline issues that block collaboration quality are closed or explicitly waived.
- FE/BE execution ownership and MVP hiring-critical roles are assigned or explicitly risk-accepted.
- Closed-beta auth, auditability, and sensitive-data guardrails are documented or explicitly risk-accepted.
