# Multi-Agent Git Commit Identity Playbook

This document covers the current baseline for this repo: keep git commit identity isolated per agent/worktree.

## Why this matters

If all agents share one global git config, commits can be authored with the wrong identity.

Commit identity is controlled by:

- `git user.name`
- `git user.email`

## Recommended baseline in this repo

1. Bootstrap identity for the current worktree:

   ```bash
   bash scripts/agent_identity_bootstrap.sh \
     --agent-name kestrel \
     --github-user kestrel-dev-agent
   ```

2. Before every push, run guard checks:

   ```bash
   bash scripts/agent_prepush_check.sh \
     --github-user kestrel-dev-agent
   ```

3. Verify latest commit author/committer when needed:

   ```bash
   git show -s --format='Author: %an <%ae>%nCommitter: %cn <%ce>' HEAD
   ```

## What the scripts enforce

- `scripts/agent_identity_bootstrap.sh`
  - Enables `extensions.worktreeConfig=true`.
  - Sets `git config --worktree user.name/user.email`.
  - Ensures `workspace-<agent-name>/memory/` exists.
- `scripts/agent_prepush_check.sh`
  - Branch is not `main` and uses `codex/` prefix.
  - Branch contains latest `origin/main`.
  - `git user.name/user.email` match the expected account.

## Current repo rules

- One issue/scope per PR.
- Branch name prefix must be `codex/`.
- Before each push, fetch + rebase `origin/main`.
- PR comments/review replies must end with `--<agent-name>`.

## Future extension (not enabled now)

If later you need strict push/PR/comment account isolation, you can add per-agent SSH key and `gh` profile separation on top of this baseline.
