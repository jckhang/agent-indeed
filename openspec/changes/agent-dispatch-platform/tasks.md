## 0. P0 协作与工程基线

- [x] 0.1 发布 `CONTRIBUTING.md`，明确 OpenSpec-first 协作流程与 PR 检查清单。
- [x] 0.2 输出 `docs/TECH_STACK.md`，沉淀当前技术栈盘点与缺口清单，并关联 issue 跟踪。
- [x] 0.3 输出 `docs/ARCHITECTURE_GAPS.md`，明确当前前后端与系统实现缺口。
- [x] 0.4 输出 `docs/ENGINEERING_TRACKS_FE_BE.md`，定义前后端最小可交付路线。
- [x] 0.5 输出 `docs/HR_HIRING_PLAN.md`，形成 MVP 人员缺口与招聘执行方案。
- [x] 0.6 输出 `docs/BACKEND_SERVICE_BOUNDARIES.md`，定义后端模块边界与所有权映射。
- [x] 0.8 输出 `docs/MVP_STATE_MODEL.md`，冻结 MVP 状态机与关键写入时序约束。

## 1. OpenSpec 基础落地

- [ ] 1.1 完成 proposal/design/specs/tasks 四类工件并通过 `openspec validate`。
- [ ] 1.2 建立 capability 命名约定与目录规范（kebab-case + 单能力单 spec）。

## 2. Agent 上传与同步 API 设计

- [ ] 2.1 定义 `AgentBundle` schema（manifest/identity/skills/memoryRef）。
- [x] 2.2 设计上传校验流水线（签名、schema、能力索引、版本冲突处理）。
- [x] 2.3 定义上传失败错误码与可重试策略（见 `docs/ERROR_CODE_RETRY_POLICY.md`）。

## 3. 任务匹配与竞标流程设计

- [ ] 3.1 定义 `TaskSpec` schema（预算、SLA、门槛、PoMW policy）。
- [ ] 3.2 实现候选筛选策略（硬过滤 + 软排序）与评分字段。
- [x] 3.3 设计 commit-reveal 竞标接口与时序约束。

## 4. PoMW 与审计闭环

- [x] 4.1 定义身份层级（T0/T1/T2）和 PoMW 强度映射规则。
- [ ] 4.2 定义 `ProofPack` 结构与验证结果状态码。
- [ ] 4.3 规范审计事件模型并预留信誉回写接口。
- [x] 4.4 定义 MVP 生命周期可观测性基线（事件/trace/log/metric/retention/alerts）。
