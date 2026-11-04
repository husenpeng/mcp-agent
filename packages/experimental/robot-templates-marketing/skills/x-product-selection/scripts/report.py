"""Write the HTML report and the xlsx workbook for one X product-selection run.

The HTML file is self-contained: inline CSS and inline SVG charts, no
scripts or network assets, so it opens offline. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime, timedelta

from metrics import commerce_links, demand_signals, domain_summary, engagement

STATUS_LABEL = {"validated": "已验证 validated", "watch": "待观察 watch", "rejected": "淘汰 rejected"}


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def bucket_labels(now: datetime, granularity: str, buckets: int) -> list:
    """Return the UTC start date (MM-DD) of each trend bucket, oldest first."""
    width = timedelta(days=1 if granularity == "day" else 7)
    return [(now - width * (buckets - index)).strftime("%m-%d") for index in range(buckets)]


def _bar_chart(rows: list, label_key: str, value_key: str, title: str) -> str:
    """Return an inline horizontal SVG bar chart for up to 10 rows with positive values."""
    data = [(str(row.get(label_key) or ""), row.get(value_key)) for row in rows if (row.get(value_key) or 0) > 0]
    data = sorted(data, key=lambda item: item[1], reverse=True)[:10]
    if not data:
        return ""
    top = data[0][1]
    bar_height, gap, label_width, width = 22, 6, 260, 760
    height = len(data) * (bar_height + gap)
    bars = []
    for index, (label, value) in enumerate(data):
        y = index * (bar_height + gap)
        length = max(2, (width - label_width - 90) * value / top)
        short = label if len(label) <= 36 else label[:35] + "…"
        bars.append(
            f'<text x="{label_width - 8}" y="{y + 15}" text-anchor="end">{html.escape(short)}</text>'
            f'<rect x="{label_width}" y="{y}" width="{length:.1f}" height="{bar_height}" rx="3"></rect>'
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{html.escape(_fmt(value, 1))}</text>'
        )
    return (
        f'<figure><figcaption>{html.escape(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">{"".join(bars)}</svg></figure>'
    )


def _column_chart(labels: list, values: list, title: str) -> str:
    """Return an inline vertical SVG column chart of counts per bucket."""
    if not values or not any(values):
        return ""
    top = max(values)
    width, height, base = 760, 180, 150
    step = width / len(values)
    cols = []
    for index, (label, value) in enumerate(zip(labels, values)):
        tall = (base - 20) * value / top
        x = index * step + step * 0.15
        cols.append(
            f'<rect x="{x:.1f}" y="{base - tall:.1f}" width="{step * 0.7:.1f}" height="{tall:.1f}" rx="3"></rect>'
            f'<text x="{x + step * 0.35:.1f}" y="{base - tall - 4:.1f}" text-anchor="middle">{value}</text>'
            f'<text x="{x + step * 0.35:.1f}" y="{base + 16}" text-anchor="middle">{html.escape(label)}</text>'
        )
    return (
        f'<figure><figcaption>{html.escape(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">{"".join(cols)}</svg></figure>'
    )


_CSS = """
body{font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;margin:0;color:#1f2328;background:#f6f8fa}
main{max-width:1100px;margin:0 auto;padding:32px 24px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 12px;border-bottom:1px solid #d0d7de;padding-bottom:6px}
.meta{color:#59636e;font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:16px}
.kpi{background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}
.kpi b{display:block;font-size:20px}.kpi span{color:#59636e;font-size:12px}
table{width:100%;border-collapse:collapse;background:#fff;font-size:13px}
th,td{border:1px solid #d0d7de;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f0f3f6}
td.n{text-align:right;white-space:nowrap}
figure{margin:12px 0;background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}
figcaption{font-weight:600;margin-bottom:8px}svg{width:100%;height:auto;font-size:12px}svg rect{fill:#2f81f7}
.gap{background:#fff8c5;border:1px solid #d4a72c;border-radius:10px;padding:8px 12px}
.note{background:#ddf4ff;border:1px solid #54aeff;border-radius:10px;padding:8px 12px}
ul{margin:4px 0}
"""


def _cost_line(context: dict) -> str:
    cost = context.get("x_cost")
    if not cost:
        return "未调用 X API，本次 X 费用为 $0。No X API call; X spend $0."
    return (
        f"X API 读取 {cost['reads']:,} 条（帖子 {cost['posts_read']:,} + 用户 {cost['users_read']:,}，请求 {cost['requests']:,} 次），"
        f"估算费用 ≈ ${cost['cost_usd']:.2f}（读取数 × ${cost['rate_usd']}）。{cost['note']}"
    )


def write_html(path: str, title: str, products: list, posts: list, context: dict) -> None:
    """Write the HTML report.

    context keys: query (str), generated_at (datetime), sources (list of str),
    gaps (list of str), granularity ("day" or "week"), buckets (int),
    dropped (int), x_cost (dict or None).
    """
    generated: datetime = context["generated_at"]
    labels = bucket_labels(generated, context["granularity"], context["buckets"])
    totals = [sum(row["counts"][index] for row in products) for index in range(context["buckets"])] if products else []
    unit = "日 day" if context["granularity"] == "day" else "周 week"
    validated = [row for row in products if row["status"] == "validated"]
    domains = domain_summary(posts)
    gaps = context.get("gaps") or []

    def product_rows(items: list) -> str:
        return "".join(
            "<tr>"
            f"<td>{html.escape(row['product'])}</td>"
            f"<td>{html.escape(STATUS_LABEL[row['status']])}</td>"
            f'<td class="n">{_fmt(row["opportunity"], 1)}</td>'
            f'<td class="n">{_fmt(row["trend_score"], 2)}</td>'
            f'<td class="n">{_fmt(row["z"], 2)}</td>'
            f'<td class="n">{row["mentions"]}</td>'
            f'<td class="n">{row["authors"]}</td>'
            f'<td class="n">{_fmt(row["engagement"])}</td>'
            f'<td class="n">{row["demand_posts"]}</td>'
            f"<td>{html.escape(', '.join(f'{name} {count}' for name, count in sorted(row['networks'].items())))}</td>"
            f"<td>{html.escape(' / '.join(str(count) for count in row['counts']))}</td>"
            "</tr>"
            for row in items
        )

    header = (
        "<tr><th>商品 Product</th><th>状态 Status</th><th>机会分 Opportunity</th><th>趋势分 Trend</th><th>z</th>"
        "<th>提及 Mentions</th><th>作者 Authors</th><th>互动 Engagement</th><th>需求帖 Demand posts</th>"
        f"<th>电商链接 Commerce links</th><th>每{html.escape(unit)}提及 Counts ({html.escape(labels[0] if labels else '')} →)</th></tr>"
    )
    demand_posts = sorted(
        (post for post in posts if demand_signals(post.get("text"))),
        key=lambda post: -(engagement(post) or 0),
    )[:20]
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">关键词 Keywords: {html.escape(context["query"])} · 生成时间 Generated: {generated.isoformat(timespec="minutes")} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}</p>',
        "<h2>结论与 Top N Summary</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(posts)}</b><span>有效帖子 Posts kept</span></div>",
        f"<div class=\"kpi\"><b>{context.get('dropped', 0)}</b><span>剔除（重复 / 疑似 bot）Dropped</span></div>",
        f"<div class=\"kpi\"><b>{len(products)}</b><span>候选商品 Candidates</span></div>",
        f"<div class=\"kpi\"><b>{len(validated)}</b><span>已验证 Validated</span></div>",
        f"<div class=\"kpi\"><b>{html.escape('$' + format(context['x_cost']['cost_usd'], '.2f') if context.get('x_cost') else '$0')}</b><span>X API 估算费用 Est. X cost</span></div>",
        "</div>",
        _bar_chart(products, "product", "opportunity", "机会分 Top 10 Opportunity score"),
        "<h2>估算口径声明 Estimate statement</h2>",
        "<div class=\"note\"><ul>"
        "<li>X 和替代讨论源都没有销量或 GMV；本报告只衡量讨论热度和需求信号，不估算销量。</li>"
        f"<li>趋势分按{html.escape(unit)}计算：最近一{html.escape(unit)}提及量相对此前 {context['buckets'] - 1} 个{html.escape(unit)}的 z-score × ln(1 + 总互动)。</li>"
        f"<li>{html.escape(_cost_line(context))}</li>"
        "</ul></div>",
        "<h2>商品榜 Product ranking</h2>",
        f"<table>{header}{product_rows(products[:50])}</table>" if products else "<p>没有识别到被至少 2 条帖子提及的商品；可用 --product 补充商品词典。</p>",
        f"<h2>提及趋势 Mention trend（每{html.escape(unit)}）</h2>",
        _column_chart(labels, totals, f"全部候选商品提及量 Mentions per {context['granularity']}") or "<p>无时间序列。</p>",
        "<h2>电商域名 Commerce domains</h2>",
        (
            "<table><tr><th>渠道 Network</th><th>含该链接的帖子 Posts</th><th>链接数 Links</th><th>域名 Hosts</th></tr>"
            + "".join(f"<tr><td>{html.escape(name)}</td><td class=\"n\">{count}</td><td class=\"n\">{links}</td><td>{html.escape(hosts)}</td></tr>" for name, count, links, hosts in domains)
            + "</table>"
        ) if domains else "<p>帖子链接中没有识别到电商域名。</p>",
        "<h2>需求信号与代表帖子 Demand signals</h2>",
        (
            "<table><tr><th>帖子 Post</th><th>来源 Source</th><th>信号 Signals</th><th>互动 Engagement</th></tr>"
            + "".join(
                f'<tr><td><a href="{html.escape(post.get("url") or "")}">{html.escape((post.get("text") or "")[:160])}</a></td>'
                f"<td>{html.escape(post.get('source') or '')}</td><td>{html.escape(', '.join(demand_signals(post.get('text'))))}</td>"
                f'<td class="n">{_fmt(engagement(post))}</td></tr>'
                for post in demand_posts
            )
            + "</table>"
        ) if demand_posts else "<p>没有识别到求推荐、问价或购买类帖子。</p>",
        "<h2>风险 Risks</h2><ul>",
        "<li>商品实体为规则抽取（首字母大写短语、话题标签、购买动词后的短语）加别名归并，可能混入品牌、人名或泛词；请以 --product 词典复核。</li>",
        "<li>样本只覆盖所列来源的公开帖子，不代表全网；Reddit 和 Hacker News 的用户画像偏向英语、科技和社区讨论。</li>",
        "<li>利润未测算：讨论源不含价格与成本，需在运行指令中提供售价与成本后另算。</li>",
        "</ul>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>流程：种子关键词搜索 → 按 id 和文本去重 → 过滤疑似 bot（账号注册 &lt; 30 天，或关注 ≥ 1000 且粉丝 ÷ 关注 &lt; 0.1；仅 X 有作者资料）→ 抽取商品实体并归并别名 → 解析链接中的电商域名 → 趋势分 → 排序。</li>",
        "<li>别名归并：小写去标点、去复数 s 后相同的写法合并；一个短写法恰好是唯一一个更长写法的结尾时并入（Creami → Ninja Creami）；--product 词典优先。</li>",
        "<li>互动 = 点赞 + 转发 + 回复 + 引用（X）；Reddit 为 score + 评论数；Hacker News 为 points + 评论数。缺失记「—」，不按 0 计算。</li>",
        "<li>趋势分 = (本期提及 − 前期均值) ÷ max(前期标准差, 1) × ln(1 + 总互动)。X recent search 只覆盖 7 天，因此有 X 数据时按日计算（最近 24 小时对比前 6 天）；否则按周计算（最近 7 天对比前 4 周）。</li>",
        "<li>状态：趋势分 &gt; 0 且扩散到 ≥ 3 位作者、≥ 2 个社区为已验证；满足其一为待观察；都不满足为淘汰。</li>",
        "<li>机会分 = 100 × (0.5 × 趋势分 + 0.3 × ln 互动 + 0.2 × 需求帖数)，三项各自在候选商品间 min-max 归一。</li>",
        "<li>X 费用估算 = 返回的帖子对象数 + 用户对象数，× $0.005；该单价来自 2026 年二手来源，须到 developer.x.com 核实。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{html.escape(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


def _write_rows(sheet, bold, columns: list, rows: list) -> None:
    for col, name in enumerate(columns):
        sheet.write(0, col, name, bold)
    for row_index, row in enumerate(rows, start=1):
        for col, value in enumerate(row):
            if value is None:
                sheet.write_blank(row_index, col, None)
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                sheet.write_number(row_index, col, value)
            else:
                sheet.write_string(row_index, col, str(value))
    sheet.freeze_panes(1, 0)


def write_xlsx(path: str, products: list, posts: list, dropped: list, context: dict) -> None:
    """Write the workbook: products, posts, search_interest, cost_assumptions, domains, dropped_posts, and run sheets."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    generated: datetime = context["generated_at"]
    labels = bucket_labels(generated, context["granularity"], context["buckets"])

    _write_rows(workbook.add_worksheet("products"), bold, [
        "product", "status", "opportunity", "trend_score", "z", "mentions", "authors", "communities", "engagement",
        "demand_posts", "demand_signals", "commerce_networks", "sources", "post_ids",
    ], [[
        row["product"], row["status"], row["opportunity"], row["trend_score"], row["z"], row["mentions"], row["authors"],
        row["communities"], row["engagement"], row["demand_posts"],
        ", ".join(f"{kind} {count}" for kind, count in sorted(row["demand"].items())),
        ", ".join(f"{name} {count}" for name, count in sorted(row["networks"].items())),
        ", ".join(row["sources"]), ", ".join(str(item) for item in row["post_ids"]),
    ] for row in products])

    post_columns = ["id", "source", "query", "created_at", "author", "author_followers", "lang", "text", "likes", "reposts",
                    "replies", "quotes", "impressions", "engagement", "demand_signals", "commerce_links", "url"]

    def post_row(post: dict) -> list:
        return [
            post.get("id"), post.get("source"), post.get("query"), post.get("created_at"), post.get("author"),
            post.get("author_followers"), post.get("lang"), post.get("text"), post.get("likes"), post.get("reposts"),
            post.get("replies"), post.get("quotes"), post.get("impressions"), engagement(post),
            ", ".join(demand_signals(post.get("text"))), " ".join(link["url"] for link in commerce_links(post)), post.get("url"),
        ]

    sheet = workbook.add_worksheet("posts")
    _write_rows(sheet, bold, post_columns, [post_row(post) for post in posts])
    sheet.set_column(7, 7, 60)

    _write_rows(workbook.add_worksheet("search_interest"), bold,
                ["product", "granularity"] + labels,
                [[row["product"], context["granularity"]] + list(row["counts"]) for row in products])

    cost = context.get("x_cost") or {}
    _write_rows(workbook.add_worksheet("cost_assumptions"), bold, ["item", "value", "note"], [
        ["x_read_rate_usd", cost.get("rate_usd", 0.005), "2026 secondary sources; verify on developer.x.com"],
        ["x_requests", cost.get("requests", 0), ""],
        ["x_posts_read", cost.get("posts_read", 0), ""],
        ["x_users_read", cost.get("users_read", 0), "author objects returned through expansions"],
        ["x_reads", cost.get("reads", 0), "posts + users"],
        ["x_estimated_cost_usd", cost.get("cost_usd", 0.0), "estimate = reads × rate"],
        ["price_band", context.get("price_band") or "", "from the run instruction"],
        ["margin", "not estimated", "discussion sources carry no price or cost; supply unit price and cost to model margin"],
    ])

    _write_rows(workbook.add_worksheet("domains"), bold, ["network", "posts", "links", "hosts"], domain_summary(posts))

    _write_rows(workbook.add_worksheet("dropped_posts"), bold, ["id", "source", "author", "drop_reason", "text", "url"],
                [[post.get("id"), post.get("source"), post.get("author"), post.get("drop_reason"), post.get("text"), post.get("url")] for post in dropped])

    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", generated.isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("trend_granularity", context["granularity"]),
        ("x_reads", str(cost.get("reads", 0))),
        ("x_estimated_cost_usd", f"{cost.get('cost_usd', 0.0):.4f}"),
        ("x_rate_note", cost.get("note") or "X API not called"),
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
