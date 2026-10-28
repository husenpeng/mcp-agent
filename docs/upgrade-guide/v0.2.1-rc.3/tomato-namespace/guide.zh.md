---
kind: upgrade-guide
description: "仓库自有的 DSH/dsh 命名统一改为 TOMATO/tomato。启动新构建前先迁移环境变量、数据、命令与插件清单。"
---

# 运行时命名统一为 Tomato

[English](guide.md) | 中文

## 变更

仓库自有的全部命名从 `DSH` / `dsh` 改为 `TOMATO` / `tomato`。旧写法不再读取，也不保留别名。

| 面 | 改前 | 改后 |
|---|---|---|
| npm scope | `@deepseek-ai/*` | `@tomato/*` |
| 环境变量命名空间 | `DSH_*` | `TOMATO_*` |
| Harness home | `~/.dsh` | `~/.tomato` |
| CLI 命令 | `dsh` | `tomato` |
| 清单字段 | `"dsh"` | `"tomato"` |
| 设置键 | `dsh.*` | `tomato.*` |
| URL scheme | `dsh-app://`、`dsh-resource://`、`dsh-session:` | `tomato-app://`、`tomato-resource://`、`tomato-session:` |
| 发布 tag | `dsh-v<version>` | `tomato-v<version>` |
| 桌面 app ID | `com.deepseek.dsh` | `vip.tomatoai.desktop` |
| 本地桌面构建 ID | `com.deepseek.harness` | `vip.tomatoai.harness` |

DeepSeek 自身的身份不变：`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`api.deepseek.com`、`deepseek-*` 模型 id、`deepseek-official` / `deepseek-account` / `deepseek-api-key` provider id，以及适配器包名中的 `deepseek` leaf。`@deepseek-ai/libreoffice-kit*` 这些真实第三方包也保留原名。

## 迁移

1. 重命名 home 目录：`mv ~/.dsh ~/.tomato`。不迁移时，新构建从空状态开始，旧数据仍留在 `~/.dsh`。
2. 把 shell 配置、`.env`、CI secret 与打包配置里的 `DSH_` 换成 `TOMATO_`。`DSH_HOME` 现在是 `TOMATO_HOME`；桌面打包变量（如 `DSH_DESKTOP_APP_ID`）现在是 `TOMATO_DESKTOP_APP_ID`。
3. 命令从 `dsh` 改为 `tomato`，包括 `dsh web`、`dsh --profile`，以及调用已安装 `dsh` / `dsh.cmd` 启动器的脚本。已安装命令需要从新包重新安装。
4. 更新插件与 profile 清单：包字段是 `"tomato"`，profile bundle 列表位于 `tomato.profile.bundles`；包名使用 `@tomato/*` 并去掉 `dsh-` 前缀，例如 `@deepseek-ai/dsh-agent` 变为 `@tomato/agent`。
5. 改名后重新安装 profile 包；旧 lockfile 与包链接引用的是已不存在的名字。
6. 使用新 app ID 的桌面安装是一个独立应用：它不会原地替换旧构建，旧构建的更新通道也不再适用。

## 验证

- `tomato --version` 能通过新启动器解析。
- `TOMATO_HOME` 指向重命名后的 home，会话出现在侧栏。
- 在 `tomato.profile.bundles` 中配置的模型路由在 profile 重载后生效。