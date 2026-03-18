# Planning Reference Rules

Use this guide when updating roadmap, checkpoint, epic, merge-train, or QA handoff docs.

## Goal

Keep durable planning docs stable while GitHub issues, PRs, and review queues keep moving.

## Source hierarchy

1. Open issues and PRs are the source of truth for live execution state.
2. Milestone, label, and owner queries are the source of truth for same-day queue views.
3. Dated repo artifacts can preserve a closed review or QA snapshot when reviewers still need a stable baseline.
4. Roadmaps, checkpoint guides, and epic rollups should summarize durable state only.

## What counts as a live reference

Use these for active blockers, ready-next work, and merge sequencing:

- open issue links
- open PR links
- milestone queries
- owner/label queries
- current validation commands posted in a live PR or issue thread

## What counts as a closed baseline

Closed issues and merged PRs can still be cited, but only as one of these:

- merged baseline
- closed historical context
- original delivery thread for a durable artifact that still exists in-repo

When a closed thread leaves behind a durable artifact, prefer the artifact path over the closed issue number in ongoing planning docs.

Examples:

- cite `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md` as the retained contract snapshot after the originating QA sweep issue closes
- cite closed runtime implementation issues as merged baselines, not as active blockers

## Repo doc rules

- `docs/ROADMAP.md`, `docs/PHASE1_GOALS.md`, `docs/PHASE1_EPIC_STATUS.md`, and `docs/PHASE1_CHECKPOINT_BOARD.md` should point to active work plus stable merged baselines.
- `docs/MERGE_TRAIN_PLAYBOOK.md` should point queue state to GitHub sweeps and queries, not a closed umbrella issue.
- `docs/issues/PHASE1_ISSUES.md` should catalog durable issue links and stable ownership structure, not same-day queue commentary.
- Review-blocker details belong in PR comments, with signed replies and pasted validation output.

## Quick check before commit

Before you push a planning-doc change, confirm:

- every issue or PR named as active work is still open
- every closed issue is labeled as historical or merged baseline context
- every dated repo artifact cited as current still exists on `main`
- volatile queue sequencing stays in GitHub threads instead of repo docs
