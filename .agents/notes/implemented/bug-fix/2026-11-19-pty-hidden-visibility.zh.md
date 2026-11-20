# Agent Note: node-pty 以隐藏符号 visibility 从源码构建，使原生错误不再中止宿主

Status: implemented

[English](2026-11-19-pty-hidden-visibility.md) | 中文

## 问题

一次在 macOS 文件沙箱内运行的打包运行时冒烟，在分配 PTY 的那一刻以 `SIGABRT` 中止（`terminating due to uncaught exception of type Napi::Error`）。崩溃栈从 `pty.node` 的 `PtyFork` 抛出，展开到位于 `koffi.node` 的 `Napi::details::CallbackData<…>::Wrapper`，随后 `__cxxabiv1::failed_throw` → `std::terminate`。

两个独立缺陷叠加：

- Seatbelt profile 在工作区与临时根之外拒绝 `file-write*`，而 `posix_openpt(O_RDWR)` 是对 `/dev/ptmx` 的写打开，因此受限进程内的 PTY 分配以 `EPERM` 失败。node-pty 在 `pty_posix_spawn` 错误路径上以 `throw Napi::Error::New(env, err)` 上报。
- node-pty 的上游 prebuild 启用 C++ 异常（`node_addon_api_except`），并把 node-addon-api 的回调包装器导出为**弱外部符号**。koffi 的预编译 `koffi.node` 导出同一个弱符号，但编译时**没有**异常支持（没有 `__cxa_throw`/`__cxa_begin_catch`/personality 导入）。dyld 与 ELF 会在全进程范围合并弱定义，因此先加载的 addon 同时拥有两者的包装器。产品与冒烟都先加载 koffi 再加载 node-pty，于是 node-pty 的抛出展开经过 koffi 那个没有 catch 的包装器，中止进程而非变成 JS 错误。node-pty 的每条错误路径（spawn 失败、参数错误、ioctl 失败）都受影响，不止沙箱这一种。

两层都已复现：先加载 koffi 时，prebuild 的 `pty.spawn` 中止（exit 134）；不加载 koffi 时，同一调用抛出可捕获的 `posix_openpt failed: Operation not permitted`；同一 payload 在沙箱外能正常 spawn。

## 决策

扩展 node-pty patch，使 Unix 以隐藏符号 visibility 从源码构建：

- `binding.gyp` 为非 Windows target 增加 `-fvisibility=hidden -fvisibility-inlines-hidden`（以及对应的 Xcode `GCC_SYMBOLS_PRIVATE_EXTERN`/`GCC_INLINES_ARE_PRIVATE_EXTERN`）。回调包装器与 `Napi::Error` typeinfo 变为私有外部符号，dyld/ELF 无法再把它们与 koffi 的副本合并，`pty.node` 绑定到自己带 catch 的包装器。`napi_register_module_v1` 通过 `NAPI_MODULE_EXPORT` 的默认 visibility 保持导出。
- `scripts/prebuild.js` 在非 Windows 上删除 prebuilds 并以非零退出，使 `node-gyp rebuild` 运行、让上述标志生效。Windows 保留 prebuilds：它没有弱符号插入。

原生抛出随即表现为可捕获的 JS 错误，由 `spawnTerminal` 现有的 try/catch 重新抛给消费者；provider 仍按 subprocess seam 的文档以平台原始错误拒绝。

## 备选方案

**把 node-pty 改为无异常的 `node_addon_api` target 并重写每个 `throw` 点。** 否决：这会在 `pty.cc` 约 15 个 throw 点及 Windows ConPTY 源码上偏离上游，抬高每次 node-pty 版本升级的成本。隐藏 visibility 保持上游代码不变，用一个构建标志修复整类问题。

**保证 node-pty 先于 koffi 加载。** 否决：加载顺序是进程级且脆弱的，跨越众多导入 koffi 的包，不是可强制执行的不变量。

**在 `pty.spawn` 前于 JS 侧预检 `/dev/ptmx`。** 否决：只覆盖沙箱触发点，其余原生 throw 路径仍会中止。

**在 Seatbelt profile 中放行 `/dev/ptmx` 与 `/dev/ttys*`。** 延后：这是关于终端是否在受限环境下运行的沙箱策略决策，与让原生错误可上报相互独立。崩溃修复不依赖它。

## 后果

Unix 安装（工作区、profile 以及 Desktop 运行时安装）现在用 node-gyp 编译 node-pty，而非解包 prebuild；koffi、fs-ext 与原生系统 addon 已经要求的 C++ 工具链足以覆盖。Desktop 安装已放行 `node-pty` 构建脚本。`loadNativeModule` 优先解析 `build/Release`，因此源码构建的 `pty.node` 与 `spawn-helper` 无需额外改动即可加载。

Desktop 运行时文件策略剔除 node-pty `build/` 下的 makefile、`config.gypi`、debug 构建与编译中间产物，同时保留 `build/Release/pty.node` 与 `spawn-helper`（以及 Windows ConPTY 二进制）。它匹配单个条目而非对文件做白名单，以免复制过滤器把 `build/Release` 目录本身剪掉。`pnpm-lock.yaml` 中的共享 patch 哈希随 patch 字节变化；`prepare-runtime-patches` 会校验它。

Windows 不变：保留上游 prebuilds 与[控制台宿主 note](2026-09-28-pty-bundled-console-host.zh.md) 记录的自带控制台宿主行为。

可捕获的拒绝同时恢复了用户授权路径。受限命令需要 PTY 时，现在以非零退出并在 stderr 输出 `Operation not permitted` 失败，seatbelt 拒绝方言（`matchesSignature`）将其归类为沙箱拒绝；`tool-bash` 随即渲染拒绝标记与升级提示，模型的 `sandbox_permissions` 重试经 `approveEscalation` 落到用户批准弹窗。它所取代的 abort 是没有退出码的信号死亡，从不匹配拒绝、也不提供授权。如今的授权是唯一严格更宽的档 `danger-full-access`；仅 PTY 的最小权限授权（把窄 `/dev/ptmx` + `/dev/ttys*` 能力接入同一批准 seam）延后。产品的交互式终端在未受限宿主里分配 PTY、只受限被 spawn 的 shell，因此不会触发此拒绝。

## 测试

`packages/subprocess/subprocess-local/tests/pty-native-error.spec.ts` 拉起一个 fixture：先加载 koffi，再以无参调用 `pty.native.open()`——一个在任何系统调用之前发生的确定性原生抛出——并断言子进程以 0 退出且带捕获到的错误，而非死于信号。它在 Windows 上跳过，因为那里不存在该隐患。面对被合并的 prebuild 包装器，fixture 会中止；面对隐藏 visibility 构建，它上报 `CAUGHT:Usage: pty.open(cols, rows)`。

`packages/sandbox/sandbox/tests/diagnostics.spec.ts` 钉住：node-pty 在失败退出上的 `Operation not permitted` 拒绝匹配 seatbelt 拒绝方言（从而到达批准升级），而 SIGABRT 信号死亡不匹配。

`apps/desktop/tests/runtime-file-policy.spec.ts` 跨平台钉住新的 `build/` 剔除项与保留的 Release 二进制。依赖 PTY 的 `subprocess-local` spec 在沙箱外通过；在沙箱内它们以可捕获的 `posix_openpt` 错误失败而非中止，这是沙箱策略所致，并非本变更。无适用 snapshot：本变更改变的是原生失败的容纳方式，而非自身的模型或产品用户可见输出。