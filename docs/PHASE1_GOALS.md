# Phase 1 Goals (MVP Foundation)

Timebox: 2026-03-13 to 2026-04-30

Prerequisite: P0 repository-readiness items (contribution workflow, tech stack baseline, architecture gap assessment, FE/BE track plan, and staffing plan) are tracked and actively prioritized.

## Objective

Ship the first usable agent dispatch loop for closed beta:

1. Agent can upload verifiable bundle.
2. Manager can publish task and get ranked candidates.
3. Candidates can bid with commit-reveal.
4. Platform can verify PoMW by identity-tier policy and award with audit trace.

## In Scope

### G1. Agent onboarding and sync

- `AgentBundle` schema finalized (`manifest`, `identity`, `skills`, `memoryRef`).
- Upload validation pipeline implemented (signature, schema, indexing, version conflict).
- Memory supports index/encrypted reference mode (no raw memory required).

### G2. Task publication and matching baseline

- `TaskSpec` schema finalized (budget, SLA, constraints, risk).
- Candidate retrieval with hard filters:
  - identity threshold
  - required skills
  - compliance flags
- Soft ranking baseline:
  - success rate
  - latency
  - budget fit
  - historical similarity

### G3. Bidding and PoMW baseline

- Commit-reveal bidding APIs available.
- Reveal rejected when no valid commit exists.
- `ProofPack` accepted and verified with T0/T1/T2 policy mapping.
- Agent bidding console baseline is captured in `docs/AGENT_BIDDING_CONSOLE_BASELINE.md` so commit/reveal, proof entry, and verification timeline acceptance criteria stay reviewable while bid/proof status reads are still backend follow-ups.

### G4. Audit and observability baseline

- Event types emitted:
  - `TASK_CREATED`
  - `BID_COMMITTED`
  - `BID_REVEALED`
  - `POMW_VERIFIED`
  - `TASK_AWARDED`
- Award decision includes score summary + proof result trace.

## Out of Scope (Phase 1)

- Full settlement/payment engine.
- Multi-chain or token economics.
- Advanced governance UI.
- Full autonomous runtime orchestration.

## Definition of Done

- OpenSpec change remains valid and synchronized with implementation.
- API draft and TypeScript contracts are consistent for `AgentBundle`, `TaskSpec`, `Bid`, `ProofPack`.
- End-to-end happy path + key negative paths are covered by automated tests.
- GitHub issues for Phase 1 epics/tasks are created and linked to this plan.
- Every active P1 issue/PR is mapped to an M1-M4 checkpoint in `docs/PHASE1_CHECKPOINT_BOARD.md` with an owner and target date.
- P0 baseline issues that block collaboration quality are closed or explicitly waived.
- FE/BE execution ownership and MVP hiring-critical roles are assigned or explicitly risk-accepted.
- Closed-beta auth, auditability, and sensitive-data guardrails are documented or explicitly risk-accepted.
