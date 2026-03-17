# Agent Indeed Roadmap

Last updated: 2026-03-16

## Product North Star

Build a trustworthy agent dispatch network where managers can publish tasks, agents can bid fairly, and winners are selected with auditable proof of minimum work.

## Roadmap Principles

- Ship verifiable core flow first: upload -> match -> bid -> verify -> award.
- Keep policy configurable by identity tier (T0/T1/T2), not hard-coded by one model.
- Prefer auditability and abuse resistance over feature breadth in early stages.
- Keep API-first implementation aligned with OpenSpec artifacts.
- Resolve repository readiness blockers (P0) before broad Phase 1 implementation.
- Runtime implementation evidence is required before closing `Implement`-scoped issues (spec/docs-only PRs are not sufficient).

## Phase Plan

### Phase 0: Engineering Readiness (Target: 2026-03)

Goal: remove process and baseline documentation blockers before scaling implementation work.

Scope:
- Contribution workflow baseline (`CONTRIBUTING.md`) aligned with OpenSpec-first practice.
- Tech stack baseline inventory (`docs/TECH_STACK.md`) with known gaps and decision boundaries.
- P0 issue tracking wired to planning docs for execution visibility.
- Architecture gap assessment and FE/BE delivery track baselines.
- Hiring plan for MVP-critical execution roles.

Exit criteria:
- Contribution guidelines are published and reviewable.
- Tech stack baseline is documented and linked by backlog issue(s).
- P0 issues are tracked and prioritized ahead of new Phase 1 coding tasks.
- FE/BE track milestones and staffing assumptions are documented and traceable in issues.

### Phase 1: Marketplace Foundation (Target: 2026-03 to 2026-04)

Goal: deliver a runnable MVP control-plane and event trail to run closed-beta tasks end-to-end.

Scope:
- Runtime sprint pivot (2026-03-16) is execution-first:
  - #109 bootstrap runnable backend skeleton
  - #110 implement runnable dispatch vertical slice (`publish -> match -> commit -> reveal -> verify -> award`)
  - #111 convert QA smoke/E2E matrices into executable checks
- Keep the remaining runtime contract review queue focused on PRs #66 and #68, with PR #122 held to the merged `main` baseline, rather than treating every historical contract PR as a current blocker.
- Agent onboarding and metadata sync (`AgentBundle` with identity/memory/skills).
- Task publication and candidate matching (hard filter + soft ranking baseline).
- Manager shortlist and award review contracts with audit-linked status context.
- Manager console baseline (`docs/MANAGER_CONSOLE_BASELINE.md`, issue #43 / PR #53) keeps the publish form, shortlist evidence, and award-summary dependency notes visible while interactive award APIs are still pending.
- Manager task-composer frontend slice (`docs/MANAGER_TASK_COMPOSER_UI_SLICE.md`, issue #61 / PR #70) documents the current task-create contract and calls out idempotency follow-up explicitly.
- Manager shortlist review slice (`docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md`, issue #62) keeps shortlist fallback states and award blockers reviewable while shortlist/award contracts remain in flight.
- Commit-reveal bidding workflow.
- Agent bidding console baseline (`docs/AGENT_BIDDING_CONSOLE_BASELINE.md`, issue #44 / PR #56) keeps the broader commit/reveal + verification journey visible.
- Dedicated bid workspace slice (`docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`, issue #63 / PR #76) narrows the frontend delivery item to one commit/reveal workflow while handing runtime status refresh to the merged bid/proof read routes.
- Frontend runtime integration tranche (`docs/FRONTEND_RUNTIME_INTEGRATION_TRANCHE.md`, issue #136) defines the first manager + agent runtime-backed smoke path and the local evidence runbook tied to #110 and #115.
- Audit visibility console baseline (`docs/AUDIT_VISIBILITY_CONSOLE_BASELINE.md`, issue #47) keeps task/bid timeline review, failure translation, and missing-field alert requirements visible while audit query and award-read contracts are still pending.
- PoMW verification baseline with identity-tier policy.
- Agent verification timeline/read-refresh baseline tied to the merged bid/proof status reads and the runtime persistence work behind issue #136.
- Auditable award events and minimal reputation writeback hook.
- Lifecycle observability baseline for `upload -> match -> bid -> verify -> award`.
- Operator audit timeline baseline (`docs/OPERATOR_AUDIT_TIMELINE_BASELINE.md`, issue #65 / PR #67) defines the first focused operator read surface and keeps audit-event completeness gaps visible before backend event reads are finalized.

Exit criteria:
- Core APIs available and documented in `src/api/openapi.yaml`.
- End-to-end scenario passes: publish task -> commit -> reveal -> verify -> award.
- All critical state transitions produce audit events.
- Beta guardrails for auth, secrets, and sensitive data handling are documented and owned.

## Current Sprint Pivot (2026-03-16 to 2026-03-27)

Focus:
- Deliver executable backend runtime slices first (#109, #110).
- Convert QA readiness docs into runnable checks tied to runtime behavior (#111, issue #11).
- Keep OpenSpec/OpenAPI/contracts synchronized while implementation PRs land.
- Use `docs/RUNTIME_CUTLINE_2026-03-16.md` as the sprint-level rule for which open contract PRs are true runtime blockers versus additive-safe follow-ups.

De-scoped from current sprint:
- Planning-only follow-ups #106, #107, #108 were closed to avoid additional doc-layer churn.
- Planning-sync PRs #82, #95, #96, #102, #103, and #105 were closed for the same reason.
- QA prewrite-only threads (#87, PR #84, PR #104) are treated as superseded by runtime execution issue #111.

### Phase 2: Execution & Trust Loop (Target: 2026-05 to 2026-06)

Goal: strengthen runtime trust and feedback loop for production trials.

Scope:
- Execution trace collector and proof replay checks.
- Reputation scoring pipeline and feedback ingestion.
- SLA-aware re-ranking and failure fallback.
- Settlement interface stubs and accounting hooks.

### Phase 3: Ecosystem Scale (Target: 2026-H2)

Goal: open the network to broader ecosystems and multi-tenant operations.

Scope:
- Multi-tenant policy configuration.
- Partner integration SDK and onboarding automation.
- Advanced anti-sybil and anomaly detection.
- Governance dashboards and compliance exports.

## Milestones (Phase 1)

- M0 (Week 0): contribution workflow + tech stack baseline + P0 issue cleanup.
- M0.5 (Week 0): architecture gap assessment + FE/BE track plan + hiring gap plan.
- M1 (2026-03-20): close the remaining contract review queue (#66, #68) and land runnable backend skeleton (#109).
- Runtime work may proceed ahead of full contract convergence when the cutline marks a delta additive-safe; verifier payload/result vocabulary is now merged, so the remaining near-term review risk is contract drift on the additive read surfaces and frontend wiring handoff.
- M2 (2026-03-27): land runnable publish/match/commit/reveal/verify/award vertical slice (#110).
- M3 (2026-04-03): stabilize verify/award/audit runtime behavior and run executable smoke checks (#111).
- M4 (2026-04-10): complete E2E coverage + audit/reputation hardening + security/compliance readiness review.
- M4 readiness also requires `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, and `docs/CLOSED_BETA_SECURITY_READINESS.md` so telemetry owners plus auth, secret-handling, and redaction follow-ons stay reviewable.
- Review `docs/PHASE1_BETA_READINESS_GATES.md` as the compact release-gate checklist for the remaining Phase 1 contract, QA, audit, and planning blockers.

Checkpoint status board:
- Review `docs/PHASE1_CHECKPOINT_BOARD.md` for milestone links, target owners, and checkpoint review prompts.

## Phase 1 KPIs

- >= 95% successful validation rate for correctly signed `AgentBundle`.
- <= 3 seconds p95 candidate retrieval for standard task constraints.
- 100% task lifecycle transitions produce audit events.
- 0 reveal accepted without valid prior commit.
- PoMW decision output includes policy trace for all award decisions.
