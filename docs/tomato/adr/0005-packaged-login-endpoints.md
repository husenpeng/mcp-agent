# 0005. 登录端点随打包环境封入应用 manifest

- 状态：Accepted
- 日期：2026-10-27
- 影响范围：`apps/desktop/scripts/`、`apps/desktop/src/`、打包模板

## 背景

桌面登录由本地网关承接：Host 启动时从 `process.env.AUTH_SERVICE_URL` 与 `process.env.TOMATO_WEB_URL` 读取 auth_service 与公司 BFF 的地址。此前安装包只能靠启动 shell 导出这两个变量，Dock/Finder 启动不会带上，用户看到 `login is not configured`（`packages/tomato/gateway/src/auth-routes.ts:94` 在两者为空或 BFF 地址非法时返回 503）。

登录地址是环境属性而不是用户偏好：test 包与 production 包应各自指向对应的服务，且不应把具体地址写死在仓库或每个用户的 shell 配置里。

## 决策

- 打包环境新增两个设置：`DSH_DESKTOP_AUTH_SERVICE_URL` 与 `DSH_DESKTOP_TOMATO_WEB_URL`，必须是 HTTP(S) origin（无凭据、路径、query、fragment），且必须成对出现。它们进入 `.env.macos` / `.env.windows`、机器预设 `presets/<test|production>.env`，由 CI 或打包机提供。
- `createElectronBuilderConfig` 把解析后的 origin 写进 electron-builder `extraMetadata` 的 `dshAuthServiceUrl` / `dshTomatoWebUrl`，随安装包的 `package.json` 一起发布；未配置时省略。
- 主进程启动时读取应用 manifest，得到封入值；显式启动环境变量 `AUTH_SERVICE_URL` / `TOMATO_WEB_URL` 逐字段覆盖封入值。最终值同时用于：
  - 注入 Host 子进程环境，让本地网关在启动时完成登录配置；
  - 账户菜单打开条款/隐私页时的公司 Web 基地址。
- 本地 unsigned 构建可以不提供这两个值，行为与之前一致：工作区可用，登录显示不可用。
- 开发态（`dev:desktop`）读取提交的 `apps/desktop/config/development.env`，把 `DSH_DESKTOP_*` 两个键映射成 `AUTH_SERVICE_URL` / `TOMATO_WEB_URL`；启动环境中的显式变量仍逐字段覆盖。开发地址是 localhost，生产地址不进入仓库。

## 备选方案

- 提交一份 dev/test/prod 地址映射到仓库：违反“环境地址不写进项目”的要求，且会让未获知的生产地址进入源码历史。
- 让用户把 export 写进登录 shell：Dock/Finder 启动依赖用户机器配置，无法随包分发，且同一台机器的不同环境无法共存。
- 把地址写进 desktop profile 的 `cordis.patch.yml`：同一份 profile 在开发、test、production 间共享，容易串环境，也无法由 CI 按打包预设注入。
- 只在启动时读环境、不封入 manifest：安装包仍无法自带登录地址。

## 后果

- 每个安装包自带其打包环境的登录端点；test 与 production 包可以并存在同一台机器。
- 登录地址来自打包配置而不是仓库；模板只保留空字段和校验规则。
- 运行时环境变量仍是最高优先级，便于支持与本地复现，但默认无需任何 shell 配置。
- 已安装的旧包不受影响：manifest 没有封入字段时继续读启动环境，登录不可用状态与之前一致。
- 打包预检对非法地址、只配一半的地址组合立即失败；未配地址的 unsigned 构建保持可用。

## 验证

- `pnpm exec vitest run apps/desktop/tests/login-environment.spec.ts apps/desktop/tests/login-packaging.spec.ts`：覆盖 manifest 读取、环境覆盖、非法 origin、打包元数据写入、预设读取与 ambient 环境剥离。
- `pnpm exec vitest run apps/desktop/tests`：桌面端全量单测通过。
- 打包产物验收：用 test 预设构建后不设置任何登录环境变量启动，登录应直接走打包地址；再设置 `AUTH_SERVICE_URL` 覆盖，确认账户菜单链接跟随覆盖值。

## 未决

- 公司 test/production 的实际 auth_service 与 BFF 地址仍需由打包机预设填写。