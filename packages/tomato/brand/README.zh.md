---
description: "Tomato 品牌在 Web 客户端侧栏与会话首页品牌槽中的占位实现，供替换官方 DeepSeek 标志的部署使用。"
kind: "package-reference"
---

# @tomato/brand

[English](README.md) | 中文

## Summary

本包为 Tomato Harness 提供侧栏标志、侧栏名称与会话首页标志。它占用外壳声明的三个通用品牌槽，因此官方 `ui-brand-official` 的占位实现不会进入组合，界面里不出现鱼形标志或 DeepSeek 字标。本包不持有运行时状态，也不影响模型请求。

## 目录

- [使用本包](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>

## 使用本包

在浏览器插件清单中挂载本插件，并让同一组合不包含 `@deepseek-ai/dsh-client-ui-brand-official`。填入两个声明：

| 槽位 | 占位组件 | Owner props |
|---|---|---|
| `sidebar.brand.mark` | `TomatoSidebarMark` | `size` |
| `sidebar.brand.name` | `TomatoBrandName` | 无 |
| `conversation.hero.brand.mark` | `TomatoMark` | `size`、`className` |

每个注册都通过 `ctx.slots.inject` 等待其所属声明，因此占位随侧栏与会话的生命周期一起出现，并在重载时一起撤下。

侧栏名称是固定产品文案，不走翻译：品牌名不做本地化。标志取自产品 favicon 的几何形状，用 `currentColor` 绘制，因此在明暗两种主题下都跟随周边配色。

<a id="model-experience"></a>

## Model Experience

无。本包只提供浏览器呈现，没有任何内容进入模型请求。

#### KV Cache effect

无；本包既不组装也不发送 provider 请求。

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **标志为单色** —— 为继承 `currentColor`，favicon 的渐变被去掉。多色标志要走主题的图标替换面，而不是本包。
- **首页字标未注册** —— 外壳自带的首页兜底保持不变，只替换方形标志。
- **浏览器标题是构建期值** —— `DSH_CLIENT_TITLE` 在构建时决定它，不在槽位体系内。
