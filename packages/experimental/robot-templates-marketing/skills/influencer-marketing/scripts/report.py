"""Write the HTML report and the xlsx workbook for one influencer-marketing run.

The HTML file is self-contained: inline CSS and an inline SVG bar chart, no
scripts or network assets. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime

from metrics import BANDS, BENCHMARKS, LIKE_COMMENT_BAND

OUTREACH_COLUMNS = ["creator", "platform", "email", "status", "first_contact_date", "channel", "template", "follow_up_date", "reply", "rate_quoted_usd", "notes"]


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def _e(value, digits: int = 0, percent: bool = False) -> str:
    return html.escape(_fmt(value, digits, percent))


def _bar_chart(rows: list, label_key: str, value_key: str, title: str) -> str:
    """Return an inline horizontal SVG bar chart for up to 10 rows with positive values."""
    data = [(str(row.get(label_key) or ""), row.get(value_key)) for row in rows if row.get(value_key)]
    data = sorted(data, key=lambda item: item[1], reverse=True)[:10]
    if not data:
        return ""
    top = data[0][1]
    bar_height, gap, label_width, width = 22, 6, 320, 760
    height = len(data) * (bar_height + gap)
    bars = []
    for index, (label, value) in enumerate(data):
        y = index * (bar_height + gap)
        length = max(2, (width - label_width - 90) * value / top)
        short = label if len(label) <= 44 else label[:43] + "…"
        bars.append(
            f'<text x="{label_width - 8}" y="{y + 15}" text-anchor="end">{html.escape(short)}</text>'
            f'<rect x="{label_width}" y="{y}" width="{length:.1f}" height="{bar_height}" rx="3"></rect>'
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{html.escape(_fmt(value, 1))}</text>'
        )
    return (
        f'<figure><figcaption>{html.escape(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">{"".join(bars)}</svg></figure>'
    )


_CSS = """
body{font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;margin:0;color:#1f2328;background:#f6f8fa}
main{max-width:1180px;margin:0 auto;padding:32px 24px}
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
.label{display:inline-block;background:#ddf4ff;border:1px solid #54aeff;border-radius:6px;padding:0 6px;font-size:12px}
ul{margin:4px 0}
"""


def _ranked(creators: list) -> list:
    return sorted(creators, key=lambda row: (row.get("fit_score") is None, -(row.get("fit_score") or 0), row["key"]))


def _table(header: list, rows: list) -> str:
    head = "".join(f"<th>{html.escape(name)}</th>" for name in header)
    return f"<table><tr>{head}</tr>{''.join(rows)}</table>"


def write_html(path: str, title: str, creators: list, context: dict) -> None:
    """Write the HTML report.

    context keys: query (str), generated_at (datetime), sources, gaps,
    filters (list of (name, value)), cpm (dict), lookalikes (list),
    contacts (list), top (int), api_units (int or None).
    """
    generated: datetime = context["generated_at"]
    ranked = _ranked(creators)
    top = ranked[: context.get("top", 10)]
    names = {row["key"]: row.get("name") or row["handle"] for row in creators}
    contacts = context.get("contacts") or []
    gaps = context.get("gaps") or []
    verified = sum(1 for contact in contacts if contact["syntax"] == "ok" and contact["mx_status"] == "mx_found")
    rates = sorted(row["engagement_rate"] for row in creators if row.get("engagement_rate") is not None)

    def creator_cell(row: dict) -> str:
        return f'<a href="{html.escape(row.get("url") or "")}">{html.escape(row.get("name") or row["handle"])}</a> <span class="meta">{html.escape(row["platform"])} · {html.escape(row["handle"])}</span>'

    def main_row(row: dict) -> str:
        return (
            f"<tr><td>{creator_cell(row)}</td><td class=\"n\">{_e(row.get('followers'))}</td><td>{_e(row.get('tier'))}</td>"
            f"<td class=\"n\">{_e(row.get('engagement_rate'), 2, percent=True)}</td><td class=\"n\">{_e(row.get('er_percentile'), 0)}</td>"
            f"<td class=\"n\">{_e(row.get('aq_heuristic'), 0)}</td><td class=\"n\">{_e(row.get('median_views'))}</td>"
            f"<td class=\"n\">{_e(row.get('rate_low'))}–{_e(row.get('rate_high'))}</td><td class=\"n\">{_e(row.get('fit_score'), 1)}</td></tr>"
        )

    main_header = ["达人 Creator", "粉丝 Followers", "档位 Tier", "互动率 ER (Modash)", "样本分位 ER pct", "受众质量启发分 AQ heuristic", "播放中位数 Median views", "报价估算 Rate (USD)", "匹配分 Fit"]
    benchmark_rows = []
    for tier in BENCHMARKS:
        count = sum(1 for row in creators if row.get("tier") == tier["tier"])
        low, high = tier["followers"]
        edges = tier["edges"]
        benchmark_rows.append(
            f"<tr><td>{html.escape(tier['tier'])}</td><td>{low:,}–{'' if high is None else f'{high:,}'}</td><td>{html.escape(tier['modash_column'])}</td>"
            f"<td>&gt; {edges[0]}%</td><td>{edges[1]}–{edges[0]}%</td><td>{edges[2]}–{edges[1]}%</td><td>{edges[3]}–{edges[2]}%</td><td>&lt; {edges[3]}%</td><td class=\"n\">{count}</td></tr>"
        )
    band_rows = [
        f"<tr><td>{creator_cell(row)}</td><td>{_e(row.get('tier'))}</td><td class=\"n\">{_e(row.get('engagement_rate'), 2, percent=True)}</td>"
        f"<td>{_e(row.get('benchmark_band'))}</td><td class=\"n\">{_e(row.get('er_tier_percentile'), 0)}</td><td class=\"n\">{_e(row.get('view_engagement_rate'), 2, percent=True)}</td></tr>"
        for row in ranked
    ]
    aq_rows = [
        f"<tr><td>{creator_cell(row)}</td><td class=\"n\">{_e(row.get('aq_heuristic'), 0)}</td><td class=\"n\">{row.get('aq_signals', 0)}/3</td>"
        f"<td class=\"n\">{_e(row.get('like_comment_ratio'), 1)}</td><td class=\"n\">{_e(row.get('view_follower_ratio'), 3)}</td><td class=\"n\">{_e(row.get('interval_cv'), 2)}</td></tr>"
        for row in ranked
    ]
    look = context.get("lookalikes") or []
    look_rows = [
        f"<tr><td>{html.escape(names.get(item['creator'], item['creator']))}</td><td>{html.escape(names.get(item['similar_to'], item['similar_to']))}</td>"
        f"<td class=\"n\">{item['similarity']:.3f}</td><td class=\"n\">{item['rank']}</td></tr>"
        for item in look[:40]
    ]
    rate_rows = [
        f"<tr><td>{creator_cell(row)}</td><td class=\"n\">{_e(row.get('median_views'))}</td>"
        f"<td>{html.escape(_cpm_text(context.get('cpm', {}), row['platform']))}</td><td class=\"n\">{_e(row.get('rate_low'))}–{_e(row.get('rate_high'))}</td></tr>"
        for row in ranked
    ]
    contact_rows = [
        f"<tr><td>{html.escape(names.get(contact['creator'], contact['creator']))}</td><td>{html.escape(contact['email'])}</td><td>{html.escape(contact['found_in'])}</td>"
        f"<td>{html.escape(contact['syntax'])}</td><td>{html.escape(contact['mx_status'])}</td><td>{html.escape(', '.join(contact['mx_hosts']))}</td><td>{'yes' if contact['role_account'] else 'no'}</td><td>{html.escape(contact['outreach_status'])}</td></tr>"
        for contact in contacts
    ]
    filters = context.get("filters") or []
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">查询 Query: {html.escape(context["query"])} · 生成时间 Generated: {html.escape(generated.isoformat(timespec="minutes"))} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}'
        + ("" if context.get("api_units") is None else f' · API units: {html.escape(str(context["api_units"]))}')
        + "</p>",
        "<div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(creators)}</b><span>达人 Creators</span></div>",
        f"<div class=\"kpi\"><b>{sum(len(row.get('posts', [])) for row in creators)}</b><span>帖子 Posts sampled</span></div>",
        f"<div class=\"kpi\"><b>{_e(rates[len(rates) // 2] if rates else None, 2, percent=True)}</b><span>互动率中位数 Median ER</span></div>",
        f"<div class=\"kpi\"><b>{len(contacts)}</b><span>公开邮箱 Public emails</span></div>",
        f"<div class=\"kpi\"><b>{verified}</b><span>语法与 MX 通过 Syntax + MX ok</span></div>",
        "</div>",
        f"<h2>推荐 Top {len(top)} Recommended creators</h2>",
        "<p>按匹配分排序：样本内互动率分位、受众质量启发分，以及有种子达人时与种子的相似度（×100）的平均值。</p>",
        _bar_chart(top, "name", "fit_score", "匹配分 Fit score"),
        _table(main_header, [main_row(row) for row in top]),
        "<h2>筛选条件 Filters</h2><ul>" + "".join(f"<li>{html.escape(name)}: {html.escape(str(value))}</li>" for name, value in filters) + "</ul>",
        "<h2>达人总表 All creators</h2>",
        _table(main_header, [main_row(row) for row in ranked]),
        "<h2>互动率分档基准 Engagement benchmarks by tier</h2>",
        "<p>分档阈值来自 Modash 的 Instagram 基准（中位点赞 ÷ 粉丝 × 100），对 YouTube、TikTok、X 只作参照。</p>",
        _table(["档位 Tier", "粉丝 Followers", "Modash 列", *BANDS, "本次样本 In sample"], benchmark_rows),
        _table(["达人 Creator", "档位 Tier", "互动率 ER", "所在档 Band", "同档分位 Tier pct", "按播放互动率 ER by views"], band_rows),
        "<h2>受众质量与假粉 Audience quality (heuristic)</h2>",
        "<p><span class=\"label\">启发式 Heuristic</span> 本分数只用公开信号估算，不是粉丝抽样的假粉率，也不等同于 HypeAuditor AQS 或 Modash 假粉比例。</p>",
        _table(["达人 Creator", "启发分 AQ heuristic", "可用信号 Signals", "赞评比 Likes/comment", "播放/粉丝 Views/follower", "发帖间隔 CV"], aq_rows),
        "<h2>相似达人簇 Lookalikes</h2>",
        "<p>TF-IDF（纯 Python 实现）对频道名称、简介和帖子标题求余弦相似度；有种子达人时按与最相近种子的相似度排序。</p>",
        _table(["达人 Creator", "相似于 Similar to", "余弦 Cosine", "排名 Rank"], look_rows) if look_rows else "<p>达人少于两位，无法计算相似度。</p>",
        "<h2>报价估算 Rate estimates</h2>",
        "<p><span class=\"label\">估算 Estimate</span> 报价 = CPM 区间 × 播放中位数 ÷ 1000，美元/条；不是达人报价。</p>",
        _table(["达人 Creator", "播放中位数 Median views", "CPM (USD)", "报价估算 Rate (USD)"], rate_rows),
        "<h2>联系方式与建联状态 Contacts and outreach</h2>",
        "<p>邮箱只从达人公开的频道描述和简介中用正则提取；校验 = 语法检查 + dns.google MX 查询，未做 SMTP 探测。建联记录见 xlsx 的 outreach_log 工作表。</p>",
        _table(["达人 Creator", "邮箱 Email", "来源 Found in", "语法 Syntax", "MX", "MX hosts", "角色邮箱 Role", "建联 Outreach"], contact_rows) if contact_rows else "<p>简介和描述中没有公开邮箱。</p>",
        "<h2>风险 Risks</h2><ul>",
        "<li>只使用达人主动公开的商务邮箱；外发邮件须遵守 CAN-SPAM 与 GDPR，提供退订方式，不批量冷发。</li>",
        "<li>无 key 采集（yt-dlp、instaloader 匿名模式）可能被限流或返回不完整计数；本次未登录、未下载媒体。</li>",
        "<li>粉丝数、报价和受众质量都基于公开计数；签约前请让达人提供后台受众截图。</li>",
        "</ul>",
        "<h2>方法与口径 Method</h2><ul>",
        f"<li>互动率 ER（Modash 口径）= 近 60 天帖子点赞中位数 ÷ 粉丝数 × 100；帖子没有日期时用全部样本帖子，并在 er_window 列注明。</li>",
        "<li>按播放互动率 = 每条帖子 (点赞 + 评论) ÷ 播放 × 100 的中位数。</li>",
        "<li>样本分位 = 该达人互动率在本次全部达人中的中位秩百分位；同档分位只在同一粉丝档内比较。</li>",
        f"<li>受众质量启发分 = 可用信号得分的等权平均：赞评比中位数在 {LIKE_COMMENT_BAND[0]:.0f}–{LIKE_COMMENT_BAND[1]:.0f} 得 100，每偏离 1.5 个数量级降到 0；播放 ÷ 粉丝 ≥ 0.1 得 100，0.001 得 0（对数插值）；发帖间隔变异系数 0 得 100，≥ 2 得 0。少于 3 条有评论的帖子或少于 4 条有日期的帖子时，对应信号缺失。</li>",
        "<li>CPM 区间（美元）：" + html.escape("; ".join(f"{platform} {low:g}–{high:g}" for platform, (low, high) in sorted((context.get("cpm") or {}).items()))) + "。这是规划假设，可用 --cpm 覆盖。</li>",
        "<li>匹配分 = 互动率样本分位、受众质量启发分、种子相似度 × 100 中可用项的平均。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{html.escape(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


def _cpm_text(cpm: dict, platform: str) -> str:
    band = cpm.get(platform)
    return "—" if band is None else f"{band[0]:g}–{band[1]:g}"


def write_xlsx(path: str, creators: list, context: dict) -> None:
    """Write the workbook: creators, posts, audience_sample, lookalikes, contacts, outreach_log, benchmarks, run."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    formats = {
        "int": workbook.add_format({"num_format": "#,##0"}),
        "dec": workbook.add_format({"num_format": "#,##0.00"}),
        "pct": workbook.add_format({"num_format": "0.00\"%\""}),
        "usd": workbook.add_format({"num_format": "$#,##0"}),
    }

    def sheet(name: str, columns: list, rows: list) -> None:
        worksheet = workbook.add_worksheet(name)
        for col, (header, _) in enumerate(columns):
            worksheet.write(0, col, header, bold)
        for row_index, row in enumerate(rows, start=1):
            for col, (header, kind) in enumerate(columns):
                value = row.get(header)
                if value is None or value == "":
                    worksheet.write_blank(row_index, col, None)
                elif kind is None or isinstance(value, str):
                    worksheet.write_string(row_index, col, str(value))
                else:
                    worksheet.write_number(row_index, col, value, formats[kind])
        worksheet.freeze_panes(1, 0)
        worksheet.autofilter(0, 0, max(len(rows), 1), len(columns) - 1)

    ranked = _ranked(creators)
    sheet("creators", [
        ("key", None), ("platform", None), ("handle", None), ("name", None), ("url", None), ("followers", "int"), ("tier", None),
        ("engagement_rate", "pct"), ("er_window", None), ("er_window_posts", "int"), ("benchmark_band", None), ("er_percentile", "dec"),
        ("er_tier_percentile", "dec"), ("view_engagement_rate", "pct"), ("median_likes", "int"), ("median_views", "int"),
        ("aq_heuristic", "dec"), ("rate_low", "usd"), ("rate_high", "usd"), ("seed_similarity", "dec"), ("fit_score", "dec"),
        ("discovered_by", None), ("source", None), ("bio", None),
    ], ranked)
    sheet("posts", [
        ("creator", None), ("platform", None), ("id", None), ("title", None), ("published_at", None),
        ("views", "int"), ("likes", "int"), ("comments", "int"), ("url", None),
    ], [{**post, "creator": row["key"]} for row in ranked for post in row.get("posts", [])])
    sheet("audience_sample", [
        ("creator", None), ("aq_heuristic", "dec"), ("aq_signals", "int"), ("like_comment_ratio", "dec"), ("like_comment_score", "dec"),
        ("view_follower_ratio", "dec"), ("view_follower_score", "dec"), ("interval_cv", "dec"), ("regularity_score", "dec"), ("note", None),
    ], [{**row, "creator": row["key"], "note": "heuristic from public post counts; no follower sample was taken"} for row in ranked])
    sheet("lookalikes", [("creator", None), ("similar_to", None), ("similarity", "dec"), ("rank", "int"), ("mode", None)], context.get("lookalikes") or [])
    contacts = context.get("contacts") or []
    sheet("contacts", [
        ("creator", None), ("email", None), ("found_in", None), ("syntax", None), ("mx_status", None), ("mx_hosts", None), ("role_account", None), ("outreach_status", None),
    ], [{**contact, "mx_hosts": ", ".join(contact["mx_hosts"]), "role_account": "yes" if contact["role_account"] else "no"} for contact in contacts])
    platforms = {row["key"]: row["platform"] for row in creators}
    sheet("outreach_log", [(name, None) for name in OUTREACH_COLUMNS], [
        {"creator": contact["creator"], "platform": platforms.get(contact["creator"], ""), "email": contact["email"], "status": "not_contacted", "channel": "email"}
        for contact in contacts if contact["syntax"] == "ok"
    ])
    benchmark_rows = []
    for tier in BENCHMARKS:
        low, high = tier["followers"]
        benchmark_rows.append({
            "tier": tier["tier"], "followers_min": low, "followers_max": high, "modash_column": tier["modash_column"],
            **{f"{band}_from_pct": edge for band, edge in zip(BANDS, tier["edges"])},
            "creators_in_sample": sum(1 for row in creators if row.get("tier") == tier["tier"]),
        })
    sheet("benchmarks", [
        ("tier", None), ("followers_min", "int"), ("followers_max", "int"), ("modash_column", None),
        *[(f"{band}_from_pct", "dec") for band in BANDS[:-1]], ("creators_in_sample", "int"),
    ], benchmark_rows)
    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("api_units", "" if context.get("api_units") is None else str(context["api_units"])),
        ("cpm_usd", "; ".join(f"{platform}={low:g}-{high:g}" for platform, (low, high) in sorted((context.get("cpm") or {}).items()))),
    ] + [(f"filter:{name}", str(value)) for name, value in context.get("filters") or []] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
