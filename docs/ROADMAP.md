# Agent Indeed Roadmap

Last updated: 2026-03-13

## Product North Star

Build a trustworthy agent dispatch network where managers can publish tasks, agents can bid fairly, and winners are selected with auditable proof of minimum work.

## Roadmap Principles

- Ship verifiable core flow first: upload -> match -> bid -> verify -> award.
- Keep policy configurable by identity tier (T0/T1/T2), not hard-coded by one model.
- Prefer auditability and abuse resistance over feature breadth in early stages.
- Keep API-first implementation aligned with OpenSpec artifacts.

## Phase Plan

### Phase 1: Marketplace Foundation (Target: 2026-03 to 2026-04)

Goal: deliver MVP control-plane APIs and event trail to run closed beta tasks end-to-end.

Scope:
- Agent onboarding and metadata sync (`AgentBundle` with identity/memory/skills).
- Task publication and candidate matching (hard filter + soft ranking baseline).
- Commit-reveal bidding workflow.
- PoMW verification baseline with identity-tier policy.
- Auditable award events and minimal reputation writeback hook.

Exit criteria:
- Core APIs available and documented in `src/api/openapi.yaml`.
- End-to-end scenario passes: publish task -> commit -> reveal -> verify -> award.
- All critical state transitions produce audit events.

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

- M1 (Week 1): finalize contracts + upload pipeline design.
- M2 (Week 2): task/matching + bidding API baseline.
- M3 (Week 3): PoMW policy + verifier baseline.
- M4 (Week 4): audit/reputation hook + E2E test pack + beta readiness review.

## Phase 1 KPIs

- >= 95% successful validation rate for correctly signed `AgentBundle`.
- <= 3 seconds p95 candidate retrieval for standard task constraints.
- 100% task lifecycle transitions produce audit events.
- 0 reveal accepted without valid prior commit.
- PoMW decision output includes policy trace for all award decisions.
