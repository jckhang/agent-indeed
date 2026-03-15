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
- **WHEN** 候选 agent 在 reveal 阶段提交价格、执行计划与 `ProofPack`，但不存在对应 commit
- **THEN** 平台拒绝该 reveal 并返回稳定前置条件错误码（`BID_REVEAL_COMMIT_NOT_FOUND`）

#### Scenario: Commit after deadline is rejected deterministically
- **WHEN** 候选 agent 在 commit deadline 之后提交 commit
- **THEN** 平台返回 `BID_COMMIT_WINDOW_CLOSED`，标记该错误为不可重试，并附带当前窗口快照

#### Scenario: Duplicate commit replays the recorded outcome
- **WHEN** 客户端重放同一 `bid_id` 与 `idempotencyKey` 的 commit 请求
- **THEN** 平台返回与首次提交一致的 commit 结果，而不会创建新的 bid 分叉

#### Scenario: Reveal response echoes proof tracking metadata
- **WHEN** reveal 请求通过 hash 校验并提交 `ProofPack`
- **THEN** 平台返回 `proofId`、验证状态和当前窗口快照，供客户端继续轮询 proof 结果

### Requirement: PoMW Must Be Policy-Driven By Identity Tier

平台 MUST 按身份层级和任务风险动态要求最小工作量证明。

#### Scenario: Low-risk task for high-trust identity
- **WHEN** 候选身份为 T0 且任务风险等级低
- **THEN** 平台要求低强度 PoMW（最小样本执行 + 签名轨迹）

#### Scenario: High-risk task for low-trust identity
- **WHEN** 候选身份为 T2 且任务风险等级高
- **THEN** 平台要求高强度 PoMW（样本执行 + 更高挑战或质押要求）

#### Scenario: Proof verification failure returns stable code
- **WHEN** 提交的 `ProofPack` 未满足任务要求的 PoMW 强度
- **THEN** 平台返回稳定验证错误码（`PROOF_VERIFY_FAILED` 或 `PROOF_VERIFY_NEEDS_REVIEW`）并附带可审计标识

#### Scenario: Proof verification status is explicit for downstream consumers
- **WHEN** verifier 完成一次 `ProofPack` 校验
- **THEN** 平台返回显式状态（`passed`、`failed`、`needs_review`）
- **AND** 平台返回 `policy_trace_id`、`decision_trace_id`、required/achieved difficulty，便于 UI、audit 与回放链路直接复用

#### Scenario: Proof verifier emits stable reason codes for replay and audit
- **WHEN** verifier 判定 proof 缺失、篡改、强度不足或需要人工复核
- **THEN** 平台返回稳定 `reason_code[]`
- **AND** `reason_code[]` 可直接映射到 operator 文案、审计事件和后续奖惩/信誉策略，而不依赖自由文本解析

### Requirement: Award Decision Must Be Auditable

平台 MUST 记录中标决策依据并可追溯到候选评分与 PoMW 校验结果。

#### Scenario: Award event contains decision trace
- **WHEN** 平台完成中标决策
- **THEN** 审计日志包含候选评分摘要、PoMW 结果、决策时间戳和签名

### Requirement: Retry and Idempotency Signals Must Be Explicit

平台 MUST 在失败响应中明确 `retryable` 信号，并为写操作提供可判定的幂等行为。

#### Scenario: Transport retry on bid commit preserves outcome
- **WHEN** 客户端因网络超时重试同一 `bid_id` 的 commit 请求
- **THEN** 平台返回与首次提交一致的最终状态（成功或重复），不产生额外状态分叉

### Requirement: MVP Lifecycle Telemetry Must Support Cross-Stage Diagnosis

平台 MUST 为 `upload -> match -> bid -> verify -> award` 的每个阶段定义最小事件、trace、日志、指标与相关性标识要求，以支持闭测期故障定位与审计回放。

#### Scenario: Critical lifecycle failure is traced across sync and async hops
- **WHEN** 任一阶段发生失败、重试或超时
- **THEN** 操作方可使用共享的 `trace_id`、业务标识（如 `task_id`/`bid_id`）以及稳定 `reason_code` 将 API、异步任务、审计事件和错误日志串联起来

#### Scenario: Award review can locate proof and ranking evidence
- **WHEN** 操作方回放一次中标决策
- **THEN** 相关事件和日志包含 `audit_id`、评分摘要、PoMW 结果码、阶段化时间戳以及触发回放/覆写的 `actor_type`，足以解释中标或拒绝原因
