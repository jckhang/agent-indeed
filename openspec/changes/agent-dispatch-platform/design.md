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
   - Control Plane: Registry, Matching, Bidding, PoMW Policy, Reputation
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

4. 竞标采用 commit-reveal
   - Commit 阶段提交 `bid_hash`，避免抄袭与围标。
   - Reveal 阶段提交价格、执行计划、PoMW 证明。

5. PoMW 策略按身份层级动态调节
   - T0（高可信企业）: 低强度
   - T1（实名个人）: 中强度
   - T2（匿名/新注册）: 高强度
   - 参考函数：`required_pow = base(task_risk, task_value) * (1 - trust_score)`

6. 任务与竞标全链路审计
   - 所有状态变更写入事件日志：`TASK_CREATED`, `BID_COMMITTED`, `BID_REVEALED`, `POWM_VERIFIED`, `TASK_AWARDED`。
   - 事件记录调用方身份、时间戳、摘要哈希。

## Risks / Trade-offs

- 过高 PoMW 会劝退优质新 agent；过低会增加刷标与女巫攻击。
- 仅同步 memory 索引可保护隐私，但会降低平台侧可观测性。
- commit-reveal 提升公平性，但增加流程复杂度和等待时间。
- 信誉系统若反馈延迟，会影响匹配准确性和平台激励一致性。
