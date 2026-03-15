# Phase 1 Checkpoint Board

Last updated: 2026-03-15

This is the single review surface for milestone drift across the active execution-track Phase 1 issues and PRs.

## Checkpoint Summary

| Checkpoint | Target date | Checkpoint owner | Scope | Active issues | Active PRs | Status | Drift / next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1 Contract Freeze + Upload | 2026-03-20 | albatross-dev-agent + kestrel | Contract finalization, observability baseline, onboarding kickoff | #30 | #90 | On track | PR #90 is the remaining M1 delivery in review; keep the kickoff examples aligned with the merged observability baseline. |
| M2 Matching + Bidding Baseline | 2026-03-27 | kestrel + lanzhou-fe-agent | Candidate matching, commit-reveal APIs, manager console baseline | #6 | #55 | At risk | Matching contract work is still in review; downstream manager and agent UX must keep honoring the current shortlist contract until it merges. |
| M3 Verify + Agent Flow | 2026-04-03 | kestrel + lanzhou-fe-agent | Verifier contract, agent workspace, bid/proof async status reads | #9, #59, #63 | #66, #73, #76, #83 | At risk | PRs #73 and #76 keep the Lanzhou frontend slices moving, but durable verification/status semantics still depend on the open verifier and status-read contract work. |
| M4 Audit + Beta Readiness | 2026-04-10 | albatross-dev-agent + kestrel + QA | Audit trail, manager award reads, shortlist review, security readiness, QA smoke pass | #10, #11, #58, #62, #72 | #68, #77, #78, #84 | At risk | Manager award reads, auditability, and QA coverage are still blocked on open backend contracts, while security and shortlist follow-through remain in review. |

## Active P1 Issue Map

| Issue | Checkpoint | Target date | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| #30 `Kestrel backend onboarding kickoff` | M1 | 2026-03-20 | kestrel | in-review | Backed by PR #90 while the onboarding examples and pipeline draft finish converging. |
| #6 `Implement candidate matching baseline` | M2 | 2026-03-27 | kestrel | in-review | Backed by PR #55; this remains the main M2 backend merge dependency. |
| #9 `Implement ProofPack verifier and result codes` | M3 | 2026-04-03 | kestrel | blocked | Blocked on the final verifier contract shape and should stay aligned with PR #83. |
| #59 `Define bid/proof status reads and async refresh contract` | M3 | 2026-04-03 | kestrel | in-review | Backed by PR #66; this is the contract gate for refresh-safe verification UX. |
| #63 `Implement agent bid commit/reveal workspace UI` | M3 | 2026-04-03 | lanzhou-fe-agent | in-review | PR #76 carries the focused bid workspace slice while keeping async refresh assumptions tied to issue #59. |
| #10 `Implement audit events and award decision trace` | M4 | 2026-04-10 | kestrel | blocked | Depends on the M3 verification/result contract outputs plus final manager award reads. |
| #11 `Add E2E tests and API examples for MVP flow` | M4 | 2026-04-10 | QA | blocked | QA coverage stays gated on the open manager/agent read contracts and shortlist-to-award flow stability. |
| #58 `Define manager shortlist and award read-model contracts` | M4 | 2026-04-10 | kestrel | in-review | Backed by PR #68 and still the main contract dependency for manager shortlist/award follow-through. |
| #62 `Implement shortlist review and award-readiness UI slice` | M4 | 2026-04-10 | lanzhou-fe-agent | in-review | PR #78 keeps the shortlist/award-readiness follow-through visible while award execution remains backend-gated. |
| #72 `Operationalize closed-beta security readiness checklist` | M4 | 2026-04-10 | albatross-dev-agent | in-review | PR #77 keeps the auth/redaction checklist active while API and contract sync feedback lands. |

## Active P1 PR Map

| PR | Checkpoint | Why it belongs there | Review note |
| --- | --- | --- | --- |
| #90 `[P1-10] Finalize onboarding kickoff contract examples` | M1 | It is the remaining open M1 backend kickoff slice and carries the onboarding examples needed for downstream implementation. | Keep examples aligned with the merged telemetry baseline and the current API draft before merge. |
| #55 `[P1-04] Define candidate matching shortlist contract` | M2 | It anchors the shortlist/ranking contract that gates matching implementation and manager UI wiring. | This is still the main M2 backend merge dependency. |
| #66 `Define bid/proof status polling contract` | M3 | It defines the async proof-status read model needed for refresh-safe agent and operator flows. | Keep queued/verifying read fields honest until this contract lands. |
| #73 `[P1-22] Implement bid/proof verification timeline UX` | M3 | It documents the verification timeline slice that sits on top of the open status-read and verifier contract work. | Keep enum vocabulary aligned with the current API/contracts until PR #83 merges. |
| #76 `[P1-21] Implement agent bid commit/reveal workspace UI` | M3 | It narrows the next frontend delivery to one bid workspace while keeping async refresh scoped to the backend follow-up. | Keep issue #63 open until merge and track verification refresh against PR #66 / PR #83. |
| #83 `[P1-07] Define ProofPack verifier contract` | M3 | It is the canonical verifier/result contract that downstream UX and docs must follow. | Merge this before renaming shared verification enums anywhere else in the repo. |
| #68 `[P1-17] Define manager shortlist and award read-model contracts` | M4 | It defines the shortlist/award read contract that manager review and award-readiness UX depend on. | This is the main backend gate for PR #78 and the remaining manager follow-through. |
| #77 `[P1-25] Operationalize closed-beta security readiness checklist` | M4 | It keeps the beta auth/redaction checklist reviewable and syncs the security draft back into the API/contracts docs. | Blocking API sync feedback has been addressed; watch for final review and merge. |
| #78 `[P1-20] Implement shortlist review and award-readiness UI slice` | M4 | It isolates the post-publish manager review experience while keeping shortlist and award contract gaps visible. | Keep issue #62 open until merge and rebase as merge-train updates land. |
| #84 `[P1-26] Draft MVP smoke matrix for merged manager/agent flows` | M4 | It captures the QA smoke coverage needed once the manager and agent milestone slices start merging together. | Keep expected manager/agent checkpoints aligned with the latest merged frontend/backend contracts. |

## Normalizations Applied

- Removed merged PRs (`#50`, `#53`, `#56`, `#81`) from the active checkpoint tables so only currently open PRs appear here.
- Removed closed issues (`#7`, `#8`, `#38`, `#43`, `#44`, `#47`, `#61`, `#71`) from the active issue map to match current GitHub state.
- Kept the active Lanzhou frontend slices (`#62` / PR #78, `#63` / PR #76, PR #73) visible alongside their open backend contract dependencies.
