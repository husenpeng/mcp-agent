---
description: "Desktop 构建体系的分阶段说明：TypeScript 编译面、tsdown 打包与其 Rolldown 插件、Vite 渲染面、运行时载荷准备、electron-builder 钩子、签名公证、安装器与更新发布，逐项说明所用插件/工具的职责与产物。"
---

# Desktop 构建体系：阶段、插件与产物

本文剖析 `apps/desktop` 的构建体系，按"源码 → 产物 → 运行时载荷 → 安装器 → 更新/发布"的顺序，说明每个阶段用到的构建插件与工具、它们各自解决什么问题，以及失败时的表现。内容以当前代码为准（`apps/desktop/package.json`、`tsdown.config.ts`、`scripts/electron-builder-config.mjs`、`scripts/package-target.ts` 及相关脚本）。

## 摘要

Desktop 不是一个独立的 Electron 应用，而是"Electron 壳 + 完整 tomato Web 运行时"的发布单元：`tsc` 先把 `src` 编译成 `lib/types`，`tsdown`（Rolldown）再把其中 8 个入口分别打成 ESM 主进程包、CJS 预加载包和 CLI 命令管理包，Vite 在同一次构建里产出 welcome/splash 两个 IIFE 页面；随后一组准备脚本把 Electron、Python/Node/pnpm、Playwright、CLI 与完整生产依赖树装配成 `resources/runtime` 和 `app.asar/tomato`；最后由 electron-builder 在五个钩子上完成安装器打包、平台签名、公证与校验。

## 目录

- [一页速览](#overview)
- [插件与工具总表](#plugin-matrix)
- [构建对象的五个面](#five-faces)
- [命令与阶段矩阵](#command-matrix)
- [阶段 1：TypeScript 编译面](#stage-tsc)
- [阶段 2：tsdown 打包与 Rolldown 插件](#stage-tsdown)
- [阶段 3：Vite 渲染面](#stage-vite)
- [阶段 4：运行时载荷准备](#stage-runtime)
- [阶段 5：electron-builder 与钩子](#stage-builder)
- [阶段 6：签名与公证](#stage-signing)
- [安装器构件](#installer)
- [更新体系](#updates)
- [发布链](#publish)
- [目录与产物地图](#artifacts)
- [环境变量与配置](#environment)
- [守卫清单](#guards)
- [与其他应用的关系](#shared)
- [三条操作路径](#workflows)
- [边界与限制](#limits)
- [附录 A：依赖包用途](#appendix-dependencies)
- [附录 B：脚本索引](#appendix-scripts)

<a id="overview"></a>

## 一页速览

```
源码面   apps/desktop/src · packages/*/*/src · apps/web/src
   │
   │  ① tsc -b（host / client 两个编译面，项目引用）
   │     → apps/desktop/lib/types/**            （中间产物，从不发布）
   │
   │  ② tsdown（Rolldown）                      → lib/main.js
   │     ├─ Rolldown 插件 desktop-packaged-imports   lib/preload-*.cjs（6 个）
   │     └─ onSuccess: Vite（IIFE + 资源插件）        lib/command-manager-entry.js
   │                                                lib/welcome/** · lib/splash/**
   ▼
产物面   apps/desktop/lib · apps/web/dist · packages/*/lib（已由仓库根构建）
   │
   │  ③ release:pack / npm pack / pnpm pack → .desktop-build/targets/<t>/packed/*.tgz
   │     prepare:runtime  → Electron + primary-runtime + Playwright + CLI
   │     prepare:packages → package-set（本地 tarball 闭包 + sha512 清单）
   │     prepare:tomato   → tomato 生产依赖树 + desktop-runtime.json
   ▼
载荷面   resources/runtime/** · app.asar/tomato/** · app.asar/node_modules/**
   │
   │  ④ electron-builder（beforeBuild → beforePack → afterPack → afterSign → artifactBuildCompleted）
   │     NSIS 安装器 / DMG / ZIP / blockmap / 更新 YAML
   ▼
分发面   .desktop-build/targets/<t>/artifacts/**
   │
   │  ⑤ upload:*（electron-builder 永远 --publish never，上传是独立命令）
   ▼
COS 对象 + nightly.yml / latest.yml + blockmap → electron-updater
```

<a id="plugin-matrix"></a>

## 插件与工具总表

| 插件 / 工具 | 形态与挂载点 | 职责 | 去掉它会怎样 |
|---|---|---|---|
| `tsc -b` | TypeScript 编译器，`apps/desktop/tsconfig.json` 两个面 | 把 `src` 编译成 `lib/types`，并按项目引用解析 workspace 声明 | tsdown 没有入口 |
| `tsdown`（Rolldown） | 打包器，`tsdown.config.ts` 的 8 个配置对象 | 产出 ESM 主进程包、CJS 预加载、CLI 命令管理包 | 没有可运行的 `lib/*.js` |
| `desktop-packaged-imports` | Rolldown 插件（`moduleParsed`） | 拒绝打包后无法解析的裸导入 | 安装后启动即 `ERR_MODULE_NOT_FOUND` |
| Vite（`configFile: false`） | 构建器，主进程包 `onSuccess` | 产出 welcome、splash 两个 IIFE 页面 | 首启欢迎页与启动动画缺失 |
| `desktop-shell-assets` | Vite 插件（`generateBundle` → `emitFile`） | 发射设计令牌 CSS、品牌字体与许可证 | 欢迎页无字体/令牌样式 |
| `@vitejs/plugin-react` 及 `apps/web` 的 6 个 Vite 插件 | Vite 插件链 | 构建随包分发的 Web 前端 `dist`（标题、字体、KaTeX、预览页、产物隔离） | Web 界面无法随桌面分发 |
| `@electron/get` + `extract-zip` | 准备脚本依赖 | 下载并解压目标平台 Electron | 打包无基座，`nodeVersion` 无从探测 |
| `pnpm`（11.28.5） | 自带发行版 + 安装器 | 打包期安装生产依赖；运行时安装插件 | 载荷与插件安装都无法建立 |
| `release:pack` / `npm pack` / `pnpm pack` | 打包脚本 | 把 workspace 包变成 tarball 闭包 | package-set 缺包，闭包遍历直接报错 |
| `sharp` | 脚本依赖（`render:tray-icon`） | 从 SVG 逐尺寸栅格化 Windows tray 图标 | tray 图标与展示不一致 |
| `clang` / `cl.exe`（+ `vswhere`） | 外部工具链 | 编译 macOS `link-entry` 与 Windows `window-frame.dll` | 命令安装器或 NSIS 自定义页面缺失 |
| `electron-builder` | 打包器，`electron-builder.config.mjs` | 组装 ASAR、安装器、blockmap 与更新元数据 | 没有可分发产物 |
| 5 个 builder 钩子 | `beforeBuild`/`beforePack`/`afterPack`/`afterSign`/`artifactBuildCompleted` | 注入语言资源、PE 外置、运行时校验、平台签名、DMG 公证 | 产物不完整或未签名 |
| `app-builder-lib`（含本地补丁） | 库 + `patches/app-builder-lib@26.17.0.patch` | ASAR 读写、manifest 变换、`ULMO` DMG 格式 | 无法校验归档、无法用 LZMA 压缩 DMG |
| `codesign` + `@electron/notarize` | macOS 外部工具 + 库 | 签名、公证、装订、验签 | Gatekeeper 拦截下载产物 |
| `signtool` + SafeNet EV 令牌 | Windows 外部工具 | 签名全部 PE、时间戳、证书匹配 | Windows 安装器无法发布 |
| NSIS + `window-frame.dll` | 安装器编译器 + 原生插件 | 自定义页面、主题、目录校验、解压进度 | 只剩 electron-builder 默认安装器 |
| `cos-nodejs-sdk-v5` | 脚本依赖（`upload:*`） | 上传二进制、blockmap、更新 YAML | 产物留在本地 |
| `electron-updater` | 运行时依赖 | 检查、下载、安装更新并接强制策略 | 无法自动更新 |

<a id="five-faces"></a>

## 构建对象的五个面

| 面 | 位置 | 谁生成 | 是否发布 | 说明 |
|---|---|---|---|---|
| 源码面 | `apps/desktop/src`、`apps/web/src`、`packages/*/*/src` | 人 | 否 | `src` 不进入发布包：harness 包的 `src/` 由文件策略剔除，桌面自身的 `src` 不在 `files` 清单里 |
| 中间产物面 | `apps/desktop/lib/types` | `tsc -b` | 否 | 只给 tsdown 当入口；`build` 每次覆盖 |
| 应用产物面 | `apps/desktop/lib`（`main.js`、`preload-*.cjs`、`welcome/`、`splash/`、`command-manager-entry.js`） | tsdown + Vite | 是（进 ASAR） | 该目录即 Electron 加载的代码：8 组 tsdown bundle + 2 个 Vite 页面 |
| 运行时载荷面 | `resources/runtime/**`、`app.asar/tomato/**` | `prepare:runtime` / `prepare:packages` / `prepare:tomato` | 是（外置 + ASAR 内） | 自带 Electron 之外的完整生产依赖树与解释器 |
| 分发面 | `.desktop-build/targets/<target>/artifacts/**` | electron-builder | 是 | DMG/EXE/ZIP、blockmap、更新 YAML、release 记录 |

分层是硬约束：源码面与产物面不混用（仓库级规则），准备脚本只读 `lib` 与 tarball，electron-builder 只读 `lib`、`resources` 与准备好的 tomato 树。

<a id="command-matrix"></a>

## 命令与阶段矩阵

| 命令（在 `apps/desktop` 下） | 对应阶段 | 实际动作 | 关键前置 |
|---|---|---|---|
| `pnpm run build` | ① + ② | `tsc -b && tsdown --config-loader native` | 依赖已安装；workspace `lib` 已构建（宿主主进程包会内联 workspace devDependencies） |
| `pnpm run bundle` | ② | 只跑 tsdown + Vite（`onSuccess`） | `lib/types` 已存在 |
| `pnpm run dev` | ① ② + 启动 | `build:artifacts` → 桌面 `build` → 准备临时项目与 primary-runtime → 启动 Electron | 需通过 pnpm 调用（检查 `npm_execpath`） |
| `pnpm run start` | 启动 | `dev.ts --skip-build`，重建临时项目后启动现有产物 | 已构建过 |
| `pnpm run prepare:runtime` | ③ | Electron / primary-runtime / Playwright / CLI → `targets/<t>/runtime` | 需要目标平台主机与网络（或缓存） |
| `pnpm run prepare:packages` | ③ | 选择 tarball 闭包 → `package-set` | `packed/**` 已存在 |
| `pnpm run prepare:tomato` | ③ | 安装生产依赖树、裁剪、签名、封存 | `package-set`、`runtime` 已就绪 |
| `pnpm run package:mac:arm64` / `package:win:x64` … | ③ ④ + 签名 | 完整打包流水线（含签名/公证），不上传 | 目标平台主机 + 发布配置 |
| `pnpm run check:package` | 配置预检 | 只校验配置与外部工具链，不构建、不签名 | 可离线（除 `--build-version auto` 会读桶） |
| `pnpm run package:desktop:…:unsigned` | ③ ④ | 本地无签名产物（mac 用 ad-hoc `-` 身份） | macOS 可不读配置文件 |
| `pnpm run upload:…` | 上传（⑤） | 校验 release 记录后上传 COS | 已有完整签名产物 |
| `pnpm run test:installer` | 安装器验证 | 用生产 NSIS 配置跑真实安装/卸载回归 | 需交互式 Windows x64 桌面 |

仓库根入口是等价的转发：`pnpm run build:desktop`、`pnpm run dev:desktop`、`pnpm run package:desktop:mac:arm64`、`pnpm run upload:latest:win:x64` 等。

<a id="stage-tsc"></a>

## 阶段 1：TypeScript 编译面

`apps/desktop/tsconfig.json` 是一个 solution 文件，只引用两个面：

| 配置 | 范围 | 输出 | 项目引用 |
|---|---|---|---|
| `tsconfig.host.json` | `src`（排除 `src/client`） | `lib/types` | app-boot、official-bundles、home-paths、account-service、api-gateway、ui-sidebar-browser、shortcuts、atomic-write、product-analytics、file-drag |
| `tsconfig.client.json` | `src/client` + `splash-api.ts` + `welcome-api.ts` + `locale.ts` | `lib/types` | brand、ui-primitives、account-service、product-analytics |

两个面分开的原因是 Cordis 的 `Context` 声明合并：宿主面与客户端面会在同一批键上合并出互相冲突的类型，一个 program 无法同时看到两边；仓库根也按同样规则切成 `tsconfig.host.json` / `tsconfig.client.json` 两个聚合检查单元（`apps/desktop/tsconfig.*.json` 是本包的项目配置，与仓库根同名文件不是同一个东西）。

编译由谁触发：

- 桌面包自身：`tsc -b`（solution 图，含两个面）→ `lib/types/**`。
- 仓库根 `build:artifacts`（`tsx scripts/build.ts --scope artifacts`）：按依赖图跑 `native` → Typert → `host-src` → `host-bundle` → `desktop-bundle`（即本包 `bundle`）→ `client-src` → `client-bundle` → `web`，宿主面的每个项目引用逐个 `tsc -b`（8 GiB 堆）。`build:lib:host` 是等价的手工串行路径（`compile-referenced-projects.ts host-libraries` + `tsc -p tsconfig.host.json` + 本包 `bundle`）。
- 顺序不可交换：桌面主进程包从 workspace 的 `lib/` 内联 devDependencies，而 tsdown 的 workspace 并发构建不保证先后；客户端面排在桌面 bundle 之后，是因为两个编译面会改写共享的 `lib/types` 文件。

`lib/types` 从不发布：electron-builder 的 `files` 只列 `lib/main.js`、各 `lib/preload-*.cjs`、`lib/welcome/**`、`lib/splash/**`，`lib/types` 只是 tsdown 的入口目录。（文件策略里的 `.d.ts`/`.js.map`/`tsbuildinfo` 剔除针对的是运行时 `node_modules`，不是这里。）

<a id="stage-tsdown"></a>

## 阶段 2：tsdown 打包与 Rolldown 插件

`tsdown.config.ts` 用 `defineConfig([...])` 声明 8 个相互独立的 bundle 组，全部 `dts: false`、`clean: false`、`codeSplitting: false`、`target: 'es2024'`、`platform: 'node'`。

| # | 入口 | 格式 | 允许保留的外部依赖 | 产物 | 用途 |
|---|---|---|---|---|---|
| 1 | `lib/types/command-manager-entry.js` | ESM | 仅 Node 内建；`@tomato/atomic-write` 强制内联 | `lib/command-manager-entry.js` | 终端 `tomato` 命令的插件管理入口（拷贝进 `runtime/cli/command-manager.js`） |
| 2 | `lib/types/main.js` | ESM | `electron` + 清单 `dependencies` + Node 内建 | `lib/main.js` | Electron 主进程；`onSuccess` 触发 welcome/splash 的 Vite 构建 |
| 3–8 | `preload-app`、`preload-welcome`、`preload-splash`、`preload-platform-account`、`preload-mandatory`、`preload-update-dialog` | CJS | `electron`、`events`、`timers`、`url` | `lib/preload-*.cjs` | 沙箱预加载脚本；Electron 的 `require` polyfill 只解析这四个名字 |

六个 CJS 预加载里，`preload-app` 还把 `preload-browser`、`preload-platform`、`preload-theme`、`preload-windows`、`preload-menu`、`preload-mandatory-overlay` 等模块一并打进去——它们不是独立入口，也不出现在 `files` 清单中。

### 插件：`desktop-packaged-imports`

文件 `scripts/desktop-bundle-imports.mjs`，以 Rolldown 插件形式挂在每个 bundle 上，名字 `desktop-packaged-imports`。

它解决的问题非常具体：electron-builder 只把 `package.json` 的 `dependencies` 复制进 `app.asar/node_modules`，因此任何其它裸导入即使 rolldown 解析失败、被降级成外部说明符（只报 `UNRESOLVED_IMPORT` 警告），也会顺利生成一个启动即 `ERR_MODULE_NOT_FOUND` 的包。插件在 `moduleParsed` 钩子里检查每个模块的 `importedIds` 与 `dynamicallyImportedIds`：

- 绝对路径 / 以 `\0` 开头的虚拟模块视为已打包；
- 其余视为外部说明符，按包名（含 `@scope/name/subpath` 取前两段）比对白名单；
- 白名单外的说明符 `this.error(...)`，报错文本同时给出导入方模块与全部越界说明符，并且不写任何输出。

选择 `moduleParsed` 而不是 chunk 元数据，是因为 chunk 的 `imports`/`dynamicImports` 不包含外部的 `import()` 与 `require()` 目标，覆盖不全。

三套策略由每个 bundle 的实际运行时能力决定：

| bundle | `packages` | `nodeBuiltins` | 依据 |
|---|---|---|---|
| `main` | `electron` + `dependencies` 键 | true | ASAR 内含 `node_modules`，Node 可用 |
| `preload-*` | `electron`、`events`、`timers`、`url` | false | 沙箱预加载的 `require` polyfill 只有这四个 |
| `command-manager-entry` | 空集合 | true | 运行时树里没有任何包依赖，必须全部内联 |

对应地，`main` 与各预加载在 tsdown 侧还设了 `deps.neverBundle: ['electron']`；`command-manager-entry` 用 `deps.alwaysBundle: ['@tomato/atomic-write']` 保证单文件自足。

### tsdown 选项语义

| 选项 | 取值 | 作用 |
|---|---|---|
| `entry` | `lib/types/*.js` | 指向 `tsc` 的输出，而非 `src`；因此 `bundle` 依赖 `tsc -b` |
| `format` / `platform` / `target` | `esm` 或 `cjs` / `node` / `es2024` | 匹配 Electron 44 自带 Node 的语法与模块能力 |
| `fixedExtension` | `false` | 保留格式默认扩展名：ESM → `.js`，CJS → `.cjs` |
| `codeSplitting` | `false` | 每个入口一个文件；预加载不能依赖 chunk 加载 |
| `dts` | `false` | 声明由 `tsc` 负责，避免重复生成与漂移 |
| `clean` | `false` | 8 个组共享 `lib/`，任何一组清理都会删掉别人的产物 |
| `define` | `process.env.TOMATO_CLIENT_VERSION` | 只内联这一个公开构建值，其余环境变量保持运行时读取 |

### 客户端版本内联

`tsdown.config.ts` 在加载时解析客户端构建环境：若父进程没给 `TOMATO_CLIENT_VERSION`，就用仓库自身的版本与提交（`repositoryClientBuildEnvironment`），缺失则直接抛错；随后把该值以 `define` 形式写死进主进程包。这样主进程读到的 `TOMATO_CLIENT_VERSION` 是构建时的确定值，而其它 `TOMATO_*` 仍是启动时查找。

<a id="stage-vite"></a>

## 阶段 3：Vite 渲染面

主进程 bundle 的 `onSuccess` 里串行执行两次 `vite.build`（`configFile: false`，即不复用 `apps/web` 的配置）：

| 目标 | 入口 | 输出 | 关键设置 |
|---|---|---|---|
| Welcome | `src/client/welcome.tsx` | `lib/welcome/welcome.js` + `welcome.css` | `lib` 模式、`iife`、全局名 `DesktopWelcome`、`jsx: 'automatic'`、`NODE_ENV=production`、`emptyOutDir` |
| Splash | `src/client/splash.ts` | `lib/splash/splash.js` | `lib` 模式、`iife`、全局名 `DesktopSplash`、`emptyOutDir` |

### 插件：`desktop-shell-assets`

Welcome 那次构建里内联一个匿名 Vite 插件，`generateBundle` 阶段用 `emitFile` 把 `packages/client/ui-theme/src/styles/` 下的 6 个文件原样发射到 `lib/welcome/`：

- `design-platform.css`（设计令牌）
- `brand-font.css`
- `montserrat-regular.woff2`、`montserrat-light.woff2`、`montserrat-medium.woff2`
- `Montserrat-OFL.txt`（字体许可证）

Splash 不再重复发射：`renderer/splash.html` 与 `renderer/welcome.html` 都直接引用 `../lib/welcome/brand-font.css`，两份文档共用同一份字体资源。

放在 `onSuccess` 而不是定义独立构建组，是为了保证 Vite 只在 `lib/types` 编译完成、主进程包已产出之后运行，且 welcome 先于 splash 完成（splash 复用其字体）。

### Web 前端（`apps/web`）的 Vite 插件

Desktop 打包的是完整 Web 应用：`prepare:tomato` 安装的生产依赖树里包含 `@tomato/web-frontend`，主进程通过 `tomato-app://app/` 协议直接从 `resources/app.asar/tomato/node_modules/@tomato/web-frontend/dist` 提供页面。该 `dist` 由 `apps/web` 的 Vite 构建产生（仓库根 `build:web`），其插件链是：

| 插件 | 职责 |
|---|---|
| `tomato-reject-standalone-web-serve` | 在 `serve` 命令下直接报错：裸 Vite 无法注入 `window.__TOMATO_BOOT__`，必须走 `tomato web` |
| `tomato-client-document-title` | 构建期把标题投影进 HTML（默认 `Tomato AI`，本地构建为 `TOMATO Local Build`） |
| `tomato-brand-font-license` | 随品牌字体一同发射 `Montserrat-OFL.txt` |
| `tomato-katex-woff2-fonts` | `enforce: 'pre'` 改写 KaTeX 的 `@font-face`，只保留 WOFF2；缺任一字体面则构建失败 |
| `@vitejs/plugin-react` | JSX / Fast Refresh（仅构建期转换） |
| `tomato-emit-preview-page` | 额外产出 `preview.html`：把 worker bootstrap 入口拼进页面，供静态预览部署 |
| `productWebBundleIsolation` | 记录产品 chunk/资源/CSS/worker 输入，并拒绝实验性输入进入默认页面 |

构建侧另有 `manualChunks`（`vendor` 只放 katex/shiki/markdown 解析链，且成员不得依赖 React）、`dedupe: ['react','react-dom']`、`node:module` 别名到 stub，以及 `process.versions.node` 等 `define` 桩值。

<a id="stage-runtime"></a>

## 阶段 4：运行时载荷准备

`packageTarget` 在调用 electron-builder 之前按顺序跑三段准备，每段都是可重放的独立脚本，并在 `packaging-runs/<timestamp>-*` 里留下事件日志。

### 4.1 `prepare:runtime`（`scripts/prepare-runtime.ts`）

产出 `targets/<target>/runtime`（含四个部件 + 一份版本清单），外加同级的 `targets/<target>/electron`：

| 部件 | 生成方式 | 用途 |
|---|---|---|
| `electron/`（runtime 的兄弟目录） | `@electron/get` 下载目标平台 Electron 归档，`extract-zip` 解压；再以 `ELECTRON_RUN_AS_NODE=1` 跑 `electron -p process.versions.node` 取绑定 Node 版本 | electron-builder 的 `electronDist`；同时决定 runtime 的 Node 版本记录 |
| `primary-runtime/` | 共享构建器 `scripts/primary-runtime/prepare.ts`：按 `lock.json` 下载 Python/Node 归档与 wheel，解析 pnpm 版本，复制 Office skill 资源 | `resources/runtime/primary-runtime`；首启后离线安装到 `$TOMATO_HOME/tomato-runtimes` |
| `playwright-browsers/` | 用 `@playwright/mcp` 依赖解析出的 Playwright CLI 下载 `chrome-headless-shell`，落到共享缓存后复制 | 内置浏览器能力的 headless shell |
| `cli/` + `bin/` | 复制 `cli/tomato`(`.cmd`)、编译 macOS `link-entry`（`clang`，按 Electron 的 `LSMinimumSystemVersion`）、复制 `command-manager.js` 与 `command-path.ps1`；`bin/` 放 node 启动器 | 安装后的终端命令与 CLI 运行基础 |
| `versions.json` | 写入 `{ node, pnpm }` | 后续 `desktop-runtime.json` 的版本来源 |

Windows 目标会对 Electron、primary-runtime、Playwright 三路并发准备；macOS 串行。primary-runtime 的彻底校验（解释器、pip、wheel 集合、Office 读写）在没有 `--defer-primary-runtime-smoke` 时执行。

### 4.2 `prepare:packages`（`scripts/prepare-package-set.ts`）

把本地打包产物收敛成一份"核心包集合"：

1. 输入目录：`packed/tomato`（`release:pack --family tomato`）、`packed/vendor`、`packed/landlock`（`native/system/packages/entry`）、`packed/node-addons`（`native/system/packages/<platform>-<arch>`，如 flock），再加现场 `npm pack` / `pnpm pack` 的 `tomato-market` 与私有运行时插件（`packages/tomato/{account,brand,gateway,telemetry}`）。
2. 从 `@tomato/cli` 与 `@tomato/desktop-host` 出发做闭包遍历：`dependencies` 与 `peerDependencies` 必须命中已打包 tarball（否则报错），`optionalDependencies` 按 `os`/`cpu` 过滤后决定是否纳入。
3. 输出 `package-set/desktop-packages.json`（`schemaVersion`、按名排序的 `{name, version, file, bytes, integrity: sha512-…}`）与 `desktop-packages/*.tgz`；随后 `verifyDesktopCorePackageSet` 校验版本与排序。

### 4.3 `prepare:tomato`（`scripts/prepare-tomato.ts`）

在临时目录里复现一次真实安装，再把结果封存成可发布的运行时树：

1. 建临时项目：复制 package-set，`createRuntimeProjectMetadata` 写入 `package.json`（`dependencies` 全部指向 `file:` tarball、`tomato.profile.bundles` 列表）与 `pnpm-workspace.yaml`（`nodeLinker: hoisted`、`allowBuilds: node-pty/koffi/fs-ext/subprocess-local`、核心包 override）。
2. 应用补丁策略（`runtime-patch-policy.ts`）：每个 workspace 补丁必须先分类——`shared`（运行时要）、`workspace-only`（只在构建机执行，如 `@electron/osx-sign`、`app-builder-lib`）、`runtime-only`；`shared` 的补丁哈希必须与根 `pnpm-lock.yaml` 一致，否则报错。
3. 用 runtime 自带的 pnpm（通过 Electron Node 模式执行 `pnpm.mjs`）先 `install --lockfile-only`，校验补丁落盘，再 `install --prod --frozen-lockfile --trust-lockfile`；pnpm store 放在共享缓存的 `pnpm-store`，配置与状态目录放在 `targets/<t>/tomato-pnpm`。
4. 物化 `node_modules`：`cpSync(dereference: true)` + `desktopRuntimeFileExclusion` 过滤；再选 LibreOffice 引擎（原生或 wasm），`prepareRuntimeManifests` 用 `app-builder-lib` 的 manifest 变换器预先把 `package.json` 改成 electron-builder 会写进 ASAR 的字节。
5. macOS 签名：对 tomato 原生模块、primary-runtime、Playwright 分别签名（前两者带签名缓存）。
6. 写 `desktop-runtime.json`（见 4.5），跑 `verifyDesktopRuntime`，再跑一次完整 smoke（准备好运行时 + 预置插件），最后再校验一次以确保 smoke 没有改动字节。

失败时的行为是显式的：任何一步抛错都会删除 `targets/<t>/tomato` 目录，避免留下半成品被下一次打包误用。

### 4.4 文件策略（`runtime-file-policy.ts`）

发布树只保留"会执行的东西"。剔除规则按条目给出原因，并在打包与归档校验两处复用：

| 类别 | 具体条目 |
|---|---|
| 包管理器元数据 | `.bin`、`.pnpm`、`.modules.yaml`、`.pnpm-workspace-state-v1.json` |
| 构建与声明 | `*.map`（js/css）、`*.d.ts`、`*.tsbuildinfo` |
| `@tomato/*` 文档与源码 | 包根 `README*`、`CHANGELOG*`、`src/**`、`native/tests/**`（嵌套 markdown 视为运行时数据，保留） |
| 其他平台二进制 | 非目标 LibreOffice 引擎、`node-pty/prebuilds/<其他平台>`、`node-pty` Windows ConPTY 源码 |
| 编译器残留 | `fs-ext` 的 `obj/`、`*.pdb`/`*.exp`/`*.lib`、`binding.sln`/`.vcxproj` |
| 第三方测试/工具 | `@mixmark-io/domino` 的 `test/`、`.yarn/`；Koffi 的 `koffi.lib` 导入库 |

`verify-runtime-archive.ts` 会读 ASAR 目录树，逐文件比对 `desktop-runtime.json` 的 `files` 清单（字节数、sha256、可执行位），并单独检查 `app.asar.unpacked/tomato` 下没有清单之外的文件；任何被策略剔除的类别重新出现在 ASAR 里都直接失败。

### 4.5 `desktop-runtime.json`

封存后的唯一权威清单，字段为：

```json
{
  "schemaVersion": 1,
  "release": { "schemaVersion": 1, "version": "…", "hostProtocolVersion": 1, "nodeVersion": "…", "pnpmVersion": "…" },
  "platform": "darwin",
  "arch": "arm64",
  "sharedPackages": [{ "name": "@tomato/app-boot", "version": "…", "path": "node_modules/@tomato/app-boot" }],
  "files": [{ "path": "node_modules/…", "bytes": 0, "sha256": "…", "executable": false }]
}
```

启动时 `readDesktopRuntime` 校验 schema、版本、平台与共享包记录；打包期在写 descriptor 后与 smoke 各校验一次，`afterPack` 钩子里再校验一次。Electron 与 `@tomato/cli` 必须同版本——`prepare-tomato` 在生成 release 时直接比较两个 `package.json`，不一致就报错。

<a id="stage-builder"></a>

## 阶段 5：electron-builder 与钩子

配置由 `scripts/electron-builder-config.mjs` 的工厂函数生成（默认导出 `createElectronBuilderConfig()`），`package-target.ts` 以 `--publish never` 调用 `electron-builder exec`，因此打包过程本身永远不会上传。

### 配置骨架

| 字段 | 值/行为 | 说明 |
|---|---|---|
| `appId` | 由发布环境解析（`resolveDesktopAppId`） | 同时写进 `extraMetadata.tomatoDesktopAppId` |
| `productName` | `Tomato AI` | 决定 `.app`/`.exe` 与安装器显示名 |
| `artifactName` | `tomato-harness-${version}-${os}-${arch}<suffix>.${ext}` | `suffix` 为 `-unsigned` 或 `-unnotarized`，避免与正式产物混淆 |
| `electronDist` | `targets/<t>/electron` | 使用准备阶段解压的目标平台 Electron |
| `electronFuses` | `runAsNode: true` | 必须开启，宿主进程以 `ELECTRON_RUN_AS_NODE=1` 启动 |
| `asar` | `true` | 主进程、预加载、渲染文档、tomato 树都在 ASAR 内 |
| `files` | `lib/main.js`、`lib/splash/**`、`lib/welcome/**`、6 个 `lib/preload-*.cjs`、`renderer/**`、`package.json`、`tomato/**` + 其 `node_modules/**` | 另有两条排除：`renderer/.claude/**` 与 node_modules 的 sourcemap/tsbuildinfo |
| `asarUnpack` | `**/*.{node,dylib,dll,so,exe}`、`**/*.so.*`、`**/spawn-helper`、`**/@vscode/ripgrep-*/bin/rg`、目标 LibreOffice 引擎；`beforePack` 追加 Office 包目录与 Windows 的全部 PE | 原生模块与可执行文件必须留在磁盘上 |
| `extraResources` | `runtime`、`release-profile.patch.yml`、`icon.png`、Windows 的 `tray.ico` | 外置资源，不走 ASAR |
| `mac` | `hardenedRuntime`、entitlements、`signIgnore`、`dmg` + `zip`；unsigned 时 `identity: '-'`、只出 `dmg` | 见"签名"章 |
| `dmg` | `format: 'ULMO'`、`sign`、`writeUpdateInfo: false` | ULMO（LZMA）由本地补丁放开 |
| `win` | `nsis`、`forceCodeSigning`、`signtoolOptions.sign` 为令牌签名器 | 见"签名"章 |
| `nsis` | 非 oneClick、perUser（`perMachine: false`、`allowElevation: false`）、关闭内置目录页（目录编辑由自定义页面接管）、8 种 `installerLanguages`、`differentialPackage: true` | 自定义页面见"安装器"章 |
| `publish` | 签名构建为 `[{ provider: 'generic', url, channel }]`，否则 `null` | 只生成元数据，不上传 |

### `extraMetadata`：打进安装清单的构建事实

`extraMetadata` 会被 electron-builder 合并进打包后的 `package.json`，因此这些值在运行时可直接读：

| 键 | 何时写入 | 运行时用途 |
|---|---|---|
| `tomatoDesktopAppId` | 总是 | 应用身份 |
| `tomatoDesktopUpdateChannel` | 总是（默认 `nightly`） | 自动更新通道 |
| `version` | 仅当本次构建版本与产品版本不同（测试版或 `auto`） | 产物名、更新 feed、`app.getVersion()` 三者同源 |
| `tomatoAuthServiceUrl` / `tomatoTomatoWebUrl` | 登录环境非空时成对写入 | 把环境的登录服务封进安装包 |
| `tomatoImServiceUrl` | 非空时 | IM 服务地址 |
| `tomatoMandatoryUpdatePolicy` | 非本地 unsigned macOS | 强制更新策略（origin / 允许页面 / 认证方式 / 轮询参数） |
| `tomatoBuildCommit` / `tomatoBuildDirty` | 有 git 信息时 | 构建溯源 |

### 五个钩子

| 钩子 | 平台 | 做的事 | 失败后果 |
|---|---|---|---|
| `beforeBuild` | Windows | 跑 `prepare-windows-installer.ps1` 编译 `window-frame.dll`，生成 `strings.nsh`，签名该 DLL；返回 `true` 让 electron-builder 照常收集生产依赖 | 安装器构建中断 |
| `beforePack` | 全部 | 追加 Office 包为 `asarUnpack`；Windows 扫描 PE 并把它们移出 ASAR；解析强制更新策略配置 | 打包中断，不产出安装器 |
| `afterPack` | 全部 | macOS 写 `app-update.yml`；`verifyDesktopRuntime` 校验封存清单；unsigned Windows 额外校验 ASAR unpack | 产物被判无效 |
| `afterSign` | 全部 | Windows：`signWindowsCode` 签名全部可执行文件 + 复验 unpack；macOS：校验 `app-update.yml`、校验证书链与签名 | 签名失败即停止，写入 fatal 记录 |
| `artifactBuildCompleted` | macOS | `.dmg` 产出后送公证并装订；`--skip-notarization` 时退化为签名校验 | DMG 不允许进入发布目录 |

### 目标矩阵

| 目标 | 主机要求 | 产物 | 备注 |
|---|---|---|---|
| `mac-arm64` | Apple Silicon macOS | `.dmg` + `.zip` | 需要完整的 Developer ID + 公证凭据（除非 unsigned/skip） |
| `mac-x64` | Intel macOS 或 Rosetta | `.dmg` + `.zip` | 同上 |
| `win-x64` | Windows x64 | `.exe`（NSIS） | 需要 EV 令牌与 SignTool（除非 unsigned） |
| `linux` | — | 配置里保留 `AppImage` | 不是受支持的发布目标 |

### 本地补丁与扩展点

- `patches/app-builder-lib@26.17.0.patch`：把 `ULMO` 加入 DMG 格式的校验与 TypeScript 声明，使 `dmg.format: 'ULMO'` 可用。
- `scripts/installer.nsh`：NSIS 的 `customHeader`/`customInit` 等宏，接入自定义页面、主题与路径校验。
- `windows-directory-installer`、`windows-asar-unpack`、`windows-runtime-signature`、`macos-app-update-config`：以模块形式在钩子里替换或补强 electron-builder 的默认行为（目录安装器、PE 外置、签名保留、macOS 更新配置）。
- `prepare-runtime-manifests`：直接复用 `app-builder-lib` 的 manifest transformer，确保"封存时的字节"与"electron-builder 写进 ASAR 的字节"一致。

<a id="stage-signing"></a>

## 阶段 6：签名与公证

### macOS

签名材料与顺序：

1. `macos-entitlements.plist`（主应用与继承）：`allow-jit`、`allow-unsigned-executable-memory`、`disable-library-validation`、`device.audio-input`。`node-x64-entitlements.plist` 在 x64 目标上给 Node 追加可执行内存权限，`jit-entitlements.plist` 只给 ARM64 Node 与 Office helper。
2. 准备阶段先签原生负载：tomato 树、primary-runtime、Playwright 各自独立 `codesign`，前两者使用可跨 checkout 复用的签名缓存。
3. electron-builder 用 `hardenedRuntime: true` 签整个应用；`signIgnore` 跳过已签的 `app.asar.unpacked/tomato`、`runtime/primary-runtime`、`runtime/playwright-browsers` 与 `.pak`。
4. 正式产物分两段：先 `--dir` 构建并 smoke 打包后的运行时，再以 `--prepackaged` 从已签名副本分别产出 DMG 与 ZIP；两条公证通道并行，DMG 走 `artifactBuildCompleted`，ZIP 的应用副本由 `packageMacOSArtifacts` 单独公证，随后装订、验签、验证 Gatekeeper。
5. `--skip-notarization` 保留签名与校验，但跳过公证与装订，产物落到 `unnotarized-artifacts/` 且带 `-unnotarized` 后缀，明确只用于内部调试。

### Windows

1. **签名器**：`windows-sign.mjs` 用 SafeNet 令牌（证书文件 + 私钥容器名 + PIN）驱动 `signtool`；`windows-sign.cmd` 是实际包装脚本；`signingHashAlgorithms: ['sha256']`，`publisherName` 从证书指纹得出。
2. **PE 扫描**：`windowsRuntimeCode` 扫 primary-runtime、应用生产依赖与整个 unpacked 目录，识别 `MZ`/PE 头（包括无扩展名文件、`.dll`/`.pyd`/`.exe`）；目录链接、畸形 `MZ`、假的 PE 扩展名直接中止。
3. **签名顺序**：先签准备阶段产出的运行时（保留供应商签名，未签的补签），再在 `afterSign` 签应用目录内全部代码；每次签名都要匹配配置证书并带时间戳。
4. **批处理与并发**：公钥检查按 32 个文件一批、最多 4 个进程；硬件令牌签名严格串行。
5. **ASAR 外置**：`prepareWindowsAsarUnpack` 把 PE 文件复制出 ASAR（保持字节不变），再以源相对模式加入 `asarUnpack`；`verifyWindowsAsarUnpack` 在 `afterPack`/`afterSign` 复核。
6. **NSIS bootstrap 签名**：`installWindowsNsisBootstrapSigner` 替换 electron-builder 内部的 NSIS bootstrap 签名器，让安装器/卸载器的中间产物也走令牌。
7. **失败联锁**：任何签名失败写 `fatal.json` 并打印 `TOMATO_DESKTOP_PACKAGING_FATAL`，监督器随即拒绝后续阶段；不会带着半签名的产物继续。

<a id="installer"></a>

## 安装器构件

### Windows NSIS

| 文件 | 作用 |
|---|---|
| `scripts/installer.nsh` | 入口宏：注入语言字符串、主题、页面、生命周期；拒绝 perMachine；解析 `/THEME=` |
| `scripts/installer-directories.nsh` | 安装目录校验（根目录、非空目录、已注册目录） |
| `installer/pages.nsh` | 自定义欢迎页、目录页、进度页、完成页 |
| `installer/theme.nsh` | 明暗主题与系统主题跟随 |
| `installer/drawing.nsh` | GDI+ 绘制封装 |
| `installer/path.nsh` | 路径规范化与校验 |
| `installer/lifecycle.nsh` | 运行中进程检测、静默更新等待 |
| `installer/uninstall.nsh` | 卸载页与数据清理入口 |
| `installer/{extract,progress,extract-report,uninstall-data,directory-report}.h` | 安装器内嵌 C 头：解压、进度、报告页、卸载数据 |
| `installer/window-frame.cpp` | x86 Win32/GDI+/DWM 原生助手，编译为 `window-frame.dll`（VC++ + Windows SDK），签名后嵌入安装器 |

语言：`installer/locales/*.json` 共 8 种（en_US、zh_CN、ja_JP、es_ES、fr_FR、de_DE、ru_RU、pt_BR），`readInstallerLocales` 校验键名、占位符与不可见字符，`renderInstallerStrings` 生成 `strings.nsh`，`installerLanguages` 从同一份清单派生。卸载会清 Electron userData、`%APPDATA%` 产品目录与 updater 缓存，但绝不触碰 `TOMATO_HOME`。

### macOS

| 产物 | 生成方式 |
|---|---|
| `Tomato AI.app` | electron-builder 的 `--dir` 构建 + 签名 |
| `tomato-harness-<version>-mac-<arch>.dmg` | `ULMO` 压缩、签名、公证、装订 |
| `tomato-harness-<version>-mac-<arch>.zip` | 承载自动更新（`dmg.writeUpdateInfo: false`） |
| 安装包 ZIP | `--bundle` 模式下由 `packageMacOSInstallBundle` 组装：`Tomato AI.app` + `packaging/installer.sh` + 生成的 `Install Tomato AI.command` + `INSTALL-zh.txt` + `README.txt`，压缩名取 `macOSInstallBundleBaseName` |

<a id="updates"></a>

## 更新体系

- 运行时使用 `electron-updater`，`publish` 为 `generic` provider；安装包里写死 `channel`（`nightly` 默认，或 `latest`）与 `publicUrl`，手工安装另一通道的包会切换通道。
- 元数据文件：Windows 为 `nightly.yml` / `latest.yml`，macOS 为 `nightly-mac.yml` / `latest-mac.yml`；`latest` 拒绝预发布版本。macOS 另需 `app-update.yml`，由 `afterPack` 的 `writeMacOSAppUpdateConfig` 写入并复验。
- 差分更新：`differentialPackage: true` 生成 `.exe.blockmap`，上传时 blockmap 先于 YAML。
- 主进程侧组件：`update-coordinator`（检查/下载/安装状态机）、`update-schedule`（10 分钟基准 + ±20% 抖动 + 指数退避至 1 小时）、`update-journal`（安装日志）、`update-presentation`/`update-overlay`/`update-dialog`（卡片 UI，隔离 preload）、`mandatory-update-policy`（强制更新策略与登录）、`update-attention`。
- 安装闸门：确认框先问宿主是否会被打断（运行中的 agent/子代理/审批等待、排队消息、运行中的 job），再锁定 API 准入并排空请求，任务状态未知或排空超时都拒绝安装；宿主优雅退出后安装器接管，失败则回滚到当前版本宿主。

<a id="publish"></a>

## 发布链

打包与上传彻底分离：

1. 打包结束时，仅"签名 + 已公证 + 非目录构建"会写 `<target>-release.json`（版本、环境、通道、`publicUrl`、commit/dirty）。
2. `upload:*` 先校验该记录、部署、目标、共享版本、文件名、大小与 SHA-512，通过后才读取 COS 凭据。
3. 上传顺序：二进制与 blockmap → YAML；历史对象保留。`upload:latest:*` 只替换固定下载名（`desktop/tomato-latest-*.dmg|exe`），不改 feed。
4. 审计：`.desktop-build/upload-records/<env>-<target>-*` 下 `plan.json`、`events.jsonl`、`result.json`；凭据与授权头不入记录；写入失败即停止后续 PUT。
5. 生产版本上传成功后给打包提交打 `desktop-v<version>` 标签；脏工作区或测试版本不打标签。
6. 版本规则：正式版等于产品版本；测试版追加 `.YYYYMMDD.index`（稳定基线用 `-test.YYYYMMDD.index`）；`--build-version auto` 读目标桶或本地产物推算下一个序号。

<a id="artifacts"></a>

## 目录与产物地图

```
apps/desktop/
├── lib/
│   ├── main.js                       # tsdown 主进程包（ESM）
│   ├── preload-*.cjs                 # 6 个沙箱预加载（CJS）
│   ├── command-manager-entry.js      # CLI 命令管理入口（ESM）
│   ├── welcome/                      # welcome.js + welcome.css + 设计令牌 + 字体
│   ├── splash/splash.js              # IIFE 启动动画
│   └── types/                        # tsc 中间产物（不发布）
├── .desktop-build/
│   ├── downloads/                    # Electron 归档缓存（共享）
│   ├── pnpm-store/                   # pnpm store（共享）
│   ├── packaging-runs/<ts>-<rand>/   # run.json / events.jsonl / stdout.log / stderr.log
│   ├── upload-records/<env>-<t>-*/   # plan / events / result
│   └── targets/<mac-arm64|mac-x64|win-x64>/
│       ├── packed/{tomato,vendor,landlock,node-addons}/*.tgz
│       ├── package-set/              # desktop-packages.json + tarballs
│       ├── runtime/                  # primary-runtime/, playwright-browsers/, cli/, bin/, office-skills/, versions.json
│       ├── tomato/                   # 生产依赖树 + desktop-runtime.json
│       ├── electron/                 # 解压后的 Electron 发行版
│       ├── artifacts/                # 正式产物：dmg/zip/exe + yml + blockmap + release.json
│       ├── unsigned-artifacts/       # -unsigned 产物
│       └── unnotarized-artifacts/    # -unnotarized 产物
└── resources/                        # 图标、tray、release-profile.patch.yml
```

安装后的应用布局：

```
Tomato AI.app/Contents/
├── MacOS/Tomato AI
├── Frameworks/Electron Framework.framework/…
└── Resources/
    ├── app.asar                      # lib/*、renderer/*、package.json、tomato/**
    ├── app.asar.unpacked/tomato/**   # 原生模块与 PE
    ├── runtime/{bin,cli,primary-runtime,playwright-browsers,office-skills,versions.json}
    ├── release-profile.patch.yml
    ├── icon.png
    └── (Windows) tray.ico
```

<a id="environment"></a>

## 环境变量与配置

| 变量 | 作用域 | 作用 |
|---|---|---|
| `TOMATO_DESKTOP_TARGET_PLATFORM` / `TOMATO_DESKTOP_TARGET_ARCH` | 打包 | 目标平台/架构（默认取主机，Windows 固定 x64） |
| `TOMATO_DESKTOP_PACKAGE_CACHE_DIR` | 打包 | 跨 checkout 复用的下载与 pnpm 缓存目录（必须是绝对路径） |
| `TOMATO_DESKTOP_BUILD_VERSION` | 打包 | 由命令行 `--build-version` 归一后的构建版本 |
| `TOMATO_DESKTOP_UNSIGNED` / `TOMATO_DESKTOP_MACOS_SKIP_NOTARIZATION` | 打包 | 无签名 / 跳过公证（互斥且有平台约束） |
| `TOMATO_PACKAGING_PRESET` / `TOMATO_PACKAGING_CONFIG_DIR` | 打包 | 选择 `test`/`production` 预设与机器配置目录 |
| `TOMATO_DESKTOP_AUTO_UPDATE_ENV` | 打包/上传 | `test`（默认，`https://download-test.deepseek.com`）或 `production`（`https://download.deepseek.com`） |
| `TOMATO_DESKTOP_UPDATE_CHANNEL` | 打包 | `nightly`（默认）/`latest` |
| `TOMATO_DESKTOP_WINDOWS_{CER_FILE,SIGNTOOL,KEY_CONTAINER,TOKEN_PIN}` | Windows 签名 | EV 令牌签名四项 |
| `TOMATO_DESKTOP_WINDOWS_SIGNATURE_CACHE_DIR` / `TOMATO_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY` | Windows 签名 | 签名缓存位置与并发 |
| `DOWNLOAD_TEST_ORIGIN`、`DOWNLOAD_{TEST,PROD}_COS_BUCKET` | 打包/上传 | 测试下载源与部署桶 |
| `DOWNLOAD_{TEST,PROD}_COS_SECRET_ID` / `_SECRET_KEY` | 上传 | COS 凭据（打包子进程会被剥离） |
| `TOMATO_DESKTOP_UPDATE_CHECK_INTERVAL_MS` / `_MAX_BACKOFF_MS` / `_JITTER` | 运行时 | 普通更新轮询参数 |
| `TOMATO_DESKTOP_SKIP_SPLASH` / `_OPEN_DEVTOOLS` / `_MAIN_INSPECT_PORT` / `_RENDERER_DEBUG_PORT` / `_HOST_INSPECT_PORT` | 开发/运行时 | 启动动画与调试端口 |
| `TOMATO_HOME` / `TOMATO_DESKTOP_USER_DATA_DIR` | 运行时/开发 | 配置与浏览器数据位置隔离 |

配置文件：`config/development.env`（开发默认值）、`config/{windows,macos}-packaging/*.env`（预设）、`apps/desktop/.env.{windows,macos}`（本地发布设置，Git 忽略），机器预设模式下改用 `packaging/presets/<preset>.env` 与 `packaging/secrets/*-signing.env`。

<a id="guards"></a>

## 守卫清单

每条校验都对应一种"能打包成功、装完才炸"的故障：

| 检查 | 位置 | 防止的故障 |
|---|---|---|
| `desktop-packaged-imports` | tsdown 插件 | 未内联的裸导入被写成外部说明符，启动即 `ERR_MODULE_NOT_FOUND` |
| 客户端版本缺失即抛错 | `tsdown.config.ts` | 产物没有版本标识，客户端上报与更新判定失据 |
| `targets/<t>/tomato` 失败即删除 | `prepare-tomato` | 上一次的半成品被下一次打包当作完整树 |
| 补丁分类与哈希一致 | `runtime-patch-policy` | 运行时用了未评审或与根 lockfile 不一致的补丁 |
| 版本一致（Electron vs CLI） | `prepare-tomato` / `writeReleaseRecord` | 壳与运行时版本漂移，出现未测试组合 |
| 文件策略 + ASAR 归档校验 | `runtime-file-policy` / `verify-runtime-archive` | 源码、文档、其他平台二进制进入发布包 |
| `desktop-runtime.json` 多处校验 | 准备（写后 + smoke 后）、`afterPack`、启动 | 封存后字节被改动，或安装树被替换 |
| Windows PE 扫描 + 签名验证 | 准备/打包/签名 | 未签名的可执行代码随安装包分发 |
| ASAR unpack 复验 | `afterPack` / `afterSign` | PE 文件被错误地留在 ASAR 内或字节被改 |
| `check:package` + 工具链探测 | `package-target` | 缺 `tar`、缺 VC++、缺证书等要到流程中段才暴露 |
| 打包运行日志与脱敏 | `packaging-run` / `packaging-step` | 长流程失败后无证据；凭据泄露到日志 |
| 上传前置校验 | `upload-target` / `desktop-upload-plan` | 未签名、版本不符或文件被替换的对象进入 CDN |

<a id="shared"></a>

## 与其他应用的关系

- **Web**：Desktop 打包同一个 Web 前端（`@tomato/web-frontend`）与同一套 profile 初始化/插件管理；主进程只提供窗口、协议、IPC 与原生能力。`tomato-app://app/` 由 Electron 提供静态资源与请求转发，`tomato-app://shell/` 提供更新文档。
- **CLI**：`@tomato/cli` 与 desktop 同版本；安装后的 `runtime/cli/bin/tomato` 用 Desktop 的 Electron 与自带 pnpm 运行，可与 npm 安装版共存但绝不共享 profile 与 `node_modules`。
- **SDK**：共享 primary-runtime 构建器与 Office 资源布局；Desktop 自带的 `load_workspace_dependencies` 工具把同一份载荷离线安装到 `$TOMATO_HOME/tomato-runtimes`。
- **运行时插件面**：Desktop profile 的初始 bundle 为 `@tomato/base`、`@tomato/web-app`、`@tomato/experimental-browser-use-playwright-bundle` 加内置 `tomato-market`；插件安装与激活走共享 Web Plugin Manager 与自带 pnpm，打包侧只保证这些包的 tarball 在闭包里（`prepare-package-set` 的 `EXTRA_PACKAGES`/`PRIVATE_RUNTIME_PACKAGES`）。

<a id="workflows"></a>

## 三条操作路径

开发（热路径）：

```sh
pnpm run dev:desktop      # 构建全部产物 + 桌面 bundle，准备临时项目与 primary-runtime，启动 Electron
pnpm run start:desktop    # 跳过构建，复用现有产物
```

本地打包（无签名，可安装验证）：

```sh
pnpm run package:desktop:mac:arm64:unsigned
pnpm run package:desktop:win:x64:unsigned
```

正式发布（示例：macOS arm64）：

```sh
pnpm run check:package
pnpm run package:desktop:mac:arm64
pnpm run upload:mac:arm64
```

Windows 的发布前必读是 [Windows signing and runner operations](windows-signing/README.md)（共享 runner 的凭据与设备隔离风险），发布细节归 [Desktop packaging](packaging/README.md) 与 [Desktop publication](publishing/README.md) 所有；本文只解释构建机制。

<a id="limits"></a>

## 边界与限制

- 只发布 macOS（arm64/x64）与 Windows（x64）；Linux 的 `AppImage` 配置存在但不属于发布目标。
- macOS x64 需要 Intel 机器或 Rosetta；Windows 目标必须在 Windows x64 主机上构建（NSIS 与 VC++ 工具链）。
- 未签名/未公证产物文件名带后缀并落在独立目录，不能进入更新 feed；`--skip-notarization` 产物明确不用于分发。
- 打包不联网也能完成的部分限于"已有缓存 + 已准备产物"；首次运行仍需要 Electron 归档、Python/Node/pnpm 归档与 Playwright shell。
- 上传不重试：一次 PUT 失败即停止，审计记录不构成"对象未写入"的证据，恢复需人工检查远端状态。
- 发布配置（证书、凭据、桶）从不进入产物；`extraMetadata` 只携带公开的构建事实与登录来源。

<a id="appendix-dependencies"></a>

## 附录 A：依赖包用途

| 包 | 类型 | 用途 |
|---|---|---|
| `electron` 44.x | dev | 运行时与打包基座；`electronFuses.runAsNode` 支撑宿主进程 |
| `electron-builder` 26.17 / `app-builder-lib` | dev | 安装器打包、ASAR 读写、manifest 变换、bootstrap 签名扩展点 |
| `tsdown` 0.22（Rolldown） | 根 dev | 8 组 bundle 的打包器与插件宿主 |
| `vite` 6.4.3 | dev | welcome/splash 的 IIFE 构建（Web 前端另用同一版本） |
| `@electron/get` + `extract-zip` | dev | 下载并解压目标平台 Electron |
| `pnpm` 11.28.5 | dev | 打包期安装生产依赖；同时作为 runtime 自带发行版 |
| `sharp` | dev | `render:tray-icon` 从 SVG 逐尺寸栅格化 tray 图标 |
| `@electron/notarize` | dev | macOS 公证（app 与 dmg 两条通道） |
| `cos-nodejs-sdk-v5` | dev | 发布上传（腾讯 COS） |
| `js-yaml` | dev | 读取 workspace 配置与补丁策略 |
| `semver` | 运行时 | 版本合法性与更新比较 |
| `electron-updater` | 运行时 | 自动更新检查/下载/安装 |
| `ws` | 运行时 | 账号后端 WebSocket |
| `three` | 运行时 | 启动动画渲染（splash 客户端包） |

<a id="appendix-scripts"></a>

## 附录 B：脚本索引

| 脚本 | 职责 |
|---|---|
| `scripts/package-target.ts` | 打包总入口：解析目标/模式、版本、配置预检、监督日志、按序调用准备与 electron-builder |
| `scripts/electron-builder-config.mjs` | 生成 electron-builder 配置与五个钩子 |
| `scripts/desktop-build-paths.mjs` | 目标目录解析与产物目录/后缀选择 |
| `scripts/desktop-package-environment.mjs` | 读取预设/dotenv/Actions 输入并做发布前校验 |
| `scripts/packaging-run.mjs` / `packaging-step.mjs` | 运行目录、事件日志、脱敏、阶段超时与致命标记 |
| `scripts/prepare-runtime.ts` | Electron / primary-runtime / Playwright / CLI 准备与 `versions.json` |
| `scripts/prepare-package-set.ts` | tarball 闭包选择与 `desktop-packages.json` |
| `scripts/prepare-tomato.ts` | 生产依赖树安装、裁剪、签名、`desktop-runtime.json`、smoke |
| `scripts/prepare-runtime-manifests.ts` / `prepare-runtime-patches.ts` | manifest 变换与补丁策略落盘 |
| `scripts/runtime-file-policy.ts` / `verify-runtime-archive.ts` | 发布文件剔除规则与 ASAR 归档校验 |
| `scripts/runtime-patch-policy.ts` | workspace 补丁的 Desktop 归属决策 |
| `scripts/windows-sign.mjs` / `windows-runtime-signature.mjs` | EV 令牌签名、PE 扫描、签名保留与验证 |
| `scripts/windows-asar-unpack.mjs` | 把 PE 文件移出 ASAR 并在打包后复核 |
| `scripts/windows-signature-cache*.mjs` | 签名缓存与并发控制 |
| `scripts/macos-runtime.ts` / `verify-macos-signature.mjs` / `notarize-macos.mjs` | 原生负载签名、签名校验、公证 |
| `scripts/package-macos.ts` / `package-macos-bundle.ts` | DMG/ZIP 双通道与 `--bundle` 安装包 |
| `scripts/upload-target.ts` / `desktop-upload-*.ts` | 发布前校验、计划、COS 上传与审计记录 |
| `scripts/dev.ts` / `development-project.ts` / `development-app.ts` | 开发启动、临时项目与 macOS 开发包 |
| `scripts/desktop-toolchain-preflight.ts` | `tar`、`vswhere` 与 VC++ 工具链探测 |

<a id="dev-note"></a>

## Dev Note

本文是面向维护者的构建机制说明，不属于 `docs/` 站点语料：单语、不参与双语配对与文档预算门禁。若需要进入文档树，应先决定归属层级（桌面应用参考 vs 跨包开发者指南），再按 `docs/AGENTS.md` 补齐 YAML 元数据、双语对与网站投影清单。
