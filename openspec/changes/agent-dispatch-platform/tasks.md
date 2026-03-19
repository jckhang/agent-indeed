## 0. P0 协作与工程基线

- [x] 0.1 发布 `CONTRIBUTING.md`，明确 OpenSpec-first 协作流程与 PR 检查清单。
- [x] 0.2 输出 `docs/TECH_STACK.md`，沉淀当前技术栈盘点与缺口清单，并关联 issue 跟踪。
- [x] 0.3 输出 `docs/ARCHITECTURE_GAPS.md`，明确当前前后端与系统实现缺口。
- [x] 0.4 输出 `docs/ENGINEERING_TRACKS_FE_BE.md`，定义前后端最小可交付路线。
- [x] 0.5 输出 `docs/HR_HIRING_PLAN.md`，形成 MVP 人员缺口与招聘执行方案。
- [x] 0.6 输出 `docs/BACKEND_SERVICE_BOUNDARIES.md`，定义后端模块边界与所有权映射。
- [x] 0.7 收敛 `docs/issues/PHASE1_ISSUES.md` 与 `docs/PHASE1_CHECKPOINT_BOARD.md` 为稳定索引，改用 GitHub 查询承载高频 issue / PR 状态。
- [x] 0.8 输出 `docs/MVP_STATE_MODEL.md`，冻结 MVP 状态机与关键写入时序约束。
- [x] 0.9 输出 `docs/MERGE_TRAIN_PLAYBOOK.md`，统一 clean LGTM merge train、dirty queue 回写与 rebase 协作流程。

## 1. OpenSpec 基础落地

- [x] 1.1 完成 proposal/design/specs/tasks 四类工件并通过 `openspec validate`。
- [x] 1.2 建立 capability 命名约定与目录规范（kebab-case + 单能力单 spec）。

## 2. Agent 上传与同步 API 设计

- [x] 2.1 定义 `AgentBundle` schema（manifest/identity/skills/memoryRef）。
- [x] 2.2 设计上传校验流水线（签名、schema、能力索引、版本冲突处理）。
- [x] 2.3 定义上传失败错误码与可重试策略（见 `docs/ERROR_CODE_RETRY_POLICY.md`）。

## 3. 任务匹配与竞标流程设计

- [x] 3.1 定义 `TaskSpec` schema（预算、SLA、门槛、PoMW policy）。
- [x] 3.2 实现候选筛选策略（硬过滤 + 软排序）与评分字段。
- [x] 3.3 设计 commit-reveal 竞标接口与时序约束。

## 4. PoMW 与审计闭环

- [x] 4.1 定义身份层级（T0/T1/T2）和 PoMW 强度映射规则。
- [x] 4.2 定义 `ProofPack` 结构与验证结果状态码。
- [x] 4.3 规范审计事件模型并预留信誉回写接口。
- [x] 4.4 定义 MVP 生命周期可观测性基线（事件/trace/log/metric/retention/alerts）。
- [x] 4.5 输出闭测安全就绪清单，明确 auth/authz、secret handling、redaction 与 M4 go/no-go 门槛。

## 5. Runtime 落地冲刺（2026-03-16 起）

- [x] 5.1 落地可运行 control-plane service skeleton（issue #109），包含健康检查、基础配置与最小持久化抽象。
- [x] 5.2 打通可执行的 MVP 垂直路径（issue #110）：`publish -> match -> commit -> reveal -> verify -> award`，并持久化关键状态转移。
- [x] 5.3 将 smoke/E2E 文档矩阵转为可执行校验（issue #111），并把验证证据回写 issue #11。
- [x] 5.3.a 增加 QA contract-drift 回归校验（issue #120），自动比对 OpenAPI / TypeScript proof reason-code 与当前 runtime 路由基线，减少 review 期间的手工枚举漂移。
- [x] 5.4 输出前端 runtime 集成 tranche 与本地 runbook（issue #136），串联 manager publish / shortlist / award-readiness 与 agent commit / reveal / status-refresh 路径。
- [x] 5.5 收敛前端 runtime 文档队列（issue #145），把 wiring target、fixture pack 与 demo payload pack 合并进单一 mainline handoff。
- [x] 5.6 输出 `docs/RUNTIME_EXECUTION_HANDOFF.md`，统一 runtime sprint 的本地命令契约、证据包与 issue #11 回写规则。
- [x] 5.7 明确 issue #146 merge-evidence sweep 与 epic #2 checkpoint 的双轨回写规则，统一 clean tranche、dirty follow-on 与 validation evidence gap 的 GitHub 记录方式。
- [x] 5.8 完成前端 runtime consumer verification pass（issue #150），校准 task composer、shortlist/award、bid workspace、verification timeline 对当前 `main` runtime 字段与 fallback 语义的引用。
- [x] 5.9 跟进前端 consumer contract claim trim（issue #157），把 shortlist/award/bid/proof 读路径的 `main` 基线解释收敛到 OpenAPI/TS draft anchors，避免把 runtime 数据缺口误写成 contract 缺口。
- [x] 5.10 补充前端 consumer contract reviewer quick-check 锚点，给出 `origin/main` 的行号与 grep 校验命令，减少对已发布读路径的重复误判。
- [x] 5.11 输出 `docs/BACKEND_API_EXAMPLE_PACKET.md`，把 `smoke:issue11` 固化为 issue #11 / QA / beta consumer 可复用的规范证据入口，并明确其底层复用 merged `smoke:dispatch` 请求响应产物。
- [x] 5.11.1 刷新 beta-readiness / API handoff / roadmap-goal 文档，把 issue #11 规范证据入口的活跃 backend survivor 指向 issue `#196` / PR `#203` 与 live planning sweep query，避免继续引用旧 formatter / planning 分支。
- [x] 5.12 固化 shortlist 查询投影语义（issue #188），确保 `limit` / `includeScoreBreakdown` 只影响当前响应视图，不回写或裁剪已持久化 shortlist 快照。
- [x] 5.12 刷新 checkpoint / merge-train 模板，移除对已关闭 issue #146 的活跃 blocker 依赖，改用 live planning sweep 查询与 issue #11 证据线程。
- [x] 5.13 补充 issue #11 可直接复用的最小 SDK 片段与 smoke 标识符回写，确保 QA/beta consumer 不必从 PR 评论中手抄 `taskId` / `proofId` / `policyTraceId` / reason-code 证据。
- [x] 5.14 为 issue #186 收敛 planning sweep 规则：同一 checkpoint 只保留一个 mergeable planning-sync PR，并把 superseded PR 的 merge/close rationale 回写到 GitHub 线程。
