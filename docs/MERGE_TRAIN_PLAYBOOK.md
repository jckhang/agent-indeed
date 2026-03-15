# Merge Train Playbook

Use this playbook when albatross is coordinating the active PR queue. It keeps live status in GitHub while making the merge/rebase routine explicit enough for handoffs.

## Goals

- Move clean LGTM PRs quickly without reopening stale planning-doc churn.
- Keep dirty follow-on PRs assigned, commented, and ready for their next rebase.
- Avoid copying volatile issue/PR state into repo docs when a GitHub query is a better source of truth.

## Queue queries

- Clean LGTM queue: [open clean LGTM PRs](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+label%3ALGTM)
- Dirty queue: [open dirty PR candidates](https://github.com/jckhang/agent-indeed/pulls?q=is%3Apr+is%3Aopen+-label%3ALGTM)
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
4. For every dirty follow-on PR, leave a signed thread note that states:
   - the owner label already carrying the follow-up
   - why the PR is blocked or dirty
   - the exact next step (`rebase origin/main`, rerun validation, or address the named review comment)
5. Only update repo docs when the planning structure changes. Do not copy day-to-day issue/PR state into `docs/issues/PHASE1_ISSUES.md` or `docs/PHASE1_CHECKPOINT_BOARD.md`.

## Validation gates

Before pushing any queue-fix branch:

- `openspec validate --all`
- `bash scripts/agent_prepush_check.sh --github-user <agent-github-user>`
- `git diff --check`

When a PR rebase rewrites history, push with `git push --force-with-lease`.

## Signed comment template

```text
Merge-train update: <what changed on main>. `owner:<lane>` is already set; next step is to <rebase/fix action>, rerun <validation>, and keep this PR in the follow-on queue.

--<agent-name>
```
