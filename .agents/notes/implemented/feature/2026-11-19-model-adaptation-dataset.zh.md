# Agent Note: 第三方模型适配数据集与一键动作

Status: implemented

[English](2026-11-19-model-adaptation-dataset.md) | 中文

## 问题

第三方 OpenAI 兼容网关会提供安装 pi-ai 目录尚未收录的模型——厂商最新版本或中转别名。目录 materialization 给这类模型既无推理能力也无协议兼容开关，因此它只当作纯文本模型应答；采纳中转的部署不得不为每个模型 id 手写 `reasoningEfforts`、`input` 与按家族的 `compat`。`modelPolicy` 允许清单加剧了这一点：已配置但缺于 `modelPolicy.local` 的模型会在任何提供方 I/O 之前以 `MODEL_NOT_ALLOWED` 被拒绝。两者都重复、易错，且每当端点新增模型就会重现。

## 决定

[`@tomato/llm-pi-ai`](../../../../packages/llm/llm-pi-ai/README.zh.md) 拥有一套代码内维护的适配数据集 [`src/adaptation.ts`](../../../../packages/llm/llm-pi-ai/src/adaptation.ts)，以规范模型 id 家族为键。每个条目存储推理深度档位与让其生效的协议参数，以 profile 字段表达。其方言是 OpenAI 兼容网关方言——`reasoning_effort`，`off` 不发送任何值，外加 DeepSeek 原生的 `thinking` 开关——因为这是第三方中转所说的最低公约数，也是部署采纳中转时逐模型验证的模式。取值镜像各家族当前的第一方目录世代；Anthropic Messages 路由获得相同档位（pi-ai 把它们映射为自适应 effort 或思考预算）以及 Claude 的 `forceAdaptiveThinking`。模态宁可少报不多报，以一个视觉标记放宽点名它的 id，沿用既有 `DEFAULT_INPUT` 的理由。

数据集通过与发现相同的方式暴露在 `llm` 服务 seam 上：`registerModelAdaptation(settingsNs, adapt)` 与 `adaptModels(settingsNs, request)`，Remote 为 `llm/adaptModels`。命名空间键让正在新增的提供方在其路由存在之前就能询问，并把业务规则留在拥有它的适配器里，而非通用运行时或浏览器。适配是草稿的纯函数——不读写任何存储——因此配置界面仍是经由 `settings.mutate` 的唯一写入者。

建议在构造上就是最小差异。它只点名草稿未设置且目录条目也未提供的字段：未知模型按其家族填充；处于自身协议上的目录模型交由目录处理（其 compat 是权威的）；改接其他协议的目录模型保留继承的推理能力但获得家族开关，因为改接不继承目录 compat。行自身的声明与路由已设置的任何开关都不会被重复写入。这正是同一动作既能服务全新中转、也能服务部分手工调过的路由而不覆盖任何一方的原因。

Models 页的 pi-ai 模型列表在既有获取选择器旁提供**一键适配**与**一键更新**。两者都走卡片既有的 Apply 路径提交，而非并行写入器，因此校验、修订围栏与凭据处理留在一处。提交即使没有 profile 字段变化也镜像 `modelPolicy.local`，这正是放行已配置但被允许清单拦截模型的关键——即最初的故障。仍继承目录的路由上，未变化的列表保持继承，而不是把每一行钉进用户层。更新会追加每个新列出的 id，与获取选择器的全选默认及部署自身把非聊天 id 列为普通行的做法一致；数据集拒绝为非聊天模型建议推理。

## 备选方案

**解析期自动适配。** 为已存储 profile 静默改变协议行为，与显式配置姿态相悖，会让网关拒绝某家族方言的部署感到意外。数据集只通过刻意的一键动作应用，其建议像任何 profile 字段一样可编辑。

**对未知模型做逐 id 推理推断。** 家族模板假设当前世代会推理；非推理变体以 `reasoningEfforts: false` 声明。从 id 子串推断能力会静默猜错，因此数据集拒绝为非聊天模型建议，也不触碰无法识别的家族。

**超出家族表的网关特定方言检测。** 交由 pi-ai 自身的 baseURL 检测与路由 `compat`。精心维护的 URL 表会比家族表更快过时，并重复 pi-ai 已拥有的检测。

**浏览器侧数据集。** 功能插件不能运行时导入另一个包的值，且业务规则属于拥有它的适配器。seam 注册把数据集留在 host 侧，Models 页只是建议的纯消费者。

## 后果

采纳中转的部署用一次点击取代逐模型手工编辑，已配置但被拦截的模型在同一次保存中被放行。代价是一套需要随厂商发布世代而刷新的精心维护表；在此之前，全新家族回退为不给建议而非错误猜测。最小差异门让动作可安全重跑——它绝不覆盖调过的行——但也无法修复已存在的错误声明，那仍是手工编辑。每次一键动作提交都镜像允许清单，即使没有字段变化也多一次设置写入。

## 验证

[`adaptation.spec.ts`](../../../../packages/llm/llm-pi-ai/tests/adaptation.spec.ts) 钉住数据集与最小差异门；`llm` topology spec 钉住注册、去重与 Remote 失败映射；pi-ai loader-composition spec 经真实 Loader 演练 `adaptModels`；Models 页一键动作 spec 钉住合并、提交、允许清单镜像与提示。