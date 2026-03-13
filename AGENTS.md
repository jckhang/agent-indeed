# Agent Collaboration Rules

## 1) One PR per development task

- In actual development, each agent must submit only one focused PR at a time.
- A PR must map to a single issue/scope and must not mix unrelated changes.
- If work is large, split by issue first, then deliver as multiple PRs.

## 2) Every developer agent needs a unique name

- Before starting work, each developer agent must pick a stable unique name (recommended: kebab-case).
- The name should be reused across commits, workspace folder, and internal notes.

## 3) Every developer agent needs its own workspace

- Each developer agent must create its own workspace directory as `workspace-<agent-name>/`.
- The workspace must contain:
  - `agents.md`: agent profile, current scope, and working conventions.
  - `memory/`: persistent notes, decisions, and temporary context.

Suggested structure:

```text
workspace-<agent-name>/
  agents.md
  memory/
```

## 4) Workspace isolation

- Do not edit or delete files in other agents' workspaces unless explicitly asked.
- Cross-agent collaboration should happen via PR review, issue comments, or documented handoff notes.

## 5) Mandatory branch start flow (before every development task)

- Before writing code, the agent must run this sequence:
  1. `git switch main`
  2. `git fetch origin`
  3. `git pull --ff-only origin main`
  4. `git switch -c codex/<issue-or-scope>`
- Development must start only after the new branch is created from the latest `main`.
