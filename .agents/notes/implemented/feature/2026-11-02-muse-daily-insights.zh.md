# Agent Note: Muse 每日洞察不写入 Session 事件

Status: implemented

[English](2026-11-02-muse-daily-insights.md) | 中文

## 问题

Muse 记忆保留了已陈述的偏好、决定和事实，却没有说明这个人今天做了什么、还留下什么未完成。这些答案分散在多个 Session 中，而记忆值上限为 1024 字节，画像记录还会进入每个新 Session。因此每日回顾不能是又一条记忆记录，也没有哪个 Session 拥有它的辅助模型请求。浏览器还需要一个位置展示简短提示并打开详情，同时不能把这个可选包变成发布依赖。

## 决定

`@tomato/experimental-muse-insights` 是一个实验性包，同时包含 Host 服务和浏览器侧。 [Muse 包](../../../../packages/experimental/muse-bundle/README.zh.md) 把它作为 `optional-muse-insights` 插入，因此开启记忆与目标专注也会开启回顾和未完成任务提醒；该包不增加模型工具。

Host 保留一个 `tomato_muse_insights` 存储域：每个所有者和本地日期一份回顾，加上该所有者最新的未完成任务分析。回顾只读取七天回看窗口内创建的顶层 Session 中、晚于当天已保留回顾的直接人类消息和助手文本，跳过 fork 继承前缀和子智能体会话，每次运行受 Session、消息和字节上限约束；每次运行如何把新证据并入当天回顾由[窗口化总结决策](../architecture/2026-11-09-muse-insights-windowed-summary.zh.md)负责。分析读取现有 `todos` 投影，把每个待开始或进行中的项视为任务，抑制被已完成待办命名的回顾文本，并合并最近一份回顾的 `openTasks`。所有者解析与记忆一致：网关提供账号时使用 `account:<id>`，否则使用 `local`；无人登录时不可访问。

回顾模型请求是辅助请求，不属于任何 Session。它的精确系统指令、框定后的用户输入、输出上限、路由和已接受响应文本与回顾一起存储，这才让模型可见输入无需虚构 Session 也能重建。路由是显式的 `provider`/`model` 对，默认使用部署的 `blueai` 网关模型；两者都不提供的直接调用者仍会退回到读取到的 Session 中最新 `request/header`。缺少路由、调用失败、超时或响应格式错误时，会生成基于 Session 的确定性回顾；调用失败绝不会替换当天已有的回顾。

浏览器侧自行挂载生成的 Remote 贡献，并每分钟轮询一次 `snapshot()`。一个全帧提示窗一次只显示一条回顾或提醒；点击后打开一个右侧栏页面类型，其中包含回顾视图和未完成任务视图，在没有屏幕上会话时先启动一个 Session。回顾弹窗和提醒间隔以最近展示时刻的形式保存在 `localStorage`，因此刷新后仍然有效，而不会成为 Host 记录。

## 考虑过的替代方案

**把回顾存成记忆记录。** 记忆值上限为 1024 字节，画像记录还会把每天的摘要注入每个新 Session；它落选是因为数据形态、生命周期和上下文成本都不一致。

**把回顾请求记为 Session 事件。** 没有 Session 拥有跨会话回顾，因此只能选择创建合成 Session 或把不可见事件写入真实 Session；两者都会让 Session 历史声明从未属于它的工作。把交换记录与回顾一起保存可以重建请求，又不产生错误归属。

**向浏览器转发 Host 事件。** 中央 `@tomato/api-remotes` 装配是发布包，不能依赖实验包；为了一个可选包把该能力提升为发布接口也不成比例。轮询失去的只是即时送达时间。

**在浏览器里总结。** 浏览器没有当天的持久语料和模型路由，页面关闭后生成也会停止；它在正确性和生命周期两方面都落选。

**只由模型推导未完成任务。** 模型可以重述任务，但 `todos` 投影才是智能体实际写入的权威记录；它落选是因为第二次模型处理会给 Host 已有的数据增加成本和幻觉。

## 后果

- 回顾和分析只属于一台 Host 及其已登录所有者；浏览器提示状态只属于一个浏览器。
- 在回看窗口之前创建的长期 Session 不贡献文本，只在工具调用、文件或图片中可见的工作不会被总结。
- 按照设计，辅助请求不在 Session 历史中。 [包 README](../../../../packages/experimental/muse-insights/README.zh.md) 负责说明存储的交换记录和限制；`sessionQuery` 找不到它。
- 该包增加了有文档的 Remote 接口、配置和两个生成的目录条目。 [真实组合测试](../../../../packages/experimental/muse-insights/tests/loader-composition.spec.ts) 用真实 Session、投影、待办、LLM、查询和 JSON 存储插件启动该 profile 行； [浏览器测试](../../../../packages/experimental/muse-insights/tests) 覆盖提示窗、页面、轮询和挂载/卸载。
- 没有录制的 Session 快照覆盖回顾请求，因为它不属于任何 Session。Host 行的 profile 启动和脚本化模型覆盖模型可见请求；开启可选包后的浏览器 e2e 仍是已命名的覆盖缺口。