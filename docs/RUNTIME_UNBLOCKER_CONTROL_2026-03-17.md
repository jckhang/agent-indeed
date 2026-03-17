# Runtime Unblocker Control (2026-03-17)

Issue anchor: [#137](https://github.com/jckhang/agent-indeed/issues/137)

This dated control note is the architecture lane's working contract for the 2026-03-17 to 2026-03-20 runtime push. It keeps the sprint centered on executable output and records the blocker owner for each active lane without turning the long-lived planning docs into a volatile status board.

## Decision rules

- Prefer runnable output over new design-only expansion.
- Treat review comments asking for literal validation output as blocking until the command output is posted in the PR thread or template.
- Keep runtime behavior behind the published OpenSpec/OpenAPI/contracts baseline; if runtime moves first, the PR is dirty until the contract set catches up.
- Leave superseded planning-only threads closed unless they unblock one of `#115`, `#127`, `#129`, or `#111`.

## Lane unblocker ledger

| Lane | Active weekly issue | Executable target this week | Current blocker snapshot | Next owner |
| --- | --- | --- | --- | --- |
| Planning | [#137](https://github.com/jckhang/agent-indeed/issues/137) | Keep runtime queue aligned to executable slices and prep the 2026-03-20 epic checkpoint | [PR #140](https://github.com/jckhang/agent-indeed/pull/140) is the active coordination thread and needs a refreshed blocker snapshot plus a clean rebase against the live queue (`#127` mergeable, `#129` blocked, `#133` conflicting, QA follow-through) | albatross-dev-agent |
| Backend | [#115](https://github.com/jckhang/agent-indeed/issues/115) | Keep the merged bootstrap baseline honest and finish the standalone `smoke:bootstrap` follow-up | [PR #129](https://github.com/jckhang/agent-indeed/pull/129) is still blocked because the branch conflicts with `origin/main` and the PR body still lacks pasted literal validation output for the smoke/test/OpenSpec/pre-push checks | kestrel |
| Backend | closed [#110](https://github.com/jckhang/agent-indeed/issues/110) follow-through | Land the publish -> match -> commit -> reveal -> verify -> award runtime path cleanly on top of merged `main` | [PR #127](https://github.com/jckhang/agent-indeed/pull/127) is now back on the latest `main`, carries fresh validation output from the 2026-03-17T13:04Z rebase, and is mergeable pending final queue movement | kestrel |
| Backend contract sync | closed [#110](https://github.com/jckhang/agent-indeed/issues/110) follow-through | Keep runtime adoption notes aligned with merged verify/award contracts | [PR #133](https://github.com/jckhang/agent-indeed/pull/133) is now conflicting and still needs its dependency notes refreshed to reflect merged PRs `#66` and `#68`; treat it as a live cleanup item, not a merge-ready reference | albatross-dev-agent |
| Frontend | closed [#136](https://github.com/jckhang/agent-indeed/issues/136) follow-through | Keep frontend runtime docs scoped to the merged runtime/API baseline | [PR #139](https://github.com/jckhang/agent-indeed/pull/139) merged on 2026-03-17 at 08:40Z, so the frontend lane is no longer an active blocker until a new runtime follow-on opens | lanzhou-fe-agent |
| QA | [#120](https://github.com/jckhang/agent-indeed/issues/120) / [#111](https://github.com/jckhang/agent-indeed/issues/111) | Turn smoke/E2E notes into executable checks against the real runtime | QA cannot close the weekly sweep until [PR #127](https://github.com/jckhang/agent-indeed/pull/127) and [PR #129](https://github.com/jckhang/agent-indeed/pull/129) settle on one reproducible local command path with posted evidence | avery |

## Design-only and deferred queue control

- Keep planning-only follow-ups [#106](https://github.com/jckhang/agent-indeed/issues/106), [#107](https://github.com/jckhang/agent-indeed/issues/107), and [#108](https://github.com/jckhang/agent-indeed/issues/108) closed during this runtime push unless a merged runtime PR proves a concrete reopen is required.
- Treat [PR #122](https://github.com/jckhang/agent-indeed/pull/122) as a merged-baseline reference point, not a reason to restart a new planning/doc stack.
- Keep frontend and QA docs slices tied to the currently merged runtime contract baseline; if a doc needs an unpublished endpoint, that is a blocker note, not a new planning deliverable.

## Daily control routine through Friday

1. Start from the runtime review queue and separate clean `LGTM` work from dirty follow-ons.
2. For each dirty PR, leave a signed note with one explicit next step: fix code drift, paste validation output, or rebase onto `origin/main`.
3. Re-check that the weekly lane issues still have one `owner:*`, one `dept/*`, one `type/*`, and one live status label.
4. Update epic [#2](https://github.com/jckhang/agent-indeed/issues/2) on 2026-03-20 using the checkpoint shape in `docs/PHASE1_CHECKPOINT_BOARD.md`.

## Friday checkpoint inputs

When posting the 2026-03-20 checkpoint on epic [#2](https://github.com/jckhang/agent-indeed/issues/2), cover these buckets:

- Done: merged runtime/bootstrap/frontend slices that changed the executable baseline
- Blocked: `#115`, `#127`, `#129`, `#111`, and any PR still missing validation evidence
- Ready next: one executable next step for frontend, backend, and QA
- Validation evidence gaps: every open runtime PR whose review thread still asks for pasted command output
