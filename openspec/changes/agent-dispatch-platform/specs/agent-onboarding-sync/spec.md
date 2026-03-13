## ADDED Requirements

### Requirement: Agent Bundle Upload Must Be Verifiable

平台 MUST 支持上传标准化 `AgentBundle`，并在入库前完成完整性与身份可验证检查。

#### Scenario: Valid signed bundle is accepted
- **WHEN** agent owner 提交包含 `manifest`, `identity`, `skills`, `memoryRef` 的 bundle，且签名有效
- **THEN** 平台接受上传并返回 `agent_id` 与 `version`

#### Scenario: Invalid signature is rejected
- **WHEN** 上传包签名校验失败
- **THEN** 平台拒绝入库并返回可审计错误码

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
