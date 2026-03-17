# Phase 1 Checkpoint Guide

GitHub milestones, issues, and PRs are the source of truth for live checkpoint state.
This document keeps only the stable checkpoint structure and links to the live milestone views.

## Milestone review links

| Checkpoint | Target date | Owners | Live issues | Live PRs | Review focus |
| --- | --- | --- | --- | --- | --- |
| M1 Contract Freeze + Upload | 2026-03-20 | albatross-dev-agent + kestrel | [Milestone issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+milestone%3A%22M1+Contract+Freeze+%2B+Upload%22) | [Milestone PRs](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+milestone%3A%22M1+Contract+Freeze+%2B+Upload%22) | Contract convergence kickoff + runnable service bootstrap gate (#109, PR #90). |
| M2 Matching + Bidding Baseline | 2026-03-27 | kestrel + lanzhou-fe-agent | [Milestone issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+milestone%3A%22M2+Matching+%2B+Bidding+Baseline%22) | [Milestone PRs](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+milestone%3A%22M2+Matching+%2B+Bidding+Baseline%22) | Runnable publish/match/commit/reveal path plus merged proof/award reads and the collapsed frontend runtime handoff (#110, #136, #145). |
| M3 Verify + Agent Flow | 2026-04-03 | kestrel + lanzhou-fe-agent | [Milestone issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+milestone%3A%22M3+Verify+%2B+Agent+Flow%22) | [Milestone PRs](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+milestone%3A%22M3+Verify+%2B+Agent+Flow%22) | Verify/audit runtime durability plus executable QA conversion (#111, PR #83, PR #92). |
| M4 Audit + Beta Readiness | 2026-04-10 | albatross-dev-agent + kestrel + QA | [Milestone issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+milestone%3A%22M4+Audit+%2B+Beta+Readiness%22) | [Milestone PRs](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+milestone%3A%22M4+Audit+%2B+Beta+Readiness%22) | Final E2E evidence, audit trail sign-off, and security readiness closure (issue #11). |

## Metadata hygiene queries

Use these GitHub queries before a checkpoint comment so milestone views and runtime queue labels stay trustworthy:

- [Runtime issues missing milestones](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+no%3Amilestone)
- [Runtime PRs missing milestones](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+no%3Amilestone)
- [Runtime PRs missing priority](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+-label%3A%22priority%2FP0%22+-label%3A%22priority%2FP1%22)
- [Open planning issues without runtime scope](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22dept%2Fplanning%22+-label%3A%22stream%2Fruntime-execution%22)

## Weekly execution lane audit

Before posting the epic checkpoint, confirm each delivery lane still has one implementation-focused weekly issue with a runnable next step:

| Lane | Query | Expectation | Escalation if empty or stale |
| --- | --- | --- | --- |
| Backend | [owner:kestrel runtime issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22owner%3Akestrel%22+label%3A%22stream%2Fruntime-execution%22+label%3A%22status%2Fready-next%22) | One active weekly issue tied to service or API execution work. | Open or retitle a backend weekly issue before the checkpoint. |
| Frontend | [owner:lanzhou-fe-agent runtime issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22owner%3Alanzhou-fe-agent%22+label%3A%22stream%2Fruntime-execution%22+label%3A%22status%2Fready-next%22) | One active weekly issue tied to runtime consumer wiring or replay evidence. | Split a new frontend weekly issue instead of stretching a doc-only PR. |
| QA | [owner:avery runtime issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22owner%3Aavery%22+label%3A%22stream%2Fruntime-execution%22+label%3A%22status%2Fready-next%22) | One active weekly issue tied to executable smoke, E2E, or contract-drift checks. | Open a QA follow-up issue and note the missing runnable gate in epic #2. |
| Planning | [owner:albatross runtime issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22owner%3Aalbatross%22+label%3A%22stream%2Fruntime-execution%22+label%3A%22status%2Fready-next%22) | One active weekly issue tied to unblockers, merge-train hygiene, or checkpoint handoff. | Refresh the planning weekly issue so it points at concrete queue actions. |

If the planning-only query returns results, close, supersede, or defer those threads in GitHub before the checkpoint so the remaining open planning queue stays execution-biased.

## Runtime pivot anchors

Sprint pivot dated 2026-03-16 keeps these issue anchors as the default execution path:

- `#109`: runnable backend skeleton
- `#110`: runnable dispatch vertical slice
- `#111`: executable smoke/E2E conversion
- `#11`: blocked final E2E sign-off thread
- `#137`: architecture unblocker control for the 2026-03-20 runtime push (`docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md`)

## Review routine

1. Open milestone issue and PR links instead of editing status snapshots in-repo.
2. Use labels such as `status/ready-next`, `status/in-review`, and owner labels to decide next merge or rebase action.
3. Run the metadata hygiene queries and clear any missing milestone or priority gaps before posting the checkpoint.
4. Use `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md` for the dated owner/blocker ledger instead of copying that volatile table into this guide.
5. Run the active planning sweep query before the checkpoint comment so blocker notes, clean-order updates, and validation gaps all have a same-day GitHub trail.
6. Run the weekly execution lane audit and make sure each owner lane still has one runnable issue queued before posting the checkpoint.
6. Treat missing validation evidence in a PR body/comment as a real blocker, even when the code diff looks complete.
7. Capture only durable planning changes in repo docs; keep comments, review notes, and volatile state in GitHub threads.
8. If merge-train triage uncovers a new durable blocker, open or link a follow-up issue instead of adding a status snapshot here.

## When to edit this file

Edit this file only when one of these stable planning facts changes:
- milestone names or target dates
- milestone ownership
- checkpoint review focus
- the GitHub query shape we want teammates to use

Do not edit this file just to reflect day-to-day issue or PR movement.

## Epic checkpoint comment shape

When posting the weekly checkpoint comment on epic #2, keep it in GitHub, start from the same-day planning sweep query/comment thread, keep the queue state in links, and use four buckets:

- `Done`: merged items that changed the runtime baseline this week
- `Blocked`: active issue/PR plus the concrete blocker and current owner
- `Ready next`: the next executable slice queued for each lane, written as one line per owner (`backend`, `frontend`, `QA`, `planning`)
- `Validation evidence gaps`: any PR that still needs pasted command output before review can close

When a checkpoint calls out a blocker, prefer a GitHub issue or PR link plus the owner label already on that thread rather than copying queue snapshots into this document. Keep the shorter sweep ledger in the active planning sweep issue/comment thread, keep the broader checkpoint rollup on epic #2, and end the checkpoint with an owner-by-owner handoff sentence so Friday handoff work is obvious without reopening the full queue.
