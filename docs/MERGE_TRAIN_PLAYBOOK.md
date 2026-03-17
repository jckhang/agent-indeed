# Merge Train Playbook

Use this playbook when albatross is coordinating the active PR queue. It keeps live status in GitHub while making the merge/rebase routine explicit enough for handoffs.

## Goals

- Move clean LGTM PRs quickly without reopening stale planning-doc churn.
- Keep dirty follow-on PRs assigned, commented, and ready for their next rebase.
- Avoid copying volatile issue/PR state into repo docs when a GitHub query is a better source of truth.

## Queue queries

- Clean LGTM queue: [open clean LGTM PRs](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3ALGTM)
- Dirty queue: [open dirty PR candidates](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+-label%3ALGTM)
- Runtime review queue: [open runtime PRs in review](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+label%3A%22status%2Fin-review%22)
- Runtime label audit: [open ready-next runtime issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+label%3A%22status%2Fready-next%22)
- Runtime issue milestone audit: [runtime issues missing milestones](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+no%3Amilestone)
- Runtime PR milestone audit: [runtime PRs missing milestones](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+no%3Amilestone)
- Runtime PR priority audit: [runtime PRs missing priority](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3A%22stream%2Fruntime-execution%22+-label%3A%22priority%2FP0%22+-label%3A%22priority%2FP1%22)
- Planning lane: [owner:albatross issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+label%3A%22owner%3Aalbatross%22)
- Review-requested planning PRs: [owner:albatross PRs](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3A%22owner%3Aalbatross%22)

## Merge-train routine

1. Refresh `main` locally before touching any queue branch:
   - `git switch main`
   - `git fetch origin`
   - `git pull --ff-only origin main`
2. Inspect open PRs and separate them into:
   - clean tranche: `LGTM` + mergeable/clean
   - dirty follow-ons: conflict/rebase needed or blocked by review comments
3. Merge the clean tranche in dependency-aware order, re-pulling `main` after each merge if the next PR depends on the newly merged contract/docs baseline.
4. Before calling the queue clean, run the milestone/priority audit links and fix any missing `owner:*`, `priority/*`, `status/*`, `stream/*`, or milestone metadata on open runtime threads.
5. For every dirty follow-on PR, leave a signed thread note that states:
   - the owner label already carrying the follow-up
   - why the PR is blocked or dirty
   - the exact next step (`rebase origin/main`, rerun validation, or address the named review comment)
6. Only update repo docs when the planning structure changes. Do not copy day-to-day issue/PR state into `docs/issues/PHASE1_ISSUES.md` or `docs/PHASE1_CHECKPOINT_BOARD.md`.

## Validation gates

Before pushing any queue-fix branch:

- `openspec validate --all`
- `bash scripts/agent_prepush_check.sh --github-user <agent-github-user>`
- `git diff --check`

Before asking for merge or re-review on any active PR:

- paste the exact output for each validation command in the PR template or a signed follow-up comment
- if a command was intentionally skipped, say `not run: <reason>` so reviewers do not have to guess
- when a reviewer asks for evidence, treat that as a blocking queue item until the literal output is posted

When a PR rebase rewrites history, push with `git push --force-with-lease`.

## Signed comment template

```text
Merge-train update: <what changed on main>. `owner:<lane>` is already set; next step is to <rebase/fix action>, rerun <validation>, and keep this PR in the follow-on queue.

--<agent-name>
```

## Weekly checkpoint template

Use this on epic #2 at the end of the week (or mid-week if the queue meaningfully shifts):

```text
Checkpoint <YYYY-MM-DD>

Done
- <merged issue/PR and why it matters>

Blocked
- <issue/PR>: <current blocker + owner>

Ready next
- <issue/PR>: <next action + owner>

Validation evidence gaps
- <PR>: <missing output or guard still needed>

--<agent-name>
```
