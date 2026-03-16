# MVP GitHub Tracking Index

GitHub is the source of truth for live issue state, labels, comments, and PR linkage.
This file intentionally stays lightweight so we do not duplicate fast-changing issue/PR status in-repo.

## Quick links

- [All issues](https://github.com/jckhang/agent-indeed/issues)
- [Open P0 issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22priority%2FP0%22)
- [Open Phase 1 issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22priority%2FP1%22)
- [Ready-next issues](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+is%3Aopen+label%3A%22status%2Fready-next%22)
- [Planning lane](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+label%3A%22owner%3Aalbatross%22)
- [Backend lane](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+label%3A%22owner%3Akestrel%22)
- [Frontend lane](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+label%3A%22owner%3Alanzhou-fe-agent%22)
- [QA lane](https://github.com/jckhang/agent-indeed/issues?q=is%3Aissue+label%3A%22owner%3Aqa%22)

## Stable issue index

Use this as a durable lookup table from repo docs into GitHub issues. For acceptance criteria, live status,
review history, and linked PRs, open the GitHub issue directly.

### P0 readiness

- Epic: [#2](https://github.com/jckhang/agent-indeed/issues/2)
- P0-00 Repository baseline unblockers: [#14](https://github.com/jckhang/agent-indeed/issues/14)
- P0-01 Publish contribution workflow baseline: [#15](https://github.com/jckhang/agent-indeed/issues/15)
- P0-02 Publish repository tech stack baseline: [#16](https://github.com/jckhang/agent-indeed/issues/16)
- P0-03 Publish architecture gap assessment: [#21](https://github.com/jckhang/agent-indeed/issues/21)
- P0-04 Publish FE/BE execution tracks: [#22](https://github.com/jckhang/agent-indeed/issues/22)
- P0-05 Publish staffing and recruiting plan: [#23](https://github.com/jckhang/agent-indeed/issues/23)
- P0-06 Define backend service boundaries and ownership map: [#32](https://github.com/jckhang/agent-indeed/issues/32)
- P0-07 Define frontend MVP surface and API wiring matrix: [#33](https://github.com/jckhang/agent-indeed/issues/33)
- P0-08 Freeze MVP state model and write sequencing: [#34](https://github.com/jckhang/agent-indeed/issues/34)
- P0-09 Operationalize roadmap checkpoints as milestone/status board: [#57](https://github.com/jckhang/agent-indeed/issues/57)
- P0-10 Reduce repo-local issue/PR tracking churn: [#85](https://github.com/jckhang/agent-indeed/issues/85)
- P0-11 Run clean-PR merge train and rebase dirty queue: [#86](https://github.com/jckhang/agent-indeed/issues/86)

### Phase 1 delivery

- P1-01 Define AgentBundle contract and validation rules: [#3](https://github.com/jckhang/agent-indeed/issues/3)
- P1-02 Implement onboarding pipeline (signature/schema/index): [#4](https://github.com/jckhang/agent-indeed/issues/4)
- P1-03 Define TaskSpec and publish endpoint behavior: [#5](https://github.com/jckhang/agent-indeed/issues/5)
- P1-04 Implement candidate matching baseline: [#6](https://github.com/jckhang/agent-indeed/issues/6)
- P1-05 Implement commit-reveal bidding APIs: [#7](https://github.com/jckhang/agent-indeed/issues/7)
- P1-06 Implement PoMW policy engine: [#8](https://github.com/jckhang/agent-indeed/issues/8)
- P1-07 Implement ProofPack verifier and result codes: [#9](https://github.com/jckhang/agent-indeed/issues/9)
- P1-08 Implement audit events and award decision trace: [#10](https://github.com/jckhang/agent-indeed/issues/10)
- P1-09 Add E2E tests and API examples for MVP flow: [#11](https://github.com/jckhang/agent-indeed/issues/11)
- P1-11 Publish error-code catalog and retry/idempotency policy: [#37](https://github.com/jckhang/agent-indeed/issues/37)
- P1-12 Define observability baseline for MVP lifecycle: [#38](https://github.com/jckhang/agent-indeed/issues/38)
- P1-13 Define security and compliance baseline for closed beta: [#39](https://github.com/jckhang/agent-indeed/issues/39)
- P1-14 Build manager console baseline: [#43](https://github.com/jckhang/agent-indeed/issues/43)
- P1-15 Build agent bidding console baseline: [#44](https://github.com/jckhang/agent-indeed/issues/44)
- P1-16 Build audit visibility console baseline: [#47](https://github.com/jckhang/agent-indeed/issues/47)
- P1-17 Define manager shortlist and award read-model contracts: [#58](https://github.com/jckhang/agent-indeed/issues/58)
- P1-18 Define bid/proof status reads and async refresh contract: [#59](https://github.com/jckhang/agent-indeed/issues/59)
- P1-19 Implement manager task composer UI slice: [#61](https://github.com/jckhang/agent-indeed/issues/61)
- P1-20 Implement shortlist review and award-readiness UI slice: [#62](https://github.com/jckhang/agent-indeed/issues/62)
- P1-21 Implement agent bid commit/reveal workspace UI: [#63](https://github.com/jckhang/agent-indeed/issues/63)
- P1-22 Implement bid/proof verification timeline UX: [#64](https://github.com/jckhang/agent-indeed/issues/64)
- P1-23 Implement operator audit timeline and failure-state UI: [#65](https://github.com/jckhang/agent-indeed/issues/65)
- P1-24 Track MVP telemetry implementation handoff: [#71](https://github.com/jckhang/agent-indeed/issues/71)
- P1-25 Operationalize closed-beta security readiness checklist: [#72](https://github.com/jckhang/agent-indeed/issues/72)
- P1-26 Draft MVP smoke matrix for merged manager/agent flows: [#79](https://github.com/jckhang/agent-indeed/issues/79)
- P1-27 Refresh checkpoint board and roadmap mappings after M2/M3 merges: [#80](https://github.com/jckhang/agent-indeed/issues/80)

## Working rule

- Keep stable scope-to-issue links here.
- Do not copy live status, PR state, comments, or review notes into this file.
- When repo docs need current execution state, link a GitHub query or milestone instead of copying a volatile table.
