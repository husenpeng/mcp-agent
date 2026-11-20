---
kind: upgrade-guide
description: "网页搜索与抓取改为只经已登录的公司网关执行；DeepSeek、Exa、Perplexity 提供方与网页搜索设置页已移除。"
---

# 网页访问只经公司网关执行

[English](guide.md) | 中文

## 变更

`@tomato/web-deepseek-api`、`@tomato/web-search-deepseek`、`@tomato/web-search-exa` 与 `@tomato/web-search-perplexity` 不再随包发行。`@tomato/web` 只在其余提供方中选择：公司网关的搜索与抓取提供方，以及匿名 HTTP 抓取提供方。`@tomato/client-ui-settings-web-search` 一并移除，因为网关 origin 来自启动环境、供应商凭据由网关持有，GUI 里已没有可配置项。

选择方式由“固定一个 id”改为“有序候选列表”。`searchProviders` 与 `fetchProviders` 取代 `searchProvider` 与 `fetchProvider`：第一个已注册且可用的候选生效，因此已登录步骤使用网关，未登录步骤仍可回落到匿名 HTTP 抓取提供方。环境变量 `$TOMATO_WEB_SEARCH_PROVIDERS` 与 `$TOMATO_WEB_FETCH_PROVIDERS` 提供同样的逗号分隔列表。空列表保留原有的自动选择规则。

没有已登录网关会话的步骤既不声明 `web_search`，也不声明 `web_fetch`，除非它的抓取候选中包含 `http`。

## 迁移

1. 删除 profile patch 与自定义组合包中所有引用上述已移除包的配置项：`web-deepseek-api`、`web-search-deepseek`，以及任何 `web-search-exa` 或 `web-search-perplexity` 行。
2. 在同样这些文件里替换选择字段：

   ```yaml
   - id: web
     config:
       searchProviders: [company]
       fetchProviders: [company, http]
   ```

   若某部署不允许未登录抓取，请从 `fetchProviders` 中去掉 `http`。
3. 删除 profile 设置与启动环境中所有 `web-deepseek-api`、`web-search-deepseek`、`web-search-exa` / `web-search-perplexity` 的设置键，以及 `DEEPSEEK_SEARCH_BASE_URL` 变量；读取它们的提供方已不存在。
4. 用 `tomato --profile <name>` 重启该 profile，并运行 `tomato --profile <name> --dump-config` 确认 `web` 行显示你写入的候选列表。
5. 在已登录会话中请求网页搜索：模型应收到 `web_search`，且请求到达网关。退出登录，或让 profile 指向没有网关 origin 的部署：该步骤不声明 `web_search`，只有在抓取候选中包含 `http` 时才准入 `web_fetch`。
