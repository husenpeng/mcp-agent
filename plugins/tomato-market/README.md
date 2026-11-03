# tomato-market

> 开源 DeepSeek Harness 插件目录的 Tomato 插件市场。English summary below.

在 Tomato Harness 的 **插件** 页新增 **插件市场** 标签页：按分类浏览、按 GitHub 星标或更新时间排序、关键词搜索，点开任意插件查看说明、版本和来源，并把声明 `tomato.bundle` 的版本直接、声明 `dsh.bundle` 的版本经兼容层转换后，交给插件页已有的安装流程。目录数据来自开源的 [`dsh-plugin-catalog`](https://awesome-dsh-plugin.com)（4380 个可安装条目、23 个分类、每日更新）。

![插件市场](docs/browse.jpg)

![插件详情与说明](docs/detail.jpg)

## 安装

```sh
# 源码目录（开发时）
pnpm tomato plugin --profile web add link:/absolute/path/to/plugins/tomato-market

# 或打包后安装
cd plugins/tomato-market && npm pack
pnpm tomato plugin --profile web add /absolute/path/tomato-market-0.2.0.tgz
```

安装后重启 profile（`pnpm tomato web`），打开侧栏 **插件 → 插件市场**。桌面端可在 **设置 → 插件 → 添加插件** 里用 `link:` 或 tgz 安装，重启应用后生效。

Tomato 识别本包的 `tomato.bundle.patch` 后会把 `tomato-market` 加入 profile 的 `tomato.profile.bundles`，因此安装日志里不会再出现 “declares no tomato.bundle — installed as a plain dependency” 这类静默失败。

## 功能

- **分类浏览**：23 个分类按条目数排序，首屏按分类分组展示每组星标最高的 6 个插件，可一键“查看全部”。分类胶囊始终可用。
- **星标排序**：星标来自目录同源的 `plugins.json`（按 npm 包名或 GitHub 仓库匹配），默认按星标降序；也可按更新时间、名称排序。
- **关键词搜索**：在名称、标题、描述、作者、分类与关键词中匹配，多个词按“全部命中”处理，中英文均可。
- **单独条目**：48px 图标框、标题、分类标签、两行描述、版本/日期/作者、星标数与安装按钮，与插件页“已安装/发现”列表同一套排版和 `--dsw-*` 设计令牌。
- **详情页**：说明文档（npm 包或仓库 README）、主页、源码仓库、版本列表与每个版本的安装入口，以及兼容性标签。
- **安装前检查与 DSH 兼容层**：点“安装”时先读该版本的 npm 清单：
  - 声明 `tomato.bundle` → 直接调用插件页的安装对话框；
  - 声明 `dsh.bundle` → 提示后下载该版本的 npm tarball，把包名、`dsh` 清单字段与代码导入改写为 Tomato 命名，重打包成 `file:` 规格交给同一个安装对话框；
  - 没有声明任何 bundle → 提示这不是插件包；
  - 注册表不可达 → 说明原因，可选择“仍然安装”，由 Tomato 的安装器再检查一次。

## DSH 兼容层做了什么

Tomato 是 DeepSeek Harness 的改名分支，社区插件以 `@deepseek-ai/*` 为 peer 依赖、以 `dsh.bundle` 声明插件层。兼容层在**安装时**完成与仓库 `scripts/rescope-to-tomato.ts` 相同的改名：

| 原名称 | 转换后 |
|---|---|
| `@deepseek-ai/dsh-<leaf>` | `@tomato/<leaf>` |
| `@deepseek-ai/dsh`、`dsh-brand`、`dsh-root`、`dsh-subagent-dsh-sdk`、`dshx` | `@tomato/cli`、`branded`、`harness`、`subagent-sdk`、`x` |
| `@deepseek-ai/cordis`、`schemastery`、`cosmokit` | `@tomato/cordis`、`schemastery`、`cosmokit` |
| `@cordisjs/plugin-<name>` | `@tomato/cordis-plugin-<name>` |
| `dsh.bundle` / `dsh.client` / `engines.dsh` | `tomato.bundle` / `tomato.client` / `engines.tomato` |
| `@deepseek-ai/libreoffice-kit*` | 保持不变（真正的第三方包） |

转换只读写文本，不执行插件代码：在临时目录解包（拒绝绝对路径与 `..` 条目、限制条目数与展开大小），改写 `package.json`、`cordis.patch.yml`、JS/TS/JSON/YAML 中的包引用，再重打为 `package/` 根目录的 tgz，缓存到 `$TOMATO_HOME/.plugin-market/adapted/`。`@deepseek-ai/*` 依赖会移到 peer 依赖，由运行中的 Tomato 安装提供，避免重复安装一份 Cordis。随后仍走 Tomato 自己的安装器：清单检查、pnpm 安装、bundle 协调与启用。

兼容层只做命名与清单转换，**不保证插件内部 API 与 Tomato 完全一致**；依赖特定 DSH 行为、或在运行时读取 `@deepseek-ai/*` 真实包路径的插件仍可能加载失败。失败会出现在插件页的启用/加载日志里，而不是 marketplace 的安装步骤。

## 配置

在 profile 的 `cordis.yml` 或 overlay 里覆盖 `tomato-market` 行：

| 字段 | 默认 | 含义 |
|---|---|---|
| `indexUrls` | jsDelivr 的 `dsh-plugin-catalog/index.json`，其次 awesome-dsh-plugin.com、dshmarket.com | 目录镜像，按顺序取第一个可用的 |
| `starUrls` | jsDelivr 的 `dsh-plugin-catalog/plugins.json`，其次 awesome-dsh-plugin.com | 星标文档 |
| `timeoutMs` | `20000` | 单次 HTTP 读取的上限 |
| `cacheTtlMs` | `600000` | 目录、星标、清单读取的缓存时间 |
| `registries` | `registry.npmjs.org`、`registry.npmmirror.com` | 清单与 README 的注册表回退顺序 |
| `adaptDir` | `$TOMATO_HOME/.plugin-market/adapted` | 兼容转换产物的缓存目录 |
| `home` | `$TOMATO_HOME`，否则 `~/.tomato` | 解析 `adaptDir` 的 home |

Host 半只读取上述固定来源，不接受浏览器传入任意 URL；`detail`/`manifest`/`adapt` 只会查询目录里列出的 `name@version`，tarball URL 取自该版本注册表清单的 `dist.tarball`。

## 已知限制

- 兼容层是命名与清单转换，不是 API 适配；个别 DSH 插件仍可能因内部假设不同而加载失败。
- 转换产物绑定到具体版本；安装后插件页显示的是本地 `file:` 来源，更新需要重新从市场安装。
- 第三方客户端插件读不到 profile 的已安装清单，因此卡片不显示“已安装/可更新”；需要时从插件页的“已安装”列表确认。
- 星标来自目录每日更新的 `plugins.json`，不是实时 GitHub API。

## 目录来源与免责声明

数据来自 [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com) 的 `dsh-plugin-catalog` npm 包（CC0-1.0）。条目的标题、描述、作者与仓库都是第三方声明，Tomato 只校验格式，不校验内容；安装前请核对来源。

## 开发

```sh
cd plugins/tomato-market
npm install --legacy-peer-deps --no-package-lock   # esbuild 与 tar
npm run build                   # 生成 client.js
npm test                        # node --test
node scripts/build-client.mjs --check
```

`client.js` 是提交产物：`link:`、tgz 与 Git 安装都不需要再构建。平台模块 `react`、`react-dom`、`@tomato/client-ui-primitives` 由 shell 注入，保持 external。

## English summary

`tomato-market` adds a **Plugin market** tab to the Tomato Plugins page. It browses the open `dsh-plugin-catalog` by category, sorts by GitHub stars, last update, or name, searches names/authors/keywords/descriptions, and shows a details page with the README, source facts, and every listed version. Installing first reads the version's npm manifest: `tomato.bundle` versions go straight to the page's install dialog, and DeepSeek Harness versions are converted first — package names, `dsh` metadata fields, peer dependencies, and code imports are rewritten to the Tomato naming (the same table as `scripts/rescope-to-tomato.ts`), repacked, and then handed to the same installer. The conversion reads and rewrites text only; it never runs package code. Host reads are limited to the configured catalog mirrors, the listed `name@version` pairs, and the registry tarball of that version.

Install with `pnpm tomato plugin --profile web add link:$PWD`, restart, then open **Plugins → Plugin market**. Configure mirrors through the `tomato-market` row (`indexUrls`, `starUrls`, `timeoutMs`, `cacheTtlMs`, `registries`).