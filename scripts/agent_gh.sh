#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/agent_gh.sh <agent-name> <gh-args...>

Examples:
  bash scripts/agent_gh.sh kestrel auth status
  bash scripts/agent_gh.sh kestrel pr create --fill
  bash scripts/agent_gh.sh kestrel pr comment 123 --body "Ack\n\n--kestrel"
EOF
}

if [[ $# -lt 2 ]]; then
  usage >&2
  exit 1
fi

agent_name="$1"
shift

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "This command must run inside a git repository." >&2
  exit 1
fi

gh_config_dir="$repo_root/workspace-$agent_name/memory/gh-config"
mkdir -p "$gh_config_dir"

exec env GH_CONFIG_DIR="$gh_config_dir" gh "$@"
