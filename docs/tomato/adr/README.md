# Tomato ADR

本目录记录 Tomato AI 的架构决策。代码完成后在同一改动内补充或更新 ADR；ADR 记录已经实现的改动，不作为开发前的审批门。

## 规则

- 文件名使用 `NNNN-<slug>.md`，编号从 `0001` 递增，不复用已删除编号。
- 实现完成后补充 ADR，记录实际落地的行为、取舍与验证；不要先写一份与代码不一致的“计划稿”。
- 一个 ADR 只记录一个决策及其后果；不要把多个无关改动塞进同一篇。
- 状态使用 `Proposed`、`Accepted`、`Superseded`。决策被推翻时新建 ADR，并在旧文件标注 `Superseded by NNNN`。
- 实现完成不等于决策成立：代码与 ADR 不一致时，先修 ADR 或代码，不让两者长期分叉。
- 中文为主，与 [`docs/tomato/decisions.md`](../decisions.md) 的现有语言一致；涉及跨仓契约时写清请求、响应、错误码与安全边界。
- 模板见 [TEMPLATE.md](TEMPLATE.md)。

## 索引

| ADR | 决策 | 状态 |
|---|---|---|
| [0001](0001-local-gateway-and-auth.md) | 本地同源网关承接浏览器业务请求；登录态统一走 auth_service 飞书 SSO | Accepted |
| [0002](0002-web-brand-identity.md) | Web 端标签页、安装图标与安装名称统一使用番茄品牌资源 | Accepted |
| [0003](0003-hero-and-send-align-company-web.md) | 空会话 hero 铺公司 Web 同款点阵；发送键改为品牌渐变圆钮，生成中显示 loading（点阵静态部分由 0004 接替） | Accepted |
| [0004](0004-hero-dot-field-interaction.md) | hero 点阵用 canvas 自写弹簧实现指针推开、弹性回位与点击冲击波 | Accepted |
| [0005](0005-packaged-login-endpoints.md) | 登录端点按打包环境封入应用 manifest，启动环境可覆盖 | Accepted |
| [0006](0006-playwright-browser-bundle.md) | Playwright MCP 以官方按需组合包进入插件页，默认 launch/headless | Accepted |
| [0007](0007-hicreator-mcp.md) | hiCreator 远程 MCP 进入 web 补丁层，未配置 API Key 时整行停用 | Accepted |
| [0008](0008-desktop-sign-in-account-refresh.md) | 初始欢迎窗登录成功后主动通知工作区刷新账户，避免停留在启动时的未登录投影 | Accepted |
| [0008](0008-desktop-shell-brand-and-height.md) | macOS 桌面壳子：欢迎/主窗口标题栏露出 Tomato AI，欢迎 1000×640、主窗口默认 1280×760 | Accepted |
