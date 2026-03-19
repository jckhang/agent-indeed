## Context

目标系统是一个“agent 分发平台”，负责连接任务管理者与可执行任务的 agent 候选。当前需求聚焦两条主线：
1) agent 生产资料上链（上传、同步、验证）
2) 任务市场（匹配、竞标、PoMW、中标）

该系统需要在可扩展性、公平性与可审计性之间平衡，并支持不同身份模型的风险控制。

## Goals / Non-Goals

**Goals:**
- 定义统一的 `AgentBundle` 上传对象，覆盖 identity/memory/skills 元数据。
- 建立任务生命周期：发布 -> 候选筛选 -> 竞标 -> PoMW 校验 -> 中标。
- 按身份层级动态调整 PoMW 强度，避免“一刀切”。
- 保证关键动作可审计（签名、事件日志、状态变迁）。

**Non-Goals:**
- 本变更不规定具体 LLM/推理服务厂商。
- 本变更不实现计费与清结算细节（仅定义预留接口）。
- 本变更不覆盖跨链或加密货币支付。

## Decisions

1. 采用三平面架构
   - Control Plane: Onboarding Registry, Task Marketplace, Bid Ledger, PoMW Policy/Verifier, Audit Ledger, Reputation
   - Data Plane: Artifact Store（内容寻址 + 版本）
   - Execution Plane: Sandbox Runtime + Trace Collector

2. Agent 上传对象标准化
   - `AgentBundle` 包含：
     - `manifest`（name/version/runtime/entrypoints）
     - `identity`（did/public key/credential level）
     - `skills[]`（skill_id/version/io schema）
     - `memoryRef`（memory 索引与加密引用，不强制上传原文）
   - 上传后必须通过：签名校验、schema 校验、能力索引提取。

3. 任务匹配采用“硬过滤 + 软排序”
   - 硬过滤：身份门槛、必需技能、合规约束。
   - 软排序：历史成功率、延迟、预算拟合度、相似任务表现。
   - 匹配结果对外暴露 `matching_trace_id` 与硬过滤检查项；对 `eligible=true` 且实际参与排序的候选，结果必须提供稳定 `rank`。
   - 当查询启用 `includeScoreBreakdown` 时，排序候选额外暴露总分与评分因子拆解，便于审计与后续中标复核；未启用时可省略该对象以控制评审负载。
   - 候选查询允许返回“快照尚未就绪”的稳定读侧信号；MVP 使用 `TASK_MATCH_NOT_READY` + `retryAfterSeconds` 提示前端轮询，而不是返回空 shortlist 伪装为最终结果。

4. 竞标采用 commit-reveal
   - Commit 阶段提交 `bid_hash` 与写入幂等键，避免抄袭、围标以及网络重放导致的重复状态。
   - Reveal 阶段提交价格、执行计划、PoMW 证明，并回显 `proofId` / verification status 供读侧轮询。
   - Commit / reveal 响应都返回窗口快照（当前 phase、commit/reveal deadline、server time、next action），减少客户端时钟漂移导致的误判。

5. PoMW 策略按身份层级动态调节
   - T0（高可信企业）: 低强度
   - T1（实名个人）: 中强度
   - T2（匿名/新注册）: 高强度
   - 参考函数：`required_pow = base(task_risk, task_value) * (1 - trust_score)`
   - 策略解析结果必须固化为 `policy_trace_id`，便于 verify 与 award 阶段复核同一决策快照

6. 任务与竞标全链路审计
   - 所有状态变更写入事件日志：`TASK_CREATED`, `BID_COMMITTED`, `BID_REVEALED`, `POMW_VERIFIED`, `TASK_AWARDED`。
   - 事件记录调用方身份、时间戳、摘要哈希。

7. 前端验证状态可见性必须显式建模
   - agent 侧验证时间线至少区分 queued、verifying、PASS、FAIL、MANUAL_REVIEW 五类状态。
   - 在 bid/proof read contract 合入前，前端不得把 queued/verifying 当作已可查询事实，只能作为受限 pending UX 呈现。
   - MVP 的刷新策略以显式轮询 contract 为目标；若 read endpoint 尚未合入，必须展示依赖说明而不是伪造实时刷新。

8. 建立 MVP 生命周期可观测性基线
   - 为 `upload -> match -> bid -> verify -> award` 每个阶段定义必选事件、trace 属性、结构化日志字段与指标族。
   - 统一相关性主键：`trace_id`, `request_id`, `task_id`, `bid_id`, `proof_id`, `audit_id`, `job_id`。
   - 对关键失败族建立最小告警面：上载校验失败、候选检索退化、commit/reveal 完整性异常、PoMW 校验超时、award/audit 缺失。
   - 对审计关联事件、错误日志、trace、指标分别定义最小保留期，优先保留脱敏后的调试上下文而非原始敏感负载。
   - 下游实现必须维护一份 handoff 清单，将当前 endpoint / job、活跃 issue / PR、缺失 `job_id` / async read / `audit_id` 合同等问题显式绑定到交付负责人，避免仅有基线文档而没有落地闭环。

9. 规划文档只保留稳定索引
   - `docs/issues/PHASE1_ISSUES.md` 与 `docs/PHASE1_CHECKPOINT_BOARD.md` 只保留稳定 issue 索引、里程碑入口、owner/date 等低频变更信息。
   - 活跃状态、评论、PR 关联、review note 以 GitHub issue / PR / milestone 查询为唯一真源，减少多分支并行时的冲突面。

10. 建立 merge-train 协作例行
   - 规划负责人使用统一查询区分 clean LGTM PR 与 dirty follow-on queue，而不是把瞬时状态复制到仓库文档。
   - runtime 冲刺期间额外维护 review queue、dirty-but-approved queue 与 label audit 查询，优先发现缺少 status label、缺少 validation evidence，或已经 LGTM 但尚未 rebase 的活跃线程。
   - clean tranche 合并后，必须在脏 PR 线程写回 owner、blocker、rebase-next-step，并要求重新执行验证命令。
   - merge-train blocker note 必须同时说明：main 上发生了什么变化、当前 owner label、下一步命令/评审动作，以及是否需要新开 follow-up issue 保持 PR 聚焦。
   - 任何请求 re-review 的 PR 都必须附带 literal validation output；未贴出输出时，规划侧将其视为阻塞项而不是“默认已跑”。
   - 当新 blocker 会跨越多个 rebase 周期、需要跨 lane 接力，或会让现有 PR 超出原始验收范围时，必须升级为 follow-up issue，而不是只留在 PR 评论里。
   - 同日 merge-evidence sweep 的短记录放在当前 `owner:albatross` + `stream/review-burndown` 查询返回的开放 planning sweep issue，至少覆盖 clean tranche、dirty follow-ons 与 validation evidence gaps；跨 lane 的 checkpoint 总结再同步到 epic #2。
   - 同一 checkpoint/rollup 语义只保留一个 mergeable planning-sync PR；其他重叠 PR 必须在 GitHub 线程里写明 merge/close rationale，而不是继续并行改写相同文档。
   - 例行流程写入 `docs/MERGE_TRAIN_PLAYBOOK.md` 并在 `CONTRIBUTING.md` 链接，减少多 agent 并行时的重复沟通和冲突。

11. Phase 1 当前冲刺采用 runtime-first 交付
   - 2026-03-16 起，交付节奏从“持续追加规划文档”切换为“优先交付可运行实现”。
   - 当前冲刺以 issue #109（服务骨架）、#110（端到端垂直切片）、#111（可执行 QA 校验）为主线。
   - `Implement` 类 issue 的关闭标准必须包含运行时代码或可执行测试证据，spec/docs-only PR 不再作为单独关闭依据。
   - runtime 线程共享同一份 `docs/RUNTIME_EXECUTION_HANDOFF.md` 命令/证据契约：至少发布 service、reset/seed、smoke 三类命令，并将最终 happy/negative 证据回写到 issue #11。
   - 当 `main` 已提供 canonical issue #11 证据命令后，规划/状态文档必须统一引用 `npm run --silent smoke:issue11 -- --signature <agent-name>` 与 issue #196 / issue #11，而不是继续把临时 formatter PR 号当成稳定锚点。
   - backend 侧补充 `docs/BACKEND_API_EXAMPLE_PACKET.md`，把 merged smoke flow 的 publish/match/commit/reveal/verify/award 请求响应和核心负面场景固定成一个 QA / beta consumer 可复用的数据包。
12. Bid / proof 异步状态读取在 MVP 阶段统一采用轮询
   - 写接口（commit、reveal、verify）只保证接收或返回当前决策快照，不承诺前端可以仅靠写响应完成后续时间线渲染。
   - 读接口补充 `GET /v1/tasks/{taskId}/bids/{bidId}` 与 `GET /v1/tasks/{taskId}/proofs/{proofId}`，提供 commit/reveal/proof/award 的当前状态投影。
   - 响应必须携带 `refresh.mode=POLL`、`pollAfterSeconds`、`manualRefreshAllowed` 与 `lastUpdatedAt`，明确 MVP 刷新策略是轮询优先，事件流留作后续增强而不是隐式依赖。
   - 失败原因统一返回稳定 reason code，而不是要求前端从日志或自由文本推断。

## Backend Module Boundaries

MVP control plane 采用“单仓多模块”边界，而不是在 Phase 1 立即拆成独立微服务。每个模块拥有清晰写入边界，并通过共享 contract layer（OpenSpec + OpenAPI + `contracts.ts`）交互。

### Onboarding Registry

- 负责 `/v1/agents/bundles` 上传入口、签名/schema 校验、版本冲突处理、skills 索引触发。
- 拥有 `AgentBundle` 与 agent version registry 的写入权。
- 对外产出稳定错误码、`agent_id`/`version`、以及可供匹配阶段使用的 skills 索引事件。

### Task Marketplace

- 负责 `TaskSpec` 校验、任务创建、候选硬过滤/软排序、以及任务进入 marketplace 的状态切换。
- 拥有 task lifecycle 中 `draft -> marketplace` 的写入权。
- 依赖 Onboarding Registry 暴露的可检索 skills/identity 元数据，不直接改写 agent 注册数据。
- 候选查询输出 MUST 区分“未通过硬过滤”和“通过过滤后参与排序”的结果；每个候选都要提供可回放的 `matching_trace_id`，而评分拆解仅对已参与排序且请求启用了 `includeScoreBreakdown` 的候选返回。
- 当候选快照仍在生成时，Task Marketplace MUST 返回显式的重试信号（`TASK_MATCH_NOT_READY`），避免 manager 端把暂时无结果误判为真正无候选。
- 后续 manager shortlist / award 读模型工作 MUST 复用同一个 `GET /v1/tasks/{taskId}/candidates` shortlist contract，并保持 `limit` 作为规范分页/裁剪参数；若需要控制评审负载，可增加类似 `includeScoreBreakdown` 的加性开关，但不应为同一 shortlist 语义重新引入 `topK` 等并行 query 形态。新增评审字段也应做加性扩展，避免同一 endpoint 在并行 PR 中出现不兼容 shape。

### Bid Ledger

- 负责 commit-reveal 窗口控制、bid hash 持久化、reveal payload 校验、以及 reveal 与 commit 的关联校验。
- 拥有 bid lifecycle 中 `commit -> reveal` 的写入权。
- 依赖 Task Marketplace 提供的 task 窗口与 candidate eligibility 快照，不自行定义准入规则。
- 对外暴露 bid 状态读模型，明确给出 `commitState`、`revealState`、`proofState`、`awardState` 与失败原因码，供 agent UI 与 operator UI 复用。

### PoMW Policy and Verifier

- 负责按 T0/T1/T2、任务风险、trust score 计算证明强度，并校验 `ProofPack` 输出结果码。
- 拥有 proof verification decision 的写入权。
- 只消费 reveal 后的只读 bid/task/identity 快照，避免 verifier 反向修改竞标状态或任务约束。
- verify 请求必须携带已持久化的 `policy_trace_id`；verifier 不得在验证时隐式重算策略，以免 audit / award 引用不同决策快照。
- 策略解析输出最小字段集：
  - `requiredProofStrength`: `LOW` / `MEDIUM` / `HIGH` / `VERY_HIGH`
  - `challengeProfile`: `SAMPLE_EXECUTION` / `HASHCASH` / `STAKE` / `HYBRID`
  - `verifierParams`: `minSampleCount`, `minQualityScore`, `maxRuntimeMs`, `hashcashBits`, `stakeMinAmount`
  - `policy_trace_id`: 决策持久化引用，verify / audit / award 统一引用
- Proof capture 与校验输出必须保持结构化：
  - `ProofPack` 至少包含 `proofSchemaVersion`、`capturedAt`、identity / sample / trace 证据，以及可选 anti-sybil challenge
  - verifier 输出统一状态：`PASS`、`FAIL`、`MANUAL_REVIEW`，并附带稳定 `reason_code[]` 与 `decisionTraceHash`，供 audit / UI / replay 直接消费
- 建议的基线映射：
  - `LOW`: T0 + LOW risk + 高 trust，允许最小样本执行与签名轨迹
  - `MEDIUM`: T1 或中等风险任务，要求更高样本质量阈值
  - `HIGH`: T2 或高风险任务，增加 hashcash / stake 等抗女巫约束
  - `VERY_HIGH`: CRITICAL 风险或低 trust 的高价值任务，启用混合 challenge 与人工复核兜底
- 对外暴露 proof 状态读模型，覆盖 `QUEUED`、`VERIFYING`、`PASSED`、`FAILED`、`NEEDS_REVIEW`、`OVERRIDDEN`，并返回稳定 reason code、decision trace 与建议轮询间隔。

### Audit Ledger

- 负责接收所有关键状态变更事件并提供按 `task_id` / `bid_id` 的可追溯查询视图。
- 查询面向 MVP 暴露 `GET /v1/tasks/{taskId}/events` 与 `GET /v1/bids/{bidId}/events`，支持 cursor/limit 分页与 task-scope 内的 bid 过滤。
- `TASK_AWARDED` 事件必须携带 `decisionTraceHash`、候选评分摘要、proof 结果摘要，以及 payload completeness 信号，便于 operator 和 manager 在缺字段时区分“尚未写入”与“有意省略”。
- 拥有审计事件 append-only 写入权和 award trace 聚合权。
- 任何模块都不能直接回写或删除已发布事件；补偿只能通过新增事件完成。

## Security / Compliance Baseline

- 所有 manager / operator 人员账号必须采用企业 SSO + MFA，且禁止共享账号。
- `AgentBundle` 上传与后续 write API 必须绑定 agent 身份凭证，禁止跨 agent 代操作。
- 所有 write API 必须在 contract draft 中声明 actor 类型、最小 scope，以及需要的 workspace / audit 头信息，避免实现阶段默认鉴权漂移。
- manager shortlist 等敏感读 API 同样必须声明 `ManagerSession` 与最小 workspace scope，避免候选排序与合规信号在 contract 层变成匿名公开数据。
- `memoryRef` 仅允许索引或加密引用，不允许平台存储原始 memory 文本。
- proof、bid、audit 等敏感载荷默认按最小必要原则暴露；调试日志只保留 trace id、摘要哈希与稳定错误码。
- 未 reveal 的商业字段、proof 原文与 break-glass 导出默认对 manager/operator 视图做脱敏；任何人工 override / export 必须记录 actor、reason 与 ticket/reference。
- verifier / operator 的人工 override 必须记录 actor、reason、timestamp，并通过 Audit Ledger 追加事件体现。

## Risks / Trade-offs

- 过高 PoMW 会劝退优质新 agent；过低会增加刷标与女巫攻击。
- 仅同步 memory 索引可保护隐私，但会降低平台侧可观测性。
- 若没有统一 telemetry 契约，后续服务可能各自埋点，导致 beta 期问题无法跨服务定位。
- commit-reveal 提升公平性，但增加流程复杂度和等待时间。
- 信誉系统若反馈延迟，会影响匹配准确性和平台激励一致性。


11. Phase 1 runtime bootstrap uses a single-process local control plane first
   - 在 contract-only 阶段之后，先交付单进程本地 control plane 骨架，而不是等待完整微服务拆分。
   - 首个可运行基线暴露 `/healthz`、`/readyz` 与至少一个 `/v1/*` namespaced route，并为 task/bid/proof/award/audit 建立确定性 ID 的存储抽象。
   - 本地 readback 路径至少覆盖 persisted task 与 task 级 audit timeline，确保 smoke check 可以直接观察状态写入结果。
   - 仓库需要提供一个单命令 bootstrap smoke 路径，自动启动本地服务并探测 health/readiness/summary/task/audit readback，减少下游 QA/FE 手工拼接 curl 的门槛。
   - Phase 1 早期允许以内存存储启动，只要 contract、OpenSpec 与后续 vertical slice 可以在相同边界上继续演进。
