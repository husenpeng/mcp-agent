---
description: "dsh web 客户端右侧栏的 Skills 标签页类型：以滚动懒加载的卡片浏览全部已安装 skill，并提供详情页与个人 skill 文件编辑。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-skill-browser

[English](README.md) | 中文

## 概述

浏览当前 Session 组合能看到的全部 skill，查看单个 skill 的元数据与指令正文，并编辑存放在个人目录 `$DSH_HOME/skills` 或 `$DSH_AGENTS_HOME/skills` 中的 skill。该页面从右侧栏的指南页进入，不声明任何资源地址。

## 目录

- [注册内容](#what-it-registers)
- [面板](#the-panel)
- [模型侧体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发者说明](#dev-note)

-----

<a id="what-it-registers"></a>
## 注册内容

- **类型** — `ctx.sidebarRightTabs.register(...)`：kind 为 `skills`，id 为 `@deepseek-ai/dsh-client-ui-skill-browser`，band 为 `builtin`，不声明地址模式；指南条目顺序为 40，标题在所有语言中都是专有名词 `Skills`。
- **页面主体** — 同一 id 下的键控 `sidebar.right.pane.tab` 席位。框架传入 Session id 与 tab 记录，主体只调用注入的 face；face 调用按 Session 寻址的 `skills` Remote。
- **标签标题** — 同一 id 下的键控 `sidebar.right.pane.tab.title` 席位：类型标签前绘制共享的 skill 字形。

状态存放在本类型自己的 store 中，按 tab id 分桶。tab 记录的 `signal` 结束一个桶：关闭标签即遗忘状态，之后到达的请求结果不再写入。

<a id="the-panel"></a>
## 面板

列表以 `includeModelOnly: true` 与 `brief: true` 读取 `skills/list`，因此仅模型可用的 skill 也会出现，而简介不进入这次响应；`/` 输入源继续使用自己完整、仅用户可调用的请求。每一行只显示 skill 名称、来源分组；当输入源隐藏该 skill 时，再显示“仅模型”标记。

行按 24 个一批揭示。已挂载行之后的哨兵在进入列表滚动区时向 store 请求下一批；重新读取 catalog 会把游标归零。整个 catalog 一次 RPC 取回，因为 skill 目录规模很小。

选择一行会只为该 skill 读取 `skills/get`，并填充列表旁的详情窗格：简介、可选的适用场景、路径、来源，以及以 Markdown 渲染的指令正文。列表保持可见，选中行有标记；关闭控件会清空详情窗格。侧栏较窄时两个窗格改为上下堆叠，列表在上方并限制高度。

`editable` 由 Host 判定：获胜 provider 必须支持更新、skill 必须有磁盘文件、来源必须是个人目录。只有满足时详情才提供 **编辑**。表单编辑简介、适用场景与 Markdown 正文；名称只读。**保存**调用 `skills/save`，并把 Host 的读回结果发布到详情与对应卡片。保存失败保留草稿并就地报告；**取消**丢弃草稿。

列表有加载骨架、带重试的就地失败提示与空状态；详情有自己的加载骨架，读取失败时提供重试。标题栏的刷新控件重新读取 catalog，并绑定该 tab 的刷新快捷键。

`src/client/` 下的源文件：`definition.tsx`（类型）、`store.ts`（保留的状态）、`face.ts`（Remote 读写）、`SkillsBody.tsx`（卡片列表与详情切换）、`SkillDetail.tsx`（详情与编辑表单）、`format.ts`（来源与失败文案）、`locales.ts`（界面文案）、`index.ts`（装配）。

<a id="model-experience"></a>
## 模型侧体验

通过后续 `skill` 调用与用户显式 `/name` 调用加载被编辑的 `SKILL.md` 间接影响模型；面板本身不组装模型请求。

#### KV Cache 影响

面板本身没有。之后的 skill 调用会把编辑后的正文嵌入请求，与嵌入任何当前 skill 文件的方式相同。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>
- **不新建、不改名。** 面板只编辑既有的个人 skill；名称保持只读，因为改名会移动目录或文件并改变所有 `/name` 引用。
- **无搜索与筛选。** 列表按名称顺序展示完整 catalog。
- **客户端增量渲染，而非 RPC 分页。** catalog 一次读取，卡片分批挂载。若 catalog 大到需要处理，应在 `skills/list` 中增加游标分页。
- **最后写入者获胜。** 保存是原子的整文件写入，没有乐观版本校验；两个编辑者可能互相覆盖。
- **手动刷新 catalog。** 其他客户端中的预设与插件变化通过刷新控件读取，而不是推送。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

写入能力由 `@deepseek-ai/dsh-skill-filesystem` 拥有：它重读原始文件，把指定字段合并到既有 YAML frontmatter，保留未知键，并重写正文。Remote 将这一能力限制在个人来源，并从获胜 catalog 条目解析目标，因此请求从不携带路径。当写入经过 `ctx.fs` 时，provider 把可写范围限定在该 skill 文件所在目录，因为个人根目录通常位于部署 workspace 之外。

</details>
