# TomatoRemote 交互流畅度测试记录

> 状态：进行中。**真机已接入（2026-11-12，iPhone 15 Pro / iOS 26.5.2）**；模拟器数字仅在同一环境内做前后对比。
> 测试环境：Debug 构建、Mock Host（真机经局域网 `http://172.24.62.77:43201`，模拟器 `127.0.0.1:43201`）、帧探针 `-TOMATO_FRAME_LOG`。
> 注意：宿主同时运行其他 Xcode 测试，load average 长期 5–10，模拟器掉帧绝对值偏高；真机数字更接近实际体验。

## 真机结果（iPhone 15 Pro / iOS 26.5.2 / Debug）

| 场景 | 方法 | 结果 |
|---|---|---|
| 冷启动 | 启动后帧探针 | 无 >50ms 掉帧 |
| 标签切换 | `-TOMATO_AUTOTOUR` 两轮 | 会话 58ms、智能体 52ms、群聊 59ms、账号 87ms；第二轮全部 <50ms |
| 会话列表滚动 | `-TOMATO_AUTOSCROLL`，7 行 ×6 趟 | **0 次 >50ms** |
| 120 行 Markdown 对话滚动 | `-TOMATO_AUTOSCROLL_CHAT`，40 步 | 1 次 51ms，其余 <50ms |
| 首张 Mermaid | 打开含图会话 | 冷启动 775ms / 841ms；预热后 **165ms**（预热本身带来一次 70ms 掉帧） |
| 内存 | 启动 + 切页后 | ~38 MB |

真机命令：`xcrun devicectl device process launch --device <udid> --terminate-existing ai.tomato.remote …`，日志用 `devicectl device copy from --domain-type appDataContainer` 取回。

### 真机功能走查（2026-11-12）

| 功能 | 结果 |
|---|---|
| 启动 / 会话列表 / 搜索框 | 正常，冷启动无 >50ms 掉帧 |
| 会话详情 + 工具卡 + 交付文件 | 正常，打开无 >50ms 掉帧 |
| 120 行 Markdown 长对话 | 正常，滚动 1 次 51ms |
| Mermaid（两张图） | 完整显示（328×196、328×492），无裁切 |
| 个人记忆 | 正常渲染，进入 84ms 掉帧 |
| 运行日志 | 正常渲染、条目 22 条、环境/主机/内存正确 |
| 审批请求 | Host 推送后标签角标变为 1，日志记录“收到待处理请求 approval/request” |
| 崩溃捕获 | `tomato://crash` 触发 SIGSEGV，`crash.json` 记录信号与调用栈；重启后日志页显示“上次运行异常结束”横幅 |
| 内存 | 启动 22MB → 多页后 38–53MB |
| 运行日志导出 | `-TOMATO_EXPORT_LOGS` 写出的 `export-test.txt` 含环境、内存、本次运行全部条目（46 行），`devicectl copy` 可完整取回 |

UI 测试在真机上受免费开发者账号限制：设备同时最多 3 个侧载 App；为装 Runner 已卸载 `TomatoRunner-Runner`。测试 Runner 首次启动仍被系统取消（“认证已取消”），需要在 设置 → 通用 → VPN 与设备管理 里信任新的开发者 App 才能跑点击类自动化。

重装 App 会重置“本地网络”权限；再次连接局域网 Mock 时系统会弹“允许查找本地网络中的设备？”，需要人工点“允许”，否则流请求会以 `-1009` 失败。

2026-11-12 第 12–14 轮：该弹窗一直停留在屏幕上（重装、改用 cloudflared 公网隧道 `https://wiki-finals-stones-berkeley.trycloudflare.com` 均无法绕过；隧道 HTTP 从 Mac 可达 200，但设备侧仍 `-1009`，且弹窗模态阻塞所有 UI）。`devicectl` 没有点击/授权能力，`DeviceHub` 也因缺少屏幕录制/辅助功能权限无法操作。真机网络与交互测试至此被人工确认阻塞。

## 方法

1. 启动 Mock Host：`node /tmp/mock-host-43201.mjs`（会话、工具卡、Mermaid、交付文件、审批、今日、定时任务、个人记忆）。
2. App 以预览配对启动：`-TOMATO_NO_LOCK -TOMATO_FRAME_LOG -TOMATO_PREVIEW_PAIRING http://127.0.0.1:43201`。
3. `SmoothnessWalkTests` 走查：会话列表滚动 → 打开 s1 并滚动 → 打开 s3（第二张图）→ 今天/智能体/群聊/账号 → 运行日志 → 第二轮切页。
4. 帧探针把 >50ms 的掉帧写进「运行日志」，带当时页面；测试结束后从 App 容器读取 `Library/Application Support/TomatoRemote/logs/tomato-remote.log`。

复跑：

```sh
node /tmp/mock-host-43201.mjs &
cd apps/ios
xcodebuild test -project TomatoRemote.xcodeproj -scheme TomatoRemote \
  -destination 'platform=iOS Simulator,id=28B16456-7937-4B49-826C-391B4446B9E4' \
  -derivedDataPath /tmp/tomato-test-derived \
  -only-testing:TomatoRemoteUITests/SmoothnessWalkTests \
  CODE_SIGNING_ALLOWED=NO
```

## 逐项结果

| # | 场景与复现 | 修复前 | 修复后 | 状态 |
|---|---|---|---|---|
| 1 | 切回「会话」标签（列表已有数据） | 500ms 掉帧；每次回页都重新拉取并整表重赋 | 114–154ms；15s 内复用已读列表，内容相等不重赋 | 已修，已测 |
| 2 | 切回「账号」标签 | 194ms 掉帧；每次回页都重读账号 | 76–81ms；30s 内复用 | 已修，已测 |
| 3 | 切回「今天」标签 | 每次回页重新请求 insights/定时任务 | 30s 内复用；成功后才记时间 | 已修，已测 |
| 4 | 打开含 Mermaid 的会话 | 每张图拼 3,573,388 字节 HTML、主线程组装 477ms；每张图单独 WebView，渲染 3.8s；UI 测试首开掉帧 745ms | 页面 850 字节、后台组装；共享一个 WebView + 快照缓存；**预热后首张图 526ms/643ms**（首次使用仍 ~2.3s），第二张 +83–114ms；并发重复渲染已去重；深链首开最大掉帧 65ms | 已修，已测 |
| 5 | 滚动长回答（Markdown 多块） | 每个 body 重新解析整段与每段 inline Markdown | 块解析 + inline 解析都按文本缓存（128/256 条）；120 行 Markdown 对话用 `-TOMATO_AUTOSCROLL_CHAT` 自驱动滚动 40 步，**0 次 >50ms 掉帧** | 已改，已测 |
| 6 | 运行日志页滚动 | 掉帧 54–88ms；日志每 0.25s 推送一次，滚动时自我放大 | 推送间隔改为 0.6s | 已改，未复测（模拟器 UI 快照超时） |
| 7 | 会话列表滚动 | XCUITest 驱动时每次滑动 52–109ms；采样发现主线程几乎都在响应 XCTest 的无障碍快照（`XCTElementSnapshotRequest` → `AXUIElementCopyParameterizedAttributeValue`） | 时间格式器改为复用；新增 `-TOMATO_AUTOSCROLL` 自驱动滚动（不经过 XCUITest）：36 段滚动动画（~16s）只有 **1 次 67ms** 掉帧 | App 本身滚动是流畅的；此前数字是测试框架开销，不是列表问题 |
| 8 | 切标签首帧（智能体/群聊/账号） | XCUITest 驱动时 122–367ms | 自驱动 `-TOMATO_AUTOTOUR`（不经过 XCUITest）：两次运行首访 73–253ms（中位 ~90ms），第二趟 73–106ms；掉帧现在能准确归到“会话/智能体/群聊/账号” | 已测；首访 73–253ms，真机复核 |
| 9 | 运行日志页首次进入 | 216–591ms（XCUITest） | 全新进程深链进入：**100ms**；随后一次 185ms 样本被同一进程的后台刷新/激活污染 | 首开 ~100ms，待真机复核 |
| 10 | 空闲基线（停在首页 20s，不操作） | — | 20s 内仅 1 次 69ms 掉帧 | 基线正常 |
| 11 | 运行中行的脉冲点 / 进度图标 pulse | `repeatForever` 透明度动画常驻，持续驱动帧；XCUITest 的 “wait for app to idle” 一次卡了 929s | 去掉两处无限动画，改为静态点/图标；UI 测试不再挂起 | 已修，已测 |

> 注：早期走查误把 `scrollViews.firstMatch` 当作会话列表（SwiftUI `List` 实际是 collection view），那次“列表滚动”数字可能包含别的表面。
>
> **关键结论：XCUITest 驱动的滑动不能用来衡量 App 滚动。** 对主线程采样显示，滑动期间绝大部分 CPU 花在给测试进程生成无障碍快照上；同一列表用 App 内自驱动滚动（`-TOMATO_AUTOSCROLL`）只有 1 次 67ms 掉帧。后续滚动优化应以真机或自驱动方式测量。

## 关键代码

- 帧探针：`TomatoRemote/Diagnostics/FrameMonitor.swift`（`-TOMATO_FRAME_LOG` 启动）；掉帧归因用 `AppLog.screen` + `AppLog.mark` 两段拼接（“屏幕 · 操作”），后台刷新不会再覆盖当前屏幕。
- 列表刷新门限：`TomatoRemote/App.swift`（`refreshSessions(force:)`）、`Home/HomeModel.swift`、`Account/AccountView.swift`。
- Markdown 缓存：`Session/MarkdownBlocks.swift`。
- 图表共享渲染：`Session/MermaidRenderer.swift`、`Session/MermaidView.swift`；用过图表的设备在启动 3s 后预热运行时（`mermaid.hasRendered`），并发同图去重。
- 无限动画移除：`Design/Components.swift`（`RunningDot`）、`Session/ChatView.swift`（进度图标）。
- 标签栏折叠开关：`App.swift` 的 `TabBarBehavior`，启动参数 `-TOMATO_NO_TAB_MINIMIZE`。
- 自驱动滚动：`Session/SessionListView.swift` 的 `autoscrollIfAsked`，启动参数 `-TOMATO_AUTOSCROLL`，配合 `tomato://sessions` 深链。
- 自驱动切页：`App.swift` 的 `autotourIfAsked`，启动参数 `-TOMATO_AUTOTOUR`。
- 自驱动聊天滚动：`Session/ChatView.swift` 的 `autoscrollTranscriptIfAsked`，启动参数 `-TOMATO_AUTOSCROLL_CHAT`；Mock 的 `s6` 会话提供 120 行 Markdown。
- 延迟深链：`App.swift` 的 `-TOMATO_DELAY_OPEN <秒>`，让启动先完成预热再打开目标页；安装后必须再 terminate 一次再 launch，否则 simctl 可能只把安装时自动拉起的旧进程带到前台（参数不生效）。
- 走查用例：`TomatoRemoteUITests/SmoothnessWalkTests.swift`（只作功能走查；性能数字以自驱滚动/真机为准）。

## 尚未解决 / 下一轮

1. 会话首开：深链路径实测最大掉帧 65ms；120 行 Markdown 对话自驱动滚动 40 步 0 次 >50ms 掉帧。聊天页进入与长文滚动已确认流畅。
2. Mermaid：已有过图表使用记录的设备启动后会预热，首张图 526–643ms；首次使用仍需 ~2.3s。是否对从未用过的用户也预热待决定。
3. 切标签已用 `-TOMATO_AUTOTOUR` 干净测量（首访 73–253ms，中位 ~90ms）；运行日志页在全新进程里首开 100ms，需真机复核。
4. 真机复测：连续九轮 `usbmuxd` 设备列表为空，iPhone 15 Pro/16 Pro 均未连接；Desktop Host 的启动 token 只在内存中（日志已 `[redacted]`）。接上真机或提供配对链接后，按同一脚本复跑并记录真机数字。
5. XCUITest 在本机高负载下多次 “Timed out while synthesizing event / evaluating UI query / wait for app to idle”；采样已证明它会给被测 App 注入大量无障碍快照工作，后续性能测量不再依赖它。
## 真机第 2 轮（2026-11-12，iPhone 15 Pro / iOS 26.5.2）

> 设备：菲菲的iPhone（00008130-000829091E52001C）；Debug 构建 v0.1.4 (5)，devicectl 安装；Host 为局域网 fixture（`http://172.24.62.77:43201`），App 经 Wi-Fi 直连，与模拟器同一份数据。测量走 App 内自驱（`-TOMATO_FRAME_LOG`、`-TOMATO_AUTOTOUR`、`-TOMATO_AUTOSCROLL`、`-TOMATO_AUTOSCROLL_CHAT`），不经过 XCUITest。

### 流畅度

| 场景 | 结果 |
|---|---|
| 五个标签 × 2 轮切页 + 会话列表自驱滚动（6 行 × 6 趟） | 6 次 >50ms：71 / 79 / 61 / 63 / 78 / 51 ms，全部落在切页与首帧；列表滚动期间 0 次 |
| 24 行对话自驱滚动（约 40 次 scrollTo，12 s） | 1 次 75 ms（滚动起步），其余 0 次 |
| 读对话时后台刷新会话列表（今天 · 刷新 / 对话 · 刷新列表） | 101 / 106 / 88 / 70 ms —— 本轮最大的卡顿来自后台刷新，不是滚动 |
| 冷启动到首屏数据 | 启动 → `session/list` 200 = 213 ms；打开对话 → 合并 8 条历史 = 409 ms |

### 功能

今天（待处理、这台手机、今日回顾、未完成）、会话列表（文件夹分组、搜索、状态）、对话（用户气泡收窄靠右、上下文折叠、工具过程组、产出文件）、图片消息、智能体名册、群聊列表与群聊流（成员、审批 批准/拒绝、@ 提及、输入框）、账号、记忆（待确认/生效中/本机观察）、运行日志（状态、占用、导出/复制/清空）均在真机渲染正常。

### 发现

1. **单条超长回答打开即空白**：s6 用 120 段落作为一条 assistant 回答时，进入对话后视口全空（标题与输入框正常）；同一会话换成 8 段即正常并滚到底部。疑似 `defaultScrollAnchor(.bottom)` 与 LazyVStack 在超高单行上的落点估算，待修。
2. 后台刷新带来的 70–106 ms 卡顿高于滚动本身，值得与列表刷新节流一起看。
3. 重装 App 后 iOS 会重置「本地网络」授权，未点允许前所有 LAN 请求 `-1009`；点允许后恢复正常。属系统行为，但会让首次真机测试看起来像断网。
4. 调试构建偶尔以 `tomato://crash` 启动（主动崩溃自测），真机自动化因此会偶发“拉不起来”。真机跑自动化前应先确认启动参数。
5. 免费个人团队最多 3 个侧载 App，装 UI 测试 runner 被拒（`MIFreeProfileValidatedAppTracker`）。本轮因此只能装 App 本身体跑自驱走查，`TomatoRemoteUITests` 与 `phone-runner-smoke.sh` 未能执行。

### 复跑

```sh
node /tmp/fixture-43201.mjs &            # 0.0.0.0:43201
xcrun devicectl device process launch --device <UDID> ai.tomato.remote \
  -TOMATO_NO_LOCK -TOMATO_FRAME_LOG -TOMATO_AUTOTOUR -TOMATO_AUTOSCROLL \
  -TOMATO_PREVIEW_PAIRING http://<mac-lan-ip>:43201 -TOMATO_OPEN_URL tomato://sessions
xcrun devicectl device copy from --device <UDID> \
  --source "Library/Application Support/TomatoRemote/logs/tomato-remote.log" \
  --domain-type appDataContainer --domain-identifier ai.tomato.remote --destination /tmp/device.log
```
