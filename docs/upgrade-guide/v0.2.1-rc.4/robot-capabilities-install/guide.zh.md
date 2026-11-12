---
kind: upgrade-guide
description: "Tomato Rbot 规格新增插件声明；依赖能力的手动机器人必须先安装才能开始运行；删除机器人只删除实例，保留规格与运行记录。"
---

# 机器人能力、安装与删除

[English](guide.md) | 中文

## 变更

机器人规格的 `capability` 区块新增 `plugins`，列出机器人依赖的插件模块名。本版本之后发布的规格都会携带该字段；早于该字段的版本 2 存储记录在打开时补为空列表，因此既有 profile 无需手工迁移即可继续使用。以 JSON 发布规格的调用方现在必须提供 `capability.plugins`，因为规格 schema 会拒绝未知字段与缺失的必填字段。

安装机器人成为显式步骤。`robot.install` 按当前部署解析声明的技能、插件、MCP 服务器与权限预设，只有全部可用时才在机器人上记录安装；否则以 `robot/capabilities-missing` 失败并列出每个缺口。插件只有在插件清单中报告为启用且活跃时才算可用。安装只校验依赖，从不安装插件包。把机器人重绑定到新 revision 会清除安装记录，因此运行不会沿用用户未执行过的校验。规格声明了技能、插件或 MCP 服务器时，`robot.start` 会在其绑定 revision 安装前拒绝开始运行；触发器或其他 Host 代码通过 `ctx.robots.start` 启动的运行仍按自身规则接受。

`robot.remove` 只删除机器人实例。已发布的 revision 与运行记录仍可读取；仍有未终态运行的机器人在该运行结束前拒绝删除。

面向模型的工具也使用同一套词汇。`robot_create` 接受可选的 `skills`、`plugins` 与 `mcpServers` 列表；`robot_update` 只替换调用中给出的列表并重新发布既有机器人。机器人页发起的创建会话还会加载内置的 `grilling` 技能，为 `robot-creation` 技能提供一次只问一个问题的访谈方法。

## 迁移

1. 为脚本、集成或保存的 fixture 产出的每份 `RobotSpec` 载荷补上 `"plugins": []`；缺少该字段会作为无效规格拒绝。已存储的规格会在机器人存储域打开时升级。
2. 规格声明了技能、插件或 MCP 服务器的既有机器人，在下一次手动运行前先执行安装。机器人页会在卡片上显示「待安装」，并在机器人上提供「安装」；缺失的插件先到「设置 → 插件」安装，再重试安装。
3. 检查通过 `robot` Remote 命名空间而不是机器人页启动运行的自动化：未安装的依赖型机器人会以 `robot/conflict` 与 `not-installed` 报告。
4. 检查指示模型收集能力选项的创建提示词。`robot_create` 现在直接接受这些列表；`robot_update` 可修改既有机器人而无需重建。挂载 `@tomato/experimental-robot-app` 的 profile 无需额外配置即可获得 `grilling` 技能。