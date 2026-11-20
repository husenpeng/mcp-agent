---
kind: upgrade-guide
description: "Models 页新增一键适配与一键更新动作，由代码内家族适配数据集与新的 llm/adaptModels Remote 支撑。"
---

# 第三方网关的一键模型适配与更新

[English](guide.md) | 中文

## 变更

`@tomato/llm-pi-ai` 内置一套代码内适配数据集，按模型家族存储推理深度档位与让其在第三方网关上生效的协议参数。安装 pi-ai 目录尚未收录的网关模型，此前解析时没有推理能力也没有协议兼容开关；该数据集填补这一空缺。其方言是 OpenAI 兼容网关方言（`reasoning_effort`，外加 DeepSeek 原生的 `thinking` 开关）；Anthropic Messages 路由获得相同档位以及 Claude 的自适应思考开关。

`llm` 服务新增 `registerModelAdaptation(settingsNs, adapt)` 与 `adaptModels(settingsNs, request)`，以 `llm/adaptModels` Remote 暴露给浏览器。与模型发现一样，适配不读写任何存储：请求携带提供方草稿，回复是逐模型的 profile 字段建议。建议只点名草稿未设置且目录条目也未提供的字段，因此绝不覆盖部署自身的声明或第一方能力。新失败码 `NO_ADAPTATION`、`INVALID_ADAPTATION`、`DUPLICATE_ADAPTATION` 加入 `LLM_FAILURE_CODES`，被拒绝的 Remote 携带 `llm/model-adaptation-rejected`。

Models 页的 pi-ai 模型列表在**获取可用模型**旁新增两个一键动作。**一键适配**把建议应用到草稿行，并走与 Apply 相同的保存路径提交。**一键更新**询问端点提供哪些模型，追加列表尚未命名的模型，对合并后的列表做适配，然后提交。两者即使没有 profile 字段变化也会镜像部署的 `modelPolicy.local` 允许清单，因此已配置但被允许清单拦截的模型会被放行。仍继承目录的路由上，未变化的列表保持继承。

## 迁移

1. 无需更改配置。既有 profile 的解析与之前完全一致；数据集只建议草稿未设置的字段，处于自身协议上的目录模型交由目录处理。
2. 要适配第三方路由，打开其编辑卡片，展开**自定义设置 → 模型选项**，点击**一键适配**。要纳入端点新提供的模型，点击**一键更新**。查看模型行与列表旁的结果提示；这两个动作立即提交并保持卡片打开。
3. 挂载自身设置命名空间的适配器家族可通过 `ctx.llm.registerModelAdaptation` 注册适配；该 offer 随 fiber 一起 dispose。没有注册适配的命名空间会以 `NO_ADAPTATION` 拒绝 `adaptModels`。
4. Session 格式不变。适配是配置期建议；它不新增会话事件，也不移除任何已记录模型。