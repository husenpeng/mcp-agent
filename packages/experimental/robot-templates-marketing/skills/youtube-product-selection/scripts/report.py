"""Write the HTML report and the xlsx workbook for one YouTube product-selection run.

The HTML file is self-contained: inline CSS and an inline SVG bar chart, no
scripts or network assets, so it opens offline. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime

from metrics import BREAKOUT, INTENTS, OPPORTUNITY_WEIGHTS, PURCHASE_INTENTS, network_summary

STATUS_LABELS = {"validated": "已验证 validated", "watch": "待观察 watch", "rejected": "淘汰 rejected"}


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


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
ul{margin:4px 0}
"""


def _video_rows(items: list) -> str:
    return "".join(
        "<tr>"
        f'<td><a href="{html.escape(video.get("url") or "")}">{html.escape(video.get("title") or video["id"])}</a></td>'
        f'<td>{html.escape(video.get("channel_title") or "")}</td>'
        f'<td class="n">{_fmt(video.get("views"))}</td>'
        f'<td class="n">{_fmt(video.get("engagement_rate"), 2, percent=True)}</td>'
        f'<td class="n">{_fmt(video.get("views_per_hour"), 1)}</td>'
        f'<td class="n">{_fmt(video.get("outlier_score"), 1)}</td>'
        f'<td>{html.escape(", ".join(sorted({link["network"] for link in video.get("affiliate_links", [])})))}</td>'
        "</tr>"
        for video in items
    )


def write_html(path: str, title: str, videos: list, comments: list, products: list, context: dict) -> None:
    """Write the HTML report.

    context keys: query (str), generated_at (datetime), sources (list of str),
    gaps (list of str), api_units (int or None), search_interest (list of rows).
    """
    generated: datetime = context["generated_at"]
    breakouts = sorted((video for video in videos if (video.get("outlier_score") or 0) >= BREAKOUT), key=lambda video: -video["outlier_score"])
    networks = network_summary(videos)
    intent_comments = [comment for comment in comments if comment.get("intents")]
    purchase = sum(any(key in comment["intents"] for key in PURCHASE_INTENTS) for comment in comments)
    validated = sum(row["status"] == "validated" for row in products)
    gaps = context.get("gaps") or []
    intent_totals = [(key, label, sum(key in comment["intents"] for comment in comments)) for key, label, _, _ in INTENTS]
    video_header = "<tr><th>视频 Video</th><th>频道 Channel</th><th>播放 Views</th><th>互动率 ER</th><th>VPH</th><th>Outlier</th><th>联盟 Affiliate</th></tr>"

    product_rows = "".join(
        "<tr>"
        f"<td>{html.escape(row['product'])}</td>"
        f"<td class=\"n\">{_fmt(row['opportunity_score'], 1)}</td>"
        f"<td>{html.escape(STATUS_LABELS[row['status']])}</td>"
        f"<td class=\"n\">{_fmt(row['demand_score'], 1)}</td>"
        f"<td class=\"n\">{row['purchase_intents']}</td>"
        f"<td class=\"n\">{row['videos']}</td>"
        f"<td class=\"n\">{row['breakouts']}</td>"
        f"<td class=\"n\">{_fmt(row['median_vph'], 1)}</td>"
        f"<td class=\"n\">{_fmt(row['affiliate_coverage'], 0, percent=True)}</td>"
        "</tr>"
        for row in products[:30]
    )
    top_comments = sorted(intent_comments, key=lambda comment: -comment["demand"])[:25]
    by_id = {video["id"]: video for video in videos}
    comment_rows = "".join(
        "<tr>"
        f"<td>{html.escape(comment.get('text') or '')}</td>"
        f"<td>{html.escape(', '.join(dict((key, label) for key, label, _, _ in INTENTS)[key] for key in comment['intents']))}</td>"
        f"<td class=\"n\">{_fmt(comment.get('likes'))}</td>"
        f"<td>{html.escape((by_id.get(comment['video_id']) or {}).get('title') or comment['video_id'])}</td>"
        "</tr>"
        for comment in top_comments
    )
    interest_rows = "".join(
        "<tr>"
        f"<td>{html.escape(row['query'])}</td><td class=\"n\">{row['videos']}</td><td class=\"n\">{row['channels']}</td>"
        f"<td class=\"n\">{_fmt(row['total_views'])}</td><td class=\"n\">{_fmt(row['median_vph'], 1)}</td>"
        f"<td class=\"n\">{_fmt(row['recent_share'], 0, percent=True)}</td>"
        "</tr>"
        for row in context.get("search_interest") or []
    )
    weights = OPPORTUNITY_WEIGHTS
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">查询 Query: {html.escape(context["query"])} · 生成时间 Generated: {html.escape(generated.isoformat(timespec="minutes"))} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}'
        + ("" if context.get("api_units") is None else f' · API units: {html.escape(str(context["api_units"]))}')
        + "</p>",
        "<h2>摘要 Summary</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(products)}</b><span>候选商品 Candidate products</span></div>",
        f"<div class=\"kpi\"><b>{validated}</b><span>已验证 Validated</span></div>",
        f"<div class=\"kpi\"><b>{len(videos)}</b><span>测评视频 Review videos</span></div>",
        f"<div class=\"kpi\"><b>{len(breakouts)}</b><span>爆款（Outlier ≥ {BREAKOUT:g}）</span></div>",
        f"<div class=\"kpi\"><b>{len(comments)}</b><span>抽样评论 Comments sampled</span></div>",
        f"<div class=\"kpi\"><b>{purchase}</b><span>购买意向评论 Purchase-intent comments</span></div>",
        "</div>",
        "<h2>候选商品榜 Candidate products</h2>",
        _bar_chart(products, "product", "opportunity_score", "机会分 Opportunity score"),
        (
            "<table><tr><th>商品 Product</th><th>机会分 Score</th><th>状态 Status</th><th>需求分 Demand</th><th>购买意向 Purchase intents</th>"
            "<th>视频 Videos</th><th>爆款 Breakouts</th><th>VPH 中位数</th><th>联盟覆盖 Affiliate coverage</th></tr>"
            + product_rows + "</table>"
        ) if products else "<p>未能从标题中抽取商品词。</p>",
        "<h2>爆款测评视频 Breakout review videos</h2>",
        f"<p>Outlier = 播放 ÷ 同频道最近 30 个视频播放中位数；≥ {BREAKOUT:g} 视为爆款。</p>",
        f"<table>{video_header}{_video_rows(breakouts[:20])}</table>" if breakouts else f"<p>没有 Outlier ≥ {BREAKOUT:g} 的视频。</p>",
        "<h3>搜索热度代理 Search-interest proxy</h3>",
        (
            "<table><tr><th>查询 Query</th><th>视频 Videos</th><th>频道 Channels</th><th>总播放 Views</th><th>VPH 中位数</th><th>近 30 天发布占比</th></tr>"
            + interest_rows + "</table>"
        ) if interest_rows else "<p>无。</p>",
        "<h2>评论需求与痛点 Comment demand and pain points</h2>",
        "<table><tr><th>意图 Intent</th><th>评论数 Comments</th></tr>"
        + "".join(f"<tr><td>{html.escape(label)}</td><td class=\"n\">{count}</td></tr>" for _, label, count in intent_totals)
        + "</table>",
        (
            "<h3>需求最高的评论 Top demand comments</h3><table><tr><th>评论 Comment</th><th>意图 Intents</th><th>点赞 Likes</th><th>视频 Video</th></tr>"
            + comment_rows + "</table>"
        ) if comment_rows else "<p>抽样评论中没有命中意图词表的评论。</p>",
        "<h2>联盟链接与渠道分布 Affiliate links by network</h2>",
        (
            "<table><tr><th>网络 Network</th><th>含该链接的视频 Videos</th><th>链接数 Links</th></tr>"
            + "".join(f"<tr><td>{html.escape(name)}</td><td class=\"n\">{count}</td><td class=\"n\">{links}</td></tr>" for name, count, links in networks)
            + "</table>"
        ) if networks else "<p>描述中没有识别到电商或联盟链接（列表模式不含完整描述时，此处为空）。</p>",
        "<h2>明细说明 Detail notes</h2>",
        "<p>xlsx 工作表：products（商品聚合）、videos（原始视频）、comments（评论与意图）、affiliate_links、search_interest（搜索热度代理）、cost_assumptions（成本假设）、run（运行信息与数据缺口）。</p>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>互动率 ER = (点赞 + 评论) ÷ 播放；缺少计数时记为「—」，不按 0 计算。VPH = 播放 ÷ 发布至今小时数（下限 1 小时）。</li>",
        f"<li>Outlier = 播放 ÷ 同频道最近 30 个视频播放中位数（样本含搜索结果和补抓的频道近期上传）；≥ {BREAKOUT:g} 为爆款。</li>",
        "<li>商品词：标题做 NFKC 规范化和小写，去掉括号内容、年份、测评类停用词与品类查询词，并在 vs / versus / 对比 处切分；在剩余词串中取 1–3 元 n-gram，优先选在 ≥ 2 个标题中出现的多词短语。启发式抽取，可能把型号与品牌拆开或合并，需人工复核。</li>",
        "<li>评论意图：中英文关键词词表（求链接、问价格、问在哪买、竞品比较、抱怨、想要功能），一条评论可命中多类；词表写在 metrics.py 的 INTENTS 中。</li>",
        "<li>需求分 = Σ 评论命中意图数 × 点赞权重，点赞权重 = 1 + log10(1 + 点赞数)，点赞未知时权重为 1。</li>",
        f"<li>机会分 = 100 × ({weights['demand']} × 需求分分位 + {weights['heat']} × VPH 中位数分位 + {weights['affiliate']} × 联盟覆盖率分位)，分位在本次候选商品之间计算，属相对排序而非绝对需求。</li>",
        "<li>状态：内容热度（有爆款视频，或 VPH 中位数 ≥ 全样本中位数）与购买意向（求链接、问价格、问在哪买评论 ≥ 1）都满足为已验证，满足其一为待观察，都不满足为淘汰。</li>",
        "<li>搜索热度代理：每个查询的视频数、频道数、总播放、VPH 中位数、近 30 天发布占比，来自 YouTube 搜索结果，不是搜索量。</li>",
        "<li>联盟链接按域名归类；Amazon 链接的 tag 参数记为 associate tag。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{html.escape(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


def _write_rows(workbook, sheet, columns: list, rows: list, bold) -> None:
    for col, (name, _) in enumerate(columns):
        sheet.write(0, col, name, bold)
    for row_index, row in enumerate(rows, start=1):
        for col, (name, fmt) in enumerate(columns):
            value = row.get(name)
            if value is None:
                sheet.write_blank(row_index, col, None)
            elif isinstance(value, bool) or fmt is None or not isinstance(value, (int, float)):
                sheet.write_string(row_index, col, ", ".join(value) if isinstance(value, list) else str(value))
            else:
                sheet.write_number(row_index, col, value, fmt)
    sheet.autofilter(0, 0, max(len(rows), 1), len(columns) - 1)
    sheet.freeze_panes(1, 0)


def write_xlsx(path: str, videos: list, comments: list, products: list, context: dict) -> None:
    """Write the workbook: products, videos, comments, affiliate_links, search_interest, cost_assumptions, and run sheets."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    percent = workbook.add_format({"num_format": "0.00%"})
    number = workbook.add_format({"num_format": "#,##0"})
    decimal = workbook.add_format({"num_format": "#,##0.0"})

    intent_columns = [(f"intent_{key}", number) for key, _, _, _ in INTENTS]
    _write_rows(workbook, workbook.add_worksheet("products"), [
        ("product", None), ("opportunity_score", decimal), ("status", None), ("demand_score", decimal), ("purchase_intents", number),
        ("videos", number), ("channels", number), ("total_views", number), ("median_vph", decimal), ("breakouts", number),
        ("affiliate_coverage", percent), ("comments_sampled", number), ("intent_comments", number), *intent_columns, ("video_ids", None),
    ], products, bold)

    _write_rows(workbook, workbook.add_worksheet("videos"), [
        ("id", None), ("query", None), ("title", None), ("product_phrases", None), ("channel_title", None), ("channel_id", None),
        ("published_at", None), ("duration_seconds", number), ("views", number), ("likes", number), ("comments", number),
        ("engagement_rate", percent), ("views_per_hour", decimal), ("outlier_score", decimal), ("url", None), ("source", None),
    ], videos, bold)

    _write_rows(workbook, workbook.add_worksheet("comments"), [
        ("video_id", None), ("id", None), ("text", None), ("likes", number), ("intents", None), ("demand", decimal),
        ("published_at", None), ("source", None),
    ], comments, bold)

    links = [
        {"video_id": video["id"], **link, "affiliate_tag": link["affiliate_tag"] or ""}
        for video in videos for link in video.get("affiliate_links", [])
    ]
    _write_rows(workbook, workbook.add_worksheet("affiliate_links"), [
        ("video_id", None), ("network", None), ("host", None), ("affiliate_tag", None), ("url", None),
    ], links, bold)

    _write_rows(workbook, workbook.add_worksheet("search_interest"), [
        ("query", None), ("videos", number), ("channels", number), ("total_views", number), ("median_vph", decimal), ("recent_share", percent),
    ], context.get("search_interest") or [], bold)

    _write_rows(workbook, workbook.add_worksheet("cost_assumptions"), [
        ("assumption", None), ("value", decimal), ("unit", None), ("source", None),
    ], context.get("cost_assumptions") or [], bold)

    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("api_units", "" if context.get("api_units") is None else str(context["api_units"])),
        ("opportunity_weights", ", ".join(f"{key}={value}" for key, value in OPPORTUNITY_WEIGHTS.items())),
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
