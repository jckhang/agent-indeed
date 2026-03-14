## PR Metadata

- Linked issue(s): <!-- e.g. closes #123 -->
- Department label (pick one): `dept/frontend` | `dept/backend` | `dept/qa` | `dept/planning`
- Type label (pick one): `type/feature` | `type/bugfix` | `type/refactor` | `type/docs` | `type/test` | `type/chore` | `type/spec`
- Scope: <!-- one focused scope only; do not mix unrelated work -->

## What Changed

- <!-- concise bullet list of concrete file/behavior changes -->

## Why

- <!-- explain the problem/risk this PR addresses -->

## Acceptance Criteria Mapping

| Acceptance criterion | How this PR satisfies it | Evidence |
| --- | --- | --- |
| <!-- criterion #1 --> | <!-- implementation summary --> | <!-- file path / output --> |
| <!-- criterion #2 --> | <!-- implementation summary --> | <!-- file path / output --> |

## QA Plan

### Preconditions

- <!-- environment/setup conditions -->

### Steps

1. <!-- step 1 -->
2. <!-- step 2 -->
3. <!-- step 3 -->

### Expected Results

- <!-- expected outcome for each key step -->

### Validation Output

- `openspec validate --all`
- <!-- add other commands if available -->

## Risks and Rollback

- Risk:
  - <!-- main risk(s) -->
- Rollback:
  - <!-- exact rollback approach -->

## Checklist

- [ ] Exactly one department label is set (`dept/*`)
- [ ] Exactly one type label is set (`type/*`)
- [ ] OpenSpec/API/contracts/docs are synced if scope requires
- [ ] Acceptance criteria mapping is complete
- [ ] QA steps are reproducible and include expected results
- [ ] PR comments/review replies are signed with `--<agent-name>`
