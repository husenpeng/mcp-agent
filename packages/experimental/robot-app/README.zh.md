---
description: "Tomato Rbot 组合包：robot 注册表、run 执行器、触发器、Remote 控制器、侧栏名册、规格编辑器，以及独立于工作区对话的对话界面。"
kind: "package-bundle"
---
# Robot App

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-app` 把 Tomato Rbot 作为一个可选 bundle 挂载：`@tomato/experimental-robot-local` 存储规格、robot 与 run；`@tomato/experimental-robot-runtime` 用每个 run 一个 Agent 执行排队中的 run，并记录该 run 的 Session；`@tomato/experimental-robot-triggers` 按 cron 与事件日程启动 run；`@tomato/experimental-robot-templates-marketing` 提供可聘用的营销模板；`@tomato/api-robot-controller` 通过 `robot` Remote 命名空间暴露注册表；`@tomato/client-ui-robot` 渲染机器人与模板的卡片网格、侧栏名册、基础/高级规格编辑器与 run 对话；`@tomato/experimental-tool-robot` 提供面向模型的 `robot_create` 工具；bundle 还会为创建会话注册内置的 `robot-creation` 技能。未添加该 bundle 的 profile 不变。

## 目录

- [使用本包](#use-this-package)
- [创建机器人](#create-a-robot)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

把 `@tomato/experimental-robot-app` 加入 profile 的 bundle 列表（或从官方可选 bundle 目录安装）。Host 行需要经由 `@tomato/storage-domain` 提供的存储后端、Agent 工厂、Session 投影注册表；cron 触发器还需要 `@tomato/schedule`。浏览器行只在 `ctx.robotRuns` 已挂载处渲染。

<a id="create-a-robot"></a>
## 创建机器人

手动创建时，规格编辑器默认打开「基础配置」：名称、描述、任务目标、成功标准。其余区块——定位与权限、触发器、预算、工具与限制、输入输出、记忆、Agent 间通信——都留在「高级配置」中，使用 `emptyRobotSpec()` 的通用默认值；编辑器会说明未修改的字段沿用这些默认值。

会话创建会在当前工作区新开一个会话，草稿中点名 `robot-creation` 技能。技能向用户询问同样的四项回答，汇总后调用 `robot_create`；工具发布规格并实例化，因此会话结束时机器人已出现在名册中。该技能随本 bundle 打包并注册为 bundled 技能，因此在任意工作区都可用，而不只限于本仓库。`robot_create` 要求存活的顶层 Agent，且当前回合包含人类消息。

在卡片网格中聘用模板时，会按页面语言从模板复制出一份归用户所有的规格并实例化；之后该机器人与其他机器人一样编辑和运行。

<a id="model-experience"></a>
## 模型体验

### 运行使命

#### 模型看到什么

每次运行的 Agent 会收到一个 `robot:mission` 系统提示区段，由规格中的使命、成功标准、停止条件与输出验收文本组成，并叠加允许/禁止工具限制与配置的权限预设。页面与 Remote 命名空间不添加其他模型可见输入。

#### Token 影响

每个 run 一个提示区段，大小由规格文本决定。

#### KV 缓存影响

同一修订内该区段稳定；新修订会改变前缀，下一次 run 从新的缓存开始。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- run 租约、预算、A2A 传输、审批、任务与记忆视图尚未实现。
- runtime 消费使命、工具限制、选中的技能、选中的 MCP 服务器、第一个工作区根与权限预设；记忆、沙箱、网络、数据等级、凭据与 agent-to-agent 字段会被存储但不被执行。
- MCP 服务器由部署以 `@tomato/mcp-client` 条目挂载；robot 只能选择部署已配置的服务器，runtime 不会自行启动。
- cron 与事件触发器可能启动计费的模型运行；因此该 bundle 为可选安装。
- `robot_create` 只收集四项基础字段；触发器、工具、权限、预算、记忆与 Agent 间通信设置仍需在编辑器里调整。

<a id="dev-note"></a>
### 开发备注

本包只负责组合：`cordis.patch.yml` 插入各功能行，且没有随产品提供的 profile 模板选择它，因此安装该 bundle 就是唯一的开启动作。页面行在缺少 Web Host 时不生效，且仅在 `ctx.robotRuns` 挂载时渲染；runtime 写入的 `robotRun` 投影让 run 的 Session 不出现在工作区会话列表中。
