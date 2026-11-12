---
description: "让一台 iPhone 一直可作为 phone-use 目标：续签、安装、拉起 runner 与健康巡检。"
kind: "package-reference"
---

# @tomato/experimental-phone-use-macos

[English](README.md) | 中文

## 概述

从 Mac 侧让一台 iPhone 一直可作为 phone-use 目标。证书过期、手机重启、runner 崩溃都表现为“手机不应答”，所以本包负责修复：检查工具链、带证书更新重新构建安装、用注入 Host 凭据的环境变量拉起 runner，并按间隔巡检。它也提供设备卡读取的 `phoneDevice` 命名空间。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

只在 macOS 上与 `@tomato/experimental-phone-use` 一起挂载；bundle 已用平台判断处理。

### 什么时候选它

当你需要手机在没有人工每周重建的情况下继续可用时选它。若另一台机器或 MDM 流程已经在续签与更新 runner，就不必选。

### 最小配置

```yaml
- id: phone-use-macos
  name: '@tomato/experimental-phone-use-macos'
  config:
    iosProjectDir: /path/to/apps/ios
```

| 字段 | 默认 | 含义 |
|---|---|---|
| `iosProjectDir` | 必填 | `apps/ios` 的绝对路径；打包后的 Desktop 不含源码。 |
| `udid` | 唯一已连接的那台 | 多台已配对时指定要管理的设备。 |
| `renewBeforeHours` | `48` | 证书剩余时间低于该值即续签。 |
| `checkIntervalMs` | `300000` | 巡检间隔；`0` 关闭循环。 |
| `transport` | `usb` | `usb` 由设备管家启动 usbmuxd 转发、Host 主动连手机；`vpn` 才是 runner 外连。 |
| `relayPort` | `18200` | Mac 侧转发监听的端口。 |
| `relayScript` | `<iosProjectDir>/tests/usbmux-relay.mjs` | 设备管家启动的转发脚本。 |
| `hostBase` | 未设 | 注入为 `TOMATO_HOST_BASE`；仅 `vpn` 传输使用。 |
| `credentialEnv` | `TOMATO_PHONE_CREDENTIAL` | 承载 runner 凭据的宿主机变量名。 |

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内幕 —— 点击展开</summary>

`DeviceManager.pass()` 每个间隔做一次决定：续签、拉起、等待或不动。这个决定是输入设备读数、证书到期时间与上次 runner 状态的纯函数，所以循环能对着录制的工具输出测试。

每个工具都经 subprocess 抽象以显式 argv、目录、输出上限与截止时间运行，没有任何一步经过 shell。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [手机工具](../phone-use/README.zh.md)：观测、动作与确认。
- [Bundle](../phone-use-bundle/README.zh.md)：插入这一行的 profile 层。

-----

<a id="model-experience"></a>
## 模型体验

None, as the manager repairs the device behind `phone_observe` and `phone_act` and registers no prompt or tool of its own.

#### KV Cache effect

None.

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 因手机锁屏导致的拉起失败会报告 `需要解锁` 并退避；它从不索要密码。
- 到期时间从构建出的应用读取，从未构建过时会继续尝试拉起。
- 设备级 Host 凭据尚未实现；`credentialEnv` 指向部署方提供的变量。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作笔记 —— 点击展开</summary>

None.

</details>
