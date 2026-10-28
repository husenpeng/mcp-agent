---
description: "Tomato AI 的公司产品面：账户入口、品牌占位、同源网关与 OTLP 上报。"
kind: "package-group"
---

# tomato/ — 公司产品面

[English](README.md) | 中文

## Summary

本组承载让 harness 成为 Tomato AI 产品、而不只是上游构建的包：登录账户界面、三个品牌槽、公司登录服务前的同源网关，以及发往内部中继的 OTLP 上报。它们通过随仓库发布的 bundle 组合；本组不拥有 agent 行为、模型访问或会话存储。

## Table of Contents

- [包](#packages)
- [相关文档](#related-documentation)
- [开发备注](#dev-note)

<a id="packages"></a>
## 包

| 包 | 职责 |
|---|---|
| [`account`](account/README.zh.md) | 侧栏入口与设置账户页，读取网关的 auth 会话 |
| [`brand`](brand/README.zh.md) | 侧栏标志、侧栏名称与 hero 标志的占位 |
| [`gateway`](gateway/README.zh.md) | 同源 `/api/auth/*` 与固定服务表 `/api/services/*` 路由 |
| [`telemetry`](telemetry/README.zh.md) | 发往内部 OTLP 中继的 turn 与工具 span |

<a id="related-documentation"></a>
## 相关文档

- [产品决策](../../docs/tomato/decisions.md) — 当前产品行为与背后的决策。
- [ADR](../../docs/tomato/adr/README.md) — 已实现的决策及其后果。

<a id="dev-note"></a>
## 开发备注

无。