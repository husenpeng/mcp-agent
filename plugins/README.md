# plugins/

第三方插件的适配副本。本目录不在 `pnpm-workspace.yaml`、`tsconfig` 或仓库质量门禁的包范围内；这里的内容是可直接安装到 profile 的外部插件源码，不是 `@tomato/*` 工作区包。

| 目录 | 内容 |
|---|---|
| [`ds-bot/`](ds-bot/FORK.md) | DS Bot 0.2.3 的 Tomato 适配分支（Apache-2.0，社区插件） |
| [`tomato-market/`](tomato-market/README.md) | 插件市场：浏览开源 DeepSeek Harness 插件目录，按分类/星标/关键词检索；安装时把 DSH 插件转换为 Tomato 命名后交给原生安装器（MIT） |

安装方式见各目录的说明。仓库级测试、类型检查与中英对照配对都不会扫描这里。