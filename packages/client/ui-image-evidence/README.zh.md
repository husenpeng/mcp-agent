---
description: "对话中粘贴图片旁的证据状态：哪个视觉模型读取了它、耗时多少，以及读取是失败、复用还是被截断。"
kind: package-reference
---

# @tomato/client-ui-image-evidence

[English](README.md) | 中文

## 概述

当图像证据桥为纯文本模型读取粘贴的图片时，该插件在图片下方显示发生了什么：使用的引擎、耗时，以及模型收到的是完整、截断、复用还是缺失的读取结果。桥未启用或尚未读取该附件时不渲染任何内容。展开状态可看到尝试次数和解释占位符的说明。卡片只读取宿主计算的 `imageEvidence` 投影，不发送自己的请求。

## 目录

- [使用此包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

内置 Web profile 已将该插件与 Chat 一同加载，因此用户消息图片出现的位置就会显示该卡片。

### 何时选用

当部署启用了[图像证据桥](../../llm/image-evidence/README.zh.md)，并且用户需要了解纯文本模型为何能回答关于图片的问题时选用。该插件只负责呈现：启用桥、选择引擎与支付读取费用都属于宿主插件。它不需要配置，移除该行即可移除卡片，且不影响读取或请求。

### 最小配置

Web bundle 已挂载该行；自定义组合把它加在 `@tomato/client-ui-chat` 旁边即可。

```yaml
- id: ui-image-evidence
  name: '@tomato/client-ui-image-evidence'
```

插件在 Chat 为每张持久用户消息图片声明的 `conversation.chat.user.image-meta` 列表插槽中注册一个条目。尚无附件的本地预览不显示条目。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节 — 点击展开</summary>

浏览器端通过 `ctx.slots.inject` 注册一份 `imageEvidence` 词典和 `conversation.chat.user.image-meta` 上的一个列表条目，因此会等待 Chat 的声明，并随插件 fiber 一起移除。组件用 `useProjection` 从宿主计算的 `imageEvidence` 投影中选出自己那张图的条目，渲染路径不持有订阅，另一张图的更新不会重渲染这一张。

| 文件 | 作用 |
|---|---|
| [`src/client/index.ts`](src/client/index.ts) | 注册、词典与注入声明 |
| [`src/client/ImageEvidenceBadge.tsx`](src/client/ImageEvidenceBadge.tsx) | 状态行、展开与投影查询 |
| [`src/client/locales.ts`](src/client/locales.ts) | 各发行语言的 `imageEvidence` 词典 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当只靠卡片不够时，阅读这些页面。

- [@tomato/image-evidence](../../llm/image-evidence/README.zh.md) — 读取图片、存储证据并把它投影进请求的桥。
- [会话投影](../../../docs/subsystems/session-projection.zh.md) — 宿主如何计算 `imageEvidence`，客户端如何按键读取。
- [插槽](../../../docs/subsystems/slots.zh.md) — 声明、子插槽，以及 `ctx.slots.inject` 如何等待其他包的声明。
- [ui-chat](../ui-chat/README.zh.md) — 声明图片插槽并渲染用户消息内容 Factory 的 Chat 目标。
- [ui-attachment](../ui-attachment/README.zh.md) — 渲染卡片所依附的每张图片的内置画廊。

-----

<a id="model-experience"></a>
## 模型体验

无；该插件只在图片旁绘制宿主计算的投影值，不注册提示词、工具或请求内容。

#### KV Cache effect

无；该卡片既不构建也不发送模型请求。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

卡片只报告宿主已计算的事实，从不自行新增数据。

- **证据文本不在卡片中** — 投影携带引擎、尝试次数、标志与耗时，不携带存储的转写文本。因此展开的详情解释读取过程而不引用原文；要显示文本需要让它进入投影或新增 Remote。
- **桥未启用时不显示任何内容** — 没有注册 `imageEvidence` 投影时查询返回空，图片保留普通缩略图，卡片保持静默。
- **复用的记录不显示耗时** — 缓存命中不调用引擎，因此卡片显示 `reused` 而不是误导性的 `0s`。
- **已报告的读取在整个会话中可见** — 条目按附件 id 索引，因此一次读取在对话行滚出窗口后仍保留在投影中。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

状态行遵循[图像证据桥 Agent Note](../../../.agents/notes/proposed/architecture/2026-11-03-image-evidence-bridge.zh.md) 的设计；展开部分最初计划显示转写文本，而投影有意不携带它。

</details>
