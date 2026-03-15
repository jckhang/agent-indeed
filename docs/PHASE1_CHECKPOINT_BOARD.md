# Phase 1 Checkpoint Board

Last updated: 2026-03-15

This is the single review surface for milestone drift across active Phase 1 issues and PRs.

## Checkpoint Summary

| Checkpoint | Target date | Checkpoint owner | Scope | Active issues | Active PRs | Status | Drift / next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1 Contract Freeze + Upload | 2026-03-20 | albatross-dev-agent + kestrel | Contract finalization, observability baseline, onboarding kickoff | #30, #38 | #50 | On track | Finish PR #50 review, then start #30 from the merged contract baseline. |
| M2 Matching + Bidding Baseline | 2026-03-27 | kestrel + lanzhou-fe-agent | Candidate matching, commit-reveal APIs, manager console baseline | #6, #7, #43 | #53, #55 | At risk | Matching contract is in review, but commit-reveal work has not started and manager UI still depends on backend status/read details. |
| M3 Verify + Agent Flow | 2026-04-03 | kestrel + lanzhou-fe-agent | PoMW policy, verifier, agent console, bid/proof async status reads | #8, #9, #44, #59 | #56 | At risk | #56 is active, but verifier and policy slices are still unmerged and issue #59 remains queued behind them. |
| M4 Audit + Beta Readiness | 2026-04-10 | albatross-dev-agent + kestrel + QA | Audit trail, operator console, manager award reads, E2E pack | #10, #11, #58, #71, #72 | #77, #81 | At risk | Security readiness and telemetry handoff are both in review, but award/audit telemetry still depends on M2/M3 backend outputs and the pending award-read contract. |

## Active P1 Issue Map

| Issue | Checkpoint | Target date | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| #30 `Kestrel backend onboarding kickoff` | M1 | 2026-03-20 | kestrel | ready-next | Starts once the merged onboarding contract baseline is settled. |
| #38 `Define observability baseline for MVP lifecycle` | M1 | 2026-03-20 | albatross-dev-agent | in-review | Reopened because PR #50 is still active; keep issue open until merge for traceability. |
| #6 `Implement candidate matching baseline` | M2 | 2026-03-27 | kestrel | in-review | Backed by PR #55. |
| #7 `Implement commit-reveal bidding APIs` | M2 | 2026-03-27 | kestrel | ready-next | Immediate follow-on after shortlist/matching contract merge. |
| #43 `Build manager console baseline` | M2 | 2026-03-27 | lanzhou-fe-agent | in-review | Reopened because PR #53 is still active; manager award view depends on read-model/API follow-up. |
| #8 `Implement PoMW policy engine` | M3 | 2026-04-03 | kestrel | ready-next | Drives the verifier and status-read work behind it. |
| #9 `Implement ProofPack verifier and result codes` | M3 | 2026-04-03 | kestrel | blocked | Blocked on the policy baseline in #8. |
| #44 `Build agent bidding console baseline` | M3 | 2026-04-03 | lanzhou-fe-agent | in-review | Reopened because PR #56 is still active; async verification status remains a dependency. |
| #59 `Define bid/proof status reads and async refresh contract` | M3 | 2026-04-03 | kestrel | ready-next | Required to make PR #56 durable once verifier status becomes asynchronous. |
| #10 `Implement audit events and award decision trace` | M4 | 2026-04-10 | kestrel | blocked | Depends on M2 and M3 state/result contracts. |
| #11 `Add E2E tests and API examples for MVP flow` | M4 | 2026-04-10 | QA | blocked | No dedicated owner label exists yet; keep this visible as a staffing + sequencing risk. |
| #58 `Define manager shortlist and award read-model contracts` | M4 | 2026-04-10 | kestrel | ready-next | Unblocks the final manager award experience and keeps M2 UI work from drifting. |
| #71 `Track MVP telemetry implementation handoff` | M4 | 2026-04-10 | albatross-dev-agent | in-review | `docs/MVP_TELEMETRY_HANDOFF.md` now maps required emitters, contract gaps, and beta review checks for downstream work while PR #81 is still open. |
| #72 `Operationalize closed-beta security readiness checklist` | M4 | 2026-04-10 | albatross-dev-agent | in-review | Backed by PR #77; keep it open until the checklist, API security draft, and contract sync merge. |

## Active P1 PR Map

| PR | Checkpoint | Why it belongs there | Review note |
| --- | --- | --- | --- |
| #50 `Define MVP lifecycle observability baseline` | M1 | It defines cross-cutting telemetry contracts needed before downstream implementation slices diverge. | Keep issue #38 open until merge; validation evidence is already attached in the thread. |
| #53 `Build manager console baseline` | M2 | It is the frontend execution slice for task publish, shortlist review, and award summary. | Monitor for read-model contract gaps feeding into issue #58. |
| #55 `Define candidate matching shortlist contract` | M2 | It anchors the shortlist/ranking contract that gates matching implementation and manager UI wiring. | This is the main M2 backend merge dependency. |
| #56 `Build agent bidding console baseline` | M3 | It covers the agent commit/reveal loop that depends on verifier/status-read semantics. | Keep issue #44 open until merge and pair follow-up work with issue #59. |
| #81 `[P1-24] Track MVP telemetry implementation handoff` | M4 | It keeps the telemetry emitter rollout, gap list, and beta validation expectations reviewable while downstream implementation catches up. | Keep issue #71 open until merge so the beta-readiness dependency stays visible. |
| #77 `[P1-25] Operationalize closed-beta security readiness checklist` | M4 | It makes the beta auth/redaction checklist reviewable and syncs the current security draft back into the API/contracts docs. | Blocking API sync feedback has been addressed; watch for final review/merge. |
| #81 `[P1-24] Track MVP telemetry implementation handoff` | M4 | It keeps the telemetry emitter rollout, gap list, and beta validation expectations reviewable while downstream implementation catches up. | Keep issue #71 open until merge so the beta-readiness dependency stays visible. |

## Normalizations Applied

- Reopened issues #38, #43, and #44 because they were closed while their linked PRs (#50, #53, #56) were still active.
- Created GitHub milestones for M1-M4 and assigned every active P1 issue plus every open P1 PR to a checkpoint.
- Moved issue #57 (`P0-09`) to `owner:albatross` so planning execution stays with albatross instead of lan.
- Added issues #71/#72 and PR #81 to the M4 board so telemetry/security beta-readiness follow-ons stay visible alongside backend dependencies, while leaving merged issue #47 off the active list.
