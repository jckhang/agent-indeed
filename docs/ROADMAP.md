# Agent Indeed Roadmap

Last updated: 2026-03-14

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
- Manager console baseline (`docs/MANAGER_CONSOLE_BASELINE.md`, issue #43 / PR #53) keeps the publish form, shortlist evidence, and award-summary dependency notes visible while interactive award APIs are still pending.
- Commit-reveal bidding workflow.
- Agent bidding console baseline (`docs/AGENT_BIDDING_CONSOLE_BASELINE.md`, issue #44 / PR #56) keeps commit/reveal workspace expectations and async refresh gaps explicit until polling/event-stream support lands.
- PoMW verification baseline with identity-tier policy.
- Auditable award events and minimal reputation writeback hook.
- Lifecycle observability baseline for `upload -> match -> bid -> verify -> award`.

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
- M3 (2026-04-03): PoMW policy + verifier baseline.
- M4 (2026-04-10): audit/reputation hook + E2E test pack + security/compliance readiness review.
- M4 readiness also requires `docs/OBSERVABILITY_BASELINE.md` to be implemented by downstream telemetry work.

Checkpoint status board:
- Review `docs/PHASE1_CHECKPOINT_BOARD.md` for the one-screen issue/PR map, target owners, and drift callouts.

## Phase 1 KPIs

- >= 95% successful validation rate for correctly signed `AgentBundle`.
- <= 3 seconds p95 candidate retrieval for standard task constraints.
- 100% task lifecycle transitions produce audit events.
- 0 reveal accepted without valid prior commit.
- PoMW decision output includes policy trace for all award decisions.
