## ADDED Requirements

### Requirement: Task Publication Must Include Matching Constraints

平台 MUST 要求任务发布时声明候选筛选所需约束（身份、技能、预算、SLA、风险级别）。

#### Scenario: Task with complete constraints enters marketplace
- **WHEN** manager 提交包含匹配约束的 `TaskSpec`
- **THEN** 任务进入可竞标状态并触发候选检索

### Requirement: Candidate Matching Must Apply Hard Filters Before Ranking

平台 MUST 先执行身份、技能、合规等硬过滤，再对剩余候选执行软排序。

#### Scenario: Candidate failing hard filters is excluded from ranked shortlist
- **WHEN** 候选 agent 不满足 `identityTierMin`、`requiredSkills` 或 `complianceTags`
- **THEN** 平台在匹配结果中将该候选标记为 `eligible=false`
- **AND** 平台不得为该候选生成排名名次

#### Scenario: Matching result exposes filter checks and ranking breakdown
- **WHEN** manager 查询任务的候选匹配结果
- **THEN** 平台返回 Top-N 候选列表
- **AND** 每个候选都包含硬过滤检查结果与 `matching_trace_id`
- **AND** `eligible=true` 的候选 MUST 携带排名名次，`eligible=false` 的候选不得伪造排名
- **AND** 如请求启用 `includeScoreBreakdown`，平台为已参与排序的候选返回总分与评分因子拆解；未启用时平台 MAY 省略该评分拆解对象

#### Scenario: Matching snapshot is still materializing
- **WHEN** manager 在任务刚发布后立即查询候选匹配结果
- **AND** 最新匹配快照尚未生成完成
- **THEN** 平台返回稳定错误码 `TASK_MATCH_NOT_READY`
- **AND** 响应 MUST 标记 `retryable=true`
- **AND** 响应 MAY 提供 `retryAfterSeconds` 作为轮询提示

#### Scenario: Downstream manager review work reuses the canonical shortlist contract
- **WHEN** 后续 manager shortlist / award 读模型工作继续扩展候选查询
- **THEN** 平台继续使用 `GET /v1/tasks/{taskId}/candidates` 作为候选 shortlist 的规范读取入口
- **AND** 查询参数继续沿用 `limit`，而不是为同一 shortlist 语义引入并行 `topK` 风格 contract
- **AND** 如需控制评审开销，平台 MAY 增加 `includeScoreBreakdown` 这类加性查询开关
- **AND** 额外评审字段必须通过现有 shortlist 响应做加性扩展，避免同一 endpoint 在并行 PR 中出现不兼容 shape

#### Scenario: Shortlist query projections do not rewrite the canonical snapshot
- **WHEN** manager 先以较小 `limit` 或 `includeScoreBreakdown=false` 查询 `GET /v1/tasks/{taskId}/candidates`
- **AND** 后续再以不同 `limit` / `includeScoreBreakdown` 组合重读同一 task 的 shortlist
- **THEN** 平台保持同一份已持久化 shortlist 快照作为 reveal / award / review 的共同基线
- **AND** `limit` 只裁剪当前响应中的 ranked shortlist 投影，而不是缩写或重排已持久化候选集
- **AND** `includeScoreBreakdown=false` 只影响当前响应是否回传评分拆解，不得让后续读取永久丢失评分字段

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

#### Scenario: Policy decision returns auditable verifier parameters
- **WHEN** 平台根据任务 `risk.level`、`risk.valueScore`、候选 `identityTier` 与 `trustScore` 解析 PoMW 策略
- **THEN** 平台返回 `requiredProofStrength`、挑战配置、最低样本质量阈值等 verifier 参数
- **AND** 平台为该决策持久化唯一 `policy_trace_id`
- **AND** 后续 proof 校验结果必须引用同一个 `policy_trace_id`

#### Scenario: Proof verification rejects unknown policy snapshot references
- **WHEN** agent 提交 proof 校验请求但未提供已持久化的 `policy_trace_id`
- **OR** 提供的 `policy_trace_id` 不属于当前 task 的策略快照
- **THEN** 平台拒绝校验请求并返回稳定错误
- **AND** 平台不得在 verify 阶段隐式重新解析 PoMW 策略

### Requirement: Bid And Proof Status Reads Must Be Deterministic

平台 MUST 提供稳定的 bid/proof 读模型，使 agent 与 operator 前端无需猜测隐藏状态或自行拼接写接口结果。

#### Scenario: Agent fetches bid status after reveal
- **WHEN** agent 使用 `task_id` 与 `bid_id` 查询竞标状态
- **THEN** 响应包含 `commitState`、`revealState`、`proofState`、`awardState`、稳定 failure reason codes、审计引用，以及当前刷新策略

#### Scenario: Operator fetches proof verification status
- **WHEN** operator 或 agent 使用 `task_id` 与 `proof_id` 查询 proof 状态
- **THEN** 响应包含验证阶段、reason codes、decision trace、最近更新时间，以及轮询建议

### Requirement: MVP Async Refresh Strategy Must Be Explicit

平台 MUST 在 MVP 阶段显式声明状态刷新策略，避免前端默认依赖未冻结的事件流。

#### Scenario: Status response declares polling contract
- **WHEN** 任一 bid/proof 状态读接口返回成功
- **THEN** 响应明确给出 `refresh.mode = POLL`、`pollAfterSeconds`、`manualRefreshAllowed` 与 `lastUpdatedAt`

#### Scenario: Event stream remains deferred in MVP
- **WHEN** 前端实现验证时间线或 proof 队列刷新
- **THEN** 平台文档将事件流视为后续增强，而不是当前必须存在的 contract

#### Scenario: Proof verification failure returns stable code
- **WHEN** 提交的 `ProofPack` 未满足任务要求的 PoMW 强度
- **THEN** 平台返回稳定验证错误码（`PROOF_VERIFY_FAILED` 或 `PROOF_VERIFY_NEEDS_REVIEW`）并附带可审计标识

### Requirement: Verification Status Visibility Must Stay Contract-Honest

平台 MUST 让 agent 能区分 queued、verifying 和终态验证结果，同时在 read contract 缺失时明确说明限制，而不是伪造后端已存在的字段。

#### Scenario: Pending verification is shown as dependency-bounded state
- **WHEN** reveal 已被接受，但 bid/proof status read contract 尚未合入
- **THEN** 前端只显示受限 pending 状态和依赖说明，不把 queued/verifying 呈现为已可查询的后端事实

#### Scenario: Terminal verification result maps to stable user-facing states
- **WHEN** proof 返回 `PASS`、`FAIL` 或 `MANUAL_REVIEW`
- **THEN** agent timeline 使用稳定终态文案渲染结果，并沿用可审计 reason code

#### Scenario: Proof verification status is explicit for downstream consumers
- **WHEN** verifier 完成一次 `ProofPack` 校验
- **THEN** 平台返回显式状态（`PASS`、`FAIL`、`MANUAL_REVIEW`）
- **AND** 平台返回 `policyTraceId`、`decisionTraceHash`、required/achieved difficulty，便于 UI、audit 与回放链路直接复用

#### Scenario: Proof verifier emits stable reason codes for replay and audit
- **WHEN** verifier 判定 proof 缺失、篡改、强度不足或需要人工复核
- **THEN** 平台返回稳定 `reason_code[]`
- **AND** `reason_code[]` 可直接映射到 operator 文案、审计事件和后续奖惩/信誉策略，而不依赖自由文本解析

#### Scenario: Proof capture metadata is mandatory for replay
- **WHEN** agent 提交 `ProofPack`
- **THEN** payload 必须包含 `proof_schema_version` 与 `captured_at`
- **AND** verifier、audit 与人工复核都可以基于同一份证据格式和采集时间回放

### Requirement: Award Decision Must Be Auditable

平台 MUST 记录中标决策依据并可追溯到候选评分与 PoMW 校验结果。

#### Scenario: Award event contains decision trace
- **WHEN** 平台完成中标决策
- **THEN** 审计日志中的 `TASK_AWARDED` 事件包含候选评分摘要、PoMW 结果摘要、`decisionTraceHash` 与决策时间戳

#### Scenario: Award command only succeeds after terminal PASS verification
- **WHEN** manager 对某个 task 提交 award command
- **THEN** 请求必须显式指定目标 `bid_id`
- **AND** 平台仅在该 bid 的 proof verification 已持久化为终态 `PASS` 时返回 `AWARDED`
- **AND** 若 verification 尚未完成或结果不是 `PASS`，平台返回稳定的 precondition error code 与审计引用，避免 award 与 verify 语义漂移

### Requirement: Audit Event Stream Must Be Queryable By Task And Bid

平台 MUST 暴露 append-only 审计事件流，支持按 `task_id` 和 `bid_id` 查询关键生命周期事件。

#### Scenario: Task audit query returns ordered lifecycle chain
- **WHEN** operator 以 `task_id` 查询审计时间线
- **THEN** 平台按 `occurredAt` 升序返回 `TASK_CREATED`、`BID_COMMITTED`、`BID_REVEALED`、`POMW_VERIFIED`、`TASK_AWARDED` 等事件
- **AND** 每条事件都包含 `eventId`、actor 身份、`auditId`、`traceHash` 和 completeness 信号

#### Scenario: Bid audit query narrows to one candidate path
- **WHEN** operator 以 `bid_id` 查询审计事件流
- **THEN** 平台仅返回与该 bid 相关的 commit、reveal、verify、award 事件
- **AND** `TASK_AWARDED` 事件附带候选评分摘要、proof 结果摘要与 `decisionTraceHash`

### Requirement: Manager Review Surfaces Must Preserve Shortlist Gaps And Award Blockers

平台 MUST 让 manager 侧候选评审与 award-ready 视图保留缺失字段、校验阻塞与依赖缺口，而不是因为后端字段未齐全就隐藏决策证据。

#### Scenario: Shortlist row remains visible when ranking evidence is partial
- **WHEN** manager 查看候选 shortlist，但部分评分维度、proof 状态或审计引用尚未返回
- **THEN** 系统仍保留该候选条目，并明确标记缺失字段或待补齐状态，而不是将候选静默过滤掉

#### Scenario: Award review exposes blocking reasons before command support is complete
- **WHEN** manager 打开某个 task 的 award-ready 视图，但任务阶段、proof 结果或 award command 依赖尚未满足
- **THEN** 系统展示当前 task/bid/proof 状态、阻塞原因以及待补齐依赖，使 manager 可以理解为何暂时不可 award

#### Scenario: Shortlist read keeps audit-linked review context additive to the canonical endpoint
- **WHEN** manager 通过 `GET /v1/tasks/{taskId}/candidates` 读取 shortlist
- **THEN** 响应继续沿用 canonical `limit` shortlist contract，并加性暴露 `missingDataStates`、`proofReadiness`、`shortlistAuditId` 与 `decisionTraceHash`

#### Scenario: Award command reuses audit refs for deterministic replay
- **WHEN** manager 提交 `POST /v1/tasks/{taskId}/award`
- **THEN** 请求必须携带 `idempotencyKey`、`shortlistAuditId` 与 `proofAuditId`
- **AND** 奖励读模型返回 `statusMessage`、proof 摘要、`decisionTraceHash` 与 handoff 状态，便于 UI/QA 复核

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

#### Scenario: Downstream implementation work is mapped to telemetry obligations
- **WHEN** 团队推进匹配、竞标、校验或审计等后续 issue / PR
- **THEN** 平台维护一份可审阅的 handoff 清单，明确每个活跃工作项必须补齐的事件、指标、trace 字段，以及仍阻塞观测接入的 `job_id` / async read / `audit_id` 等合同缺口

### Requirement: Sensitive Marketplace And Proof Data Must Respect Role And Phase Boundaries

平台 MUST 对竞标、proof 与审计读写面实施显式 actor scope 与脱敏边界，避免在闭测期泄露商业或敏感验证数据。

#### Scenario: Unrevealed bid content is redacted before reveal gate opens
- **WHEN** manager 或 operator 在 reveal deadline 之前查看 shortlist / bid 读模型
- **THEN** 平台只返回允许披露的状态摘要，不暴露价格、执行计划原文或 proof 引用

#### Scenario: Manual proof override requires privileged actor and rationale
- **WHEN** operator 使用人工 override 处理 proof 校验结果
- **THEN** 请求必须携带特权 actor 身份与 review reason
- **AND** 审计事件记录 actor、reason、ticket/reference 与时间戳


### Requirement: Runtime Control Plane Must Be Bootstrappable Locally

平台 MUST 提供一个可本地运行的 control-plane 基线，作为 Phase 1 从 contract 走向可执行 vertical slice 的起点。

#### Scenario: Local runtime exposes health, readiness, and namespaced API routes
- **WHEN** 开发者按仓库文档启动本地服务
- **THEN** 服务暴露 `/healthz` 与 `/readyz` 探针
- **AND** 服务至少暴露一个 `/v1/*` namespaced 路由用于 contract 对齐验证
- **AND** 至少一个 runtime route 支持把已持久化实体重新读回，便于 smoke check 与后续 vertical slice 接续
- **AND** runtime 提供 task 级别 audit readback，便于本地验证状态写入与事件时间线

#### Scenario: Repository exposes one-command bootstrap smoke verification
- **WHEN** 开发者执行仓库约定的本地 smoke 命令
- **THEN** 命令自动启动 runtime baseline 并串行探测 `/healthz`、`/readyz` 与一个 `/v1/*` 写读回路径
- **AND** 命令输出 task/audit readback 的结果摘要，便于 FE/QA 复用同一条本地验证路径

#### Scenario: Repository exposes one canonical issue #11 evidence export
- **WHEN** QA 或 planning 需要从 `main` 把 runnable backend 证据回贴到 issue #11
- **THEN** 仓库提供唯一的签名命令 `npm run --silent smoke:issue11 -- --signature <agent-name>`
- **AND** 该命令复用 merged dispatch smoke baseline，而不是引入第二条并行 smoke 路径
- **AND** 输出包含可直接粘贴的 Markdown 证据块、底层 smoke 命令、稳定 task/bid/proof/policy/audit 标识，以及指向 `docs/BACKEND_API_EXAMPLE_PACKET.md` 与 `docs/RUNTIME_EXECUTION_HANDOFF.md` 的 handoff 锚点

#### Scenario: Runtime storage abstractions cover core lifecycle entities
- **WHEN** 本地 control-plane 初始化存储层
- **THEN** 平台为 `task`、`bid`、`proof`、`award` 与 `audit` 建立明确的存储抽象
- **AND** 这些实体的基线 ID 生成规则保持确定性，便于测试与回放
