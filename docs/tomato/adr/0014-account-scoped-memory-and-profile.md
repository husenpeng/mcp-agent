# 0014. 记忆按登录账号隔离，并增加跨工作区的用户画像

- 状态：Accepted
- 日期：2026-10-29
- 影响范围：`packages/tomato/gateway`、`packages/experimental/memory`、`packages/experimental/tool-memory`、`packages/experimental/muse-bundle`

## 背景

[ADR 0012](0012-memory-and-focus.md) 的记忆只按项目目录隔离：同一台机器、同一目录下换一个账号登录，也能看到上一个人的记忆；关于这个人本身的事实（角色、工作语言、写作风格）只能逐个工作区重复保存。用户要求记忆按账号隔离，并有一份“用户画像”。

当时搁置这项的原因是：agent 与会话侧没有已验证的用户 id，只有网关在校验浏览器会话时知道是谁。约束：Desktop 每个安装只运行一个 Host；网关是私有的 `packages/tomato` 包，记忆是公开的实验包；不应为此修改会话头部或 `agent-loop`。

## 决策

- **账号来源**：`@tomato/gateway` 在配置了 `authServiceUrl` 时提供 `ctx.tomatoAccount`，只暴露 `current()` 与 `watch()`。状态为 `signed-in`（带已验证用户）、`signed-out` 或首次校验前的 `unknown`。`/api/auth/session` 校验有效时记录该用户；会话无效、登出、或请求不带会话时记为 `signed-out`；auth_service 不可达（`unavailable`）时保持原状态。未配置 `authServiceUrl` 时不提供该服务。
- **所有者**：每条记忆记录新增 `owner`。`ctx.tomatoAccount` 不存在时为本地所有者 `local`；存在且已登录时为 `account:<用户 id>`；存在但未登录或状态未知时，`ctx.memory.accessOf()` 返回 `sign-in-required`，所有工具以 `MEMORY_SIGN_IN_REQUIRED` 失败，`/memory` 提示先登录，快照不注入（之前已注入的会追加一条清除通知）。所有者在每次调用时读取，登录、切换账号即时生效；记忆服务通过 `ctx.get('tomatoAccount')` 读取，不把它列为注入依赖，因此网关出现或消失时不会重载服务。
- **范围**：记录新增 `scope`：`profile`（关于这个人，进入其所有者的每个工作区）或 `workspace`（带规范化项目路径）。同一所有者、同一范围内 `(entity, key)` 唯一。没有项目目录的会话只能看到和写入画像记忆。只有生效的工作区记录可以置顶；画像记录总会进入新会话，`pinned` 对它无效，`/memory pin` 会提示这一点。画像记录数受 `maxProfileRecords`（默认 100）限制，超出时以 `profile-full`（工具错误码 `MEMORY_PROFILE_FULL`）拒绝。
- **注入与工具**：`ctx.memory.snapshot()` 取代原来的 `pinned()`，先返回所有生效的画像记录，再返回至多 `maxPinnedRecords` 条置顶工作区记录；快照字节上限改名为 `maxSnapshotBytes`。`memory_write` 新增必填参数 `scope`；搜索结果与快照中的画像记录带 `profile` 标记。`/memory` 先列画像、再列本工作区记录，新增 `/memory profile` 只列画像。
- **存储**：`tomato_memory` 仍为版本 1、`single` 布局。该存储域尚未随任何版本发布，因此直接修改记录结构，不保留旧结构的读取路径。
- **依赖方向**：公开的 `@tomato/experimental-memory` 以可选 peer 依赖、仅类型导入的方式引用 `@tomato/gateway` 的服务声明；运行时只通过 `ctx.get` 读取。

## 备选方案

- **把账号 id 写入会话头部**：需要会话格式变更与迁移，而且旧会话没有该字段；账号在会话中途切换时，头部也无法表达。
- **由网关直接为记忆提供所有者**：会让网关知道记忆这一业务概念，违反“业务规则放在自己的包里”。
- **新建一个公开的账号接口包**：只有一个提供方和一个消费方，新增包的维护成本高于收益；`@tomato/web-app` 已经直接依赖私有的 tomato 包，可选 peer 依赖与现状一致。
- **未登录时退回本地所有者**：Desktop 在账号切换或登录过期时会把上一位用户的记忆展示给下一位，违背隔离目标。
- **画像记录也需要置顶才注入**：画像的意义就是始终可用；改为由快照字节上限约束体积。

## 后果

- 开启登录的 Host 上，记忆只对已登录账号可用；auth_service 首次校验完成之前（`unknown`）记忆也不可用。
- 本地所有者写入的记录不会出现在账号下，反之亦然；从未配置登录切换到配置登录后，原有记录不会自动迁移。
- `ctx.tomatoAccount` 跟随最近一次校验，而不是每个浏览器：多个浏览器以不同账号共用一个 Host 时，所有者会随校验切换。Desktop 每个安装一个 Host，不受影响。
- 画像记录变化后的第一轮快照会变大；快照总字节仍受 `maxSnapshotBytes` 限制，超出部分以“还有 N 条，请用 memory_search”替代。
- 不能在范围之间移动记录；要把工作区记忆改为画像记忆，需要以 `scope: profile` 重新保存并删除旧记录。

## 验证

- `pnpm exec vitest run packages/tomato/gateway`：覆盖账号从未知到已登录、`unavailable` 保持原状态、切换账号、会话无效/登出/请求不带会话时记为已退出、相同状态不重复通知、监听器失败被隔离、未配置 auth_service 时不提供服务，以及插件卸载后服务消失；`account-state.ts` 覆盖率 100%。
- `pnpm exec vitest run packages/experimental/memory packages/experimental/tool-memory`：覆盖所有者隔离、画像跨工作区可见、未登录时所有入口拒绝、切换账号后只看到自己的记忆、退出登录后撤回快照、无项目目录时只保存和注入画像、画像不可置顶、`profile-full`；两个包源码覆盖率均为 100%。
- 组合包测试通过真实 profile Loader 启动随包发布的三行：第一个会话保存一条工作区偏好和一条画像事实；同一工作区的新会话快照同时包含两者；另一个工作区的新会话只包含画像。
- `pnpm run verify-cordis-catalog`、`verify-doc-graphs`、`verify-tool-catalog`、`verify-config-catalog`、`verify-persistence-catalog` 通过。

## 未决

- 是否提供把本地所有者的记录迁移到账号下的入口。
- 是否需要按浏览器（而不是按 Host）区分账号。
