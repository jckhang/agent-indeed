# Architecture Gap Assessment

Last updated: 2026-03-14

## Goal

Identify the smallest set of missing decisions that block delivery of the Phase 1 MVP loop:
`upload -> match -> bid -> verify -> award`.

## Current State Snapshot

- Product and capability boundaries are defined in OpenSpec.
- API object draft exists in `src/api/openapi.yaml` and `src/api/contracts.ts`.
- Implementation architecture (frontend, backend, data, operations) is not yet baseline-documented.

## Critical Gaps (P0/P1)

| Priority | Gap | Why it blocks delivery | Minimal output needed |
| --- | --- | --- | --- |
| P0 | Backend service boundaries are undefined | Teams cannot split execution ownership safely | Service map + ownership for onboarding, matching, bidding, proof, audit modules |
| P0 | Frontend MVP scope is undefined | No visible closed-beta flow for manager/agent roles | Page map + role journeys + endpoint wiring matrix |
| P0 | Data and state transition model is incomplete | Commit-reveal and PoMW decisions can become inconsistent | Task/bid/proof/audit state machine + write model |
| P1 | Error-code catalog and retry policy baseline is now documented, but endpoint adoption is incomplete | Integrations can still drift if new endpoints skip the shared error contract | Keep `docs/ERROR_CODE_RETRY_POLICY.md` synchronized with OpenAPI/contracts per change |
| P1 | Observability baseline is missing | Incidents cannot be diagnosed quickly in beta | Event schema + trace/log/metric baseline per flow stage |
| P1 | Security and compliance baseline is now documented, but enforcement work is still pending | High-risk tasks still need API, secret, and redaction controls before beta | Keep `docs/SECURITY_COMPLIANCE_BASELINE.md` synchronized with auth, audit, and operator implementation changes |

## Frontend-Specific Gaps

- Manager-side baseline is now documented in `docs/MANAGER_CONSOLE_BASELINE.md`, but candidate-read and award contracts are still missing.
- Agent-side bidding baseline is now documented in `docs/AGENT_BIDDING_CONSOLE_BASELINE.md`, but bid/proof read contracts are still missing.
- Operator audit timeline baseline is now documented in `docs/OPERATOR_AUDIT_TIMELINE_BASELINE.md`, but task-scoped event reads and completeness guarantees are still missing.
- No contract for sync/async updates (polling, event stream, or both).
- Commit/reveal/proof error codes are documented, but route-level UX mapping still needs to stay synchronized with backend responses.

## Backend-Specific Gaps

- Missing module boundaries and data ownership (registry, marketplace, verifier, audit).
- Missing write sequencing rules for commit/reveal windows and anti-race protections.
- Missing formal definition of PoMW policy evaluation inputs and outputs.
- Missing audit query model and storage retention baseline.

## 2-Week Stabilization Targets

1. Publish frontend and backend delivery tracks with milestone-level ownership.
2. Freeze minimal data/state model required for P1-01 to P1-09 implementation.
3. Produce staffing plan tied to the roadmap critical path.
4. Track all outputs through dedicated issues linked from `docs/issues/PHASE1_ISSUES.md`.
