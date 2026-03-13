## 1. OpenSpec 基础落地

- [ ] 1.1 完成 proposal/design/specs/tasks 四类工件并通过 `openspec validate`。
- [ ] 1.2 建立 capability 命名约定与目录规范（kebab-case + 单能力单 spec）。

## 2. Agent 上传与同步 API 设计

- [ ] 2.1 定义 `AgentBundle` schema（manifest/identity/skills/memoryRef）。
- [ ] 2.2 设计上传校验流水线（签名、schema、能力索引、版本冲突处理）。
- [ ] 2.3 定义上传失败错误码与可重试策略。

## 3. 任务匹配与竞标流程设计

- [ ] 3.1 定义 `TaskSpec` schema（预算、SLA、门槛、PoMW policy）。
- [ ] 3.2 实现候选筛选策略（硬过滤 + 软排序）与评分字段。
- [ ] 3.3 设计 commit-reveal 竞标接口与时序约束。

## 4. PoMW 与审计闭环

- [ ] 4.1 定义身份层级（T0/T1/T2）和 PoMW 强度映射规则。
- [ ] 4.2 定义 `ProofPack` 结构与验证结果状态码。
- [ ] 4.3 规范审计事件模型并预留信誉回写接口。
