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
- 图表共享渲染：`Session/MermaidRenderer.swift`、`Session/MermaidView.swift`；用过图表的设备在启动 3s 后预热运行时（`mermaid.hasRendered`），并发同图去重；主题按 `TomatoToken` 与明暗模式注入（`Session/MermaidTheme.swift`），失败时回到可复制的源码。运行时由 `Resources/mermaid/render.html` 以 `<script src="mermaid.min.js">` 引入，不再作为 3.4MB 的 `WKUserScript` 注入；页面加载有 8s 上限，WebKit 渲染进程退出后重建；快照高度上限 10,000pt、单张 8MP，内存警告时清空快照缓存。
- 启动期磁盘与格式化：`Diagnostics/AppLog.swift` 的时间戳改为按需格式化，`Diagnostics/LogStorage.swift` 的目录创建与文件打开都在日志写队列内首次发生；`PhoneAgent/AgentCore.swift` 的 `loadHistoryIfNeeded()` 用 `Task.detached` 读会话历史，由 Tomato Phone 页面的 `.task` 触发，不再放在 `PhoneAgentModel.init`。
- 崩溃记录：`Diagnostics/CrashGuard.swift` 的信号处理器只调用 `write(2)` 写预开文件描述符（`tomato-crash 2` 文本），异常处理器保留栈；下次启动 `previousRecord()` 解析并上报。
- 图表全屏：点按图打开矢量视图，内置 `svg-pan-zoom` 3.6.2 提供双指缩放与拖动；全屏视图复用渲染器返回的 SVG，不再解析第二遍。两套第三方许可放在 `TomatoRemote/Resources/mermaid/`。
- 无限动画移除：`Design/Components.swift`（`RunningDot`）、`Session/ChatView.swift`（进度图标）。
- 悬浮切页球：`Design/FloatingTabBar.swift`（`tomatoFloatingTabs()`）；每个根页隐藏原生标签栏并把球放在自己的内容层，推入对话时球随根页一起消失。展开时用 `bgMask2 → bgMask1` 的全屏渐变遮罩（含底部安全区），面板改用 `regularMaterial` 保持可读；球和面板共用一个 `FloatingTabMenuState`，输入框页面用 `showsBall: false` 从自己的按钮打开同一个面板。UI 测试通过 `app.tabBall` / `app.tab.<id>` 操作。
- 紧凑页头：`Home/HomeView.swift` 隐藏导航栏，用左对齐的标题 + 说明代替大标题（`home.header`）；会话保留 inline 系统标题与搜索。智能体/群聊/账号的说明移入内容或列表 header（`PageCaption`），不再用 iOS 26 的 `navigationSubtitle`——那会把列表首行顶到字幕下方。
- Tomato Phone 底部：不再预留悬浮球条，页面入口是输入框模型行里的 30pt 网格按钮（`phone.tabMenu`），输入框贴到底部安全区。
- 流式性能：`Session/MessageRows.swift` 的 `AssistantRow` 在 `pending` 时只画 inline 文本，结束后才走块级 Markdown 与 Mermaid，避免每个分片重新解析并触发图表渲染。
- 对话输入框：`Session/ChatView.swift` 把 composer 放在滚动区的兄弟位置，不再作为 ScrollView 的 `safeAreaInset`。iOS 26 在键盘收起后可能让 inset 停在旧键盘高度，输入框会悬在正文中间、正文从其下方穿出；固定 VStack 消除这一状态。底部材质仍延伸进安全区。
- 对话状态：`Session/ChatStatus.swift`（`ChatActivity`）与 `ChatModel` 的 `turnStartedAt` / `awaitingTurn`；顶部胶囊与转录末尾的 live 行共用一套文案，完成时有一次触觉反馈。Tomato Phone 的本机对话在分段控件下显示同一组阶段（思考/写回答/工具）与秒数，完成时同样有一次触觉反馈。
- Tomato Phone 正文：本地 agent 的回答改用 `MarkdownView`，与 Host 对话一样渲染标题、代码块和 Mermaid；流式阶段仍用纯文本气泡，避免每个分片触发图表渲染。
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

## 第 3 轮（2026-11-13，模拟器 / Debug / Mock Host）：启动卡顿与异常结束

> 环境：iPhone 18 Pro 模拟器（iOS 27.0）、Debug 构建、Mock Host `127.0.0.1:43201`、`-TOMATO_FRAME_LOG`。数字只用于同一模拟器会话内的前后对比；真机数字仍待复测。

### 修复

| # | 现象 | 根因 | 处理与测量 |
|---|---|---|---|
| 1 | 启动约 3s 后一次 452–515ms 掉帧 | 预热把 3,572,661 字节运行时作为 `WKUserScript` 注入，主线程复制整份脚本 | 运行时改由 `Resources/mermaid/render.html` 的 `<script src>` 引入；同一安装内连续三次预热掉帧 88 / 110 / 135ms，WebView 创建 51–67ms（刚安装后的首次预热仍是 755ms） |
| 2 | 长历史时打开 Tomato Phone 卡顿，启动也可能被拖住 | `PhoneAgentModel.init` 在主线程解码全部会话 | 历史读取移到 `Task.detached`，由页面 `.task` 触发；4.3MB / 4 个会话的历史耗时 225ms，读取期间无 >50ms 掉帧 |
| 3 | 启动瞬间掉帧 | 首条日志在主线程初始化 `DateFormatter`（ICU），并建目录、打开日志文件 | 时间戳按需格式化；日志文件状态改为静态值，目录与句柄在写队列内首次创建 |
| 4 | 极高图表可能被系统终止 | 快照位图没有上限 | 高度上限 10,000pt、单张快照 8MP；缓存 6→4；收到内存警告时释放快照 |
| 5 | 异常结束后没有记录，看起来“无缘无故崩溃” | 信号处理器内做 JSON 编码并取 `NSLock`，可能在损坏的堆上死锁 | 信号路径改为预开 fd + `write(2)` 写纯文本记录，不分配、不加锁；异常路径保留栈 |
| 6 | 移除已发送照片偶尔崩溃 | `ForEach` 以 `\.offset` 为 id，删除后旧闭包按越界 offset 移除 | 照片改用 UUID 标识的 `StagedPhoto`，按 id 移除 |
| 7 | Host / 模型返回异常数字时崩溃 | `Int(Double)` 直接转换 | `finiteInt` 统一兜底（会话 turn、工具序号、token、目标轮数、设备事件） |

### 验证

- 单元测试：`TomatoRemoteTests` 全部通过；新增 `StartupRegressionTests`（数值兜底、会话目录延迟创建、渲染页与运行时随包发布）。
- 崩溃上报：`-TOMATO_OPEN_URL tomato://crash` 后 `crash.txt` 内容为 `tomato-crash 2 / signal 11 / time …`；下次启动运行日志出现“上次运行异常结束 | 信号 SIGSEGV (11)”。
- 图表：`tomato://session/s3` 在新页面下渲染成功（337pt 宽、674×780 快照）。
- 仍未解决：WebKit 进程启动后的首次页面加载约 1.2s；刚安装后的第一次预热最慢。真机需按第 2 轮脚本复核。

## 真机第 3 轮（2026-11-13，iPhone 15 Pro / iOS 26.5.2）：修复后复测与崩溃记录

> 设备：菲菲的iPhone（00008130-000829091E52001C），Debug 构建 v0.1.4 (5)，`devicectl` 安装；Host 为 Mac 局域网 Mock（`http://172.24.62.77:43201`）。测量走 App 内自驱（`-TOMATO_FRAME_LOG`、`-TOMATO_AUTOTOUR`、`-TOMATO_AUTOSCROLL`），不经过 XCUITest。

### 流畅度

| 场景 | 结果 |
|---|---|
| 冷启动到会话列表 | `session/list` 200 = 69ms；列表刷新 77ms；启动到 `active` 约 0.2s；首个 >50ms 掉帧出现在 1.7s 后的自驱滚动 |
| 五个标签 × 2 轮切页 | 50 / 71 / 94 / 85 / 54 / 62 / 82 ms，均落在切页与首帧 |
| 会话列表自驱滚动 | 1 次 50ms |
| 打开含图会话（s3） | 渲染器创建 17ms、页面加载 170ms、渲染完成 656×756；全程无 >50ms 掉帧 |
| 下次启动预热 | 创建 49ms、页面加载 184ms，预热期间 67ms 掉帧 |
| Tomato Phone 历史 | 3 个会话 42ms，后台读取，期间无掉帧 |

### 崩溃记录

- `-TOMATO_OPEN_URL tomato://crash` 连续两次：App 在 1s 后以 `SIGSEGV` 结束，`crash.txt` 分别写入 `tomato-crash 2 / signal 11 / time 1794565516` 与 `…1794565632`；进程列表中不再有主 App。
- 每次重启后运行日志都出现 `F crash 上次运行异常结束 | 信号 SIGSEGV (11)：进程收到 SIGSEGV (11)`，随后 `crash.txt` 被读走并截断为 0。
- 信号记录没有调用栈（栈由 MetricKit 提供），运行日志页只在有栈时才显示“查看调用栈”；设备截图确认崩溃横幅与这一状态正常。

### 复跑

```sh
xcrun devicectl device process launch --device <UDID> --terminate-existing ai.tomato.remote \
  -TOMATO_NO_LOCK -TOMATO_FRAME_LOG -TOMATO_PREVIEW_PAIRING http://<mac-lan-ip>:43201 \
  -TOMATO_AUTOTOUR -TOMATO_AUTOSCROLL -TOMATO_OPEN_URL tomato://sessions
xcrun devicectl device copy from --device <UDID> --domain-type appDataContainer \
  --domain-identifier ai.tomato.remote \
  --source "Library/Application Support/TomatoRemote/logs/tomato-remote.log" --destination /tmp/device.log

## 第 4 轮（2026-11-14，模拟器 / Debug / QA fixture 43202）：流式合帧、按压反馈与交互防抖

> 环境：iPhone 18 Pro 模拟器（iOS 27.0）、Debug 构建、fixture-qa（`127.0.0.1:43202`）、`-TOMATO_FRAME_LOG -TOMATO_AUTOTOUR -TOMATO_AUTOSCROLL`，不经过 XCUITest。数字只用于同一模拟器会话内的前后对比；真机仍待复测。

### 修复

| # | 现象（修复前实测） | 根因 | 处理与测量 |
|---|---|---|---|
| 1 | 自驱滚动期间一次 640ms 掉帧 | Mermaid 预热在启动后盲等 3s 就在主线程建 WKWebView（创建 378ms），撞上用户首次滚动 | 预热改为等「无切页 ≥2s」再跑、20s 上限兜底（`App.swift`）；同场景最大掉帧 640→148ms，WebView 创建 378→73ms |
| 2 | 「账号」356ms、「今天·刷新」254ms 掉帧 | `HomeModel.readGoal` 对前 5 个会话串行发 `session/projections`；列表自带的 projections 提示块未被利用 | 先读提示块（零网络），缺失时 TaskGroup 并行回源（`Home/HomeModel.swift`）；今天刷新 61→26ms |
| 3 | 流式回答每个 token 触发整表重算 | `streamingText += text` 是逐 chunk 的 `@Published` 发布，无合帧 | 增量进 `pendingStreamText`、80ms 合帧发布（`Session/ChatModel.swift`），与既有 60ms `scheduleFlush` 同构 |
| 4 | 工具卡每次 body 重解析整段 arguments JSON | `ToolDetail.summary` 是计算属性 | 改为构造时算一次的存储属性（arguments 在 call 事件后不可变，`Session/ChatTranscript.swift`） |
| 5 | 全 App 点击无按压反馈，"点了像没点" | 40 处自定义控件用 `.buttonStyle(.plain)` | 新增共享 `TomatoPressableStyle`（按压降透明 + 微缩）并统一替换（`Design/Components.swift`） |
| 6 | 键盘"发送"键无效 | 多行 TextField 的回车只插换行，`onSubmit` 不触发 | `.onKeyPress(.return)`：有内容即发送，空则回落换行（`Session/ComposerView.swift`） |
| 7 | 双击会话行推入两个同名页；双击"创建"建两个会话 | 无重入防护 | `open()` 0.6s 同 id 防抖；`createSession` 加 `!isCreatingSession` 前置守卫 |
| 8 | Sheet 关闭按钮 28pt，小于 44pt 最小触控 | `SheetChrome` 固定 28pt | 视觉保持 28pt 圆，触控区扩到 44pt |
| 9 | `ChatRowsTests` 两个用例必失败 | `launchRich()` 回退到已不存在的 43199 端口 | 回退改为 43201；两用例转绿（20.2s / 9.7s） |

### 前后对比（同一模拟器、同一自驱脚本）

| 指标 | 修复前 13:28 | 修复后 14:09 |
|---|---|---|
| 最大掉帧 | 640ms | 148ms |
| >200ms 掉帧次数 | 3 | 0 |
| 掉帧合计 | ~1901ms | ~1117ms |
| 剩余掉帧分布 | 51–640ms | 79–148ms（均为切页首帧） |

### 验证

- 单元测试 `TomatoRemoteTests` 全绿。
- `ChatRowsTests` 的 `testDiagramOpensFullScreen` / `testRichAnswerRendersDiagramAndCode` 通过；截图确认 Mermaid 流程图与代码块渲染正常。
- 其余 UI 用例因 `TOMATO_UITEST_HOST` 无法经 xcodebuild 传入测试运行器而 skip（既有 harness 限制，非本轮引入）。

### 尚未解决 / 下一轮

1. 切页首帧 79–148ms 仍是最大头，需真机复核（第 2/3 轮真机为 50–94ms）。
2. 渲染/主线程审计余量：PhoneAgent 本地 agent 每条消息全量落盘（`PhoneAgent/AgentCore.swift` persist）、SSE 解析与请求体构建在 MainActor、照片行同步读盘解码（`PhoneAgent/PhoneAgentView.swift`）；`ChatView` 订阅 `AppModel.sessions` 使列表事件重渲染打开的转录；Mermaid 快照缓存仅 4 项。
3. 交互审计余量：NewSessionSheet 键盘陷阱、Composer 工具条 30–34pt 触控区、代码块复制按钮约 12pt、`InteractionSheetTests` 期望过期（待处理/完成 vs 实际 SheetHeader/关闭）。
4. 「单条超长回答打开即空白」的复现用例已不在夹具中（s6 现为 120 条独立消息），需补一条单消息 120 段的 fixture 再修。

## 第 5 轮（2026-11-14，模拟器 / Debug）：Phone 持久化离主、转录与列表解耦、触控与键盘余量

> 环境同第 4 轮。本轮帧数字**不作前后对比**：测量期间宿主 load average 13–26，且模拟器冷 WebKit 使预热的 WebView 创建达 390ms（第 2/3 轮真机为 17–49ms），两者都远超代码改动的量级；真机复测才是权威。

### 修复

| # | 问题 | 根因 | 处理 |
|---|---|---|---|
| 1 | Tomato Phone 每条消息在主线程全量 JSON 编码 + 原子写 | `AgentCore.persist()` 同步调 `PhoneConversationStore.save` | 值拷贝后 `Task.detached` 写；单写串行、只保留最新快照防乱序覆盖；失败仍回主线程报横幅（`PhoneAgent/AgentCore.swift`） |
| 2 | 任一会话的列表事件重渲染打开着的转录 | `ChatView.body` 经 `liveness` 读 `AppModel.sessions` | 读取移入零尺寸 `LivenessBridge` 子视图，只有它订阅列表（`Session/ChatView.swift`） |
| 3 | Composer 工具条 30/34pt 触控区 | 固定 frame + 圆形 contentShape | `contentShape(Circle().inset(by: -5/-7))` 扩到 44pt，不改布局（`Session/ComposerView.swift`） |
| 4 | 代码块复制按钮约 12pt | caption2 字形无 frame | 44×30 frame + contentShape，并换按压样式（`Session/MarkdownView.swift`） |
| 5 | NewSessionSheet 输入路径后键盘盖住"创建"且无法收起 | List 无 scrollDismissesKeyboard、无键盘工具条 | `.scrollDismissesKeyboard(.interactively)` + 键盘"完成"（`Session/SessionListView.swift`） |
| 6 | Mermaid 预热仍可能撞首屏加载 | "还没切页"被当成空闲 | 启动后先给首屏加载 6s 独立窗口，再要求 2s 无切页（`App.swift`） |
| 7 | `InteractionSheetTests` 期望过期 | 断言 navigationBar/完成，实际是自绘 SheetHeader/关闭 | 改为 `待处理` 前缀 staticText + `关闭` 按钮 |

### 验证

- 单元测试 `TomatoRemoteTests` 全绿（含覆盖持久化路径的 `PhoneConversationsTests`）。
- 截图确认 `LivenessBridge` 之后状态胶囊（"等待你确认 1"）、代码块复制按钮、审批横幅、运行中停止按钮均正常渲染。

### 尚未解决 / 下一轮

1. 切页首帧与预热成本需真机复核（模拟器冷 WebKit 与宿主负载均不可比）。
2. PhoneAgent 的 SSE 解析循环与请求体构建仍在 MainActor（`PhoneAgent/AgentCore.swift` 的 `turn()`）。
3. 照片行同步读盘 + 全尺寸解码（`PhoneAgent/PhoneAgentView.swift`）。
4. Mermaid 快照缓存仅 4 项，多图转录回滚会重渲染；应改成本型 NSCache 并在 `init` 同步播种命中。
5. 「单条超长回答打开即空白」仍缺复现用例。

## 第 6 轮（2026-11-14，模拟器 / Debug）：行 Equatable、Mermaid 缓存扩容、超长单条回答复核

### 修复

| # | 问题 | 根因 | 处理 |
|---|---|---|---|
| 1 | 转录每追加一行/每次流式合帧，所有已实现行重渲染 | 行视图带闭包，SwiftUI 无法证明相等 | `UserRow`/`UserImageRow`/`ToolCard`/`ProcessGroup` 手写 `Equatable`（只比数据，闭包仅转发点击；照片库按身份比），`AssistantRow` 合成 `Equatable`；调用点加 `.equatable()`。`@ObservedObject` 的照片更新仍自行失效 |
| 2 | 多图转录回滚逐张重渲染 + 缓存命中仍闪一帧占位并跳高 | 快照缓存仅 4 项；`@State diagram` 随行回收丢失，`.task` 首帧后才查缓存 | 缓存 4→12；新增 `cachedAnyWidth(source:)`，`MermaidView.init` 同步播种命中结果 |
| 3 | 「单条超长回答打开即空白」 | 复核 | **当前构建无法复现**。补了单条 120 段消息的夹具（`/tmp/fixture-huge.mjs`，43203）深链打开：视口落在本轮开头（用户气泡 + 第 1 段），这是 `anchorNewestTurn` 的既定设计（长回答钉底部会既看不到提问也看不到回答开头），非空白。真机仍待复核 |
| 4 | ForEach 用内容派生的块 id：两条分隔线或两段相同代码会撞 identity，且每次 body 重拼整条消息的 id 字符串 | `MarkdownBlock.id` 嵌入整段内容 | `MarkdownView` 改用索引 identity（settled 消息的块不移动，索引稳定且 O(1)） |

### 验证

- 构建通过；单元测试 `TomatoRemoteTests` 全绿。
- 截图确认单条 120 段消息正常渲染且锚定在本轮开头。

### 尚未解决 / 下一轮

1. 切页首帧与预热成本需真机复核（模拟器冷 WebKit 与宿主负载均不可比）。
2. PhoneAgent 的 SSE 解析循环与请求体构建仍在 MainActor（`PhoneAgent/AgentCore.swift` 的 `turn()`）。
3. 照片行同步读盘 + 全尺寸解码（`PhoneAgent/PhoneAgentView.swift`）。
4. ~~`displayRows` 仍在每次 body 全量重组~~ → 第 7 轮已移入模型。`activityStartedAt` 反扫同轮消除。

## 第 7 轮（2026-11-14，模拟器 / Debug）：转录分组与运行中工具扫描移入模型

### 修复

| # | 问题 | 根因 | 处理 |
|---|---|---|---|
| 1 | `displayRows` 每次 body 全量重组（含 `isAnswer` 前瞻扫描），流式期间每帧一次 | 分组逻辑在视图 body | 移入 `ChatModel`：`entries` 与 `runningTool` 随新增的 `publishRows(_:)` 发布，三个 `rows` 赋值点（发送、发送失败回滚、flush）统一走它；body 只读 `chat.entries` |
| 2 | `activity` / `activityStartedAt` 每次 body 对 `rows` 做 `last(where:)` 反向 O(N) 扫描 | 扫描在视图 body | 改读 `chat.runningTool`（publish 时算一次） |

### 验证

- 构建通过；单元测试 `TomatoRemoteTests` 全绿。
- 截图确认 s1 转录渲染不变：Mermaid、代码块、状态胶囊（等待你确认 1）、审批横幅、运行中停止按钮均正常；串行 WebView 队列中第二张图仍按既有行为显示占位。

### 尚未解决 / 下一轮

1. 切页首帧与预热成本需真机复核（模拟器冷 WebKit 与宿主负载均不可比；两台真机当前均 unavailable）。
2. PhoneAgent 的 SSE 解析循环与请求体构建仍在 MainActor（`PhoneAgent/AgentCore.swift` 的 `turn()`）。
3. ~~照片行同步读盘 + 全尺寸解码~~ → 第 8 轮已修。

## 第 8 轮（2026-11-14，模拟器 / Debug）：照片解码离主与暂存照片一次解码

### 修复

| # | 问题 | 根因 | 处理 |
|---|---|---|---|
| 1 | Tomato Phone 照片行在 body 内同步读盘 + 全尺寸 JPEG 解码，只为画 156pt 缩略图 | `userRow` 直接 `imageData(for:)` + `UIImage(data:)` | 新增 `AgentPhotoTile`：`Task.detached` 内 ImageIO 降采样到 312px，NSCache 按附件 id 共享（`PhoneAgent/PhoneAgentView.swift`） |
| 2 | 暂存照片每次按键重解码整张原图 | `StagedPhoto.image` 是计算属性；Composer 的 chip 在 body 内 `UIImage(data:)` | 两处 `StagedPhoto` 改为 staging 时解码一次并存储；`attachmentChip` 改收 `StagedPhoto` 用其 image |

### 验证

- 构建通过；单元测试 `TomatoRemoteTests` 全绿。

### 尚未解决 / 下一轮

1. 切页首帧与预热成本需真机复核（两台真机当前均 unavailable）。
2. PhoneAgent 的 SSE 解析循环与请求体构建仍在 MainActor（`PhoneAgent/AgentCore.swift` 的 `turn()`）；改隔离域需要真实 provider 才能功能验证，留待有 provider/真机时做。

## 第 9 轮（2026-11-14，模拟器 / Debug）：交互余量批次

### 修复

| # | 问题 | 处理 |
|---|---|---|
| 1 | 被阻 agent 的 CTA 触控区过小：重试约 16pt、"等待你确认"胶囊约 24pt | 重试加 `frame(minHeight: 44)` + contentShape；胶囊 `contentShape(Rectangle().inset(by: -10))` 并换按压样式（`Session/ChatStatus.swift`） |
| 2 | "+N" 照片溢出块形似可点但点击无反应 | 改为 Button，打开第 4 张全屏（全屏内可滑动浏览其余），带按压反馈与无障碍标签（`Session/MessageRows.swift`） |
| 3 | InteractionSheet 输入自定义答案后键盘盖住下方卡片；选项行无选中态无障碍性状 | ScrollView 加 `.scrollDismissesKeyboard(.interactively)`；选项行加 `.accessibilityAddTraits(selected ? .isSelected : [])` |
| 4 | ToolDetailSheet / AgentSheet 的不透明 header 以 overlay 盖住滚动内容首行并吃掉其触摸 | 改 `.safeAreaInset(edge: .top)`，header 占据布局高度（`Session/ChatView.swift`） |
| 5 | 相对 Markdown 链接（如 `docs/x.md`）点击被静默丢弃，读起来像坏链接 | `ChatLink` 新增带 base 的初始化：无 scheme 且非绝对路径时相对会话 `workingDirectory` 解析为 hostFile；无 base 才保持 unresolved（`Session/ChatLinks.swift`、`Session/ChatView.swift`） |

### 验证

- 构建通过；单元测试 `TomatoRemoteTests` 全绿。

### 尚未解决 / 下一轮

1. 切页首帧与预热成本需真机复核（两台真机当前均 unavailable）。
2. PhoneAgent 的 SSE 解析与请求体构建离主（需真实 provider 功能验证）。
3. ~~相对 Markdown 链接被静默丢弃~~ → 本轮第 5 项已修。
4. ~~小于 44pt 的余量触控区扫尾~~ → 第 10 轮完成其中 4 处，余 2 处。

## 第 10 轮（2026-11-14，模拟器 / Debug）：触控区扫尾（4/6）

### 修复

| # | 位置 | 处理 |
|---|---|---|
| 1 | 跳到底部玻璃球 36×36 | 视觉不变，`contentShape(Circle().inset(by: -4))` 扩到 44pt（`Session/ChatView.swift`） |
| 2 | ProcessGroup 折叠头约 30pt | contentShape 负 inset 7pt（`Session/ProcessGroup.swift`） |
| 3 | ContextRow 披露头约 28–30pt | 同上（`Session/ContextRow.swift`） |
| 4 | ErrorBanner 重试为约 24pt 字形 | `frame(minHeight: 44)` + contentShape（`Design/Components.swift`） |

### 验证

- 构建通过；单元测试 `TomatoRemoteTests` 全绿。

### 尚未解决 / 下一轮

1. 切页首帧与预热成本需真机复核（两台真机当前均 unavailable）。
2. PhoneAgent 的 SSE 解析与请求体构建离主（需真实 provider 功能验证）。
3. ~~触控区余量 2 处~~ → 同轮补齐：Mermaid 全屏三控件 contentShape 扩到 44pt、VoiceInputBar minHeight 36→44。
4. 注意：本仓库存在并发写者（第 9 轮的 P2-2 由其落地）；后续轮次动手前先核对其活动状态。
```
