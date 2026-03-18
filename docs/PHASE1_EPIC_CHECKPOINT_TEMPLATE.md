# Phase 1 Epic Checkpoint Template

Use this template when posting the weekly checkpoint comment on epic
[#2](https://github.com/jckhang/agent-indeed/issues/2). Keep the live status in
GitHub issues and PRs; use this document only to make the checkpoint comment
consistent, owner-specific, and reviewable.

## Before posting

- Open the milestone links in `docs/PHASE1_CHECKPOINT_BOARD.md`.
- Run the metadata hygiene queries from `docs/PHASE1_CHECKPOINT_BOARD.md`.
- Open the current planning sweep issue from the `owner:albatross` + `stream/review-burndown` query so the checkpoint inherits the same-day clean tranche, dirty follow-on, and validation-gap notes.
- Open the current QA sweep issue from the `owner:avery` runtime-handoff query whenever contract-drift or smoke evidence changed that week.
- Pull the current runtime blocker snapshot from the dated control doc when one exists.
- Verify every blocker references a live issue or PR and the owner label already on that thread.

## Comment template

```md
## Phase 1 checkpoint (YYYY-MM-DD)

### Done
- Merged [PR #](https://github.com/jckhang/agent-indeed/pull/) because it changed the runnable baseline by ...
- Closed [issue #](https://github.com/jckhang/agent-indeed/issues/) after ...

### Blocked
- [issue/PR #](https://github.com/jckhang/agent-indeed/) - concrete blocker; current owner: `owner:*`; next unblock condition.
- [issue/PR #](https://github.com/jckhang/agent-indeed/) - concrete blocker; current owner: `owner:*`; next unblock condition.

### Ready next
- Frontend: [issue/PR #](https://github.com/jckhang/agent-indeed/) - next executable slice.
- Backend: [issue/PR #](https://github.com/jckhang/agent-indeed/) - next executable slice.
- QA: [issue/PR #](https://github.com/jckhang/agent-indeed/) - next executable slice.
- Planning: [issue/PR #](https://github.com/jckhang/agent-indeed/) - next executable slice.

### Validation evidence gaps
- [PR #](https://github.com/jckhang/agent-indeed/pull/) - missing literal output for `openspec validate --all` / diff check / pre-push guard.
- [PR #](https://github.com/jckhang/agent-indeed/pull/) - missing smoke/test evidence in the PR body.
- [PR #](https://github.com/jckhang/agent-indeed/pull/) - missing contract-drift guard output after a contract/doc sync change (for example `npm run check:contract-drift` when that branch defines it).

### Owner handoff for next week
| Lane | Owner | Must preserve | First next action |
| --- | --- | --- | --- |
| Frontend | `owner:lanzhou-fe-agent` | merged runtime/API baseline | ... |
| Backend | `owner:kestrel-dev-agent` | one documented local command path | ... |
| QA | `owner:avery` | executable happy/negative checks | ... |
| Planning | `owner:albatross` | milestone + blocker ledger alignment | ... |
```

## Writing rules

- Lead with merged or closed changes in `Done`; do not list work that is still in review.
- Every `Blocked` bullet must name one blocker, one owner, and one concrete next unblock condition.
- `Ready next` should describe executable slices only; defer design-only follow-ups unless they unblock the runtime path this week.
- `Validation evidence gaps` should call out the exact missing command output so reviewers know what to ask for next.
- When a checkpoint cites contract/doc convergence, prefer evidence already posted in the current QA sweep issue instead of paraphrasing enum or route state by hand.
- The owner handoff table should stay short enough to scan in GitHub without expanding code blocks.

## Minimum evidence checklist

Before posting, confirm the comment names:

- merged runtime slices that changed the baseline this week
- the current blocker for each active lane
- one next executable action for frontend, backend, QA, and planning
- any open PR still missing pasted validation output
- whether a contract/doc refresh also needs the branch-specific contract-drift guard evidence
