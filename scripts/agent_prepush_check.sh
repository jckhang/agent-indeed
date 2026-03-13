#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/agent_prepush_check.sh --agent-name <agent-name> --github-user <github-user> [--email <email>] [--skip-fetch]

Checks:
  - Current branch is not main and uses codex/ prefix.
  - Branch includes latest origin/main history (rebase requirement).
  - Worktree git user.name/user.email match expected identity.
  - gh account in workspace-<agent-name>/memory/gh-config matches expected user (if gh is installed/logged in).
EOF
}

agent_name=""
github_user=""
email=""
skip_fetch=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent-name)
      agent_name="${2:-}"
      shift 2
      ;;
    --github-user)
      github_user="${2:-}"
      shift 2
      ;;
    --email)
      email="${2:-}"
      shift 2
      ;;
    --skip-fetch)
      skip_fetch=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$agent_name" || -z "$github_user" ]]; then
  echo "Both --agent-name and --github-user are required." >&2
  usage >&2
  exit 1
fi

if [[ -z "$email" ]]; then
  email="${github_user}@users.noreply.github.com"
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "This command must run inside a git repository." >&2
  exit 1
fi

branch="$(git branch --show-current)"
failures=0

ok() {
  echo "[ok] $1"
}

fail() {
  echo "[fail] $1" >&2
  failures=$((failures + 1))
}

warn() {
  echo "[warn] $1" >&2
}

if [[ "$branch" == "main" ]]; then
  fail "Current branch is main; create/switch to a codex/<scope> branch first."
elif [[ "$branch" == codex/* ]]; then
  ok "Branch '$branch' uses codex/ prefix."
else
  fail "Branch '$branch' does not use codex/ prefix."
fi

if [[ "$skip_fetch" -eq 0 ]]; then
  ok "Fetching origin for latest baseline..."
  git fetch origin --prune >/dev/null
else
  warn "Skipping git fetch (--skip-fetch)."
fi

if git rev-parse --verify origin/main >/dev/null 2>&1; then
  if git merge-base --is-ancestor origin/main HEAD; then
    ok "Branch contains origin/main (rebased or merged baseline is current)."
  else
    fail "Branch does not contain latest origin/main. Run: git rebase origin/main"
  fi
else
  fail "origin/main not found. Check remote setup."
fi

actual_name="$(git config --worktree --get user.name || git config --get user.name || true)"
actual_email="$(git config --worktree --get user.email || git config --get user.email || true)"

if [[ "$actual_name" == "$github_user" ]]; then
  ok "git user.name matches expected account ($actual_name)."
else
  fail "git user.name is '$actual_name', expected '$github_user'."
fi

if [[ "$actual_email" == "$email" ]]; then
  ok "git user.email matches expected account ($actual_email)."
else
  fail "git user.email is '$actual_email', expected '$email'."
fi

if command -v gh >/dev/null 2>&1; then
  gh_config_dir="$repo_root/workspace-$agent_name/memory/gh-config"
  if GH_CONFIG_DIR="$gh_config_dir" gh auth status >/dev/null 2>&1; then
    gh_user="$(GH_CONFIG_DIR="$gh_config_dir" gh api user --jq .login 2>/dev/null || true)"
    if [[ "$gh_user" == "$github_user" ]]; then
      ok "gh user matches expected account ($gh_user)."
    else
      fail "gh user is '$gh_user', expected '$github_user' (config: $gh_config_dir)."
    fi
  else
    fail "gh is not logged in for this agent profile (config: $gh_config_dir)."
  fi
else
  warn "gh command not found; skipped PR/comment identity verification."
fi

if [[ "$failures" -gt 0 ]]; then
  echo ""
  echo "Pre-push guard failed with $failures issue(s)." >&2
  exit 1
fi

echo ""
echo "Pre-push guard passed."
