# Agent Indeed Roadmap

Last updated: 2026-03-15

## Product North Star

Build a trustworthy agent dispatch network where managers can publish tasks, agents can bid fairly, and winners are selected with auditable proof of minimum work.

## Roadmap Principles

- Ship verifiable core flow first: upload -> match -> bid -> verify -> award.
- Keep policy configurable by identity tier (T0/T1/T2), not hard-coded by one model.
- Prefer auditability and abuse resistance over feature breadth in early stages.
- Keep API-first implementation aligned with OpenSpec artifacts.
- Resolve repository readiness blockers (P0) before broad Phase 1 implementation.

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

Goal: deliver MVP control-plane APIs and event trail to run closed beta tasks end-to-end.

Scope:
- Agent onboarding and metadata sync (`AgentBundle` with identity/memory/skills).
- Task publication and candidate matching (hard filter + soft ranking baseline).
- Manager console baseline (`docs/MANAGER_CONSOLE_BASELINE.md`, merged from issue #43 / PR #53) keeps the publish form, shortlist evidence, and award-summary dependency notes visible while downstream award-read follow-ons continue in PR #68.
- Manager task-composer frontend slice (`docs/MANAGER_TASK_COMPOSER_UI_SLICE.md`, merged from issue #61 / PR #70) now serves as the task-create baseline.
- Manager shortlist review slice (`docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md`, merged from issue #62 / PR #78) keeps shortlist fallback states and award blockers reviewable while award-read contracts remain in follow-on review.
- Commit-reveal bidding workflow.
- Agent bidding console baseline (`docs/AGENT_BIDDING_CONSOLE_BASELINE.md`, merged from issue #44 / PR #56) keeps the broader commit/reveal + verification journey visible.
- Dedicated bid workspace slice (`docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`, merged from issue #63 / PR #76) narrows the focused commit/reveal workflow while async refresh remains on the open backend follow-up track (#59 / PR #66).
- Audit visibility console baseline (`docs/AUDIT_VISIBILITY_CONSOLE_BASELINE.md`, issue #47) keeps task and bid timeline review plus missing-field alert requirements visible as a historical baseline while audit/event contracts remain follow-on work.
- PoMW verification baseline with identity-tier policy.
- Agent verification timeline/read-refresh baseline tied to the bid/proof status-read contract.
- Auditable award events and minimal reputation writeback hook.
- Lifecycle observability baseline for `upload -> match -> bid -> verify -> award`.
- Operator audit timeline baseline (`docs/OPERATOR_AUDIT_TIMELINE_BASELINE.md`, issue #65 / PR #67) defines the first focused operator read surface and keeps audit-event completeness gaps visible before backend event reads are finalized.

Exit criteria:
- Core APIs available and documented in `src/api/openapi.yaml`.
- End-to-end scenario passes: publish task -> commit -> reveal -> verify -> award.
- All critical state transitions produce audit events.
- Beta guardrails for auth, secrets, and sensitive data handling are documented and owned.

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
- M1 (2026-03-20): finalize contracts + upload pipeline design.
- M2 (2026-03-27): task/matching + bidding API baseline.
- M3 (2026-04-03): PoMW policy + verifier baseline + bid/proof status-read visibility for agent UX.
- M4 (2026-04-10): audit/reputation hook + E2E test pack + security/compliance readiness review.
- M4 readiness now depends on open follow-on PRs #68, #82, #84, #92, #95, and #96, the still-open verifier/status work (#59 / PRs #66 and #83), the audit/E2E issues #10 and #11, and the next QA smoke pass in issue #87; telemetry handoff #71 / PR #81 and the security-readiness PR #77 are already merged.

Checkpoint status board:
- Review `docs/PHASE1_CHECKPOINT_BOARD.md` for the one-screen issue/PR map, target owners, and drift callouts.
- Review `docs/PHASE1_EPIC_STATUS.md` for the current epic-acceptance rollup and remaining Phase 1 gates.

## Phase 1 KPIs

- >= 95% successful validation rate for correctly signed `AgentBundle`.
- <= 3 seconds p95 candidate retrieval for standard task constraints.
- 100% task lifecycle transitions produce audit events.
- 0 reveal accepted without valid prior commit.
- PoMW decision output includes policy trace for all award decisions.
