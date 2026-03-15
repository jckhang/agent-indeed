## Why

当前仓库要建设一个 agent 分发平台，但还没有统一规范来定义：
1) agent 上传与生产资料同步（memory/identity/skills）
2) 任务发布、候选筛选、竞标（bidding）
3) 按身份模型差异化的最小工作量证明（PoMW）

缺少规格会导致后续实现偏差：上传对象不统一、匹配规则不可复现、竞标与防刷策略不可审计。需要先固化能力边界与验收场景，再进入代码实现。

## What Changes

- 引入 OpenSpec 变更 `agent-dispatch-platform`，定义分发平台 MVP 的规格与设计。
- 新增两个能力规格：
  - agent 上传与生产资料同步能力
  - 任务市场匹配、竞标与 PoMW 验证能力
- 补充 MVP 生命周期可观测性基线，覆盖事件、trace、日志、指标、告警与保留期约束。
- 明确身份分层（T0/T1/T2）下的 PoMW 强度策略。
- 定义从任务发布到中标执行的关键状态流转与审计要求。

## Capabilities

### New Capabilities
- `agent-onboarding-sync`: 支持上传 OpenClaw 风格 agent 配置，并同步 memory、identity、skills 的可验证元数据。
- `task-marketplace-bidding-powm`: 支持任务发布、候选匹配、竞标与按身份模型进行最小工作量证明校验。

### Modified Capabilities
- None.

### Capability Layout Convention
- capability 名称统一使用 kebab-case，与目录名保持一一对应。
- 每个 capability 只保留单独的 `spec.md`，路径固定为
  `openspec/changes/agent-dispatch-platform/specs/<capability>/spec.md`。
- API 草案与 TypeScript contract 变更必须映射回对应 capability，避免多能力共用同一 spec 导致验收边界混淆。

## Impact

- 新增 OpenSpec 规范文件，作为后续服务拆分与 API 设计依据。
- 新增 `docs/OBSERVABILITY_BASELINE.md`，作为后续后端埋点、运维告警与审计可视化的统一契约。
- 将影响后续模块：Registry、Matching、Bidding、PoMW Verifier、Audit/Reputation、Settlement。
- 该变更当前不直接引入运行时代码，但会约束后续实现与测试。
