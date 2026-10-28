# DS Bot 的 Tomato 分支

本目录是社区插件 [DS Bot](https://github.com/Fei2411/DS-Bot) `0.2.3` 的 Tomato Harness 适配分支，Apache-2.0，非 DeepSeek 官方产品。上游代码原样保留；Tomato 适配只做命名、清单字段和路径迁移，不改产品逻辑。

## 安装

```sh
# 独立 profile，避免影响日常 web/desktop
pnpm tomato plugin --profile robot add link:/absolute/path/to/plugins/ds-bot
```

首次安装会创建 profile。默认 bundles 只有 `@tomato/base`，需要 Web UI 时把 `@tomato/web-app` 加入 profile 的 `tomato.profile.bundles`，或直接用 Web 模板：

```sh
pnpm tomato plugin --profile web add link:/absolute/path/to/plugins/ds-bot
pnpm tomato web
```

启动后浏览器打开日志里的地址，侧栏出现 Bot 模式，首次自动创建主 Bot「Chief」。数据在 `~/.tomato/bot/` 和对应 Session 中。

交付给他人时打包安装：

```sh
cd plugins/ds-bot
npm pack                                  # ds-bot-0.2.3.tgz
pnpm tomato plugin --profile robot add /absolute/path/ds-bot-0.2.3.tgz
```

`desktop` profile 只能由桌面应用管理，不能从 CLI 安装。

## 改造内容

1. **命名**：`scripts/tomato-codemod.ts` 调用仓库的 `scripts/rescope-to-tomato.ts`，执行 `pkg`、`env`、`ident`、`cli` 四层（不开 `prose`，避免误改产品文案）。覆盖包名、`DSH_` 环境变量、`~/.dsh`、`dsh` 清单字段、`dsh-*` 文件引用与 `--dsh-*` CSS 变量。
2. **文件名**：`dsh-update.js`、`dsh-primitives.js`、`dsh-offer.js` 及两个测试文件改为 `tomato-*`，与 import 同步。
3. **清单**：`package.json` 的 `dsh` 字段改为 `tomato`，peer 依赖改为 `@tomato/*`，新增 `engines.tomato`。
4. **客户端**：`scripts/build-client.mjs` 的平台模块改为 `@tomato/client-ui-primitives`，并用它重新生成 `client.js`。npm 包不含 client 源码时也必须从本目录构建。
5. **secrets**：`DSH_SECRET_` 改为 `TOMATO_SECRET_`，因为 Tomato 的 `shellEnv.register` 只接受 `TOMATO_` 前缀。

重跑改造（上游升级后）：

```sh
pnpm exec tsx plugins/ds-bot/scripts/tomato-codemod.ts
cd plugins/ds-bot && node scripts/build-client.mjs
```

## 测试

```sh
cd plugins/ds-bot
node --import ./test/harness-resolve.mjs --test "test/*.test.js"
```

当前结果：1125 个用例，1117 通过，6 个已知失败：

- 5 个浏览器工具测试：测试手工装配的 Context 未加载 `tool-executor`，Tomato 要求显式加载；直接加载 `NativeToolExecutor` 又需要 `sessions` 等服务，测试装配未提供。
- 1 个时钟测试：fake Context 的 `sessionProjections` 桩返回的 handle 缺少 Tomato 期望的 `stateOf`。

这些失败属于上游测试脚手架与 Tomato 内部接口的差异，不影响已验收的 Web 运行路径。`client.js` 与源码一致（`node scripts/build-client.mjs --check` 通过）。

## 运行风险（接入前请确认）

- ds-bot 用低优先级覆盖侧栏品牌位、设置入口和会话节点；Bot 模式下会替换 Tomato 自己的品牌与账户入口。
- Bot 会话绕过 Tomato 的 compaction，使用自己的 steward；长对话上下文由 ds-bot 管理。
- `update.js` 会查询 npm/GitHub 的上游新版本；用 `link:`/`file:` 安装时来源识别为 `path`，不会触发更新。若改为 registry 安装，更新会装回未适配的上游版本。
- Bot 可以执行命令、读写文件；请使用独立 profile 和受限权限预设，不要在生产 profile 的 Full access 下运行。
- `llm/stream` 的 secrets/images 拦截器会重新调用 `ctx.llm.stream()`，Tomato 的其他监听器会对该请求再执行一次。

## 许可证与归属

- 上游：Fei2411/DS-Bot，Apache-2.0。本目录保留 `LICENSE` 与 `NOTICE`。
- 修改文件按 Apache-2.0 要求标注为 Tomato 适配版本。
- 本项目与 DeepSeek 无隶属、认可或赞助关系。