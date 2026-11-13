---
kind: upgrade-guide
description: "多智能体协作现在编排已发布的 Tomato Rbot 智能体：独立画布面板移除，每个成员必须绑定 Rbot，robot_crew_create 改为接收 Rbot 名称而不是可选规格 id。"
---

# Multi-agent collaboration orchestrates Rbot agents

[English](guide.md) | 中文

## 变更

`@tomato/client-ui-robot-crew` 现在只注册 `collab` 多智能体协作页；`crews` 协作画布面板及其可拖拽图已从包中移除。页面通过从已发布 Tomato Rbot 名单挑选成员、排序并串联交接来编辑协作；运行对话记录与共享设置仍在同一页。

协作规格随之变化：

| 变更前 | 变更后 | 含义 |
|---|---|---|
| `CrewNode.at`（`{x, y}`） | 移除 | 画布坐标不再属于已发布规格 |
| `CrewNode.robot` 可选 | 发布时必填 | `validateCrewSpec` 仍只做结构校验；`requireRobotMembers` 是新的发布规则 |
| `robot_crew_create` 成员的 `robotSpec` / `robotRevision` | 成员 `robot`（名称或规格 id）加可选 `robotRevision` | 工具解析已发布 Rbot，绝不新建 |

provider 在 `publish` 时同时应用两条规则：未绑定已发布 Rbot revision 的成员会带着字段路径被拒绝。规则发布之前保存的 revision 仍可打开并通过兼容路径运行，但在每个成员绑定 Rbot 之前不能重新发布。已存 JSON 中的画布坐标会被忽略。

## 迁移

1. 从布局、固定侧栏项或自动化中移除 `crews` 面板 key 的引用。`collab` key 与其标签不变；包不再注册第二个主面板。
2. 在**编辑**中打开每个已有协作，为每个成员绑定一个已发布 Rbot。显示**未绑定 Rbot**的成员必须在**保存**前修复；在此之前，旧发布仍可读取和运行。
3. 更新调用 `robot_crew_create` 的提示或集成：把成员可选的 `robotSpec`/`robotRevision` 组合替换为必填 `robot`（已发布 Rbot 的名称或规格 id），仅当要固定非最新 revision 时保留 `robotRevision`。未知名称会被拒绝并列出已发布名称，而不是发布一个空白智能体。
4. 不要在协作调用里创建 Rbot。先在 Tomato Rbot 创建智能体，再编排它们；工具绝不代写智能体的任务或能力。

验证：新协作在成员未绑定 Rbot 时无法保存；已有协作者仍出现在列表中且最近运行仍可打开；对话调用使用未知 `robot` 时会报告已发布 Rbot 名称。
