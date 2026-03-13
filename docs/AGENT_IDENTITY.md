# Multi-Agent GitHub Identity Playbook

This document explains how to keep **commit identity**, **push identity**, and **PR/comment identity** separated when multiple agents share one machine.

## Why this matters

If all agents share the same global git/gh setup, commit and PR metadata may appear under the wrong account.

Identity surfaces are different:

- Commit identity: controlled by `git user.name` and `git user.email`.
- PR/comment/review identity: controlled by the authenticated `gh` account (`GH_TOKEN` or `gh auth login` profile).
- Push identity: controlled by SSH key or token used for `git push`.

## Recommended baseline in this repo

1. Bootstrap identity for the current worktree:

   ```bash
   bash scripts/agent_identity_bootstrap.sh \
     --agent-name kestrel \
     --github-user kestrel-dev-agent
   ```

2. Login GitHub CLI for this agent profile:

   ```bash
   GH_CONFIG_DIR="$PWD/workspace-kestrel/memory/gh-config" gh auth login -h github.com
   ```

3. Use the wrapper for all PR/comment/review operations:

   ```bash
   bash scripts/agent_gh.sh kestrel pr create --fill
   bash scripts/agent_gh.sh kestrel pr comment 123 --body $'Done.\n\n--kestrel'
   ```

4. Run guard checks before every push:

   ```bash
   bash scripts/agent_prepush_check.sh \
     --agent-name kestrel \
     --github-user kestrel-dev-agent
   ```

## Strict per-account separation patterns

### Option A: Per-agent fork (recommended)

- Each agent GitHub account creates its own fork.
- Add a remote for that fork and push there.
- Open PR from `<agent-account>:codex/<branch>` to upstream `main`.

Pros:

- Clean author attribution.
- No shared push permissions required on upstream.

### Option B: Shared upstream with per-agent write access

- Add each agent account as upstream collaborator.
- Use per-agent SSH key + host alias.
- Push directly to upstream branch with that account key.

Pros:

- No fork sync overhead.

Trade-off:

- Requires upstream collaborator management.

## SSH host alias example

```sshconfig
Host github-kestrel
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_kestrel
  IdentitiesOnly yes
```

Then set remote URL:

```bash
git remote set-url origin git@github-kestrel:<owner>/<repo>.git
```

## Rules used in this repo

- One issue/scope per PR.
- Branch name prefix must be `codex/`.
- Before each push, fetch + rebase `origin/main`.
- PR comments/review replies must end with `--<agent-name>`.
