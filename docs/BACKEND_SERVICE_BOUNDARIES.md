# Backend Service Boundaries (MVP Control Plane)

Last updated: 2026-03-14

## Objective

Define the minimum backend module split needed to deliver the closed-beta flow with clear ownership for:
`upload -> match -> bid -> verify -> award`

This baseline is intentionally module-first, not microservice-first. Phase 1 should keep one shared contract layer and separate write ownership before introducing distributed deployment complexity.

## Operating Principles

- Keep OpenSpec, `src/api/openapi.yaml`, and `src/api/contracts.ts` as the shared source of truth for cross-module payloads.
- Give each lifecycle transition a single writing owner; other modules consume read-only snapshots or emitted events.
- Prefer append-only audit publication over in-place mutation for cross-cutting visibility.
- Defer settlement, billing, and autonomous runtime orchestration to later phases.

## Module Map

| Module | Primary responsibility | Writes owned | Reads consumed | Public seam |
| --- | --- | --- | --- | --- |
| Onboarding Registry | Validate and register signed `AgentBundle` uploads | agent version registry, bundle validation outcome, skills index trigger | signature payload, schema metadata | `POST /v1/agents/bundles` |
| Task Marketplace | Validate `TaskSpec`, create tasks, and compute candidate eligibility/ranking | task records, marketplace visibility state, candidate score snapshot | agent registry projection, policy defaults | `POST /v1/tasks` and future candidate query surface |
| Bid Ledger | Enforce commit/reveal windows and persist bid commitments/reveals | bid commit record, reveal record, bid phase status | task window snapshot, candidate eligibility snapshot | `POST /v1/tasks/{taskId}/bids/commit`, `POST /v1/tasks/{taskId}/bids/reveal` |
| PoMW Policy and Verifier | Calculate required proof strength and verify `ProofPack` | policy decision trace, structured proof verification result | task risk/value, bidder identity tier, reveal payload | `POST /v1/tasks/{taskId}/proofs/verify` |
| Audit Ledger | Persist immutable lifecycle events and award decision trace | audit event stream, decision trace projection | event envelopes from all modules | append-only event contract and query surface |

## Flow Ownership

| MVP stage | Writing owner | Why this owner exists |
| --- | --- | --- |
| Upload | Onboarding Registry | Signature/schema/version handling must stay deterministic and isolated from marketplace logic. |
| Match | Task Marketplace | Candidate filtering and ranking depend on task constraints plus registry projections, not on bidding state. |
| Bid | Bid Ledger | Commit/reveal sequencing and anti-race controls need one module to own all bid phase transitions. |
| Verify | PoMW Policy and Verifier | Proof policy and result codes need one authority to avoid task or bid modules inventing inconsistent verdicts. |
| Award | Audit Ledger (decision trace publication) with Task Marketplace owning task award status | Marketplace owns task outcome, while Audit Ledger owns the immutable explanation trail. |

## Interface Seams

### Onboarding Registry -> Task Marketplace

- Published data:
  - normalized agent identity tier
  - discoverable skill metadata
  - accepted agent version/status
- Contract dependency:
  - `AgentBundle`
  - upload success/error responses
- Constraint:
  - Marketplace consumes a projection and must not read partially validated uploads.

### Task Marketplace -> Bid Ledger

- Published data:
  - task eligibility snapshot
  - bidding window boundaries
  - candidate shortlist or admission token
- Contract dependency:
  - `TaskSpec`
  - future task state and candidate score schemas
- Constraint:
  - Bid Ledger treats eligibility as immutable for a given bidding round to prevent commit/reveal races.

### Bid Ledger -> PoMW Policy and Verifier

- Published data:
  - committed hash
  - reveal payload
  - bidder identity and task snapshot
- Contract dependency:
  - `Bid`
  - `ProofPack`
- Constraint:
  - Verifier can reject or flag review, but it does not mutate bid contents; Bid Ledger records the phase result reference.
  - Verifier MUST reuse the persisted policy trace and return stable verification status / reason codes so later audit replay does not depend on free-text diagnostics.

### All modules -> Audit Ledger

- Published data:
  - event type
  - actor identity
  - entity id (`task_id`, `bid_id`, `agent_id`)
  - timestamp
  - content hash / trace id
- Contract dependency:
  - audit event envelope
  - award decision summary payload
- Constraint:
  - Events are append-only; corrections are represented as new events, never destructive edits.

## Shared Contract Dependencies

| Shared contract | Primary owner | Downstream consumers |
| --- | --- | --- |
| `AgentBundle` | Onboarding Registry | Task Marketplace, Audit Ledger |
| `TaskSpec` | Task Marketplace | Bid Ledger, PoMW Policy and Verifier, Audit Ledger |
| `Bid` | Bid Ledger | PoMW Policy and Verifier, Audit Ledger |
| `ProofPack` | PoMW Policy and Verifier | Audit Ledger |
| Audit decision/event payloads | Audit Ledger | Operators, analytics, future reputation hooks |

## Sequencing and Dependency Risks

1. Contract freeze risk
   - If `AgentBundle`, `TaskSpec`, `Bid`, or `ProofPack` change without coordinated updates in OpenSpec/OpenAPI/contracts, module boundaries become invalid.
   - Mitigation: keep spec and contract updates in the same PR whenever a boundary payload changes.

2. Eligibility drift risk
   - If Task Marketplace can change candidate eligibility after commits start, Bid Ledger may accept commits that cannot be revealed fairly.
   - Mitigation: publish an immutable bidding-round snapshot before the first commit is accepted.

3. Verifier side-effect risk
   - If proof verification directly changes task or bid records, failure handling becomes non-deterministic.
   - Mitigation: verifier emits a decision record; Bid Ledger and Task Marketplace apply their own follow-up transitions.

4. Audit gap risk
   - If modules treat audit as best-effort, award decisions become unverifiable.
   - Mitigation: require event emission as part of the write transaction boundary for commit, reveal, verify, and award decisions.

## Recommended Build Order

1. Onboarding Registry contract + validation (`#3`, `#4`)
2. Task Marketplace contract + publish behavior (`#5`)
3. Bid Ledger commit/reveal behavior (`#7`)
4. PoMW policy + verifier (`#8`, `#9`)
5. Audit Ledger event and award trace (`#10`)

This order matches the dependency chain: marketplace depends on registry projections, bidding depends on task snapshots, verifier depends on reveal artifacts, and audit depends on stable events from every upstream module.
