# Tomato Phone × 本地 agent_service 联调

> 环境：macOS 本地服务栈（`services-monorepo-im` + `client-monorepo`）。手机端 `v0.1.4 (5)` DEBUG 构建。
> 记录日期：2026-11-18。

## 本地服务

| 服务 | 端口 | 说明 |
|---|---|---|
| web BFF（Next.js） | 3000 | 手机唯一入口，路由 `/api/agent-v2/*` |
| auth_service | 8003 | 校验 `session_id`；用户库/会话库是测试环境的 RDS + Redis |
| agent_service | 8014 | 会话、轮、SSE、审批、附件 |
| im_service | 8013 | 本次未涉及 |

手机 → BFF 用的是**配对账号的会话**：auth_service 与测试部署共用同一套 Redis/RDS，所以在测试环境（`https://test.tomatoai.vip`）登录得到的 `session_id` 在本地 BFF 同样有效。

## 手机端配置

- 联调地址（DEBUG）：`Tomato Phone 设置 → 联调（DEBUG） → 服务端 Base URL`，真机填 `http://<Mac 主机名>.local:3000`（当前为 `http://UnderDogs-MacBook-Pro.local:3000`）。
  写入 `UserDefaults` 键 `phoneAgent.service.base`；留空时用飞书登录捕获的 BFF 地址。
- 用主机名而不是局域网 IP：Mac 的 IP 随 DHCP 换过几次（`172.24.60.56` → `172.24.62.81` → `172.24.60.45`），每次换 IP 手机上存的地址就失效，表现为「服务端连接失败」。`.local` 名字跟着 Mac 走，不用改。
- 启动参数优先于该值：`-TOMATO_SERVICE_BASE <origin>`。
- 账号会话存 `account.auth.debug`（DEBUG 镜像）与钥匙串 `account.session`。

## 连通性自测

`-TOMATO_SERVICE_PROBE <prompt>` 让 App 直连服务端跑一轮，结果写 `Documents/service-probe.json`（也会进日志）：

```sh
xcrun devicectl device process launch --device <UDID> --terminate-existing ai.tomato.remote -- \
  -TOMATO_NO_LOCK -TOMATO_SERVICE_PROBE "只回答四个字：真机流式"
xcrun devicectl device copy from --device <UDID> --domain-type appDataContainer \
  --domain-identifier ai.tomato.remote --source Documents/service-probe.json --destination /tmp/probe.json
```

模拟器同一套（先用 `simctl spawn <dev> defaults write` 写入 `account.auth.debug` 与 `phoneAgent.service.base`，2026-11-18 验证 cfprefsd 会忽略直接改容器 plist）。

## 本轮修的两个真问题

| # | 现象 | 根因 | 处理 |
|---|---|---|---|
| 1 | 提交后很快收到 `200 text/event-stream` 却收到 0 帧，界面只有提问、没有回答（服务端 `messages` 里答案已生成） | iOS 上 `URLSession.bytes(for:)` 的 `AsyncLineSequence` 一行都不产出；同样请求用 curl 和 Mac 端 `URLSession.bytes` 都能拿到帧 | 改用 `URLSessionDataDelegate` 按网卡到达的 chunk 收字节，按 `\n` 切帧（`AgentServiceStreamReader`） |
| 2 | 事件流在轮结束前被载体关闭（服务端 200/225 ms 就收尾，模型 5 s 后才产出答案），App 把"干净结束"当成轮结束，丢掉答案 | 客户端只按错误重连，干净结束直接退出循环 | 干净结束且未收到 `turn/end` 时按 `afterSeq` 续播（最多 5 次），仍失败则读 `messages` 补齐助手消息（`AgentCore.runService` / `recoverServiceTranscript`） |
| 3 | **下一轮开始时，上一轮的 agent 正文又弹出来** | 服务端按 `afterSeq` 续播：初始 `afterSeq=0` 会把**同会话更早轮次**的事件整段重放（实测第二轮流里先有第一轮的 seq 1–8），客户端逐条渲染，于是旧答案被再追加一次、旧的 `assistant/delta` 还会把正文回填进流式气泡 | ① 提轮流前先读会话头部 seq 作为起点（`messages?limit=1`）；② 只渲染 `turnId` 等于当前轮的事件，其余只推进 `lastSeq`（`AgentServiceEvent.belongsToTurn`）；③ 新增 `-TOMATO_SERVICE_PROBE_FOLLOWUP` 双轮自测 |

诊断行：`事件流已连 | HTTP 200 · text/event-stream`、`事件流结束 | 11 帧 · 最后 turn/end · 4485 字节`、`事件流提前结束，续播 | 第 N 次 · afterSeq N`。

## 验证结果（2026-11-18）

| 环境 | 服务地址 | 结果 |
|---|---|---|
| 模拟器 | `http://127.0.0.1:3000` | 用户「只回答三个字：字节流」→ 助手「字节流」，**11 帧 · turn/end · 4472 字节**，一次流完成 |
| 真机（菲菲的iPhone） | `http://172.24.62.81:3000`（读的是持久化设置，未用启动参数覆盖；该 IP 现已失效，改用 `http://UnderDogs-MacBook-Pro.local:3000`） | 用户「只回答四个字：真机流式」→ 助手「真机流式」，**11 帧 · turn/end · 4485 字节** |

服务端侧同时可见 `/api/v1/sessions` 201、`/turns` 202、`/stream` 200，模型为 `DeepSeek-V4.1-Flash`。唯一告警：`[skill] 拉取已安装技能失败`（本机未起 skill-service，服务端跳过本轮技能索引，不影响对话）。

单元测试 `TomatoRemoteTests` 109 项通过。

## 流式输出与交互样式（2026-11-18 第二轮）

### 流式

- 服务端对一轮会发 `assistant/delta`（实测 8–19 条）再发 `assistant/message`。客户端改为数据代理逐块读取后，首帧 259–920 ms 到达，整轮 19–36 帧，界面按增量刷新；修复前是整段答案在响应结束时一次性出现（看起来"没有流式"）。
- 日志：`首帧到达 | 269 ms · connected`、`事件流结束 | 36 帧 · 首帧 269 ms`。
- 兜底仍保留：流在 `turn/end` 前结束会按 `afterSeq` 续播，最多 5 次，再失败改读 `messages`。

### 样式

| 位置 | 改动 |
|---|---|
| 回答 | 左侧品牌「T」圆标 + 回答卡片，正文与气泡内边距重排；同一轮的多段回答共用一张卡 |
| 提问 | 气泡收窄到 300pt，右下角改小圆角形成朝向，红色渐变保持原样 |
| 流式中的回答 | 与最终回答同一张卡，末尾是一根静态光标（不做无限动画，避免帧探针/UI 测试判定卡死） |
| 运行状态 | 从裸文字改为胶囊：spinner + 阶段 + 秒数（`正在写回答… 12s`），与列表留白一致 |
| 输入区 | 运行中停止键改为品牌红实心圆；其余（模型芯片、附件栏）位置不变 |

截图：`screenshots/phone-streaming.png`（流式中，末尾有光标）、`screenshots/phone-answer.png`（完成态）。

单元测试 `TomatoRemoteTests` 109 项通过；真机（菲菲的iPhone）实测首帧 920 ms、29 帧、12 秒流式完成。

## 修复：上一轮正文在新一轮弹出（2026-11-18 第三轮）

服务端事件日志是**会话级**的，`GET /turns/{turnId}/stream?afterSeq=` 会从给定 seq 起把会话里更早轮次的事件一起回放。App 之前每次都以 `afterSeq=0` 开始，于是第二轮一开始就把第一轮的 `assistant/message`（以及 `/delta`）重新渲染了一遍。

修复后：
- 起点改为"提交本轮之前会话的头部 seq"，不再从头回放；
- 即便回放，也按事件的 `turnId` 过滤，不属于当前轮的只推进 seq、不渲染；
- `recoverServiceTranscript` 同步受影响（它按 `seq > afterSeq` 读消息，起点正确后才不会补进旧答案）。

验证（双轮自测：`-TOMATO_SERVICE_PROBE "只回答两个字：甲" -TOMATO_SERVICE_PROBE_FOLLOWUP "只回答两个字：乙"`）：

| 环境 | 结果 |
|---|---|
| 模拟器 | 记录 4 条：用户甲 / 助手甲 / 用户乙 / 助手乙，无重复 |
| 真机 | 同上 4 条 |

单元测试新增 `testEventOwnershipFollowsTheTurnId`、`testEventWithoutATurnStillCounts`，共 111 项通过。

## 修复：图片与 PDF 传不上去（2026-11-18 第四轮）

现象：任何模型（含 `claude-opus-5-5`）下点附件都失败，容易被误判成"这个模型不支持图片 / PDF"。

根因：`POST /api/agent-v2/attachments` 把上传绑定到会话，`sessionId` 是必填 multipart 字段；手机只发了 `file`，于是每次上传都被 `400 / 40001 请求参数不合法 · sessionId Field required` 挡下，附件的 `attachmentId` 从未拿到，这一轮自然没有附件。

修复：`AgentServiceClient.uploadAttachment` 增加 `sessionId` 参数并作为表单字段随文件提交，调用方传入本轮已经建好的会话 id。

验证：
- 直接打服务端：同一登录会话、`model_route: claude-opus-5-5` 建会话 → 带 `sessionId` 上传 PDF（`rawChars: 35`）→ 发一轮"附件里写的是什么" → 模型回 `TOMATO-PDF-42`，证明路由本身能吃 PDF。
- 单元测试 `AgentServiceUploadTests` 校验 multipart 里的 `sessionId` 与 `file` 两段、以及拒绝时回传服务端文案；`TomatoRemoteTests` 113 项全部通过。

仍未覆盖：PDF 仍是手机端用 PDFKit 抽文本后按 `.txt` 上传，扫描件（无文本层）会在选文件时就报"无法读取这份 PDF"，长文档截到 6 万字；需要原文解析时应改为上传原始 PDF 字节，交给服务端解析。
