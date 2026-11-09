# tomato-campaign

把 client-monorepo 的 **campaign（活动）/ outreach（触达）** 业务接进 Tomato Harness：一个同源 BFF 代理、一个活动工作台面板、一组模型工具，以及一份内嵌 skill。

## 组成

| 面 | 内容 |
|---|---|
| Host | `index.js`：注册 `<harness>/api/clientweb/**` 前缀代理（把网关的 `tomato_session` 换成 BFF 的 `session_id`）、工具、skill |
| Browser | `src/client`：全局主面板「活动工作台」（活动列表 / 活动详情 / 触达收件箱），侧栏入口 `campaign-workspace`；列表带筛选与排序，详情分角色卡 / 达人清单 / 概览 / 触达四页 |
| 工具 | `campaign_list`、`campaign_get`、`roster_list`、`role_card_list`、`search_report_get`、`feishu_members`、`outreach_threads`，以及写工具 `campaign_update`、`campaign_create`、`role_card_create`、`search_task_start`、`roster_import_feishu`、`outreach_reply` |
| Skill | `campaign-outreach`：链路顺序、写操作确认、额度与 PII 提醒 |

## 界面

| 位置 | 展示 | 能做什么 |
|---|---|---|
| 活动列表 | 活动名、品牌 · 品类 · 目标、阶段、市场、平台、预算、达人数与招募目标、头腰尾分布、更新时间 | 关键词搜索、按阶段 / 平台 / 市场筛选、按更新时间 / 达人数 / 名称排序、加载更多、新建活动 |
| 活动详情 | 阶段、市场、平台、预算、周期、我的角色；达人 / 招募目标 / 头腰尾 / 角色卡 / 待触达 / 成员六个指标 | 改阶段（PATCH）、新建角色卡、导入飞书达人、刷新 |
| 角色卡页 | 每张卡的角色定位、层级、平台、目标国家、粉丝区间、内容任务、受众、商务信号、排除项 | 发起推荐任务（异步）、查看最近一次推荐报告（平台分桶候选、评分、预估报价、理由与主页链接） |
| 达人清单页 | 头像、名字、handle、平台、国家、粉丝、互动率、层级、建联阶段、数据更新时间 | 搜索、加载更多、点行看详情抽屉（推荐理由、主页、从活动移除 DELETE） |
| 概览页 | 目标 / 产品 / 受众 / 卖点 / 达人偏好 / 竞品 / 周期 / 简介 / 备注，活动 id 与产出文件 | 打开产出文件的外链 |
| 触达 | 收件箱线程、待触达活动（待发首封的达人数） | 选中线程写纯文本回复 |

写操作都以对话框或明确的按钮发起，成功后在顶部提示；失败落在同位置的红条里，不会静默吞掉。

## 配置

```yaml
- id: tomato-campaign
  name: tomato-campaign
  config:
    baseUrl: https://test.tomatoai.vip   # 默认取 TOMATO_WEB_URL（Desktop 已指向公司 BFF）
    proxyPath: /api/clientweb            # 浏览器侧前缀
    allowWrites: true                    # false 时不注册写工具
    tools: true
    skill: true
```

会话不需要单独配置：浏览器请求带着本地网关写的 `tomato_session`，代理把它翻译成 `session_id` 转发；工具读取最近一次代理请求用过的同一个会话。**插件不落盘任何凭据。**

## 安装

### Desktop（`~/.tomato/profiles/desktop`）

Desktop 的 profile 不接受仓库 CLI 的 `tomato plugin`（CLI 拒绝管理 desktop profile），直接改 profile 再装：

```sh
# 0) 先备份
cp ~/.tomato/profiles/desktop/package.json ~/.tomato/profiles/desktop/package.json.bak-tomato-campaign

# 1) 依赖里加一行（路径换成你的 tgz 绝对路径）
#    "tomato-campaign": "file:/Users/underdog/engineering/tomatoHarness/plugins/tomato-campaign/tomato-campaign-0.1.0.tgz"

# 2) bundles 里加一行（放在 "@tomato/web-app" 之后）
#    "tomato-campaign"

cd ~/.tomato/profiles/desktop
pnpm install
# 3) 完全退出 Tomato AI 再启动；侧栏「活动」入口即为本插件
```

改完的 `package.json` 关键片段：

```json
{
  "dependencies": {
    "tomato-market": "file:/…/tomato-market-0.3.0.tgz",
    "tomato-campaign": "file:/…/tomato-campaign-0.1.0.tgz"
  },
  "tomato": {
    "profile": {
      "bundles": ["@tomato/base", "@tomato/web-app", "…", "tomato-market", "tomato-campaign"]
    }
  }
}
```

> 想边改边看，把 `file:` 换成 `link:/Users/underdog/engineering/tomatoHarness/plugins/tomato-campaign`，改完 `node scripts/build-client.mjs`，浏览器刷新即可（Host 面改动仍需重启）。

### 其他 profile

```sh
cd plugins/tomato-campaign && npm pack
pnpm tomato plugin --profile <profile> add file:/abs/path/tomato-campaign-0.1.0.tgz
# 再把 "tomato-campaign" 加进该 profile 的 tomato.profile.bundles，重启 Host
```

## 本地验证

```sh
node --test "tests/*.test.mjs"    # 24 个用例：配置、信封、代理、工具、客户端渲染与写操作
node scripts/build-client.mjs     # 生成 client.js（已提交）
```

- `tests/host.test.mjs` 起一个 mock BFF，验证路径/查询/方法/请求体转发、`session_id` 注入、401 与登录跳转收敛、`set-cookie` 过滤、重定向改写、工具执行与错误分类。
- `tests/client.test.mjs` 用 jsdom 加载**构建产物**，验证主面板与侧栏注册、列表数据列、点击进入详情、角色卡与推荐报告、达人清单，以及改阶段真的发出 PATCH。

## 本地测试的依赖

`tests/` 需要两个仓库内包：`esbuild`（构建 bundle）与 `@tomato/tools`（`defineTool`）。插件不在 workspace 里，所以用软链解决，`node_modules/` 不随包发布：

```sh
mkdir -p node_modules/@tomato
ln -sfn ../../tomato-market/node_modules/esbuild node_modules/esbuild
ln -sfn ../../../../packages/core/tools node_modules/@tomato/tools
```

## 已知边界

- 只覆盖 campaign / 达人清单 / 角色卡 / 触达回复；飞书 IM 发消息走 `services-monorepo` 的 `im_service`（`/mcp/im/`），不在本插件内。
- 活动详情里的富文本编辑器（tiptap）、文件上传、导出没有搬；需要时按同一数据层补。
- 面板是全局主面板，不跟会话绑定；同一 Host 上多个会话共享一个登录态。