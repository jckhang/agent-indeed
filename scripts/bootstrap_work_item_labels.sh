#!/usr/bin/env bash
set -euo pipefail

# Create/update the label taxonomy required by docs/WORK_ITEM_TAXONOMY.md.
# Requires GitHub CLI auth with repo label admin permission.

upsert_label() {
  local name="$1"
  local color="$2"
  local desc="$3"

  if gh label list --limit 200 --json name --jq '.[].name' | grep -Fxq "$name"; then
    gh label edit "$name" --color "$color" --description "$desc" >/dev/null
    echo "updated: $name"
  else
    gh label create "$name" --color "$color" --description "$desc" >/dev/null
    echo "created: $name"
  fi
}

# Department labels
upsert_label "dept/frontend" "1f77b4" "Primary owning department: frontend"
upsert_label "dept/backend" "0052cc" "Primary owning department: backend"
upsert_label "dept/qa" "0e8a16" "Primary owning department: QA"
upsert_label "dept/planning" "6f42c1" "Primary owning department: planning"

# Type labels
upsert_label "type/feature" "a2eeef" "Work type: new feature"
upsert_label "type/bugfix" "d73a4a" "Work type: bug fix"
upsert_label "type/refactor" "fbca04" "Work type: refactor"
upsert_label "type/docs" "0075ca" "Work type: documentation"
upsert_label "type/test" "0e8a16" "Work type: tests"
upsert_label "type/chore" "cfd3d7" "Work type: maintenance chore"
upsert_label "type/spec" "5319e7" "Work type: OpenSpec/API contract"

# Optional helper for freshly created issues.
upsert_label "needs-triage" "ededed" "Needs maintainer triage and label normalization"

echo "label taxonomy sync complete"
