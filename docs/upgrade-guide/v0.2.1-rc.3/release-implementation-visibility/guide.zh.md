---
kind: upgrade-guide
description: "发行版 Desktop 运行时不再携带 harness 文档与源码，拒绝读取安装目录，也不再告知实现 checkout 位置。"
---

# 发行版不再暴露 harness 实现

[English](guide.md) | 中文

## 变更

已安装的 Desktop 应用把自己的 harness 当作可读文件携带：`app.asar` 里包含各包 README、`src/` 目录、测试材料、bundle patch，以及带注释的未压缩 JavaScript。文件工具运行在 Electron 内，其 `fs` 把 ASAR 归档当目录读取，所以模型被问及自身配置时可以直接引用安装后的代码，而 shell 命令只看到一个不透明文件。发行构建现在关闭这条路径。

| 面 | 之前 | 之后 |
|---|---|---|
| 运行时归档 | 生产 `node_modules` 树的全部文件 | 省略包根 README/CHANGELOG、翻译元数据、`src/`、`native/tests/`（`apps/desktop/scripts/runtime-file-policy.ts`） |
| 归档校验 | 描述文件字节与文件清单 | 额外拒绝任何被省略类别进入 ASAR |
| 文件读取 | 只约束写入 | 受保护安装根下的读取以 `FS_PROTECTED_PATH` 失败，不存在可升级的路径 |
| Shell 配置 | 约束写入 | macOS Seatbelt 拒绝读取，Linux `bwrap` 遮蔽受保护根；Landlock 与 Windows ACL runner 无法拒绝读取 |
| 模型上下文 | Web bundle 告知实现 checkout | Desktop 发行覆盖层设置 `harness-dev-context` 的 `sourceContext: false`；Web GUI 定位与 URL 保留 |

早期构建创建的 Session 在下一次请求前不受影响：它已接纳的 checkout 段落不再注册，因此该轮的 system prompt 省略该段。GUI 段落仍然保留。

## 迁移

1. 重新构建已分发的 Desktop 产物；已有安装在被替换前仍保留旧归档。用 `npx @electron/asar extract <app>/Contents/Resources/app.asar /tmp/asar` 确认 `tomato/node_modules/@tomato/*/src` 与包 README 均不存在。
2. 自行组合部署的维护者应显式命名安装目录：在 `@tomato/sandbox-policy` 上设置 `protectedReadRoots` 为物理运行时根。Desktop 应用通过 `TOMATO_PROTECTED_READ_ROOTS` 传入；不设置则保持原有行为。
3. 仅在实现树本就应当可被检查时保持 `harness-dev-context.sourceContext` 的默认值 `true`。发行版设置为 `false`；禁用整行会同时移除 GUI 定位。
4. 在 Linux 与 Windows 上，shell 命令仍可读取归档字节，因为这两类配置语言没有读取拒绝规则。不要把它们当作该边界；发行归档本身已不再携带文档或源码。

用打包构建验证：向 `tomato web` 询问自身配置时不再引用安装内文件，对应用归档下路径的 `read` 以 `FS_PROTECTED_PATH` 失败，macOS 沙箱命令中的 `strings app.asar` 失败，运行时上下文不再包含 `Current Tomato Harness implementation checkout` 行。