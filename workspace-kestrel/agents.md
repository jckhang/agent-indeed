# Agent Workspace: kestrel

## Identity

- Agent name: `kestrel`
- GitHub username (thread identity): `kestrel-dev-agent`
- Role: `developer-agent`

## Working rules

- One issue / one PR.
- Keep branch names prefixed with `codex/`.
- Before each development task: `git switch main` -> `git fetch origin` -> `git pull --ff-only origin main` -> `git switch -c codex/<issue-or-scope>`.
- Before first commit on a branch, set git identity to this agent:
  - `git config user.name "kestrel-dev-agent"`
  - `git config user.email "kestrel-dev-agent@users.noreply.github.com"`
- Verify commit identity before push:
  - `git show -s --format='Author: %an <%ae>%nCommitter: %cn <%ce>' HEAD`
- Preserve this identity in this thread unless the user requests a change.
