---
description: "通过 Typert Remote 把宿主机的硬件与进程采样流式送进浏览器：处理器、显卡、内存、磁盘、网络、电源、CPU 占用最高的进程，以及按引用计数的 Client 观测服务。"
kind: "package-reference"
---
# System Monitor Controller

[English](README.md) | 中文

## 概述

`@tomato/api-system-monitor-controller` 拥有 Host 的 `ctx.systemMonitorController` 服务与生成的 Client `ctx.remote.systemMonitor` namespace。它唯一的 Remote 流 `systemMonitor.sample` 按间隔产出一帧：机器标识、带每核占用的处理器负载、内存与交换占用、显卡利用率、根卷容量、网口吞吐、电源与温度状态，以及 CPU 占用最高的进程。Client 半侧安装 `ctx.systemMonitor`——只要还有界面在观测就保持一条流的按引用计数服务，保留最近 90 个头部百分比，并在载体中断后重开该流。这里不触碰模型的请求路径、Session 日志，也不触碰某个 Session 的 Agent。

## 目录

- [使用本包](#use-this-package)
- [宿主机探针](#host-probes)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

Host 控制器要求 Typert Remote 注册表（`ctx.typert`），缺少它即加载失败；其余依赖都是采集器直接运行的宿主机命令。`systemMonitor.sample({ intervalMs?, processLimit? }, signal)` 先立即产出当前读数，之后每等待一次产出一帧。这条流没有自然结束：浏览器断开时由载体关闭，正在采集的那一帧会先结算再让生成器返回。间隔被夹到 250–10,000 毫秒，进程列表被夹到 0–50 行，调用方无法把看板变成忙循环或无界列表。

每一帧都是独立的：`at`、`host`、`cpu`、`memory`、`processes` 始终存在；`gpu`、`disk`、`network`、`power` 在不提权就拿不到的平台上报 null。拒绝服务的探针——读不到的交换记录、被拒绝的 `ps`、没有网口计数器——只损失自己那个字段，并把 id 记进 `unavailable`，因此残缺的帧依然诚实，而不是一条失败的流。CPU 占用与网络速率都是相对上一帧的差值：采样器的第一帧两者都报 0，计数器回退（网口重置）报 0 速率。

Client 入口安装 `ctx.systemMonitor`（`ISystemMonitor`），由包内部的 `ClientSystemMonitorModel` 支撑。`watch()` 无论多少界面持有都只保持一条流，并在最后一个引用释放后关闭它，从而停止 Host 采样；`state` 暴露 `{ frame, points, status, failure }`，其中 `points` 保留最近 90 个处理器、显卡与内存百分比供迷你图绘制，`status` 在 `idle`、`live`、`reconnecting`、`failed` 之间流转。载体中断时最后一帧留在屏幕上，由 Gateway 重开该流；采样不带游标，所以新一代读数整体替换上一代。插件在自己 context 仍为当前时解析 Gateway 流工厂与 `systemMonitor` namespace，因为流的（重）打开发生在调用方栈上，其动态 context 并未声明 `remote.systemMonitor`。

### 配置

| 字段 | 默认值 | 含义 |
|---|---:|---|
| `intervalMs` | `1000` | 采样间隔（毫秒），夹到 250–10,000 |
| `processLimit` | `6` | 每帧的进程行数，按 CPU 降序，夹到 0–50 |
| `commandTimeoutMs` | `2000` | 单个平台探针的截止时间（毫秒） |

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoapi-system-monitor-controller)是接受字段及其 JSDoc 的完整来源。

<a id="host-probes"></a>
## 宿主机探针

| 字段 | macOS | Linux | 其他平台 |
|---|---|---|---|
| `host` | `node:os` 加 `sysctl -n hw.model` | `node:os` 加 DMI 产品名 | `node:os`，型号为空 |
| `cpu` | `os.cpus()` 心跳差值、`os.loadavg()` | 同上 | 同上 |
| `memory` | `vm_stat`、`sysctl -n vm.swapusage` | `/proc/meminfo` | `os.totalmem`/`os.freemem` |
| `gpu` | `ioreg -c IOAccelerator` 性能统计 | `/sys/class/drm/card*/device/gpu_busy_percent` | null |
| `disk` | `/` 的 `statfs` | `/` 的 `statfs` | `SystemDrive` 的 `statfs` |
| `network` | `netstat -ib`，非回环网口 | `/proc/net/dev` | null |
| `power` | `pmset -g batt`、`pmset -g therm` | `/sys/class/power_supply` | null |
| `processes` | `ps -Ao pid=,pcpu=,pmem=,comm=` | 同上 | 空 |

机器标识缓存 60 秒；跨帧状态（上一份处理器快照与网口计数器）属于采样器实例。命令一律以 argv 形式经 `execFile` 运行，带截止时间与输出上限，从不经过 shell。

<a id="model-experience"></a>
## 模型体验

无。本包按需采样宿主机硬件，不注册任何提示词、工具或会话事件。

#### KV 缓存影响

无直接影响；帧是浏览器侧的观测，从不进入模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **Windows 覆盖是结构性的**——`statfs` 盘符路径以及缺失的显卡、网络、电源探针只由夹具覆盖；没有任何 Windows 车道运行本包的实机路径。
- **显卡利用率是驱动自己的记账**——macOS 上报 `IOAccelerator` 的 `Device Utilization %`，Linux 读 `gpu_busy_percent`；两者都藏起来的机器报 null 而不是估算，`powermetrics`（需要 root）被刻意不用。
- **进程 CPU 是生命周期平均值**——macOS 与 Linux 的 `ps` 报的是自进程启动以来的 CPU 时间，不是瞬时占比，因此长期繁忙的进程读数会低于活动监视器。
- **网口计数器只排除回环**——隧道与网桥接口与其物理载体一起计数，VPN 会让吞吐看起来高于线路实际承载。
- **两个浏览器就是两个采样器**——引用计数按浏览器连接计，所以同时打开两个看板会对宿主机每间隔探测两次。
- **帧里带宿主机名**——`host.hostname` 会到达浏览器；把机器名视为敏感的部署必须在展示前脱敏。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

None.

</details>