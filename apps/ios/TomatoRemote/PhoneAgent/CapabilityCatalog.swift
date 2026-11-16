//
//  CapabilityCatalog.swift
//  Tomato Remote
//
//  The open-source capabilities Tomato Phone ships knowledge of.
//
//  Each entry is a declaration, not bundled code: a skill is instruction text
//  the loop adds to every turn, an MCP row is a public Streamable HTTP endpoint
//  the app connects to, and a plugin pairs the two. Keeping the table in the
//  app means a fresh install offers useful capabilities with one tap instead
//  of asking the owner for a URL.
//

import Foundation

/// One capability the phone offers out of the box.
struct CapabilityCatalogEntry: Identifiable, Hashable {
    let id: String
    let kind: AgentCapabilityKind
    let name: String
    let version: String
    let summary: String
    /// Human name of the upstream project or service.
    let sourceName: String
    /// Page a reader can use to check the project and its terms.
    let sourceURL: String
    /// Licence or service terms the entry relies on.
    let license: String
    /// Instructions a skill or plugin adds to every turn.
    let skillText: String?
    /// Public MCP endpoint, when this entry connects one.
    let mcpURL: String?
    /// Label the MCP tool list is registered under.
    let mcpName: String?

    /// The declarative bundle a plugin entry installs.
    var manifest: AgentPluginManifest {
        AgentPluginManifest(
            name: name,
            version: version,
            summary: summary,
            skillText: skillText,
            mcpURL: mcpURL,
            mcpName: mcpName
        )
    }
}

/// Office skills adapted from Anthropic's document workflows.
private enum OfficeCapabilityCatalog {
    static let all: [CapabilityCatalogEntry] = [
        CapabilityCatalogEntry(
            id: "skill.pptx",
            kind: .skill,
            name: "PPT 演示文稿",
            version: "1.0",
            summary: "规划页纲、视觉层级、图表与演讲备注；连接 PPTX 工具后可生成或编辑 .pptx。",
            sourceName: "anthropics/skills · pptx",
            sourceURL: "https://github.com/anthropics/skills/tree/main/skills/pptx",
            license: "Apache-2.0",
            skillText: """
            处理演示文稿时，先确认受众、目的、语言、篇幅与比例，再给出逐页大纲。每页只传达一个核心观点，标题尽量直接写结论；
            混用要点、图示、图表和流程，避免把长段落搬上幻灯片，必要时补演讲备注。已安装并能调用 PPTX 工具时，
            按工具能力生成或编辑文件，检查文字溢出、元素遮挡、页数和最终文件是否可用；没有文件工具时，
            输出可直接制作的逐页文稿，并明确说明尚未生成 .pptx 文件，不得虚构下载链接。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.docx",
            kind: .skill,
            name: "Word 文档生成",
            version: "1.0",
            summary: "生成报告、方案与公文的正文和样式；连接 DOCX 工具后可导出 .docx。",
            sourceName: "anthropics/skills · docx",
            sourceURL: "https://github.com/anthropics/skills/tree/main/skills/docx",
            license: "Apache-2.0",
            skillText: """
            处理 Word 文档时，先确认用途、读者、语气与篇幅，再组织标题层级、正文、列表、表格、页眉页脚和引用。
            样式保持一致，事实与数字必须有输入或来源，不要编造。已安装并能调用 DOCX 工具时，
            按工具能力创建、读取或编辑文件，复核标题样式、表格、分页与最终文件；没有文件工具时，
            输出结构完整、可粘贴到 Word 的文稿，并明确说明尚未生成 .docx 文件，不得虚构下载链接。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.xlsx",
            kind: .skill,
            name: "Excel 电子表格",
            version: "1.0",
            summary: "设计工作簿、公式、图表与分析口径；连接 XLSX 工具后可生成或编辑 .xlsx。",
            sourceName: "anthropics/skills · xlsx",
            sourceURL: "https://github.com/anthropics/skills/tree/main/skills/xlsx",
            license: "Apache-2.0",
            skillText: """
            处理电子表格时，先确认输入数据、计算口径与交付结果，再划分原始数据、计算和展示区域。
            保留可追溯的公式，不硬编码应由公式得到的结果；使用合适的数据类型、数字格式、表头与图表，数据区避免合并单元格。
            已安装并能调用 XLSX 工具时，生成或编辑文件后检查公式错误、行列范围、汇总与图表引用；没有文件工具时，
            输出可复制到 Excel 的表格或 CSV 文本，并明确说明尚未生成 .xlsx 文件，不得虚构下载链接。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.pdf",
            kind: .skill,
            name: "PDF 文档处理",
            version: "1.0",
            summary: "规划 PDF 的读取、合并、拆分与检查；连接 PDF 工具后可执行文件操作。",
            sourceName: "anthropics/skills · pdf",
            sourceURL: "https://github.com/anthropics/skills/tree/main/skills/pdf",
            license: "Apache-2.0",
            skillText: """
            处理 PDF 前先确认任务是读取、提取、合并、拆分、填写还是创建，并核对页码范围与输出顺序。
            扫描件没有文本层时说明需要 OCR，不要把猜测当作原文。已安装并能调用 PDF 工具时，
            操作后检查页数、顺序、文本与表单是否保留；没有文件工具时，只提供用户可执行的操作步骤或文本处理结果，
            并明确说明尚未生成或修改 PDF 文件，不得虚构下载链接。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
    ]
}

/// The shipped capability table.
enum CapabilityCatalog {
    /// Entries in the order the market shows them, grouped by kind.
    static let all: [CapabilityCatalogEntry] = OfficeCapabilityCatalog.all + [
        // MARK: MCP servers

        CapabilityCatalogEntry(
            id: "mcp.deepwiki",
            kind: .mcp,
            name: "DeepWiki 仓库文档",
            version: "1.0",
            summary: "查询公开 GitHub 仓库的架构、用法和实现说明，无需账号。",
            sourceName: "DeepWiki",
            sourceURL: "https://docs.devin.ai/work-with-devin/deepwiki-mcp",
            license: "公开端点 · 无需 Key",
            skillText: nil,
            mcpURL: "https://mcp.deepwiki.com/mcp",
            mcpName: "deepwiki"
        ),
        CapabilityCatalogEntry(
            id: "mcp.context7",
            kind: .mcp,
            name: "Context7 开发文档",
            version: "1.0",
            summary: "按库名和版本读取第三方开发库的官方文档与示例。",
            sourceName: "Context7",
            sourceURL: "https://context7.com/docs/resources/all-clients",
            license: "公开端点 · 匿名限流",
            skillText: nil,
            mcpURL: "https://mcp.context7.com/mcp",
            mcpName: "context7"
        ),
        CapabilityCatalogEntry(
            id: "mcp.mslearn",
            kind: .mcp,
            name: "Microsoft Learn 文档",
            version: "1.0",
            summary: "检索微软官方文档与代码示例，覆盖 Azure、.NET 和 Microsoft 365。",
            sourceName: "Microsoft Learn",
            sourceURL: "https://learn.microsoft.com/api/mcp",
            license: "Microsoft API 使用条款",
            skillText: nil,
            mcpURL: "https://learn.microsoft.com/api/mcp",
            mcpName: "microsoft-learn"
        ),
        CapabilityCatalogEntry(
            id: "mcp.cloudflare",
            kind: .mcp,
            name: "Cloudflare 文档",
            version: "1.0",
            summary: "检索 Cloudflare 开发者文档：Workers、Pages、R2 与 AI Gateway。",
            sourceName: "Cloudflare",
            sourceURL: "https://developers.cloudflare.com/agents/model-context-protocol/",
            license: "公开端点 · 无需 Key",
            skillText: nil,
            mcpURL: "https://docs.mcp.cloudflare.com/mcp",
            mcpName: "cloudflare-docs"
        ),

        CapabilityCatalogEntry(
            id: "mcp.aws-knowledge",
            kind: .mcp,
            name: "AWS 知识库",
            version: "1.0",
            summary: "检索 AWS 官方文档、最佳实践与服务限制，无需 AWS 账号。",
            sourceName: "AWS Knowledge",
            sourceURL: "https://aws.amazon.com/about-aws/whats-new/2025/10/aws-knowledge-mcp-server-generally-available",
            license: "公开端点 · 无需 AWS 账号",
            skillText: nil,
            mcpURL: "https://knowledge-mcp.global.api.aws",
            mcpName: "aws-knowledge"
        ),

        // MARK: Skills

        CapabilityCatalogEntry(
            id: "skill.code-review",
            kind: .skill,
            name: "代码审查",
            version: "1.0",
            summary: "按正确性、边界、错误处理、安全和测试覆盖给出分级结论。",
            sourceName: "awesome-skills/code-review-skill",
            sourceURL: "https://github.com/awesome-skills/code-review-skill",
            license: "MIT",
            skillText: """
            审查用户给出的代码或补丁时，先确认目标行为和上下文；按正确性、边界与空值、错误处理、并发、安全、测试覆盖的顺序检查。只报告有证据的问题，按 P0/P1/P2 标注严重度；先列最严重的一到三条，再给最小修复建议和需要补的测试。不要重写整个文件，也不要臆测未展示的代码。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.debugging",
            kind: .skill,
            name: "系统化调试",
            version: "1.0",
            summary: "先复现、再最小化、用证据排除假设，修复后补回归验证。",
            sourceName: "obra/superpowers",
            sourceURL: "https://github.com/obra/superpowers",
            license: "MIT",
            skillText: """
            调试问题时先复现并写清期望与实际；构造最小失败用例，列出可能的假设并逐一用证据排除；优先检查最近改动、边界输入与依赖版本。修复后补一条能防止复发的验证。报告根因、修复点与验证结果，不要只给猜测。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.brainstorm",
            kind: .skill,
            name: "结构化头脑风暴",
            version: "1.0",
            summary: "先发散再收敛：给出多方向候选，并说明取舍与下一步验证。",
            sourceName: "obra/superpowers",
            sourceURL: "https://github.com/obra/superpowers",
            license: "MIT",
            skillText: """
            头脑风暴时先明确目标、约束与受众；先发散，至少给出 8 个不同方向，包括反向和极端方案；再按影响、成本、风险收敛到 3 个候选，说明每个候选的假设与下一步验证。不要过早否定想法，也不要给没有取舍理由的清单。
            """,
            mcpURL: nil,
            mcpName: nil
        ),

        CapabilityCatalogEntry(
            id: "skill.financial-statements",
            kind: .skill,
            name: "财务报表分析",
            version: "1.0",
            summary: "读三张表，算盈利、杠杆与现金流质量，标出异常项。",
            sourceName: "anthropics/financial-services",
            sourceURL: "https://github.com/anthropics/financial-services",
            license: "Apache-2.0",
            skillText: """
            分析财务报表时先确认公司、期间、币种与会计准则（US GAAP、IFRS 或中国会计准则），再读利润表、资产负债表与现金流量表。计算收入与利润增速、毛利率、经营利润率、ROE/ROIC、流动比率、净负债/EBITDA，以及经营现金流与净利润的差异；标出异常项，例如应收或存货增速快于收入、一次性收益、资本化支出。先给三条最重要的发现，再列数据与计算口径；没有数据时明确缺失，不要编造。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.valuation",
            kind: .skill,
            name: "估值与敏感性",
            version: "1.0",
            summary: "DCF 与可比公司交叉验证，给出区间和关键假设的敏感性。",
            sourceName: "anthropics/financial-services",
            sourceURL: "https://github.com/anthropics/financial-services",
            license: "Apache-2.0",
            skillText: """
            做估值时先写清假设：预测期、收入与利润率驱动、资本开支、营运资本、WACC、永续增长或退出倍数；用 DCF 与可比公司两种方法交叉验证，给出区间而不是单点。对关键假设做敏感性分析，例如 WACC 上下各一个百分点、增长率上下各一个百分点，说明哪些假设最影响结论。区分事实、管理层指引与你的假设并引用来源；缺少数值时给出所需数据清单，不要臆造。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.portfolio-risk",
            kind: .skill,
            name: "风险与组合分析",
            version: "1.0",
            summary: "集中度、回撤、因子与情景分析，给出风险排序和缓解建议。",
            sourceName: "anthropics/financial-services",
            sourceURL: "https://github.com/anthropics/financial-services",
            license: "Apache-2.0",
            skillText: """
            分析投资组合或单一标的风险时，先确认资产、权重、基准与时间窗口；计算集中度、波动率、最大回撤、下行捕获与主要因子暴露。用情景分析说明利率上行、需求下滑或汇率波动的影响路径；提到 VaR 时说明置信度、窗口与局限。输出风险排序与对冲或减仓建议，明确这不是投资建议，并列出数据缺口。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.industry-research",
            kind: .skill,
            name: "行业与公司研究",
            version: "1.0",
            summary: "拆解市场规模、竞争格局与监管周期，标出需要验证的假设。",
            sourceName: "anthropics/financial-services",
            sourceURL: "https://github.com/anthropics/financial-services",
            license: "Apache-2.0",
            skillText: """
            研究行业时先定义边界与产业链位置，拆解市场规模、增速、竞争格局、定价权、监管与周期；对比两到三家代表公司，引用财报、公告或权威数据并标注日期。结论给出三条关键判断与需要验证的假设，区分事实与推断，不要用单一年份的数据代替趋势。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.architecture-review",
            kind: .skill,
            name: "系统架构评审",
            version: "1.0",
            summary: "沿请求路径检查扩展性、一致性、失败模式与可观测性。",
            sourceName: "Tomato 内置",
            sourceURL: "https://github.com/donnemartin/system-design-primer",
            license: "原创内容",
            skillText: """
            评审系统架构时先确认目标、规模假设、SLA 与约束；从请求路径、数据模型、一致性、失败模式、可观测性、部署与成本七个方面检查。列出单点、热点、跨服务事务和回滚缺口；对每个问题给影响与最小修复建议，按 P0/P1/P2 排序。区分已证实的问题与需要验证的假设。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.tech-selection",
            kind: .skill,
            name: "技术选型",
            version: "1.0",
            summary: "按约束给候选打分，明确 PoC 验证点与退出条件。",
            sourceName: "Tomato 内置",
            sourceURL: "https://github.com/donnemartin/system-design-primer",
            license: "原创内容",
            skillText: """
            做技术选型时先写需求与非功能约束（吞吐、延迟、一致性、合规、团队经验、成本），列出两到四个候选；用加权评分表对比，给出 PoC 验证点与退出条件。结论明确推荐一个方案，并说明不选其他方案的理由与迁移成本。不要只列优缺点清单。
            """,
            mcpURL: nil,
            mcpName: nil
        ),
        CapabilityCatalogEntry(
            id: "skill.threat-model",
            kind: .skill,
            name: "安全威胁建模",
            version: "1.0",
            summary: "按资产与信任边界做 STRIDE 分析，给最小缓解措施。",
            sourceName: "Tomato 内置",
            sourceURL: "https://owasp.org/www-community/Threat_Modeling",
            license: "原创内容",
            skillText: """
            做威胁建模时先画资产、信任边界与入口；按 STRIDE 逐类列出威胁，标注可能性与影响，给出最小缓解措施（认证、授权、输入校验、最小权限、审计）。优先覆盖身份、数据存储、外部集成与供应链；区分已修复与待验证项。
            """,
            mcpURL: nil,
            mcpName: nil
        ),

        // MARK: Plugins

        CapabilityCatalogEntry(
            id: "plugin.github-docs",
            kind: .plugin,
            name: "GitHub 仓库助手",
            version: "1.0",
            summary: "用 DeepWiki 读公开仓库文档，回答架构、用法和实现问题。",
            sourceName: "DeepWiki + Tomato",
            sourceURL: "https://docs.devin.ai/work-with-devin/deepwiki-mcp",
            license: "公开端点 · 无需 Key",
            skillText: """
            用户询问某个公开 GitHub 仓库的架构、用法或实现时，先确认 owner/repo，再调用 DeepWiki 的仓库文档工具读取结构与内容，必要时提问。回答引用仓库名和文档主题；仓库不存在或未收录时明确说明，不要编造源码细节。
            """,
            mcpURL: "https://mcp.deepwiki.com/mcp",
            mcpName: "deepwiki"
        ),
        CapabilityCatalogEntry(
            id: "plugin.library-docs",
            kind: .plugin,
            name: "开发库文档助手",
            version: "1.0",
            summary: "用 Context7 按库名和版本读取官方文档，给出匹配当前版本的 API。",
            sourceName: "Context7 + Tomato",
            sourceURL: "https://context7.com/docs/resources/all-clients",
            license: "公开端点 · 匿名限流",
            skillText: """
            用户询问第三方开发库或框架的用法时，先解析库名与版本，再读取对应文档；优先给与当前版本匹配的 API 和示例，标注库名、版本和来源。文档未覆盖时说明，不要凭记忆补全 API。
            """,
            mcpURL: "https://mcp.context7.com/mcp",
            mcpName: "context7"
        ),
        CapabilityCatalogEntry(
            id: "plugin.ms-docs",
            kind: .plugin,
            name: "微软技术文档助手",
            version: "1.0",
            summary: "用 Microsoft Learn 检索官方文档，回答 Azure、.NET 与 Microsoft 365 问题。",
            sourceName: "Microsoft Learn + Tomato",
            sourceURL: "https://learn.microsoft.com/api/mcp",
            license: "Microsoft API 使用条款",
            skillText: """
            回答 Azure、.NET、Microsoft 365 等微软技术问题时，先检索 Microsoft Learn 官方文档并读取相关页面；引用标题与链接，区分预览版和正式版。找不到官方说明时明确说明。
            """,
            mcpURL: "https://learn.microsoft.com/api/mcp",
            mcpName: "microsoft-learn"
        ),

        CapabilityCatalogEntry(
            id: "plugin.aws-architecture",
            kind: .plugin,
            name: "AWS 架构助手",
            version: "1.0",
            summary: "用 AWS 官方知识库做架构评审与云服务选型，引用文档链接。",
            sourceName: "AWS Knowledge + Tomato",
            sourceURL: "https://aws.amazon.com/about-aws/whats-new/2025/10/aws-knowledge-mcp-server-generally-available",
            license: "公开端点 · 无需 AWS 账号",
            skillText: """
            回答 AWS 架构或服务选型问题时，先用 AWS Knowledge 检索官方文档，引用服务名、区域与链接；评审架构时按扩展性、一致性、失败模式、可观测性与成本给结论，区分官方限制与你自己的假设。
            """,
            mcpURL: "https://knowledge-mcp.global.api.aws",
            mcpName: "aws-knowledge"
        ),
    ]

    /// Entries for one market tab.
    /// - Parameter kind: capability kind the tab shows.
    /// - Returns: catalog rows in table order.
    static func entries(for kind: AgentCapabilityKind) -> [CapabilityCatalogEntry] {
        all.filter { $0.kind == kind }
    }
}
