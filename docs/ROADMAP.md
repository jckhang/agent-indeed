# Agent Indeed Roadmap

Last updated: 2026-03-19

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
- Runtime sprint pivot (2026-03-16) has already landed its baseline implementation threads:
  - #109 bootstrap runnable backend skeleton
  - #110 implemented the runnable dispatch vertical slice baseline (`publish -> match -> commit -> reveal -> verify -> award`)
  - #111 converted QA smoke/E2E matrices into executable checks
- Post-runtime planning work now focuses on keeping roadmap/checkpoint references aligned to the merged baseline, not reopening the bootstrap queue.
- Agent onboarding and metadata sync (`AgentBundle` with identity/memory/skills).
- Task publication and candidate matching (hard filter + soft ranking baseline).
- Manager shortlist and award review contracts with audit-linked status context.
- Commit-reveal bidding workflow.
- PoMW verification baseline with identity-tier policy.
- Auditable award events and minimal reputation writeback hook.
- Lifecycle observability baseline for `upload -> match -> bid -> verify -> award`.
- Closed-beta evidence handoff stays concentrated on issue #11 plus the canonical runtime command path in `docs/RUNTIME_EXECUTION_HANDOFF.md`.

Exit criteria:
- Core APIs available and documented in `src/api/openapi.yaml`.
- End-to-end scenario passes: publish task -> commit -> reveal -> verify -> award.
- All critical state transitions produce audit events.
- Beta guardrails for auth, secrets, and sensitive data handling are documented and owned.

## Current Sprint Pivot (2026-03-16 to 2026-03-27)

Focus:
- Treat issues #109, #110, and #111 as closed runtime baseline work.
- Land issue #196 / PR #203 as the backend-owned survivor so durable docs keep the canonical `smoke:issue11` evidence path aligned to `main`.
- Use the live `owner:albatross` + `stream/review-burndown` planning sweep query instead of older planning PR snapshots when checking post-runtime status cleanup.
- Keep PR #133 aligned to the published verify/award contract vocabulary after the planning refresh settles.
- Move QA evidence forward through issue #11 and the canonical runtime handoff docs instead of reopening closed issue #120 or other merged formatter follow-ups.

De-scoped from current sprint:
- Planning-only follow-ups #106, #107, #108 were closed to avoid additional doc-layer churn.
- QA prewrite-only threads (#87, PR #84, PR #104) remain superseded by the executable QA path that now runs through issue #11.
- Closed issue #120 remains a dated baseline reference only; it is not an active evidence lane.

## Next 24h Merge Sequence

1. Merge PR #203 (`[Week 2026-03-19] Converge issue #11 backend evidence path on main`) so durable backend docs stop splitting the canonical evidence lane across superseded follow-up threads.
2. Keep the current `owner:albatross` + `stream/review-burndown` planning sweep query as the only live planning cleanup lane instead of reviving older planning PR stacks.
3. Revisit PR #133 once the planning baseline is stable, then keep the canonical smoke evidence path anchored to issue #11 plus `docs/RUNTIME_EXECUTION_HANDOFF.md`.
4. Capture the next bounded QA smoke result directly on issue #11 so the backend packet, handoff docs, and live evidence thread stay in sync.
5. Treat older planning and formatter refresh branches as baseline history only unless new drift appears on `main`.

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
- M1 (2026-03-20): land issue #196 / PR #203, keep the live planning sweep query authoritative for remaining doc cleanup, and keep verify/award follow-through on PR #133 tied to the merged contract baseline.
- M2 (2026-03-27): hold the merged publish/match/commit/reveal/verify/award slice steady while backend and QA publish one canonical smoke evidence path through issue #11 and `docs/RUNTIME_EXECUTION_HANDOFF.md`.
- M3 (2026-04-03): stabilize verify/award/audit evidence and run executable smoke checks against the merged runtime baseline.
- M4 (2026-04-10): complete E2E coverage + audit/reputation hardening + security/compliance readiness review.
- M4 readiness also requires `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, and `docs/CLOSED_BETA_SECURITY_READINESS.md` so telemetry owners plus auth, secret-handling, and redaction follow-ons stay reviewable.
- Review `docs/PHASE1_BETA_READINESS_GATES.md` as the compact release-gate checklist for the remaining Phase 1 contract, QA, audit, and planning blockers.

Checkpoint status board:
- Review `docs/PHASE1_CHECKPOINT_BOARD.md` for milestone links, target owners, and checkpoint review prompts.
- Use `docs/PHASE1_EPIC_CHECKPOINT_TEMPLATE.md` when posting the weekly epic #2 checkpoint so the comment keeps the same Done/Blocked/Ready next/Validation evidence gaps shape plus owner handoff table.

## Phase 1 KPIs

- >= 95% successful validation rate for correctly signed `AgentBundle`.
- <= 3 seconds p95 candidate retrieval for standard task constraints.
- 100% task lifecycle transitions produce audit events.
- 0 reveal accepted without valid prior commit.
- PoMW decision output includes policy trace for all award decisions.
