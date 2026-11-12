# iPhone Use 分阶段技术实现方案（交付执行 Agent）

> 状态：M0 已在真机验收；M1 已实现；M2 设备管家已实现，待真机跑通一轮。剩余：网关传输层集成测试、真机 attach 验证、M3 手机大脑。设备：iPhone 15 Pro / iOS 26.5.2 / Xcode 27.0（2026-11-11）。
> 范围：`apps/ios`（TomatoRemote + 新增 TomatoRunner）与 Host 侧新实验包。
> 本文是执行依据；涉及 `packages/` 的第一个 PR 必须先把本文转成仓库规范的 proposed Agent Note（见 §0.3）。

## 0. 给执行 Agent 的约定

### 0.1 必读顺序

1. 本文全文，尤其是 §4 关键决策与 §5 协议规范；协议是两端的唯一契约。
2. 仓库根 `AGENTS.md`、`docs/architecture.md`、`docs/defensive-patterns/README.md`、`docs/testing.md`、`docs/cookbook/adding-a-tool.md`、`snapshots/AGENTS.md`。
3. 参考实现：`packages/experimental/cua`（Host 工具、协议 zod 校验、请求关联 `native-client.ts`、截图进附件、应用授权）、`packages/api/robot-controller`（`TypertRemoteService` 与 `@Remote({ mode: 'stream' })` 的写法）。
4. iOS 现状：`apps/ios/project.yml`、`TomatoRemote/Net/{HubClient,Streams,Wire}.swift`、`TomatoRemote/Interactions/InteractionCenter.swift`、`TomatoRemote/Desktop/DesktopStatusView.swift`、`TomatoRemote/Pair/KeychainStore.swift`。

### 0.2 许可证红线

- 可以依赖或借鉴：WebDriverAgent（BSD）、iCTRL（Apache-2.0，<https://github.com/OpenMinis/iCTRL>）、idevice（MIT）。逐字复制 iCTRL 任意文件或片段时，保留其版权头，并在 `apps/ios/THIRD-PARTY-NOTICES.md` 登记来源与许可证。
- 禁止复制代码，只可读设计：iphone-use-app（AGPL-3.0）、StikDebug（AGPL-3.0）、SideStore（AGPL-3.0）、leeguooooo/iphone-use（PolyForm Shield，非开源）。
- LocalDevVPN 只允许以 URL scheme 调用外部 App，不打包其代码。

### 0.3 交付方式

- 每个里程碑一个或多个 PR，按 `dsh-pr-description` 写描述，推送前按 `dsh-pre-push-checks` 选检查。
- M1 的第一个 PR 先新增 `.agents/notes/proposed/feature/2026-11-11-phone-use.md`（英文）+ `.zh.md` + `.i18n.yaml`（`pnpm run verify-translation-pairing --write <路径>` 生成），内容由本文 §1–§4、§9 提炼，骨架为 `Problem / Proposal / … / Alternatives considered / Acceptance criteria / Risks`。本文件随后删除或保持未提交，不进入文档门禁。
- 仓库当前存在大量未提交改动（含 `apps/ios`），开工前与用户确认基线分支。

### 0.4 已确认的输入

| 项 | 值 |
|---|---|
| 签名团队 | `XA4Y65F4M9`，免费个人团队：不能签 Network Extension；证书与描述文件 7 天过期；设备同时最多 3 个侧载 App；每 7 天最多注册 10 个 App ID |
| 手机系统 | iOS 27 |
| Mac | 运行 Tomato Desktop（Host），装有 Xcode 并登录同一 Apple ID |
| 分发 | 只走开发签名，不上 App Store、不走 TestFlight |
| 顺序 | Desktop 大脑（M1、M2）先于手机大脑（M3） |
| 测试设备 | **所有测试一律在真机（iOS 27 的 iPhone）上跑，不用模拟器**（§10.0） |

## 1. 目标与非目标

**目标**

1. 手机上常驻一个自研 XCUITest runner（TomatoRunner），能读屏（无障碍树 + OCR + 截图）、合成触摸与输入、启动 App、打开 URL。
2. Mac 上的 Tomato Agent 能通过已配对链路把这台 iPhone 当工具操作，全过程进入 Session 日志，手机端可在现有会话页实时查看。
3. Mac 自动处理免费团队的维护：续签、重启后重新挂载 DDI、重新拉起 runner。
4. 手机端可配置第三方模型 API，离开 Mac 也能在手机上完成任务（M3）。
5. 支付、发送、删除、分享等动作有确定性的人工确认门，与模型无关。

**非目标**

- App Store 或 TestFlight 分发。
- 自动输入锁屏密码、通过 Face ID、操作 Apple Pay 或钱包。
- 越狱、硬件 HID 方案。
- M4 之前：手机在无 Mac 时自行拉起 runner。

#### 工作模式开关（已实现）

App 增加显式的两种工作状态（`Phone/WorkMode.swift`，持久化在 `workMode`）：

| 模式 | 行为 |
|---|---|
| `操控 Mac`（默认） | 指令发给 Host 上的 Agent；手机只展示、答审批，不执行任何本机动作，手机页的执行按钮禁用 |
| `操控这台手机` | 页面对 Runner 取得 lease；执行按钮可用；切回 Mac 模式时自动 `lease.release` |

入口在「手机」页顶部（分段控件）与「今天」页的「这台手机」卡片；切换是显式动作，不做隐式推断。

#### A 的真机回归结果（2026-11-11）

用 `TomatoRemoteUITests/DeviceE2ETests` 对真实 Host 跑通（Host 起在 `172.24.62.77:43229`，环境经 `xctestrun` 注入，`TEST_RUNNER_*` 不生效这一点已确认）：

| 用例 | 结果 |
|---|---|
| `testPairingReachesTheHost` | 通过（18.7s）：配对到达 Host，会话列表来自真实 Mac |
| `testCreateThenPauseASchedule` | 通过（32.2s）：创建并暂停定时任务 |
| `testVoiceInputStartsDictation` | 通过（35.2s） |
| 文档上传 / 文件预览 | 跳过（需要 `-TOMATO_STAGE_SAMPLE` 的样本文件） |

结论：手机→Mac 这条链路在真机上正常，本轮新增的手机模块没有影响它。

### 1.4 需求定位（2026-11-11 确认，覆盖此前推断）

| 需求 | 定位 | 影响 |
|---|---|---|
| **手机通过 App 操作 Mac**（会话、指令、审批、桌面管理；进一步由 Mac 侧 CUA 点 Mac 界面） | **产品核心** | 既有的 HubClient / InteractionCenter / 页面链路不得改变行为、凭据与入口 |
| **iPhone use：手机操作自己的 App** | **测试与验证能力**，不是产品核心 | 默认不随 profile 启用；桌面端不驱动手机 |
| **Mac → 手机的 USB 转发** | 只作为测试口子保留 | 不进入产品路径 |

由此产生的硬约束：

1. **不改 A 的链路**：`Net/HubClient*`、`Streams`、`Pair/*` 的协议、凭据与超时保持原样；新增模块只读取 `PairingProfile`，不回写、不替换 cookie。
2. **B 默认关闭**：`phone-use` / `phone-use-macos` 只通过显式 `--patch` 或测试 bundle 挂载，不加入随发布 profile 的 bundle 列表。
3. **桌面端不接管手机**：`host:<sessionId>` 这一 lease 持有者保留接口但不启用；`transport` 默认 `usb`，且只在测试脚本里拉起转发。
4. **App 里的手机入口**：可以保留（便于测试时看 runner 状态），但不展示业务动作、不承载产品流程；测试结束后可整体隐藏。

## 1.5 定位：运行期不依赖 Mac

“iPhone use”是让 Agent 操作**这台手机本身**，不是操作 Mac。运行期不需要 Mac，也不需要任何网络对端：

- **大脑在手机上**：模型调用由 runner（或 App）直接发出，走端上 Foundation Models 或手机里配置的第三方 API；Key 存 App 的 Keychain，按任务经 loopback 交给 runner。
- **执行在手机上**：runner 通过 `127.0.0.1:8200` 的 loopback 接口接受命令，同机通信不需要本地网络权限、不需要 VPN。
- **Mac 只承担工具链**：安装 runner、每次重装/续签（免费团队 7 天）、重启后重新挂载 DDI 并拉起 runner。这些是构建与签名动作，不是运行时依赖。

因此 M1（Desktop 大脑）与 USB 转发是**可选能力**：让桌面端能遥控手机、复用 Host 的会话与模型额度；它们不是产品成立的前提。M3（手机大脑）才是主路径。

## 1.6 双模定位与共存规则

产品有两个互不替代的能力，必须同时可用且互不干扰：

| 模式 | 做什么 | 谁执行 | 链路 |
|---|---|---|---|
| **A. 手机操作 Mac** | 在手机上看会话、发指令、答审批、管桌面；进一步可由 Mac 侧的 CUA 工具直接点 Mac 的界面 | Mac 上的 Host / Agent / CUA provider | App ↔ Host（cookie，局域网或隧道） |
| **B. 手机操作自己** | 读这台手机的屏幕、点击、输入、跨 App 完成任务 | 手机上的 runner（日后加手机大脑） | App/Host ↔ runner（loopback 或 USB 转发） |

### 分离的边界（任何时候都不共享）

- **凭据**：A 用 Host 的 `tomato-auth-*` cookie；B 用 runner 的 32 字节 Bearer。互不代用。
- **传输**：A 走 HubClient 的 HTTP/WS mux；B 走 `127.0.0.1:8200/rpc` 或 USB 转发。两套客户端、两套超时与重连策略。
- **队列与失败域**：B 卡死（例如锁屏导致 XCTest 调用悬挂）不得阻塞 A 的流；`PhoneDeviceModel`/`RunnerLink` 独立持有自己的 URLSession，不进入 HubClient 的队列。
- **页面**：B 独占「手机」页（`Phone/PhoneView.swift`），A 的「今天」「会话」「智能体」「群聊」「账号」不展示 runner 细节；桌面页只保留 Mac 的状态与重启。
- **通知分类**：A 用 Host 交互通知（`interaction.id`）；B 用独立标识（`tomato.pair` / `tomato.confirm`），文案与动作按钮分开，同屏不互相覆盖。

### 必须仲裁的共享资源

| 资源 | 冲突形态 | 规则 |
|---|---|---|
| 手机屏幕 | B 的 runner 在操作别的 App 时，A 的页面被切到后台 | 这是预期行为：A 的会话在 Host 上继续，App 回前台自动续流（`InteractionCenter.resume`）。不视为冲突 |
| runner 的 lease | 桌面会话遥控手机（A 的延伸）与手机任务（B）同时想驱动 | **单一持有者**：`human:*` > `local:task:*` > `host:<sessionId>`；被抢占方收到 `LEASE_HELD` 并带持有者名字；抢占必须先释放或过期，不做静默打断 |
| runner 到 Host 的外连 | `transport: usb` 时 runner 不外连；`transport: vpn` 才启用 `HostLink` | 同一 `deviceId` 只保留一条 attach 流，新连接替换旧流并让旧流在途命令失败 |
| 通知中心 | A 的提问与 B 的确认同时到达 | 两个分类各自排队；B 的确认不依赖 App 前台（通知按钮直接回传 runner） |

### 这条规则带来的实现约束

1. A 的审批必须在 App 前台或经通知回答；B 的审批必须在手机上点通知——两者不能互相代理。
2. B 的模型凭据只存在 App 的 Keychain，并按任务交给 runner，不写入 Host；A 的模型配置属于 Host。
3. 桌面端若要从 A 驱动的助手切到「遥控手机」，必须显式申请 lease，不能默认接管。

## 2. 总体架构

```
                 ┌──────────── Mac · Tomato Host（Desktop） ─────────────┐
                 │ Agent Session ── tools: phone_observe / phone_act       │
                 │ @tomato/…phone-use（Host 插件）                          │
                 │   PhoneRemote(namespace "phone") · DeviceLink · 授权/确认 │
                 │ @tomato/…phone-use-macos（M2，macOS provider）            │
                 │   DeviceManager：续签 · 安装 · 拉起 runner · 健康         │
                 └──────▲──────────────────────────────▲──────────────────┘
       /api/remote.mux  │ phone/attach（流）             │ xcodebuild / devicectl
       + /api/phone/*   │ phone/result（单次）           │（USB 或 Wi‑Fi）
┌──────── iPhone ───────┴───────────────────────────────┴─────────────────┐
│ TomatoRemote.app（现有）                                                 │
│   会话 / 确认 / Desktop 页 + 设备卡（新）+ 手机大脑设置与任务页（M3）       │
│   RunnerLink ──HTTP 127.0.0.1:8200（Bearer）──┐                          │
│ TomatoRunner（XCUITest，常驻，不被挂起）       ▼                          │
│   Engine：observe / screenshot / act / apps / guard / lease              │
│   Transport A：LoopbackServer（仅 127.0.0.1）                            │
│   Transport B：HostLink（外连 Host，自动重连）                            │
│   Brain（M3）：手机大脑循环（第三方 API，Key 只在内存）                     │
└─────────────────────────────────────────────────────────────────────────┘
```

进程与信任边界：

- **TomatoRunner** 是唯一能操作屏幕的进程，也是唯一的执行权仲裁者（lease）与风险门。两个大脑都经过它，所以确认规则只实现一次。
- **TomatoRemote** 不直接操作屏幕，只负责：本机配对、把 Host 凭据交给 runner、展示状态、发起手机大脑任务。
- **Host** 负责会话、模型、日志、授权弹窗与设备维护。

## 3. 组件清单与落点

| 组件 | 位置 | 里程碑 |
|---|---|---|
| TomatoRunner target | `apps/ios/TomatoRunner/`，`project.yml` 新 target | M0 |
| 共享协议类型（Swift） | `apps/ios/TomatoRemote/Shared/PhoneProtocol.swift`，同时编进 App 与 Runner | M0 |
| RunnerLink + 设备卡 | `apps/ios/TomatoRemote/Device/` | M0、M2 |
| HostLink（runner 外连） | `apps/ios/TomatoRunner/Transport/HostLink.swift` | M1 |
| Host 插件 | `packages/experimental/phone-use/`（包名按 `packages/experimental/AGENTS.md` 的命名规则定） | M1 |
| macOS DeviceManager | `packages/experimental/phone-use-macos/` | M2 |
| 启用 bundle | `packages/experimental/phone-use-bundle/`（参照 `cua-bundle`） | M2 |
| 手机大脑 | `apps/ios/TomatoRunner/Brain/` + `apps/ios/TomatoRemote/Agent/` | M3 |
| 协议契约样例 | `packages/experimental/phone-use/tests/fixtures/protocol/*.json`，TS 与 Swift 测试共用 | M1 |
| 工具 JSON schema | `packages/experimental/phone-use/schema/phone-tools.v1.json`，Host 与手机大脑共用 | M1、M3 |

## 4. 关键设计决策

| # | 决策 | 放弃的方案与原因 |
|---|---|---|
| D1 | 自研 runner，借鉴 iCTRL 设计 | 直接嵌入 iCTRL：其 runner 单个处理器约 455KB，含浏览器控制页、H.264 推流、Nearby 等用不到的功能，并依赖大量私有 API，维护面过大。嵌入 iphone-use-app：AGPL 传染。 |
| D2 | **以 Mac 主动连 runner 为主通道（USB / usbmuxd 端口转发）；runner 外连只作为 VPN 部署的可选路径** | 初版选择外连的理由是「App 在操作其他 App 时被挂起、`$events` 流会断」——这一点仍然成立，但它只排除了「App 中继」，没有证明「必须外连」。真机实测推翻了外连的可行性：UI 测试 runner 没有前台界面，iOS 弹不出本地网络授权，runner 主动连局域网一律 `-1009`；外连只有在 VPN 隧道里才成立，于是 Tailscale 从「一种选项」变成了硬依赖。反向由 Mac 主动连（usbmuxd 转发到设备 8200）不需要 VPN、不需要任何权限，已在真机验收（§5.7b/§5.7c）。Tailscale 只保留给「手机不在数据线上」的部署。 |
| D3 | 新增独立能力 `phone-use`，不复用 `computer-use` 注册位 | `computer-use` 注册表是互斥的单一桌面 provider；操作 Mac 与操作手机必须能共存。 |
| D4 | 工具只有 `phone_observe` 和 `phone_act` 两个 | 每个动作一个工具会膨胀首轮提示词；两个工具加判别联合参数足够，且动作结果可附带新的观测，少一轮调用。 |
| D5 | 风险门放在 runner 内，确定性匹配 | 只靠提示词让模型自觉不可审计；放在 Host 则手机大脑要再实现一遍。 |
| D6 | runner 拥有 lease，同一时刻只有一个控制者 | 两个大脑与人同时操作会互相覆盖。 |
| D7 | M1 先用 owner Cookie 外连，M2 换成设备级凭据 | 网关现有的非 owner 资源判定（`packages/api/gateway/src/access.ts`）能否承载“只允许 `phone/*`”需要调研；M1 不被它阻塞。风险见 §9。 |
| D8 | Mac 负责续签与拉起，手机自启动（idevice + LocalDevVPN）推迟到 M4 | 免费团队签不了 Network Extension，手机自启动必须外挂 LocalDevVPN 并占用第 3 个侧载名额，还需配对文件；Mac 可达时完全不需要。 |

## 5. 协议规范 v1

协议版本常量 `PHONE_PROTOCOL_VERSION = 1`。Host 侧以 zod 定义为准（`packages/experimental/phone-use/src/protocol.ts`），Swift 侧在 `PhoneProtocol.swift` 镜像，双方用 `tests/fixtures/protocol/*.json` 互相校验。字段名一律 lowerCamelCase。可选字段缺省即省略，不发 `null`（与 `HubClient.invoke` 的约定一致）。

### 5.1 Engine 方法

两种传输承载同一组方法与返回结构。

| method | params | result |
|---|---|---|
| `health` | `{}` | `{ protocol, runnerVersion, build, screen: {width, height, scale}, locked: bool, foreground?: {bundleId, name}, lease?: {holder, since}, hostLink: "off"|"connecting"|"attached" }` |
| `observe` | `{ maxElements?: int(1..200, 默认 80), includeOcr?: "auto"|"always"|"never"（默认 auto）, screenshot?: bool（默认 false） }` | `Observation`（§5.2） |
| `screenshot` | `{ maxEdge?: int(320..2048, 默认 1280), quality?: number(0.2..0.9, 默认 0.5) }` | `{ mime: "image/jpeg", base64, pixelWidth, pixelHeight, observationId }` |
| `act` | `Action`（§5.3）+ `{ observeAfter?: bool（默认 true）, confirmToken?: string }` | `ActResult`（§5.3） |
| `apps.resolve` | `{ query }` | `{ matches: [{bundleId, name}] }`（离线表 + 本机曾成功启动过的记录） |
| `lease.acquire` | `{ holder: "host:<sessionId>"|"local:<runId>", ttlMs?: int(默认 300000) }` | `{ granted: bool, holder }` |
| `lease.release` | `{ holder }` | `{}` |
| `link.set` | `{ hostBase, credential, deviceId, deviceName }` | `{}`，仅 Loopback 可调用 |
| `link.clear` | `{}` | `{}`，仅 Loopback 可调用 |
| `task.start` / `task.status` / `task.stop` | M3 定义（§8） | 仅 Loopback 可调用 |

所有会改变屏幕的方法都要求调用方持有 lease；Loopback 的单次调试调用允许 `holder` 为 `local:debug`。

### 5.2 Observation

```json
{
  "observationId": "o-42",
  "foreground": { "bundleId": "com.apple.Preferences", "name": "设置" },
  "screen": { "width": 402, "height": 874 },
  "elements": [
    { "ref": "e7", "role": "button", "label": "通用", "value": null, "frame": [16, 410, 370, 44], "enabled": true }
  ],
  "ocr": [ { "ref": "t3", "text": "电池", "frame": [24, 520, 60, 20] } ],
  "truncated": false,
  "keyboardVisible": false,
  "alert": null
}
```

- 坐标单位为 UIKit point，原点左上。
- `ref` 只在当前 `observationId` 内有效。runner 保存每个 ref 的查询条件（role + label + identifier + 序号 + frame），执行时重新解析当前元素，找不到则返回 `STALE_REF`，不得退回到旧坐标。
- `elements` 只含与屏幕可见区域相交的元素，按阅读顺序排列，超出 `maxElements` 时 `truncated: true`。
- `includeOcr: "auto"`：可见元素少于 5 个，或带文本的元素覆盖率低于阈值（可配置，默认 30%）时附带 OCR。
- `alert` 为系统弹窗的标题与按钮列表；有弹窗时优先返回它。

### 5.3 Action 与 ActResult

`Action` 按 `type` 判别：

| type | 字段 |
|---|---|
| `tap` | `ref` 或 `{x, y}`；可选 `count: 1|2` |
| `longPress` | `ref` 或 `{x, y}`；`durationMs`（200..5000，默认 800） |
| `swipe` | `from: {x,y}`、`to: {x,y}` 或 `direction: up|down|left|right` + 可选 `ref` 作为区域；`durationMs`（默认 300） |
| `type` | `text`（≤ 4000 字符）；可选 `ref`（先点击聚焦）；`submit?: bool`；`clear?: bool` |
| `press` | `button: home|volumeUp|volumeDown` |
| `launch` | `bundleId` 或 `name`；`fresh?: bool`（先终止再启动） |
| `openUrl` | `url`（http/https 或已知 scheme） |
| `wait` | `ms`（≤ 10000）或 `untilText` + `timeoutMs` |

```json
{ "ok": true, "pageChanged": true, "foreground": {"bundleId": "…"}, "hint": "…", "observation": { … } }
```

- `pageChanged`：执行前后可见元素签名（label + frame 哈希）是否变化，用于让模型判断动作是否生效。
- `hint`：一句话提示，例如“点中的是空白区域”“键盘已弹出”。
- 动作执行后需等待屏幕稳定再观测（ScreenSettle：连续两次签名相同或超时 1500ms）。

### 5.4 错误码

错误格式为 `{ code, message, retryable: bool, details? }`。

| code | 含义 | 处理方 |
|---|---|---|
| `LOCKED` | 设备锁屏 | 告知用户解锁；不重试 |
| `STALE_REF` | ref 已失效 | 模型重新观测 |
| `NOT_FOUND` | 文本或应用找不到 | 模型 |
| `NEEDS_CONFIRMATION` | 命中风险门；`details: {reason, target, confirmToken}` | Host 或 runner 发起人工确认，通过后带 `confirmToken` 重发 |
| `BLOCKED_APP` | 目标 App 在禁止名单中 | 不重试 |
| `LEASE_HELD` | 其他控制者持有 lease | 调用方 |
| `TIMEOUT` | 单次调用超时（UI 卡住） | 可重试一次 |
| `HALTED` | 用户在通知里点了“停止” | 终止任务 |
| `BAD_REQUEST` | 参数校验失败 | 调用方修正 |
| `INTERNAL` | 其他错误 | 记录日志 |

### 5.5 风险门（runner 内实现，D5）

- 判定输入：目标元素的 label、value、所在 App 的 bundleId、`type` 动作的文本。
- 规则存放在 runner 内的 `RiskRules.json`（版本化，可由 Host 下发覆盖），默认规则：
  - 中英文关键词：支付、付款、确认付款、立即购买、提交订单、转账、发送、删除、清空、注销、分享、Pay、Buy、Purchase、Send、Delete、Remove、Share、Confirm payment；
  - 默认禁止 App：`com.apple.Passbook`（钱包），以及用户在设置里添加的银行类 App；
  - `type` 文本若像卡号、身份证号或验证码，也视为风险。
- 命中后返回 `NEEDS_CONFIRMATION`，并生成一次性 `confirmToken`（60 秒有效，绑定该动作的哈希）。
- 带 token 重发时，runner 先校验哈希一致再执行。

### 5.6 Loopback 传输（Transport A）

- Network.framework `NWListener`，只绑定 `127.0.0.1`，端口默认 8200（运行环境变量 `TOMATO_RUNNER_PORT` 可覆盖）。
- 最小 HTTP/1.1：只支持 `Content-Length`，请求体上限 1 MiB，单连接串行。
- 路由：
  - `POST /rpc`：JSON-RPC 2.0（`{jsonrpc, id, method, params}` → `{jsonrpc, id, result|error}`），需要 `Authorization: Bearer <key>`；
  - `POST /pair`：无鉴权，触发 runner 本地通知“允许 Tomato Remote 控制本机？”，用户点“允许”后返回 32 字节随机 key（base64），60 秒内无应答返回 `TIMEOUT`；
  - `GET /health`：无鉴权，只返回 `{protocol, runnerVersion, ok}`。
- 手机上其他 App 也能访问 127.0.0.1，因此除 `/health` 与 `/pair` 外一律校验 key。
- key 由 runner 存在自己的数据容器（`Application Support/runner-keys.json`，文件保护级别 `complete`）；App 侧存 Keychain，新增 `account = "runner"`，不改动现有 `pairing` 条目。

### 5.7c 真机验收结果（USB 通道，2026-11-11）

设备：iPhone 15 Pro / iOS 26.5.2；通道：`node apps/ios/tests/usbmux-relay.mjs 18200 8200`；凭据由 xctestrun 的 `TOMATO_RUNNER_CREDENTIAL` 指定（显式启动环境优先于已存凭据）。

| 步骤 | 结果 |
|---|---|
| `/health` | 协议 1，屏幕 393×852，前台主屏幕 |
| `observe` | 读到 1 个元素（主屏时钟） |
| `lease.acquire` | `granted: true`（`mac:acceptance`） |
| `act launch 设置` | **3s**，`ok: true`，返回 41 个元素，含「通用」「搜索」 |
| `act swipe up` + `tap 通用` | 进入通用页；**注意**：首次 `observeAfter` 仍返回根页，落地页要 1–2s 后才稳定 |
| `screenshot` | 1178×2556 JPEG，base64 约 168KB |
| `act type` 卡号样文本 | `NEEDS_CONFIRMATION` + 一次性 `confirmToken`（风险门生效） |
| `act press home` | 回到主屏幕 |

由此确定的两条实现细节：

1. **动作后的稳定判定**必须轮询到签名变化，最多约 2s；单次读取会把“页面已切换但动画未结束”当作未变化（已修 `Engine+Act.swift`）。
2. **底部 20pt 的点击被 Home 指示条吞掉**：`通用` 在 815–871 时点击无效，滚动后（571）才生效。工具与模型都应先滚动再点边缘元素。
3. **设备必须解锁**：锁屏时 `launch` 被 SBMainWorkspace 拒绝，且引擎无法取消已发出的 XCTest 调用，该次调用会一直挂到超时。验收期把自动锁定设为「永不」。

### 5.7b 传输层实测结论（2026-11-11 真机）

| 通道 | 结果 |
|---|---|
| 同机 loopback（App/runner 之间） | 可用，M0 的 `testTransport` 全绿 |
| runner 外连 Host（局域 `172.24.62.0/22`、USB NCM `169.254.x`） | **全部 `-1009`**：UI 测试 runner 没有前台界面，iOS 弹不出「本地网络」授权，默认拒绝 |
| Host 经 usbmuxd 转发到设备 8200 端口 | **可用**：`node apps/ios/tests/usbmux-relay.mjs 18200 8200` 后 `/health`、`observe`、`lease.acquire` 均成功 |

因此桌面场景的主通道改为 **USB（usbmuxd 端口转发）**：Mac 侧主动连 runner 的 loopback 服务，不需要 VPN、不需要本地网络权限。`HostLink` 保留给「手机不在 USB 上」的部署（Tailscale 等 VPN 隧道内的外连）。

代价与约束：设备必须解锁且数据线连着；锁屏会让 `launch` 被 SBMainWorkspace 拒绝，并让引擎卡在该次调用上直到超时（引擎无法取消已发出的 XCTest 调用）。验收前把「设置 → 显示与亮度 → 自动锁定」设为「永不」。

### 5.7 Host 链路（Transport B）

**Host 侧 Remote 服务**：`PhoneRemote extends TypertRemoteService`，命名空间 `phone`。

| 端点 | 方式 | 说明 |
|---|---|---|
| `phone/attach` | `@Remote({ mode: 'stream' })`，参数 `request: AttachRequest` | runner 打开，Host 通过该流下发命令帧 |
| `phone/result` | 单次，参数 `request: CommandResult` | runner 回传命令结果 |
| `phone/event` | 单次，参数 `request: DeviceEvent` | runner 上报 `halted`、`locked`、`unlocked`、`leaseChanged` |
| `phone/devices` | 单次 | 已连接设备列表，给 App 设备卡和 Desktop GUI 用 |

**帧格式**：

```jsonc
// AttachRequest（runner → Host，open 帧 payload.args.request）
{ "deviceId": "…", "deviceName": "…的 iPhone", "protocol": 1, "runnerVersion": "0.1.0",
  "screen": {"width":402,"height":874,"scale":3}, "capabilities": ["observe","screenshot","act","ocr"] }
// Host → runner（item）
{ "type": "ready", "attachId": "…" }
{ "type": "command", "commandId": "…", "method": "act", "params": { … }, "deadlineMs": 15000 }
{ "type": "cancel", "commandId": "…" }
{ "type": "ping" }
// runner → Host（POST /api/phone/result）
{ "attachId": "…", "commandId": "…", "ok": true, "value": { … } }
{ "attachId": "…", "commandId": "…", "ok": false, "error": { "code": "STALE_REF", "message": "…", "retryable": false } }
```

**线路约定**（照抄现有 iOS 客户端）：

- 流：`WS <base>/api/remote.mux`，open 帧为 `{type:"open", streamId, endpoint:"phone/attach", payload:{args:{request:…}}}`，带 Cookie，不发 `Origin`，每 20 秒心跳（同 `Streams.swift`）。
- 单次调用：`POST <base>/api/phone/result`，信封为 `{type:"client-request", rpcId, method:"phone/result", payload:{args:{request:…}}}`（同 `HubClient.invoke`）。

**连接语义**：

- 同一 `deviceId` 只保留最新一次 attach，旧流由 Host 以 `phone/replaced` 错误结束。
- 断线后 Host 立即以 `PHONE_DISCONNECTED` 拒绝所有未完成命令，不重放任何输入。
- runner 侧指数退避重连（1s → 30s，抖动 ±20%）。

**命令执行**：

- Host 对每台设备串行下发；`deadlineMs` 到期后 Host 先发 `cancel`，再以 `TIMEOUT` 失败。
- runner 收到 `cancel` 后：尚未开始的命令直接丢弃；已开始的合成事件无法撤回，结果仍回传，但 Host 忽略迟到结果。

## 6. 里程碑 M0：TomatoRunner 与本机链路 — 已完成

实现落在 `apps/ios/TomatoRunner/`（`README.md` 记录了架构与真机结论），App 侧落在
`apps/ios/TomatoRemote/Device/`，真机冒烟脚本是 `apps/ios/tests/phone-runner-smoke.sh`。

### 6.1 与初稿的偏差（都是真机暴露出来的，后续里程碑按此继续）

| 初稿 | 实际 | 原因 |
|---|---|---|
| runner 绑定宿主 App（`TEST_TARGET_NAME: TomatoRemote`） | **独立 runner，`TEST_TARGET_NAME` 与 `TEST_HOST` 均为空** | 宿主 App 一进后台，宿主进程连同 runner 一起被挂起；独立 runner 才能在别的 App 前台时持续服务 |
| 逐节点走 `XCUIElement.children` | 解析一次 `XCUIApplication.debugDescription` 全文 | 逐节点每个都付一次 IPC，在 SpringBoard 上直接卡住数十秒；全文一次 0.25–0.33s |
| 引擎跑在后台串行队列 | 引擎跑在**主线程**（在主线程调用则就地执行，否则跳主线程） | XCTest 要求 `launch`/`terminate` 在主线程；后台读取会死锁 |
| 用 `wait(for: .runningForeground)` 判断前台 | 不再查询应用状态，空树回退 SpringBoard | 状态查询会远超超时地阻塞 |
| `UIScreen.main.bounds` 取屏幕尺寸 | 取 dump 里第一个 window 的 frame | runner 进程里 `UIScreen.main` 返回 320×480 |
| 元素 `label` 为空即丢弃 | 空 label 时用 `identifier` 顶替 | 图标型按钮（工具栏、返回）只有 identifier |
| 点击前不处理边缘 | 自检先滚动再点；文档建议滚到屏幕中部 | 底部 20pt 内的点击被 Home 指示条吞掉 |

### 6.2 真机验收结果

`testSelfCheck`（引擎）与 `testTransport`（HTTP 链路）在 iPhone 15 Pro / iOS 26.5.2
上一次通过，2026-11-11：

| 步骤 | 耗时 | 结果 |
|---|---|---|
| `health` | <1ms | 协议 1，屏幕 393×852 |
| `go-home` | 485ms | 主屏 |
| `observe`（主屏） | 649ms | 2 个元素 |
| `launch 设置` | 3.0s | 前台变为 `com.apple.Preferences`，`pageChanged` 为真 |
| `swipe` + `tap 通用` | 1.9s + 2.1s | 进入通用页，`pageChanged` 为真，80 个元素 |
| `tap 搜索` + `type` 中文 | 5.0s + 3.2s | 搜索框出现“Tomato” |
| `screenshot` | 99ms | 1178×2556 JPEG，约 195KB base64 |
| `press home` | 1.3s | 回到主屏 |
| `/health` `/pair` `/rpc observe` | 24ms / 21ms / 706ms | 全通 |
| 错密钥 `/rpc` | 2ms | 401 `UNAUTHORIZED` |
| `lease.acquire` / `act launch` | 45ms / 3.2s | 全通 |

失败与修复过程记录在 `apps/ios/TomatoRunner/README.md` 的“Device findings”一节。

### 6.3 仍需人工验证的两件事

1. **配对弹窗**：`POST /pair` 会发本地通知，需要人在手机上点“允许”。自动化检查用
   `TOMATO_RUNNER_AUTOPAIR=1` 跳过，这只在 runner 的调试环境里存在。
2. **App 内的设备卡**：Log 卡上的“配对 Runner / 在备忘录里输入一行字”需要在手机上点一次，
   验收标准是配对后能读到前台应用与元素列表。

### 6.4 工程改动清单（已完成）

- `project.yml`：新增 `TomatoRunner` 目标（`bundle.ui-testing`、独立、桥接头
  `TomatoRunner/Support/XCTestPrivate.h`、`RiskRules.json` 作为资源）与独立 `TomatoRunner`
  scheme（关闭自动录屏）。
- `TomatoRemote/Shared/PhoneProtocol.swift`：App 与 runner 共用的线协议。
- `TomatoRemote/Device/`：`RunnerLink`、`RunnerCredentials`、`PhoneDeviceModel`、
  `PhoneDeviceCard`；`DesktopStatusView` 末尾挂上设备卡。
- `Pair/KeychainStore.swift`：新增按 account 存取的通用 `saveSecret/secret/removeSecret`，
  原 `pairing` 条目行为不变。
- `apps/ios/tests/phone-runner-smoke.sh`：真机冒烟，`TOMATO_IPHONE_UDID` 未设置时退出码 0 跳过。

## 7. 里程碑 M1：Desktop 大脑 — 已实现（待网关集成测试与 bundle）

### 7.1 已落地

| 位置 | 内容 |
|---|---|
| `packages/experimental/phone-use/src/protocol.ts` | 与 Swift 半区镜像的全部 zod 契约；`PhoneJson` 由本包声明，满足 Typert 的边界类型归属要求 |
| `src/registry.ts` | `PhoneDevices`：每设备一个 attach 会话、命令关联、截止时间、断线与替换、吊销迟到结果、halted 状态 |
| `src/remote.ts` | `PhoneRemote`：`phone/attach`（stream）、`phone/result`、`phone/event`、`phone/devices` |
| `src/tools.ts` | `phone_observe` 与 `phone_act`；动作失败为 `NEEDS_CONFIRMATION` 时走 `src/consent.ts` 向人提问，允许后带一次性令牌重发 |
| `src/index.ts` | Config（`commandTimeoutMs` / `observeMaxElements` / `maxRenderElements`）与挂载 |
| `src/types.ts` | 品牌 id、`PhoneUseError`、Remote 边界类型（经 `./types` 子路径导出） |
| `apps/ios/TomatoRunner/Transport/HostWire.swift` | open 帧与 `client-request` 信封 |
| `apps/ios/TomatoRunner/Transport/HostLink.swift` | 外连 `/api/remote.mux`、接收命令、主线程执行、单次回报、指数退避、cancel 丢弃迟到结果 |
| `apps/ios/TomatoRemote/Device/RunnerLink.swift` | `link.set` / `link.clear`；配对后自动把 Host 凭据交给 runner |

工程登记：`tsconfig.base.json` 路径别名（`pnpm run gen-tsconfig-paths`）、`tsconfig.host.json` 项目引用、Typert 产物（`lib/typert.host.*`、`lib/typert.remote-client.*`）已生成。

### 7.2 已验证

- `pnpm exec vitest run packages/experimental/phone-use`：13 项通过（命令关联、截止时间、断线、替换、halted、协议校验、非法输入拒绝）。
- `pnpm exec tsc -p packages/experimental/phone-use/tsconfig.json --noEmit`：无错误。
- `pnpm exec oxlint packages/experimental/phone-use`：无告警。
- `pnpm exec tsx scripts/generate-typert.ts`：39 个包产物生成成功，含本包。
- Swift 两侧构建通过；真机 `phone-runner-smoke.sh` 仍全绿（M0 能力未回归）。

### 7.3 已完成的收尾

- `tests/artifact.spec.ts`：校验生成的 Typert 产物声明了四个端点（`phone/attach|result|event|devices`）、命名空间绑定到 `phoneRemote`、manifest 能注册进 `ctx.typert`。现在共 15 项测试通过。
- `packages/experimental/phone-use-bundle`：`cordis.patch.yml` 插入 `phone-use` 行，profile 以 `- include: '@tomato/experimental-phone-use-bundle'` 启用；README 中英成对并过 pairing 检查。
- `tsconfig.base.json` 的 hand-written 别名（目录名与包名不同）与 `tsconfig.host.json` 项目引用。

### 7.4 未完成（M1 收尾）

1. **网关传输层集成测试**：按 §10.3 用 WebSocket 客户端扮演 runner，走通 `phone/attach` → 命令 → `phone/result`。当前覆盖到 `PhoneDevices` 与产物声明，未覆盖 Remote 传输层。
2. **真机 attach 验证**：需要 Host 运行并挂载本 bundle；M2 完成后由 `phoneDevice/relaunch` 自动注入 `TOMATO_HOST_BASE` / `TOMATO_HOST_CREDENTIAL` / `TOMATO_DEVICE_ID`（runner 已支持从环境变量自建链路）。

### 7.4 工具定义与渲染

- `phone_observe` 的工具结果首行为“前台应用 + 元素数 + 是否截断”，其后每行一个元素 `e7 button "通用" (16,565,361,56)`，默认最多 40 行。
- 两个工具的输出 schema 为 `json`：值就是协议文档本身，结构由 `src/protocol.ts` 定义并在运行时用 zod 校验；`render` 提供人读视图。
- `phone_act` 的 `action` 参数是判别联合的扁平描述；`type` 之外的字段按需出现，跨字段规则在工具内校验。

## 8. 里程碑 M2：Mac 设备管家 — 已实现（待真机验收）

### 8.1 落地

`packages/experimental/phone-use-macos`：

| 文件 | 内容 |
|---|---|
| `src/decide.ts` | 纯函数：解析 `devicectl` 输出、读证书到期、决定下一步（renew / launch / wait / idle） |
| `src/manager.ts` | `DeviceManager`：`doctor` / `renew` / `launch` / `pass` / `start` / `stop`，状态机与退避 |
| `src/runner.ts` | 唯一的进程入口，经 `ctx.subprocess` 以显式 argv 运行，不经过 shell |
| `src/remote.ts` | `phoneDevice` 命名空间：`status` / `doctor` / `renew` / `relaunch` |
| `src/index.ts` | Config 与挂载；非 macOS 或缺少 `iosProjectDir` 时启动即报错 |

命令序列：`xcode-select -p` → `xcrun devicectl list devices --json-output` → `security cms -D` 读证书 → `xcodebuild … build-for-testing -allowProvisioningUpdates` → 两次 `devicectl device install app` → `xcodebuild test-without-building`（注入 `TOMATO_HOST_BASE` / `TOMATO_DEVICE_ID`）。

`phone-use-bundle` 已加入设备管家行，用 `!!js process.platform !== 'darwin'` 做平台判断；`verify-cordis-config` 通过（313 个配置文件）。

### 8.2 已验证

- `vitest`：13 项（决定矩阵、工具链缺失、续签并安装两个应用、拉起注入环境、失败退避、离线等待）
- `tsc --noEmit` 与 `oxlint`：无错误
- Typert 产物：40 个包，含 `phoneDevice` 命名空间

### 8.3 真机验收时要确认的两件事

1. **`xcodebuild test-without-building` 能否在 Host 侧长驻**（M0 的 S1）。目前 `launch()` 在命令成功返回时把状态记为 `launching` 而不是 `attached`——因为该命令正常返回意味着测试会话已经结束，真正的“已连接”信号来自 `phone/devices`。若 S1 证明 xcodebuild 退出后 runner 仍存活，则 `launch()` 可以直接等命令退出并记为 `attached`。
2. **锁屏时的失败形态**：现在通过 `lastError` 报告并退避；真机要确认错误文本足够定位（“需要解锁”）。

### 8.4 未完成

- 真机跑通一轮 `doctor → renew → launch → attach`（需要一台连着 Mac 的手机与一次真机 Host 启动）。
- 设备级 Host 凭据（§5.7 的 D7 第二步）：目前 `credentialEnv` 指向部署方提供的变量。

## 9. 里程碑 M3：手机大脑 — 已实现（模型实测待 Key）

### 9.1 落地

| 位置 | 内容 |
|---|---|
| `TomatoRunner/Brain/Provider.swift` | `ModelProvider` 协议；OpenAI 兼容 `chat/completions`、Anthropic `messages`、以及无模型的 `script` 实现 |
| `TomatoRunner/Brain/Brain.swift` | 任务循环：`observe → 模型 → act → observe`，步数上限、取消、步骤日志、`task.start` / `task.status` / `task.stop` |
| `TomatoRunner/Brain/TaskConversation.swift` | 发给模型的对话：只保留最新一次屏幕，旧的替换成占位，工具调用与结果成对保留 |
| `TomatoRunner/Brain/BrainText.swift` | 系统提示与屏幕/结果的渲染，渲染上限与读取上限是同一个值 |
| `TomatoRunner/Brain/ConfirmCenter.swift` | 风险门拒绝时发本地通知并阻塞该步，通知按钮回传一次性令牌；拒绝或超时结束任务 |
| `TomatoRemote/Phone/ModelSettings.swift` + `ModelSettingsView.swift` | 服务商预设、Base URL、模型、步数；Key 按服务商存 Keychain，随任务经 loopback 下发 |
| `TomatoRemote/Phone/PhoneTaskModel.swift` + `PhoneTaskView.swift` | 目标输入、开始/停止、每秒轮询状态、步骤列表 |
| `TomatoRemote/Phone/WorkMode.swift` + `PhoneView.swift` | 「操控 Mac / 操控这台手机」显式切换；切换时申请或释放 runner lease |

约束保持：循环跑在 runner 进程内（App 挂起不影响任务），每一步都经同一套引擎方法，lease 与风险门与远端驱动完全一致。

### 9.2 真机验证（脚本 provider，无需模型 Key）

USB 通道 + `provider.kind = script` 的任务在设备上跑通：

| 用例 | 结果 |
|---|---|
| `task.start` → `observe` → `launch 设置` → `swipe` → `done` | 状态 `done`，步骤记录带耗时（390ms / 3134ms / 5666ms） |
| 卡号样文本的 `type` | 状态停在 `needs_confirm`，等待通知确认；`task.stop` 可结束 |

修掉的两个实现缺陷：`Engine.brain` 用弱引用导致循环被立刻释放（改由 `RunnerEntry` 强持有）；`task.status` 用 UUID 字典序取“最新任务”导致返回旧任务（改为记录启动顺序）。

同一轮按“模型在瞎跑”的反馈修掉的循环缺陷（`Brain/`）：

| 症状 | 改法 |
|---|---|
| 第一轮请求只有目标，模型没有屏幕可看 | 开局先真实观测一次，目标与首屏放进同一条 user 消息（Anthropic 不接受同一角色连续出现） |
| 一个过期 ref 就整条任务失败，模型学不到原因 | 引擎失败作为该工具调用的结果回给模型（`STALE_REF` 等按错误码给出下一步建议），连续 3 步失败才收尾 |
| 动作后页面没变，模型照着重复 | 每一步的工具结果都带 `pageChanged` 与 `hint`，并写明“没有变化就不要重复” |
| 旧屏幕堆在上下文里，模型按记忆中的画面决策 | 只保留最新一次屏幕，旧的替换成占位；工具调用与结果成对保留 |
| 两家的工具调用/结果没有按协议关联 | OpenAI 走 `tool_calls` + `tool_call_id`（arguments 是 JSON 字符串），Anthropic 走 `tool_use` + `tool_result`，相邻同角色合并 |
| 结束时 lease 不交还，App 30 分钟内拿不回设备 | 成功、失败、停止、超步数都 `lease.release`；租不到（别的持有者占用）直接报 `LEASE_HELD`，不在别人的 lease 下驱动屏幕 |
| 动作 schema 缺 `point`/`from`/`to`/`count`/`durationMs`/`untilText`/`timeoutMs` | schema 与 `PhoneAction` 对齐，模型能表达的正是引擎支持的 |

### 9.3 未验证

- **真实模型调用**：需要手机上的第三方 API Key。Provider 的两个 HTTP 分支已实现但未跑过真实响应；下一次有 Key 时先跑一条「读电池电量」。
- 两个 provider 的请求体由 `RunnerEntry/testBrainWire`（`TomatoRunner/BrainCheck.swift`）断言：每个 tool 结果都能对上它回答的调用、Anthropic 的角色不重复、action schema 覆盖全部动作字段、上下文里只有一个完整屏幕。该用例不需要 Key，已并入 `phone-runner-smoke.sh`；真机仍需一次带 Key 的实跑。

## 10. 测试策略

### 10.0 只用真机

**没有模拟器路径。** 所有涉及 iOS 的测试、冒烟、验收一律在 iOS 27 的 iPhone 上执行；不新增模拟器 target、模拟器 scheme 或模拟器专用脚本，也不为模拟器保留任何降级分支。理由：模拟器没有真实触摸合成路径（S3）、没有锁屏与 Face ID（`LOCKED`）、没有真实 App（银行、钱包、第三方 App 的屏蔽截屏行为）、网络与 ATS 行为也不同，在模拟器上通过的结论不能用于验收。

由此带来的约束，执行时必须照做：

- 测试与验收依赖真机连接：USB 优先，或 Xcode → Devices 里同一 Wi‑Fi 网络连线。设备必须已解锁、开发者模式已开、开发者证书已信任。
- 真机测试**不进 CI 必跑集合**。用一个统一开关控制：环境变量 `TOMATO_IPHONE_UDID` 未设置时，真机测试脚本与 target 直接跳过并打印原因（退出码 0），不得失败、不得静默通过。CI 不设置该变量。
- 所有真机测试的通过标准都要带**耗时**记录（观测 p50、点击 p50、端到端完成时间），因为这些数字是判断回归的唯一依据。
- 每个真机测试脚本开头先跑 `health`，断言 `protocol == 1`、设备未锁屏、前台为预期 App；不满足就以“环境未就绪”失败，而不是让后续断言误报。
- 一台设备同一时刻只跑一个真机测试（runner 是单例资源，§5.5 lease），测试脚本之间串行执行。
- 免费团队限制下，每次真机测试都可能触发重新签名。脚本不要自己续签：续签由 M2 的 DeviceManager 负责，`TOMATO_IPHONE_UDID` 场景下缺失证书时报告“需要续签”，并由操作者手动跑一次续签流程。

### 10.1 协议契约（不需要设备）

- `packages/experimental/phone-use/tests/fixtures/protocol/*.json` 覆盖每个方法的合法请求、合法结果、每个错误码，以及非法样例。
- TS 侧用 zod 校验合法样例通过、非法样例拒绝。
- Swift 侧的往返编码断言**放在真机测试 target 里**（`TomatoRunnerTests`，跑在 iPhone 上），不新增模拟器单元测试 target；样例通过 `project.yml` 的资源路径引入。

### 10.2 runner 冒烟（真机）

在 `apps/ios/tests/` 新增 `phone-runner-smoke.sh`：

1. 校验 `TOMATO_IPHONE_UDID` 已设置，否则跳过。
2. 在真机上启动 runner（M0 阶段用 `xcodebuild test-without-building -destination id=$TOMATO_IPHONE_UDID`；M2 之后改为调 `phoneDevice/relaunch`）。
3. 轮询 `http://<Mac 侧的 runner 端口>/health` 直到可用（runner 在设备上监听 `127.0.0.1`，从 Mac 侧经 usbmux 转发访问；转发方式在 M0 的 S1 里一并确认）。
4. `/pair` 走调试旁路：仅 DEBUG 构建、启动参数 `-TOMATO_RUNNER_AUTOPAIR` 时接受；release 构建里不存在该开关。
5. 依次断言：`observe` 能看到“设置”首页的“通用”；`tap` 后 `pageChanged` 为真；`typeText` 写入中文“你好 Tomato 123”后 `observe` 能读回；`launch` 与 `press(home)` 生效。
6. 输出 JSON 结果（每步耗时、成功与否），失败时退出码非 0 并打印最后一张截图路径。

### 10.3 Host 侧

- 单元测试（不需要真机）：`DeviceLink` 的关联、串行、超时、cancel、断线拒绝、迟到结果丢弃；`consent` 的授权与确认流程；工具结果格式。用伪链路（进程内的假 runner 传输）驱动。
- Host 集成测试（不需要真机）：参照 `packages/api/gateway/tests/gateway-stream.host.spec.ts`，用 WebSocket 客户端扮演 runner，完整走 `phone/attach` → 命令 → `phone/result`。
- 录制会话快照（不需要真机）：在 `snapshots/` 下新增一个场景，“伪 runner”作为测试客户端经公开协议 attach，提供一组脚本化屏幕，回放 Agent 完成“看电量”的会话。按 `snapshots/AGENTS.md`：经 `tomato` CLI 与正式 profile 启动，不新增应用入口。
- 以上三类用伪设备是刻意的：它们验证 Host 的协议与状态机，不验证设备行为；设备行为只由 §10.2 与 §10.4 的真机测试负责。伪设备不得被当成真机验收的证据。

### 10.4 真机验收清单

每个里程碑结束，在真机上逐项执行该里程碑的“验收”，并在 PR 描述里记录：设备型号、iOS 版本、Xcode 版本、证书剩余天数、每一项的结果与耗时。

## 11. 风险与开放问题

| 风险 | 影响 | 缓解 |
|---|---|---|
| Xcode 或 iOS 升级导致私有 XCTest API 变化 | 合成触摸失效 | S3 退路为公开 API；私有 API 调用集中在 `Input.swift` 与 `XCTestPrivate.h` |
| runner 持有 owner Cookie（M1） | runner 被攻破即等于 Host 被接管 | 只存内存；Loopback 需 key；M2 改为设备级凭据 |
| 手机上其他 App 访问 127.0.0.1:8200 | 被他人控制 | Bearer key + 通知审批配对；`/health` 不泄露敏感信息 |
| 提示注入（屏幕内容诱导模型） | 越权操作 | 风险门确定性拦截；系统提示声明屏幕内容是不可信数据；会话级授权 |
| 免费团队 7 天到期且 Mac 长期不可达 | runner 与 App 都无法启动 | 设备卡提前 48 小时提醒；M4 可选手机自启动（仍受 7 天限制） |
| 每次启动 runner 可能要求输入密码 | 无人值守时启动失败 | 锁屏不拉起；状态显示“需要解锁” |
| 长时间运行占用电量与内存 | 被系统杀掉 | 空闲时不做观测；runner 不做视频流；ScreenSettle 有上限 |
| 抓取第三方 App 内容可能违反其服务条款 | 法律风险 | README 与首次授权文案提示只操作自有设备与账号 |

**开放问题**（M0 结束时给出结论）：S1–S10 的结果；`xcodebuild` 是否需要常驻；中文输入方式；前台 App 识别方式。

## 12. 里程碑 M4（可选）：手机自启动

只有当用户明确需要“Mac 长期不可达也能恢复”时才做。

- App 内嵌 idevice xcframework（MIT，用固定版本的 release 资产，脚本拉取，不提交）。
- 用户从 App Store 安装 LocalDevVPN（免费团队签不了自己的 VPN 扩展）；App 通过 `localdevvpn://enable?scheme=tomato` 调起并返回。
- 首次在 Mac 上执行 `idevice-tools rppairing pair <name> pairingFile.plist`，生成 RemotePairing 格式的配对文件；可由 DeviceManager 自动生成，并通过已有配对链路推送给 App 保存到 Keychain。
- App 内：经 `10.7.0.1` 建立 RSD 隧道 → 下载并挂载 DDI → 启动 runner。设计参照 iCTRL 的 `iCTRLApp/DDI/`（Apache-2.0）。
- 代价：占用第 3 个侧载名额；只能在 Wi‑Fi 下工作；与其他 VPN 互斥；仍受 7 天签名限制。

## 13. 参考资料

- iCTRL（Apache-2.0）：<https://github.com/OpenMinis/iCTRL> —— 常驻 runner、合成触摸、有界快照、OCR 兜底、通知控制、loopback 配对。
- WebDriverAgent：<https://github.com/appium/WebDriverAgent> —— 常驻 XCUITest 与“不让测试失败”的写法。
- idevice（MIT）：<https://github.com/jkcoxson/idevice> —— `xctest`、`core_device_proxy`、`mobile_image_mounter`（M4）。
- iphone-use-app（AGPL，只读设计）：<https://github.com/EliotAndres/iphone-use-app> —— 手机大脑的交互、模型选择、评测方法。
- leeguooooo/iphone-use（PolyForm Shield，只读设计）：<https://github.com/leeguooooo/iphone-use> —— 动作结果语义、lease、空闲释放、`/agent/task` 接口形态。
- LocalDevVPN：<https://apps.apple.com/app/localdevvpn/id6755608044>
- 仓库内：`packages/experimental/cua`、`packages/api/robot-controller`、`packages/api/gateway/src/stream-protocol.ts`、`apps/ios/TomatoRemote/Net/`。

## 14. 工作量与顺序汇总

| 里程碑 | 预计 | 依赖 | 主要产出 |
|---|---|---|---|
| M0 | 已完成（1 天） | 无 | TomatoRunner、Loopback、协议、App 设备卡；见 §6 |
| M1 | 已实现，待收尾 | M0 | `phone-use` Host 插件、HostLink、工具与确认；网关集成测试与 bundle 待补 |
| M2 | 已实现，待真机验收 | M1 | `phone-use-macos` DeviceManager、bundle 行；见 §8 |
| M3 | 已实现，模型实测待 Key | M0 | 手机大脑、模型设置、任务页；见 §9 |
| M4 | 1–2 周（可选） | M0 | 手机自启动 |
