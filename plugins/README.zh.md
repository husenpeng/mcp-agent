# plugins/

[English](README.md) | 中文

独立插件源码：其中一个目录是出厂组合包挂载的工作区包，其余目录是可安装到 profile 的外部插件。

| 目录 | 内容 |
|---|---|
| [`ds-bot/`](ds-bot/FORK.md) | DS Bot 0.2.3 的 Tomato 适配分支（Apache-2.0，社区插件） |
| [`tomato-campaign/`](tomato-campaign/README.md) | Tomato Campaign 适配副本 |
| [`tomato-market/`](tomato-market/README.zh.md) | 插件市场的 Host 半：读取开源 Tomato Harness 插件目录与营销目录，并把安装交给插件页自己的安装对话框（MIT）。它的标签页是 `@tomato/client-ui-tomato-market` |

安装方式见各目录的说明。`tomato-market` 是工作区包，随仓库测试、类型检查与中英对照配对一起校验；其余副本只在需要时安装。
