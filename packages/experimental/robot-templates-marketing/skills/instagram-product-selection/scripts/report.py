"""Write the HTML report and the xlsx workbook for one Instagram product-selection run.

The HTML file is self-contained: inline CSS and inline SVG bar charts, no
scripts or network assets, so it opens offline. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime

from metrics import engagement


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def _bar_chart(rows: list, label_key: str, value_key: str, title: str, keep_order: bool = False, top: int = 10) -> str:
    """Return an inline horizontal SVG bar chart for rows with positive values."""
    data = [(str(row.get(label_key) or ""), row.get(value_key)) for row in rows if row.get(value_key)]
    if not keep_order:
        data = sorted(data, key=lambda item: item[1], reverse=True)
    data = data[:top]
    if not data:
        return ""
    peak = max(value for _, value in data)
    bar_height, gap, label_width, width = 22, 6, 320, 760
    height = len(data) * (bar_height + gap)
    bars = []
    for index, (label, value) in enumerate(data):
        y = index * (bar_height + gap)
        length = max(2, (width - label_width - 90) * value / peak)
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
.note{background:#ddf4ff;border:1px solid #54aeff;border-radius:10px;padding:8px 12px}
ul{margin:4px 0}
"""

_STATUS = {"watch": "待观察 watch", "rejected": "淘汰 rejected"}


def _link(url, label) -> str:
    text = html.escape(str(label or url or ""))
    return f'<a href="{html.escape(url)}">{text}</a>' if str(url or "").startswith("https://") else text


def _excerpt(text, size: int = 120) -> str:
    flat = " ".join((text or "").split())
    return flat if len(flat) <= size else flat[:size - 1] + "…"


def _quota_line(quota) -> str:
    if quota is None:
        return ""
    return f' · 话题配额 Hashtag quota: {_fmt(quota["used_after"])}/{quota["limit"]} (7 days)'


def _conclusions(data: dict) -> list:
    products = data["products"]
    watch = [row for row in products if row["status"] == "watch"]
    lines = [f"共识别 {len(products)} 个商品词，其中 {len(watch)} 个进入待观察。{len(products)} product phrases, {len(watch)} on watch."]
    for row in watch[:3]:
        lines.append(
            f"推荐优先跟进「{row['phrase']}」：提及 {row['mentions']} 帖，热度分 {row['heat_score']:.1f}，"
            f"近 7 天 {_fmt(row['last_7d'])} 帖，前 7 天 {_fmt(row['prior_7d'])} 帖。"
        )
    lines.append("以上都是内容热度信号，尚未经搜索或其他平台验证，因此没有商品标为「已验证」。These are heat signals only; no phrase is validated.")
    return lines


def write_html(path: str, title: str, data: dict, context: dict) -> None:
    """Write the HTML report.

    data keys: posts, products, hashtags, related, daily, brands, reels.
    context keys: query (str), generated_at (datetime), sources (list of str),
    gaps (list of str), quota (dict or None), api_calls (int or None).
    """
    generated: datetime = context["generated_at"]
    posts, products = data["posts"], data["products"]
    gaps = context.get("gaps") or []
    owners = {post["owner"] for post in posts if post.get("owner")}
    product_rows = "".join(
        "<tr>"
        f'<td>{_link(row["sample_url"], row["phrase"])}</td>'
        f'<td class="n">{row["mentions"]}</td><td class="n">{_fmt(row["authors"])}</td>'
        f'<td class="n">{_fmt(row["total_engagement"])}</td><td class="n">{_fmt(row["total_views"])}</td>'
        f'<td class="n">{_fmt(row["last_7d"])}</td><td class="n">{_fmt(row["prior_7d"])}</td>'
        f'<td class="n">{_fmt(row["mention_growth"], 0, percent=True)}</td>'
        f'<td class="n">{_fmt(row["trend_score"], 1)}</td>'
        f'<td class="n">{_fmt(row["intent_ratio"], 1, percent=True)}</td>'
        f'<td class="n">{_fmt(row["heat_score"], 1)}</td>'
        f'<td>{html.escape(_STATUS[row["status"]])}</td>'
        "</tr>"
        for row in products[:30]
    )
    hashtag_rows = "".join(
        f'<tr><td>{html.escape(row["hashtag"])}</td><td class="n">{_fmt(row["media_count"])}</td><td class="n">{row["posts"]}</td>'
        f'<td class="n">{row["top_posts"]}</td><td class="n">{row["recent_posts"]}</td>'
        f'<td class="n">{_fmt(row["median_likes"], 1)}</td><td class="n">{_fmt(row["median_comments"], 1)}</td>'
        f'<td class="n">{_fmt(row["video_share"], 0, percent=True)}</td></tr>'
        for row in data["hashtags"]
    )
    reel_rows = "".join(
        f'<tr><td>{_link(post.get("url"), post["id"])}</td><td>{html.escape(post.get("owner") or "—")}</td>'
        f'<td>{html.escape(_excerpt(post.get("caption")))}</td><td class="n">{_fmt(post.get("views"))}</td>'
        f'<td class="n">{_fmt(post.get("likes"))}</td><td class="n">{_fmt(post.get("comments"))}</td></tr>'
        for post in data["reels"]
    )
    brand_rows = "".join(
        f'<tr><td>{html.escape(row["brand"])}</td><td class="n">{row["mentions"]}</td>'
        f'<td class="n">{_fmt(row["mention_share"], 1, percent=True)}</td><td class="n">{_fmt(row["median_engagement"], 1)}</td></tr>'
        for row in data["brands"]
    )
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">查询 Query: {html.escape(context["query"])} · 生成时间 Generated: {generated.isoformat(timespec="minutes")} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}'
        + ("" if context.get("api_calls") is None else f' · API calls: {context["api_calls"]}')
        + html.escape(_quota_line(context.get("quota")))
        + "</p>",
        "<h2>结论与推荐 Conclusions</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(posts)}</b><span>帖子 Posts</span></div>",
        f"<div class=\"kpi\"><b>{len(owners) if owners else '—'}</b><span>作者 Authors</span></div>",
        f"<div class=\"kpi\"><b>{len(products)}</b><span>商品词 Product phrases</span></div>",
        f"<div class=\"kpi\"><b>{sum(row['status'] == 'watch' for row in products)}</b><span>待观察 On watch</span></div>",
        "</div><ul>",
        "".join(f"<li>{html.escape(line)}</li>" for line in _conclusions(data)),
        "</ul>",
        "<h2>口径 Scope: no GMV, heat only</h2>",
        '<p class="note">Instagram 没有可见已售数，本报告<strong>不估算销量或 GMV</strong>，只衡量需求热度：商品提及、互动、Reels 表现和评论购买意向。'
        "Instagram shows no sold counts, so this report estimates neither sales nor GMV.</p>",
        "<h2>品类热度趋势 Category heat</h2>",
        _bar_chart(data["daily"], "day", "posts", "近 14 天每日发帖（样本内）Daily posts in the sample", keep_order=True, top=14),
        (
            "<table><tr><th>话题 Hashtag</th><th>总帖数 Media count</th><th>样本 Sampled</th><th>热门 Top</th><th>最新 Recent</th>"
            f"<th>点赞中位数 Median likes</th><th>评论中位数 Median comments</th><th>视频占比 Video share</th></tr>{hashtag_rows}</table>"
        ) if hashtag_rows else "<p>本次没有采集话题。</p>",
        _bar_chart(data["related"], "hashtag", "posts", "共现话题 Related hashtags"),
        "<h2>商品词排行与双验证 Product phrases</h2>",
        _bar_chart(products, "phrase", "heat_score", "热度分 Heat score"),
        (
            "<table><tr><th>商品词 Phrase</th><th>提及 Posts</th><th>作者 Authors</th><th>互动 Engagement</th><th>播放 Views</th>"
            "<th>近 7 天</th><th>前 7 天</th><th>增速 Growth</th><th>趋势分 Trend</th><th>购买意向 Intent</th><th>热度分 Heat</th><th>状态 Status</th></tr>"
            f"{product_rows}</table>"
        ) if products else "<p>没有识别到重复出现的商品词。</p>",
        "<p>双验证尚未完成：本技能不采集搜索热度或其他平台数据，所以状态只有「待观察」和「淘汰」。Dual validation is not done, so no phrase is validated.</p>",
        "<h2>代表性 Reels Representative Reels</h2>",
        (
            "<table><tr><th>帖子 Post</th><th>作者 Author</th><th>文案 Caption</th><th>播放 Views</th><th>点赞 Likes</th><th>评论 Comments</th></tr>"
            f"{reel_rows}</table>"
        ) if reel_rows else "<p>样本中没有视频帖子。</p>",
        "<h2>品牌与竞品 Brands</h2>",
        (
            "<table><tr><th>品牌 Brand</th><th>提及 Mentions</th><th>提及份额 Share</th><th>互动中位数 Median engagement</th></tr>"
            f"{brand_rows}</table>"
        ) if brand_rows else "<p>运行指令没有给出品牌（--brand）。</p>",
        "<h2>利润测算 Margin</h2>",
        "<p>未测算。Instagram 不提供售价和成本；xlsx 的 cost_assumptions 表列出需要填写的项目。Not computed: Instagram exposes neither price nor cost.</p>",
        "<h2>风险 Risks</h2><ul>",
        "<li>Instagram 服务条款禁止未经许可的自动化采集；匿名路径有被限流或封 IP 的风险，也可能随时失效。官方路径风险更低。</li>",
        "<li>样本只覆盖热门和最新帖子，不代表话题全貌；增速受样本结构影响，只看方向。</li>",
        "<li>商品词来自文案中的词组，可能混入非商品词，采用前需人工复核。</li>",
        "</ul>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>商品词：同一分句内不含停用词的 2–3 词词组，至少出现在 2 个不同文案的帖子中；--product 指定的词出现 1 次即保留。无空格分词的语言（如中文）只统计 --product 指定的词。</li>",
        "<li>互动 = 点赞 + 评论；缺少计数时记为「—」，不按 0 计算。</li>",
        "<li>增速 = 近 7 天提及 ÷ 前 7 天提及 − 1；前 7 天为 0 时不计算。</li>",
        "<li>趋势分 = 本周提及相对过去 4 周的 z-score × log(1 + 总互动)；过去 4 周没有波动时不计算。</li>",
        "<li>购买意向占比 = 命中求链接、问价、问购买渠道的评论数 ÷ 抽样评论数，仅在拿到评论时计算；评论文本不保存。</li>",
        "<li>热度分 = 提及帖数 × log10(10 + 总互动) × (1 + 购买意向占比)，意向未知时该项为 1。仅用于本次样本内排序。</li>",
        "<li>状态：提及 ≥ 3 且增速未跌破 −50% 为待观察，否则淘汰；已验证需要搜索或跨平台证据。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{html.escape(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


_COST_ITEMS = ["selling_price", "unit_cost", "platform_fee", "creator_commission", "fulfillment", "allocated_ads", "returns_reserve"]


def _write_rows(workbook, name: str, columns: list, rows: list, bold) -> None:
    """Write one sheet; strings use write_string so captions cannot become formulas."""
    sheet = workbook.add_worksheet(name)
    for col, (key, _) in enumerate(columns):
        sheet.write(0, col, key, bold)
    for row, item in enumerate(rows, start=1):
        for col, (key, fmt) in enumerate(columns):
            value = item.get(key)
            if value is None:
                sheet.write_blank(row, col, None)
            elif fmt is None:
                sheet.write_string(row, col, str(value))
            else:
                sheet.write_number(row, col, value, fmt)
    sheet.freeze_panes(1, 0)


def write_xlsx(path: str, data: dict, context: dict) -> None:
    """Write the workbook: products, posts, search_interest, cost_assumptions, hashtags, brands, and run sheets."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    percent = workbook.add_format({"num_format": "0.00%"})
    number = workbook.add_format({"num_format": "#,##0"})
    decimal = workbook.add_format({"num_format": "#,##0.0"})

    _write_rows(workbook, "products", [
        ("phrase", None), ("status", None), ("heat_score", decimal), ("mentions", number), ("authors", number),
        ("total_engagement", number), ("median_engagement", decimal), ("total_views", number), ("reel_mentions", number),
        ("last_7d", number), ("prior_7d", number), ("mention_growth", percent), ("trend_score", decimal),
        ("comments_sampled", number), ("intent_ratio", percent), ("sample_url", None),
    ], data["products"], bold)
    posts = [{**post, "engagement": engagement(post)} for post in data["posts"]]
    _write_rows(workbook, "posts", [
        ("id", None), ("target", None), ("edge", None), ("owner", None), ("kind", None), ("published_at", None),
        ("likes", number), ("comments", number), ("views", number), ("engagement", number),
        ("comments_sampled", number), ("intent_hits", number), ("caption", None), ("url", None), ("source", None),
    ], posts, bold)
    _write_rows(workbook, "search_interest", [("phrase", None), ("search_interest", None), ("cross_platform", None)], [
        {"phrase": row["phrase"], "search_interest": "not_collected", "cross_platform": "not_collected"} for row in data["products"]
    ], bold)
    _write_rows(workbook, "cost_assumptions", [("item", None), ("value", None), ("note", None)], [
        {"item": item, "note": "input required; Instagram does not expose this"} for item in _COST_ITEMS
    ], bold)
    _write_rows(workbook, "hashtags", [
        ("hashtag", None), ("media_count", number), ("posts", number), ("top_posts", number), ("recent_posts", number),
        ("median_likes", decimal), ("median_comments", decimal), ("video_share", percent),
    ], data["hashtags"], bold)
    _write_rows(workbook, "brands", [
        ("brand", None), ("mentions", number), ("mention_share", percent), ("median_engagement", decimal),
    ], data["brands"], bold)

    run = workbook.add_worksheet("run")
    quota = context.get("quota") or {}
    facts = [
        ("query", context["query"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("metric_scope", "demand heat only; no GMV"),
        ("api_calls", "" if context.get("api_calls") is None else str(context["api_calls"])),
    ] + [
        (f"hashtag_quota_{key}", "unknown" if quota[key] is None else str(quota[key]))
        for key in ("limit", "used_before", "queried_this_run", "used_after", "remaining") if key in quota
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
