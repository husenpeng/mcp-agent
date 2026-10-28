# 0008. 初始欢迎窗登录成功后主动刷新工作区账户

- 状态：Accepted
- 日期：2026-10-27
- 影响范围：`apps/desktop/src/main.ts`、桌面登录态测试

## 背景

工作区主窗口在欢迎窗出现前就已创建，客户端插件随之挂载并读取一次 `/api/auth/session`。用户在欢迎窗完成飞书登录后，主进程只在「从工作区打开欢迎窗」的路径发送 `dsh-desktop:account-changed`；初始欢迎窗的路径只调用 `enterWorkspace()`，而该导航命中启动时缓存的 URL，不会重新加载页面。结果：网关与会话文件已是登录态，侧栏与设置页仍停留在启动时读到的「未登录」，直到窗口重新获得焦点才通过 focus 刷新恢复。

## 决策

- 初始欢迎窗登录成功时，`enterWorkspace()` 完成后向主窗口发送一次 `dsh-desktop:account-changed`。
- 从工作区打开欢迎窗的路径保持原有行为：关闭欢迎窗并立即发送同一事件。
- 不依赖窗口焦点或可见性事件：`showInactive()` 不保证触发 focus，客户端不能把登录态正确性建立在用户后续操作上。
- 登录失败、取消、登出与重试逻辑不变；账户页与侧栏菜单的「重试」仍读取同一 `/api/auth/session` 投影。

## 备选方案

- 登录成功后强制重新导航工作区：丢弃当前页面状态，且启动缓存的存在就是为了避免重复加载。
- 只在客户端监听 focus / visibilitychange：焦点事件在 Electron `showInactive()` 下不可靠，属于隐式时序依赖。
- 客户端定时轮询会话接口：为一次状态变更引入持续请求与延迟窗口。

## 后果

- 初始欢迎窗登录成功后，侧栏账户与设置页立即显示登录用户，无需手动聚焦或刷新。
- 每次登录成功最多多一次账户投影请求；会话读取走本地网关，不增加 auth_service 之外的往返。
- 从工作区再次登录与登出的通知路径不变。

## 验证

- `pnpm exec vitest run apps/desktop/tests/main-startup.spec.ts -t "refreshes the workspace account after an initial welcome sign-in"`：新增用例在修复前失败（只观察到 `enter-workspace`），修复后通过。
- `pnpm exec vitest run apps/desktop/tests/main-startup.spec.ts apps/desktop/tests/tomato-auth.spec.ts packages/tomato/account/tests/account.client.spec.tsx`：144 个用例通过。
- `pnpm run build:check`：Host/Client 两个 aggregate 通过。
- 手工链路（本地假 auth_service 与假 BFF）：初始欢迎窗登录成功后工作区立即显示用户；停掉 auth_service 后账户页显示不可用，服务恢复后点击「重试」恢复为已登录。

## 未决

- 开发态曾观察到工作区根渲染报 `scope 'session-maybe' rendered without an installed adapter`，与本决策无直接关系，另案排查。
- 打包桌面端仍未解决每用户登录地址分发之外的密钥/会话轮换问题。