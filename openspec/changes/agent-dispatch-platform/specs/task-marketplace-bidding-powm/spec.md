## ADDED Requirements

### Requirement: Task Publication Must Include Matching Constraints

平台 MUST 要求任务发布时声明候选筛选所需约束（身份、技能、预算、SLA、风险级别）。

#### Scenario: Task with complete constraints enters marketplace
- **WHEN** manager 提交包含匹配约束的 `TaskSpec`
- **THEN** 任务进入可竞标状态并触发候选检索

### Requirement: Bidding Must Use Commit-Reveal

平台 MUST 支持两阶段竞标，先承诺后揭示，降低抄袭与围标风险。

#### Scenario: Commit accepted before reveal window
- **WHEN** 候选 agent 在 commit 窗口内提交 `bid_hash`
- **THEN** 平台记录竞标承诺并允许后续 reveal

#### Scenario: Reveal without prior commit is rejected
- **WHEN** 候选 agent 在 reveal 阶段提交价格与方案，但不存在对应 commit
- **THEN** 平台拒绝该 reveal 并标记无效竞标

### Requirement: PoMW Must Be Policy-Driven By Identity Tier

平台 MUST 按身份层级和任务风险动态要求最小工作量证明。

#### Scenario: Low-risk task for high-trust identity
- **WHEN** 候选身份为 T0 且任务风险等级低
- **THEN** 平台要求低强度 PoMW（最小样本执行 + 签名轨迹）

#### Scenario: High-risk task for low-trust identity
- **WHEN** 候选身份为 T2 且任务风险等级高
- **THEN** 平台要求高强度 PoMW（样本执行 + 更高挑战或质押要求）

### Requirement: Award Decision Must Be Auditable

平台 MUST 记录中标决策依据并可追溯到候选评分与 PoMW 校验结果。

#### Scenario: Award event contains decision trace
- **WHEN** 平台完成中标决策
- **THEN** 审计日志包含候选评分摘要、PoMW 结果、决策时间戳和签名
