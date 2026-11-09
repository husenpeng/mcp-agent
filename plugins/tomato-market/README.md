# tomato-market

> Tomato 的两个插件市场：面向海外达人营销的精选市场，和完整的开源插件目录。English summary below.

在 Tomato Harness 的 **插件** 页新增两个标签页，顺序是 已安装 → **营销插件市场** → **通用插件市场** → 发现。

## 营销插件市场

精选 107 条开源、免费、与海外达人营销相关的能力，清单随插件打包（`src/host/marketing-catalog.json`），浏览不需要联网。不收录需要付费 key 的项目。

| 类型 | 数量 | 安装方式 |
|---|---|---|
| 插件 | 28 | 交给插件页的安装对话框，版本固定 |
| MCP 服务器 | 51 | 确认后写入当前 profile 的 `cordis.patch.yml`，用 `npx` 或 `uvx` 启动固定版本 |
| Skill | 28 | 确认后把清单列出的子技能下载到 `$TOMATO_HOME/skills/<name>`，commit 固定 |

其中 27 条标为 **手动安装**（Docker、浏览器扩展、pip 等），详情页给出步骤，不显示安装按钮。

**标签**：类型（插件 / MCP / Skill）可筛选；**需免费 key**、**需自部署**、**需登录**、**手动安装**、**已安装** 显示在卡片上。标为 **需登录** 的 5 条使用用户自己的账号登录态，安装确认弹窗会提示封号风险。

**分类**：达人发现与核验、社媒数据、视频与内容分析、广告与竞品、内容与素材生成、发布排期、外联与 CRM、SEO/GEO、电商、数据分析与报告、基础能力。一条可以属于多个分类；搜索也匹配平台名和子技能名。

### MCP 怎么写入配置

新增的行放在 `cordis.patch.yml` 里一段由注释标记的区块中，行 id 为 `mkt-mcp-<id>`，服务器名为 `mkt-<id>`，工具名形如 `mcp__mkt-<id>__<tool>`。

- 区块以外的文字逐字节保留。卸载最后一条后，文件恢复成安装前的样子。
- 每次写入前把原文件复制到 `cordis.patch.yml.bak-tomato-market`（只保留最近一份），用临时文件加重命名整体替换。写入在 HMR 队列和 profile 清单锁内完成，与插件页、配置编辑器的写入互斥。
- profile 拒绝新配置时，写回原文件并重新加载；回滚也失败时，错误信息会给出备份路径。
- 区块被手动改过时停止写入并说明原因，不做猜测修复。

key 不写进配置文件。需要 key 的条目在 `env` 里只声明变量名，配置中是一个读取这些变量的 `!!js` 表达式，变量由用户写进 `~/.tomato/.env` 后重启生效。必须显式传递，因为 MCP 子进程的环境会去掉名字里带 KEY、TOKEN、SECRET、PASSWORD 的变量。

### Skill 怎么安装和卸载

文件通过 jsDelivr 按固定 commit 下载，先进暂存目录，全部成功后才移入技能根目录，因此下载失败不会留下半个技能。每个目录写入一个 `.tomato-market.json` 标记。

- 已有同名技能（目录或 `<name>.md`）且不是这一条安装的，安装前提示并停止，不覆盖。
- 卸载只删带标记且属于这一条的目录，用户自己写的同名技能不受影响。

插件在 **已安装** 里卸载和更新。MCP 和 Skill 这一版不做更新，需要时卸载后重装。

### 维护清单

```sh
node scripts/refresh-marketing-catalog.mjs          # 用 GitHub API 刷新星数和最近更新时间
node scripts/refresh-marketing-catalog.mjs --check  # 只检查仓库是否还在、是否已归档
```

设置 `GITHUB_TOKEN` 可以提高 API 限额。脚本不改动版本、commit 和安装命令：改这些内容需要重新审核，因为一键安装执行的就是文件里写的东西。宿主启动时校验整份清单，字段不合法会直接报错。浏览器只传条目 id，命令永远来自打包的清单。

## 通用插件市场

按分类浏览、按 GitHub 星标或更新时间排序、关键词搜索，点开任意插件查看说明、版本和来源，并把声明 `tomato.bundle` 的版本直接、声明 `dsh.bundle` 的版本经兼容层转换后，交给插件页已有的安装流程。目录数据来自开源的 [`dsh-plugin-catalog`](https://awesome-dsh-plugin.com)（4380 个可安装条目、23 个分类、每日更新）。

![通用插件市场](docs/browse.jpg)

![插件详情与说明](docs/detail.jpg)

## 安装

```sh
# 源码目录（开发时）
pnpm tomato plugin --profile web add link:/absolute/path/to/plugins/tomato-market

# 或打包后安装
cd plugins/tomato-market && npm pack
pnpm tomato plugin --profile web add /absolute/path/tomato-market-0.4.0.tgz
```

安装后重启 profile（`pnpm tomato web`），打开侧栏 **插件 → 营销插件市场** 或 **通用插件市场**。桌面端可在 **设置 → 插件 → 添加插件** 里用 `link:` 或 tgz 安装，重启应用后生效。

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

## 按 TOMATO 版本选版本

安装前市场先判定该版本能否在当前 TOMATO 上运行，再从列出的版本里选一个能装的：

- **判定规则与安装器一致**（`packages/boot/app-boot/src/plugin-compatibility.ts`）：包自己声明了 `engines.tomato` 就只看这条范围（DSH 包的 `engines.dsh` 按同一范围读），否则逐个检查 `@tomato/*` peer 依赖的范围是否包含当前版本。`@tomato/cordis*`、`cosmokit`、`schemastery` 这些 vendored 包由安装自带，固定版本，不参与判定；`@deepseek-ai/*` 先按兼容层映射成 Tomato 名字再判定，`@deepseek-ai/libreoffice-kit*` 保持第三方身份不判定。
- **当前版本与安装器同源**：读 profile 启动时给出的 `installAnchor` 的 `package.json` 的 `version`，也就是安装器 `getTomatoRuntimeVersion()` 用的同一个值。
- **自动回退**：点“安装”后先判定所选版本；不满足要求时，再按“目录里的其余版本 → 注册表发布的更早版本”由新到旧读清单，最多 8 个，取第一个满足要求的版本。所选版本不兼容时会自动改装这个版本，标签页顶部说明换成了哪个版本、当前 TOMATO 是什么。目录只保留每个插件最新的 24 个版本，更早的版本按注册表 packument 补齐，所以像 `0.30.1` 要求 `0.2.2` 而本机是 `0.2.1` 的情况，会回落到目录里没有的 `0.28.2`。
- **没有可用版本**：不再把注定被拒的安装交给安装器，直接说明当前 TOMATO 版本和最新版本要求的范围。
- **未知不阻塞**：读不到运行版本（没有 profile 的进程）或清单不可读时保持“未知”，按原流程交给安装器再检查一次。
- 详情页标出所选版本是否兼容当前 TOMATO，并显示运行中的 TOMATO 版本。

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
| `home` | 当前 profile 的 home，否则 `$TOMATO_HOME`，再否则 `~/.tomato` | 解析 `adaptDir` 和 `skillRoot` 的 home |
| `skillRoot` | `<home>/skills` | Skill 的安装目录 |

Host 半只读取上述固定来源，不接受浏览器传入任意 URL；`detail`/`manifest`/`adapt` 只会查询目录或营销清单里列出的 `name@version`，tarball URL 取自该版本注册表清单的 `dist.tarball`。

## 已知限制

- 兼容层是命名与清单转换，不是 API 适配；个别 DSH 插件仍可能因内部假设不同而加载失败。
- 兼容判定只看清单声明的范围，与安装器一致；它不预演插件在运行时会用到哪些服务。范围满足但实际不兼容的插件仍会在加载时报错。
- 自动回退一次最多读 8 个版本清单（含所选版本）；注册表 packument 只用来补齐目录没有的更早版本，不保证所有历史版本都能翻到。
- 转换产物绑定到具体版本；安装后插件页显示的是本地 `file:` 来源，更新需要重新从市场安装。
- 通用插件市场的卡片不显示“已安装/可更新”，需要时从插件页的“已安装”列表确认；营销插件市场由 Host 读取当前 profile，会显示“已安装”。
- MCP 服务器启动失败不算安装失败：`@tomato/mcp-client` 记录错误后继续运行，配置已写入，但工具不会出现，原因在日志里（常见原因是 key 没设置或首次下载超时）。卸载后重装即可重试。
- `uvx` 或 `npx` 不在 PATH 时只提示，不自动安装。确认弹窗里检查的是 Host 进程的 PATH。
- 营销清单的星数是打包时的快照。多数“免 key”条目依赖第三方免费额度或公开接口，没有服务承诺。
- 达人发现没有免费的一站式方案，能按品类和市场搜达人的工具都要付费。这个分类收录的是可以组合使用的读取工具和方法论 Skill。
- 清单里的 AGPL 条目（Postiz、TryPost、BrightBean、wigolo、dsh-guizang-design）在本机使用没有问题，二次分发或做成托管服务前需要法务评估。
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

`tomato-market` adds two tabs to the Tomato Plugins page, in the order Installed, **Marketing plugins**, **General plugins**, Discover.

**Marketing plugins** lists 107 reviewed, open-source, free entries for overseas creator marketing from a catalog bundled with the package: plugins, MCP servers, and Skills, with categories, a type filter, and tags for free keys, self-hosting, login sessions, manual installs, and installed entries. MCP servers install as `mkt-mcp-<id>` rows in a marked block of the running profile's `cordis.patch.yml`, written atomically with a backup and restored if the profile refuses them. Skills install below `$TOMATO_HOME/skills` at a pinned commit with a `.tomato-market.json` marker, and uninstall removes only marked directories. Credentials never reach the file: entries declare variable names only. Twenty-seven entries are manual installs with written steps.

**General plugins** browses the open `dsh-plugin-catalog` by category, sorts by GitHub stars, last update, or name, searches names/authors/keywords/descriptions, and shows a details page with the README, source facts, and every listed version. Installing first reads the version's npm manifest: `tomato.bundle` versions go straight to the page's install dialog, and DeepSeek Harness versions are converted first — package names, `dsh` metadata fields, peer dependencies, and code imports are rewritten to the Tomato naming (the same table as `scripts/rescope-to-tomato.ts`), repacked, and then handed to the same installer. The conversion reads and rewrites text only; it never runs package code. Host reads are limited to the configured catalog mirrors, the listed `name@version` pairs, and the registry tarball of that version.

**Choosing a version for the running TOMATO.** Before installing, the market judges the chosen version with the installer's own rule — its `engines.tomato` range alone, else every `@tomato/*` peer range, with vendored Cordis packages exempt — against the version of the running installation, read from the profile's `installAnchor`. A version that does not qualify makes the market walk the remaining catalog versions and then the older releases the registry publishes, newest-first and at most eight manifest reads, install the newest one that does, and say at the top of the tab which version it substituted and what the requested one required. When no listed version qualifies it refuses with the requirement instead of starting an install the installer would reject. An unreadable runtime version or manifest stays unknown and falls back to the installer's own check.

Install with `pnpm tomato plugin --profile web add link:$PWD`, restart, then open **Plugins → Marketing plugins** or **General plugins**. Configure mirrors through the `tomato-market` row (`indexUrls`, `starUrls`, `timeoutMs`, `cacheTtlMs`, `registries`).