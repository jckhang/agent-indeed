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
   - 匹配结果对外暴露 `matching_trace_id`、硬过滤检查项、以及评分因子拆解，便于审计与后续中标复核。

4. 竞标采用 commit-reveal
   - Commit 阶段提交 `bid_hash`，避免抄袭与围标。
   - Reveal 阶段提交价格、执行计划、PoMW 证明。

5. PoMW 策略按身份层级动态调节
   - T0（高可信企业）: 低强度
   - T1（实名个人）: 中强度
   - T2（匿名/新注册）: 高强度
   - 参考函数：`required_pow = base(task_risk, task_value) * (1 - trust_score)`

6. 任务与竞标全链路审计
   - 所有状态变更写入事件日志：`TASK_CREATED`, `BID_COMMITTED`, `BID_REVEALED`, `POMW_VERIFIED`, `TASK_AWARDED`。
   - 事件记录调用方身份、时间戳、摘要哈希。

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
- 候选查询输出 MUST 区分“未通过硬过滤”和“通过过滤后参与排序”的结果，并为每个候选提供可回放的 `matching_trace_id` 与评分拆解。

### Bid Ledger

- 负责 commit-reveal 窗口控制、bid hash 持久化、reveal payload 校验、以及 reveal 与 commit 的关联校验。
- 拥有 bid lifecycle 中 `commit -> reveal` 的写入权。
- 依赖 Task Marketplace 提供的 task 窗口与 candidate eligibility 快照，不自行定义准入规则。

### PoMW Policy and Verifier

- 负责按 T0/T1/T2、任务风险、trust score 计算证明强度，并校验 `ProofPack` 输出结果码。
- 拥有 proof verification decision 的写入权。
- 只消费 reveal 后的只读 bid/task/identity 快照，避免 verifier 反向修改竞标状态或任务约束。

### Audit Ledger

- 负责接收所有关键状态变更事件并提供按 `task_id` / `bid_id` 的可追溯查询视图。
- 拥有审计事件 append-only 写入权和 award trace 聚合权。
- 任何模块都不能直接回写或删除已发布事件；补偿只能通过新增事件完成。

## Security / Compliance Baseline

- 所有 manager / operator 人员账号必须采用企业 SSO + MFA，且禁止共享账号。
- `AgentBundle` 上传与后续 write API 必须绑定 agent 身份凭证，禁止跨 agent 代操作。
- `memoryRef` 仅允许索引或加密引用，不允许平台存储原始 memory 文本。
- proof、bid、audit 等敏感载荷默认按最小必要原则暴露；调试日志只保留 trace id、摘要哈希与稳定错误码。
- verifier / operator 的人工 override 必须记录 actor、reason、timestamp，并通过 Audit Ledger 追加事件体现。

## Risks / Trade-offs

- 过高 PoMW 会劝退优质新 agent；过低会增加刷标与女巫攻击。
- 仅同步 memory 索引可保护隐私，但会降低平台侧可观测性。
- commit-reveal 提升公平性，但增加流程复杂度和等待时间。
- 信誉系统若反馈延迟，会影响匹配准确性和平台激励一致性。
