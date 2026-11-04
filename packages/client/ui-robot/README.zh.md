---
description: "Tomato Rbot 页面：机器人与可聘用模板的卡片网格、左侧栏机器人名册、基础/高级规格编辑器、会话创建，以及独立于工作区对话的机器人对话界面。"
kind: "package-reference"
---
# Robot UI

[English](README.md) | 中文

## 概述

`@tomato/client-ui-robot` 是 Tomato Rbot 的浏览器插件。它注册 `robots` 主面板与侧边栏名册，默认展示已聘用 robot 与已注册模板的卡片网格，并通过绑定到 run Session 的 `SessionProvider` 渲染每次运行的详情：运行列表旁的状态条、指令、进度、结果，以及中断、纠正和停止控制。编辑器包含四项字段和一个高级标签页；保存时发布修订并创建新实例或重绑 robot。会话创建按钮会新开一个带内置 `robot-creation` 技能的会话。注册表状态与调用都经 `ctx.robotRuns`，插件本身不持有传输状态。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在与 `@tomato/api-robot-controller` 及 `@tomato/experimental-robot` provider 一同装配的浏览器组合中挂载本插件。它需要 `slots`、`locale`、`layout`、`robotRuns`、`sessions` 与 `uiWorkspace`。

手动创建时，编辑器默认打开「基础配置」：名称、描述、任务目标与成功标准。其余区块留在「高级配置」，使用 [`emptyRobotSpec()`](../../experimental/robot/src/spec.ts) 的通用默认值；两个标签页共用同一份草稿，若 provider 的 issue 落在基础路径之外，编辑器会自动切到高级页。高级列表字段是选择器：技能、工具、MCP 服务器、工作区根目录、数据等级、意图与已知 robot 名来自 `robot.capabilities` 与注册表，同时保留自由输入以填写本地没有来源的值；来源为空时只显示自由输入并说明该值的出处。新建机器人、以及规格未声明根目录的既有机器人，会以页面正在查看的工作区目录起步，因此保存后的机器人总会写明一个可检查的工作目录；招聘没有根目录的模板时会传入同一个目录。只有访问快照允许 `session/create` 时才显示会话创建；它通过 `uiWorkspace.startSession` 带上 robot-creation 引导语，新会话因此携带负责访谈并调用 `robot_create` 的技能。页面可从侧栏图标或 roster 行进入；点击行会打开 robot 页面并选中该 robot。

未选中 robot 时，页面显示卡片网格：搜索框匹配名称、描述和模板分类；「全部 / 运行中 / 空闲」筛选；用户的 robot 卡片显示状态、描述和运行次数；随后是已注册模板。选择「运行中」时隐藏模板。模板卡片上的加号按钮以当前语言调用 `hire` 并打开新 robot；聘用失败时，在网格下方显示错误信息。模板文案的语言回退规则与 Host 发布聘用时相同。卡片头像按 robot 首个可识别技能绘制角色图形——品牌、达人、素材，或某个平台的选品/数据洞察组合——其他 robot 回退到名称首字。

运行区分左右两栏。左栏按业务状态列出该 robot 的运行记录——包括暂停中的 `waiting`——并显示每次运行的指令预览，以及启动新运行的输入框；运行仍在进行时该输入框禁用并说明原因，因为每个 robot 只有一个执行槽位。右栏把选中的运行显示为一件任务：带「打断」「结束运行」与技术详情开关的状态条；启动这次运行的指令；由该 run Session 的 Chat 节点折叠成业务语言行的进展列表（读取文件、运行命令、检索资料、给出回答）；以及结果或失败详情。底部的补充输入框在运行进行中把纠正发进这次运行，运行暂停后同一个输入框改为继续。时间线经 `ctx.uiConversation.binding(sessionId).target('chat')` 读取该 Session 已注册的 Chat 快照；技术详情开关会展开工具名与原始参数，不需要第二个视图。页面只在 run 被选中期间以 `robotRun` 引用源保留该 Session，并在卸载时释放。如果该 Session 已从客户端会话目录中移除（Agent 结束，Host 收回该行），页面先拉取一次该目录再重试保留；仍然无法解析时，右栏照常显示运行状态、指令与结果，只在进展列表说明会话记录不可用，而不是让页面失败。

<a id="dev-note"></a>
## 开发备注

页面选择 store 投影为 `useRobotPage`，其中包括卡片网格的搜索文本和筛选状态；store 实例同时提供 PropsStore 的 `actions`。注册表数据是 `robotRuns` 快照，由整份 `robot.watch` 帧替换，名册与运行状态因此无需轮询即可收敛。工作区浏览器会排除摘要携带 `robotRun` 投影的 Session，该投影由 runtime 从 run 的日志记录写入。

<a id="model-experience"></a>
## 模型体验

### 运行使命

#### 模型看到什么

页面本身不添加任何内容。robot run 的模型看到的是 `@tomato/experimental-robot-runtime` 由规格中的使命、成功标准、停止条件与输出验收组装的 `robot:mission` 系统提示区段。

#### Token 影响

每个 run 一个提示区段，大小由编辑器写入的规格文本决定；页面自身不增加 token。

#### KV 缓存影响

同一修订内该区段稳定。发布并重绑新修订会改变提示前缀，下一次 run 从新的缓存开始。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 进展列表折叠 Chat 目标的节点，因此必须挂载 `@tomato/client-ui-chat`；时间线只读取它物化出的节点，不拥有这些定义。
- 技术详情开关保存在浏览器存储而非 profile 的设置里，所以另一个浏览器或清空 profile 后会回到业务语言。
- 运行详情还没有汇总 token 用量、花费与产出文件。
- 记忆、沙箱、网络、数据等级、凭据与 agent-to-agent 字段会被持久化，但 runtime 尚未执行；编辑器中标注了哪些字段会在运行时生效。
- 任务板、审批、A2A 传输与记忆视图尚未实现。
