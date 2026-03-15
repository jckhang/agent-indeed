# Phase 1 Checkpoint Board

Last updated: 2026-03-16

This is the single review surface for milestone drift across the active execution-track Phase 1 issues and PRs.

## Checkpoint Summary

| Checkpoint | Target date | Checkpoint owner | Scope | Active issues | Active PRs | Status | Drift / next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1 Contract Freeze + Upload | 2026-03-20 | albatross-dev-agent + kestrel | Contract finalization, observability baseline, onboarding kickoff | None | #90 | On track | Issue #30 is closed, but PR #90 is still open as the last M1 kickoff/examples thread to land against the current onboarding baseline. |
| M2 Matching + Bidding Baseline | 2026-03-27 | kestrel + lanzhou-fe-agent | Candidate matching, commit-reveal APIs, manager console baseline | None | #55 | At risk | Issue #6 is closed, but PR #55 still gates the remaining M2 shortlist contract before downstream slices can treat the baseline as settled. |
| M3 Verify + Agent Flow | 2026-04-03 | kestrel + lanzhou-fe-agent | Verifier contract, agent workspace, bid/proof async status reads | #59 | #66, #83 | At risk | The manager and agent UI slices are merged, but durable verification/status semantics still depend on the open status-read and verifier contracts. |
| M4 Audit + Beta Readiness | 2026-04-10 | albatross-dev-agent + kestrel + QA | Audit trail, manager award reads, QA smoke pass, beta handoff docs | #10, #11, #80, #87 | #68, #82, #84, #92, #95, #96 | At risk | Audit/E2E follow-through (#10, #11), this planning-sync pass (#80 / PR #82), the next QA smoke pass (#87), and the still-open audit/QA handoff PRs keep M4 as the active convergence checkpoint. |

## Active P1 Issue Map

| Issue | Checkpoint | Target date | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| #59 `Define bid/proof status reads and async refresh contract` | M3 | 2026-04-03 | kestrel | in-review | Backed by PR #66 and remains the contract gate for durable agent-side refresh semantics. |
| #10 `Implement audit events and award decision trace` | M4 | 2026-04-10 | kestrel | in-review | PR #92 is now the active contract thread for the audit-event stream and award-trace work. |
| #11 `Add E2E tests and API examples for MVP flow` | M4 | 2026-04-10 | QA | blocked | Still depends on the open status/audit follow-ons plus the next smoke pass in issue #87 before the full MVP pack can be automated. |
| #80 `Refresh checkpoint board and roadmap mappings after M2/M3 merges` | M4 | 2026-04-10 | planning | in-review | Backed by PR #82 so the planning docs stay aligned with the actual merged and open queue. |
| #87 `Run QA smoke pass on next merged tranche` | M4 | 2026-04-10 | QA | ready-next | Uses PR #84 as the current smoke-matrix baseline while the remaining audit and QA handoff PRs converge. |

## Active P1 PR Map

| PR | Checkpoint | Why it belongs there | Review note |
| --- | --- | --- | --- |
| #90 `[P1-10] Finalize onboarding kickoff contract examples` | M1 | It is the remaining open M1 kickoff/examples slice and carries the onboarding examples needed for downstream implementation. | Keep examples aligned with the merged telemetry baseline and current API draft before merge. |
| #55 `[P1-04] Define candidate matching shortlist contract` | M2 | It anchors the shortlist/ranking contract that gates matching implementation and manager award-read wiring. | This remains the main M2 backend merge dependency. |
| #66 `Define bid/proof status polling contract` | M3 | It defines the async status model that keeps the verifier and agent console durable once verification is no longer synchronous. | Keep issue #59 open until merge and pair review with the remaining verifier work. |
| #83 `[P1-07] Define ProofPack verifier contract` | M3 | It is the canonical verifier/result contract that downstream UX and docs must follow. | Merge this before renaming shared verification enums anywhere else in the repo. |
| #68 `[P1-17] Define manager shortlist and award read-model contracts` | M4 | It defines the manager read models that award-readiness UI and QA checks depend on. | The linked issue is already closed, so keep review focused on contract drift rather than issue state. |
| #82 `[P1-27] Refresh checkpoint board and roadmap mappings after M2/M3 merges` | M4 | It reconciles the planning docs with the current merged and open checkpoint queue. | Merge after the board, roadmap, and issue backlog all reflect current GitHub state. |
| #84 `[P1-26] Draft MVP smoke matrix for merged manager/agent flows` | M4 | It documents the smoke matrix that issue #87 now uses as the validation baseline for the next merged tranche. | Keep the PR open only until the matrix language matches the current merged manager/agent slices and QA handoff. |
| #92 `[P1-08] Define audit event stream and award trace contracts` | M4 | It is the active backend contract thread for audit-event reads and award-trace payloads. | Keep it aligned with issue #10 so audit work does not drift from the live API draft. |
| #95 `[P1-30] Capture frontend data gaps after manager/agent UI merges` | M4 | It records the remaining manager/agent UI data dependencies that QA and backend owners still need to close. | The linked issue is closed, so merge once the documented gaps reflect the current open contracts and owners. |
| #96 `[P1-29] Draft MVP API example outline for QA handoff` | M4 | It packages the QA-facing API example outline needed for the next smoke and E2E handoff. | The linked issue is closed, so merge once the examples stay aligned with the still-open contract PRs. |

## Normalizations Applied

- Dropped merged PRs #50, #53, #56, #70, #73, #75, #76, #77, #78, and #81 from the active board so merged work is not still presented as in-flight.
- Dropped closed issues #6, #7, #8, #9, #30, #38, #43, #44, #58, #61, #62, #63, #64, #71, #72, #79, #93, and #94 from the active issue map so only genuinely open issue threads remain there.
- Added still-open PRs #92, #95, and #96 to the M4 tracking surface because their linked issues closed before the review threads did.
- Kept open issues #10, #11, #59, #80, and #87 visible because they are the remaining active GitHub issue threads tied to open M3/M4 work.
- Kept issue #57 (`P0-09`) as the historical source for the checkpoint-board workflow while this update refreshes current Phase 1 state.
