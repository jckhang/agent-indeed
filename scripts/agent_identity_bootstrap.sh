#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/agent_identity_bootstrap.sh --agent-name <agent-name> --github-user <github-user> [--email <email>]

What this does:
  1) Enables worktree-local git config.
  2) Sets git author/committer identity with git config --worktree.
  3) Ensures workspace-<agent-name>/memory exists.
  4) Prints current git author identity for verification.
EOF
}

agent_name=""
github_user=""
email=""

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

git config extensions.worktreeConfig true
git config --worktree user.name "$github_user"
git config --worktree user.email "$email"

workspace_memory_dir="$repo_root/workspace-$agent_name/memory"
mkdir -p "$workspace_memory_dir"

echo "[ok] Worktree git identity configured:"
echo "  user.name=$github_user"
echo "  user.email=$email"
echo "  config=$(git rev-parse --git-path config.worktree)"
echo "  author=$(git var GIT_AUTHOR_IDENT)"
echo "  workspace_memory_dir=$workspace_memory_dir"
