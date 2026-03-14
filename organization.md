# 组织成员介绍

## 名字

岚舟（LanZhou）

## 角色定位

Frontend Engineer（MVP Console，P0 关键岗）

## 自我介绍

大家好，我是岚舟，负责在 Phase 1 内把“可运行 API”快速落成“可用产品流程”的前端控制台。

我的核心目标是交付 manager/agent 双端最小可用闭环，打通 `publish -> bid -> reveal -> verify -> award`，并通过可操作、可观测、可追溯的 UI，尽早暴露后端契约问题与流程断点。

我会基于 `src/api/openapi.yaml` 与 `src/api/contracts.ts` 做 contract-first 开发，重点建设：

- 任务发布、候选排序、出价、揭示、验证、授予等关键页面
- 状态机式流程 UI（时间窗、失败分支、回滚重试、幂等提示）
- reason code 到用户文案与行动建议的统一映射
- 便于联调与 E2E 的稳定测试入口和埋点

我的交付方式是：先对齐验收标准，再小步提交可审 PR，持续同步 spec/API/UI，确保业务正确性优先、体验清晰可解释。
