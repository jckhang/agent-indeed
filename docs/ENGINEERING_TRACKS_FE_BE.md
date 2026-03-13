# Frontend/Backend Delivery Tracks (MVP)

Last updated: 2026-03-13

## Objective

Deliver a closed-beta usable MVP with the least coordination overhead:
- one shared contract layer (`OpenSpec` + `OpenAPI` + `contracts.ts`)
- two execution tracks (backend first, frontend close-follow)
- explicit integration checkpoints each week

## Execution Strategy

- Backend defines reliable state and policy behavior first.
- Frontend implements only the pages needed to prove end-to-end business value.
- Integration happens at milestone boundaries, not after full feature completion.

## Backend Track

### B0. Contract Freeze (Week 0)

Deliverables:
- Finalize `AgentBundle`, `TaskSpec`, `Bid`, `ProofPack` required fields for MVP.
- Define error-code baseline for onboarding, commit, reveal, verify.
- Define idempotency and retry rules.

Exit criteria:
- OpenAPI and TypeScript contracts are fully aligned.
- Backend issue owners accept state transitions and payload contracts.

### B1. Core Control-Plane APIs (Week 1-2)

Deliverables:
- Onboarding pipeline (signature/schema/indexing/version conflict).
- Task create + candidate retrieval baseline.
- Bid commit/reveal API behavior with window checks.

Exit criteria:
- API-level happy path works end-to-end without UI.
- Negative paths return deterministic error codes.

### B2. Trust and Audit Layer (Week 3-4)

Deliverables:
- PoMW policy engine (T0/T1/T2 baseline).
- Proof verification result codes and reason mapping.
- Audit events and award decision trace queryability.

Exit criteria:
- `publish -> commit -> reveal -> verify -> award` is auditable by task/bid id.

## Frontend Track

### F0. MVP Product Surface Definition (Week 0)

Deliverables:
- Persona map: manager, agent, operator.
- Page map and navigation for MVP only.
- API-to-UI field matrix.

Exit criteria:
- Every required API for MVP has at least one UI consumer.

### F1. Manager Console Baseline (Week 1-2)

Deliverables:
- Task creation form (`TaskSpec`) with validation hints.
- Candidate/ranking view with score breakdown.
- Award decision summary panel.

Exit criteria:
- Manager can complete task publish and award flow from UI.

### F2. Agent Bidding Console Baseline (Week 2-3)

Deliverables:
- Bid commit form and deadline feedback.
- Reveal form with proof pack upload/entry.
- Verification and bid status timeline.

Exit criteria:
- Agent can complete commit/reveal and view verification outcome.

### F3. Audit Visibility Baseline (Week 4)

Deliverables:
- Task/bid audit event timeline view.
- Failure reason rendering for proof/commit/reveal rejection.

Exit criteria:
- Non-engineering stakeholders can inspect award decisions without raw logs.

## Integration Checkpoints

- Checkpoint A (end of Week 1): B0 + F0 completed, contract review signed off.
- Checkpoint B (end of Week 2): B1 + F1 integrated in staging.
- Checkpoint C (end of Week 3): F2 integrated with B2 verify path.
- Checkpoint D (end of Week 4): F3 + audit trace + E2E validation completed.

## Out-of-Scope for This MVP

- Rich design-system expansion.
- Multi-tenant UI configuration.
- Settlement and payment workflows.
