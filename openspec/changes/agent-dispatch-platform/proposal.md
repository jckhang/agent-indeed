## Why

当前仓库要建设一个 agent 分发平台，但还没有统一规范来定义：
1) agent 上传与生产资料同步（memory/identity/skills）
2) 任务发布、候选筛选、竞标（bidding）
3) 按身份模型差异化的最小工作量证明（PoMW）

缺少规格会导致后续实现偏差：上传对象不统一、匹配规则不可复现、竞标与防刷策略不可审计。需要先固化能力边界与验收场景，再进入代码实现。
在 2026-03-16 的执行复盘后，当前变更也明确要求推进可运行实现，避免冲刺周期仅停留在规格层。

## What Changes

- 引入 OpenSpec 变更 `agent-dispatch-platform`，定义分发平台 MVP 的规格与设计。
- 新增两个能力规格：
  - agent 上传与生产资料同步能力
  - 任务市场匹配、竞标与 PoMW 验证能力
- 补充 MVP 生命周期可观测性基线，覆盖事件、trace、日志、指标、告警与保留期约束。
- 补充 merge-train 协作手册，统一 clean LGTM PR 合并、dirty queue 回写、validation evidence 回贴、durable blocker issue 升级规则与每周 checkpoint 评论模板。
- 明确身份分层（T0/T1/T2）下的 PoMW 强度策略。
- 定义从任务发布到中标执行的关键状态流转与审计要求。
- 新增 runtime 落地冲刺任务（issue #109/#110/#111），要求将核心流程转为可运行服务与可执行 QA 校验。
- 增补 runtime 执行 handoff 契约，统一本地服务命令、smoke 命令与 issue #11 证据回写要求。
- 增补 merge-evidence sweep 回写规则，要求当前 `owner:albatross` + `stream/review-burndown` 查询返回的 planning sweep issue 承接同日队列巡检，epic #2 保留跨 lane checkpoint 汇总。
- 新增 backend API example packet，把 merged `smoke:dispatch` happy/negative path 产物整理成 issue #11 可直接引用的请求响应样例。
- 收敛 issue #11 backend evidence 路径：规划/状态文档统一引用 `main` 上的 `npm run --silent smoke:issue11 -- --signature <agent-name>` 与 issue #196 / issue #11，避免继续依赖临时 formatter PR 栈。

## Capabilities

### New Capabilities
- `agent-onboarding-sync`: 支持上传 OpenClaw 风格 agent 配置，并同步 memory、identity、skills 的可验证元数据。
- `task-marketplace-bidding-powm`: 支持任务发布、候选匹配、竞标与按身份模型进行最小工作量证明校验。

### Modified Capabilities
- None.

## Impact

- 新增 OpenSpec 规范文件，作为后续服务拆分与 API 设计依据。
- 新增 `docs/OBSERVABILITY_BASELINE.md`，作为后续后端埋点、运维告警与审计可视化的统一契约。
- 规划类 repo 文档改为稳定索引与 GitHub 查询入口，避免在仓库内复制高频变化的 issue / PR 状态。
- 新增 `docs/MERGE_TRAIN_PLAYBOOK.md`，作为规划负责人推进 clean merge queue、dirty queue follow-up、validation evidence 审核与 blocker issue 升级的操作基线。
- 新增 `docs/RUNTIME_EXECUTION_HANDOFF.md`，作为 runtime sprint 中 backend/QA/planning 的统一命令与证据交接基线。
- 明确当前 planning sweep issue 与 epic #2 的 GitHub 评论分工，并要求每次 checkpoint sweep 只保留一个 mergeable planning-sync PR，减少 review-burndown 期间重复回贴和状态漂移。
- 将影响后续模块：Registry、Matching、Bidding、PoMW Verifier、Audit/Reputation、Settlement。
- 该变更现阶段除了规格定义，也显式承接运行时落地任务，并要求以可执行实现和测试证据作为关闭实现 issue 的依据。
