## ADDED Requirements

### Requirement: Agent Bundle Upload Must Be Verifiable

平台 MUST 支持上传标准化 `AgentBundle`，并在入库前完成完整性与身份可验证检查。

#### Scenario: Valid signed bundle is accepted
- **WHEN** agent owner 提交包含 `manifest`, `identity`, `skills`, `memoryRef` 的 bundle，且签名有效
- **THEN** 平台接受上传并返回 `agent_id` 与 `version`

#### Scenario: Invalid signature is rejected
- **WHEN** 上传包签名校验失败
- **THEN** 平台拒绝入库并返回可审计错误码（`AGENT_BUNDLE_SIGNATURE_INVALID` 或同类签名错误码）

#### Scenario: Invalid schema is rejected
- **WHEN** 上传包缺少必填字段、字段格式不合法，或 schema 版本不受支持
- **THEN** 平台拒绝入库并返回稳定 schema 错误码（`AGENT_BUNDLE_SCHEMA_INVALID` / `AGENT_BUNDLE_SCHEMA_UNSUPPORTED_VERSION`）与字段路径

### Requirement: Bundle Version Conflict Must Follow Deterministic Strategy

平台 MUST 对 `(agent_id, manifest.version)` 冲突采用确定性策略，避免重复上传产生不一致状态。

#### Scenario: Replayed upload with identical payload hash
- **WHEN** 同一 `agent_id` 与 `manifest.version` 已存在，且 `payload_hash` 一致
- **THEN** 平台返回已存在版本信息，并标记冲突策略 `RETURN_EXISTING_ON_HASH_MATCH`

#### Scenario: Duplicate version with different payload hash
- **WHEN** 同一 `agent_id` 与 `manifest.version` 已存在，但 `payload_hash` 不一致
- **THEN** 平台拒绝上传并返回 `AGENT_BUNDLE_VERSION_CONFLICT` 与策略 `REJECT_ON_HASH_MISMATCH`

#### Scenario: Upload replay with identical idempotency key is deterministic
- **WHEN** 客户端因网络抖动重试同一个 `idempotencyKey` 且 payload hash 不变
- **THEN** 平台返回稳定重放结果而不是创建新版本，并保证响应可用于幂等恢复

### Requirement: Onboarding Pipeline Must Publish Matching-Ready Skill Indexes

平台 MUST 在 bundle 被接受后同步生成 matching-ready 的 skill 索引记录，而不是要求下游模块重新解析原始 bundle。

#### Scenario: Accepted upload reports indexed skills
- **WHEN** bundle 通过签名、schema、版本冲突校验并被平台接受
- **THEN** 成功响应包含 `indexing.status = INDEXED`
- **AND** 成功响应回显 `indexing.indexedSkillCount`
- **AND** 成功响应列出每个被索引的 `skillId`、`version`、`sourceAgentId`、`sourceVersion`

### Requirement: Memory Synchronization Must Preserve Privacy Boundary

平台 MUST 支持 memory 的索引级同步，并允许原始 memory 保持在 agent 控制域内。

#### Scenario: Index-only memory sync
- **WHEN** 上传方仅提供 memory 摘要、向量索引引用或加密引用
- **THEN** 平台仍可完成候选匹配所需的能力检索，不要求原文入库

### Requirement: Skills Metadata Must Be Discoverable

平台 MUST 为每个 skill 建立可检索元数据，以支持任务匹配阶段的硬过滤。

#### Scenario: Skill metadata indexed on upload
- **WHEN** bundle 含有 skills 元数据（skill_id, version, io schema）
- **THEN** 平台将其纳入检索索引，供后续任务匹配使用
