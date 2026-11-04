"""Write the HTML report and the xlsx workbook for one X data-insight run.

The HTML file is self-contained: inline CSS and inline SVG charts, no
scripts or network assets, so it opens offline. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime, timedelta

from metrics import engagement, language_mix

TREND_LABEL = {"trend": "长期趋势 trend", "spike": "短期热点 spike", "fading": "降温 fading", "steady": "平稳 steady", "none": "—"}


def _fmt(value, digits: int = 0, percent: bool = False, signed: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:+.{max(digits, 1)}f}%" if signed else f"{value * 100:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def bucket_labels(now: datetime, granularity: str, buckets: int) -> list:
    """Return the UTC start date (MM-DD) of each bucket, oldest first."""
    width = timedelta(days=1 if granularity == "day" else 7)
    return [(now - width * (buckets - index)).strftime("%m-%d") for index in range(buckets)]


def _bar_chart(data: list, title: str, digits: int = 1) -> str:
    """Return an inline horizontal SVG bar chart for up to 10 (label, positive value) pairs."""
    data = sorted(((str(label), value) for label, value in data if (value or 0) > 0), key=lambda item: item[1], reverse=True)[:10]
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
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{html.escape(_fmt(value, digits))}</text>'
        )
    return (
        f'<figure><figcaption>{html.escape(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">{"".join(bars)}</svg></figure>'
    )


def _sentiment_bar(counts: dict) -> str:
    """Return an inline stacked SVG bar of positive, neutral, and negative shares."""
    total = counts["scored"]
    if not total:
        return ""
    x, parts = 0.0, []
    for key, color in (("positive", "#1a7f37"), ("neutral", "#8c959f"), ("negative", "#cf222e")):
        width = 740 * counts[key] / total
        if width:
            parts.append(f'<rect x="{x:.1f}" y="0" width="{width:.1f}" height="26" style="fill:{color}"></rect>'
                         f'<text x="{x + 4:.1f}" y="18" style="fill:#fff">{html.escape(key)} {counts[key]}</text>')
        x += width
    return f'<figure><figcaption>情感分布 Sentiment mix</figcaption><svg viewBox="0 0 760 26" role="img" aria-label="sentiment mix">{"".join(parts)}</svg></figure>'


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


def cost_line(cost) -> str:
    """Describe the X reads and estimated spend of a run."""
    if not cost:
        return "未调用 X API，本次 X 费用为 $0。No X API call; X spend $0."
    return (
        f"X API 读取 {cost['reads']:,} 条（帖子 {cost['posts_read']:,} + 用户 {cost['users_read']:,}，请求 {cost['requests']:,} 次），"
        f"估算费用 ≈ ${cost['cost_usd']:.2f}（读取数 × ${cost['rate_usd']}）。{cost['note']}"
    )


def suggestions(kpis: list, sentiment: dict, topics: list, sov: list, outliers: list) -> list:
    """Return rule-based action prompts derived from the computed tables."""
    lines = []
    rising = [topic for topic in topics if topic["trend_class"] == "trend"]
    if rising:
        lines.append(f"跟进长期上升的话题「{rising[0]['label']}」（{rising[0]['posts']} 帖，{rising[0]['authors']} 位作者）。")
    spikes = [topic for topic in topics if topic["trend_class"] == "spike"]
    if spikes:
        lines.append(f"「{spikes[0]['label']}」是短期热点，借势内容宜快、不宜长期投入。")
    negative = [topic for topic in topics if topic["net_sentiment"] is not None and topic["net_sentiment"] < 0]
    if negative:
        worst = min(negative, key=lambda topic: topic["net_sentiment"])
        lines.append(f"话题「{worst['label']}」净情感 {worst['net_sentiment']}，需排查负面原因并准备回应口径。")
    if sentiment.get("net") is not None and sentiment["net"] < 0:
        lines.append(f"整体净情感为 {sentiment['net']}，低于 0。")
    if len(sov) >= 2 and sov[0]["mentions"]:
        lines.append(f"声量份额领先者是 {sov[0]['brand']}（提及 {_fmt(sov[0]['sov_mentions'], 1)}%）。")
    known = [row for row in kpis if row.get("engagement_rate") is not None]
    if len(known) >= 2:
        best = max(known, key=lambda row: row["engagement_rate"])
        lines.append(f"@{best['handle']} 互动率最高（{_fmt(best['engagement_rate'], 2, percent=True)}），可拆解其内容形式作为对标。")
    if outliers:
        lines.append(f"复盘 {len(outliers)} 条异常帖（≥ 3 倍基线）的话题、时段和形式。")
    return lines or ["样本不足以得出行动建议；扩大关键词或账号后重跑。"]


def write_html(path: str, title: str, data: dict, context: dict) -> None:
    """Write the HTML report.

    data keys: posts, kpis, benchmarks, sentiment, topics, sov, outliers.
    context keys: query (str), generated_at (datetime), sources (list of str),
    gaps (list of str), granularity, buckets, dropped (int), x_cost (dict or None).
    """
    generated: datetime = context["generated_at"]
    posts, kpis, topics, sov = data["posts"], data["kpis"], data["topics"], data["sov"]
    sentiment = data["sentiment"]
    outliers = sorted((post for post in data["outliers"] if post["is_outlier"]), key=lambda post: -post["outlier_score"])
    labels = bucket_labels(generated, context["granularity"], context["buckets"])
    unit = "日 day" if context["granularity"] == "day" else "周 week"
    gaps = context.get("gaps") or []
    known = [engagement(post) for post in posts if engagement(post) is not None]

    def post_rows(items: list) -> str:
        return "".join(
            "<tr>"
            f'<td><a href="{html.escape(post.get("url") or "")}">{html.escape((post.get("text") or "")[:160])}</a></td>'
            f"<td>{html.escape(post.get('author') or '')}</td><td>{html.escape(post.get('source') or '')}</td>"
            f'<td class="n">{_fmt(engagement(post))}</td><td class="n">{_fmt(post.get("baseline"), 1)}</td>'
            f'<td class="n">{_fmt(post.get("outlier_score"), 1)}</td><td>{html.escape(post.get("sentiment") or "—")}</td>'
            "</tr>"
            for post in items
        )

    post_header = "<tr><th>帖子 Post</th><th>作者 Author</th><th>来源 Source</th><th>互动 Engagement</th><th>基线 Baseline</th><th>Outlier</th><th>情感 Sentiment</th></tr>"
    bench_rows = "".join(
        f"<tr><td>@{html.escape(row['handle'])}</td><td>{html.escape(row['metric'])}</td>"
        f'<td class="n">{_fmt(row["value"], 4)}</td><td class="n">{_fmt(row["peer_median"], 4)}</td>'
        f'<td class="n">{_fmt(row["vs_peer"], 2)}</td></tr>'
        for row in data["benchmarks"]
    )
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">账号与话题 Accounts and topics: {html.escape(context["query"])} · 生成时间 Generated: {generated.isoformat(timespec="minutes")} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}</p>',
        "<h2>摘要 Summary</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(posts)}</b><span>有效帖子 Posts kept</span></div>",
        f"<div class=\"kpi\"><b>{context.get('dropped', 0)}</b><span>剔除（重复 / 疑似 bot）Dropped</span></div>",
        f"<div class=\"kpi\"><b>{_fmt(sum(known) if known else None)}</b><span>总互动 Total engagement</span></div>",
        f"<div class=\"kpi\"><b>{_fmt(sentiment['net'], 1)}</b><span>净情感 Net sentiment (−100…+100)</span></div>",
        f"<div class=\"kpi\"><b>{len(topics)}</b><span>话题簇 Topic clusters</span></div>",
        f"<div class=\"kpi\"><b>{len(outliers)}</b><span>异常帖 Outliers ≥ 3×</span></div>",
        f"<div class=\"kpi\"><b>{html.escape('$' + format(context['x_cost']['cost_usd'], '.2f') if context.get('x_cost') else '$0')}</b><span>X API 估算费用 Est. X cost</span></div>",
        "</div>",
        f"<p>{html.escape(cost_line(context.get('x_cost')))}</p>",
        "<h2>账号 KPI 与对标 Account KPIs and benchmarks</h2>",
        (
            "<table><tr><th>账号 Account</th><th>粉丝 Followers</th><th>样本帖 Posts</th><th>每周发帖 Posts/week</th><th>互动中位数 Median eng.</th>"
            "<th>互动率 ER</th><th>点赞率 Like rate</th><th>互动增长 Growth</th><th>高峰时段 Top hour UTC</th></tr>"
            + "".join(
                f"<tr><td>@{html.escape(row['handle'] or '')}</td><td class=\"n\">{_fmt(row['followers'])}</td><td class=\"n\">{row['sampled_posts']}</td>"
                f"<td class=\"n\">{_fmt(row['posts_per_week'], 2)}</td><td class=\"n\">{_fmt(row['median_engagement'], 1)}</td>"
                f"<td class=\"n\">{_fmt(row['engagement_rate'], 3, percent=True)}</td><td class=\"n\">{_fmt(row['like_rate'], 3, percent=True)}</td>"
                f"<td class=\"n\">{_fmt(row['engagement_growth'], 1, percent=True, signed=True)}</td><td class=\"n\">{_fmt(row['top_hour_utc'])}</td></tr>"
                for row in kpis
            )
            + "</table>"
            + (f"<table><tr><th>账号 Account</th><th>指标 Metric</th><th>值 Value</th><th>同类中位数 Peer median</th><th>对比 vs peer</th></tr>{bench_rows}</table>" if bench_rows else "")
        ) if kpis else "<p>未采集账号时间线（需要 X_BEARER_TOKEN 和 --account）。</p>",
        "<h2>情感 Sentiment</h2>",
        _sentiment_bar(sentiment) or "<p>没有可评分的帖子。</p>",
        f"<p>正面 {sentiment['positive']} · 中性 {sentiment['neutral']} · 负面 {sentiment['negative']} · 已评分 {sentiment['scored']} / {len(posts)}。</p>",
        "<p>语种 Languages: " + html.escape(", ".join(f"{lang} {count}" for lang, count in language_mix(posts))) + "</p>",
        "<h2>话题聚类与趋势 Topic clusters and trends</h2>",
        _bar_chart([(topic["label"], topic["posts"]) for topic in topics], "话题簇帖子数 Posts per cluster", 0),
        (
            f"<table><tr><th>话题 Cluster</th><th>关键词 Keywords</th><th>帖子 Posts</th><th>作者 Authors</th><th>互动 Engagement</th><th>净情感 Net</th>"
            f"<th>每{html.escape(unit)}帖子 ({html.escape(labels[0] if labels else '')} →)</th><th>判定 Class</th></tr>"
            + "".join(
                f"<tr><td>{html.escape(topic['label'])}</td><td>{html.escape(', '.join(topic['keywords'][:10]))}</td><td class=\"n\">{topic['posts']}</td>"
                f"<td class=\"n\">{topic['authors']}</td><td class=\"n\">{_fmt(topic['engagement'])}</td><td class=\"n\">{_fmt(topic['net_sentiment'], 1)}</td>"
                f"<td>{html.escape(' / '.join(str(count) for count in topic['counts']))}</td><td>{html.escape(TREND_LABEL[topic['trend_class']])}</td></tr>"
                for topic in topics
            )
            + "</table>"
        ) if topics else "<p>样本中没有足够共现的关键词形成话题簇。</p>",
        "<h2>竞品声量份额 Share of voice</h2>",
        _bar_chart([(row["brand"], row["sov_mentions"]) for row in sov], "提及声量份额 SOV by mentions (%)"),
        (
            "<table><tr><th>品牌 Brand</th><th>提及 Mentions</th><th>SOV 提及</th><th>互动 Engagement</th><th>SOV 互动</th><th>净情感 Net</th></tr>"
            + "".join(
                f"<tr><td>{html.escape(row['brand'])}</td><td class=\"n\">{row['mentions']}</td><td class=\"n\">{_fmt(row['sov_mentions'], 1)}%</td>"
                f"<td class=\"n\">{_fmt(row['engagement'])}</td><td class=\"n\">{_fmt(row['sov_engagement'], 1)}%</td>"
                f"<td class=\"n\">{_fmt(row['sentiment']['net'], 1)}</td></tr>"
                for row in sov
            )
            + "</table>"
        ) if sov else "<p>未指定品牌或竞品（--brand / --competitor）。</p>",
        "<h2>互动 Top 10 帖子 Top posts by engagement</h2>",
        f"<table>{post_header}{post_rows(sorted((post for post in data['outliers'] if engagement(post) is not None), key=lambda post: -engagement(post))[:10])}</table>"
        if known else "<p>样本中没有互动计数。</p>",
        "<h2>异常帖 Outlier posts</h2>",
        f"<table>{post_header}{post_rows(outliers[:20])}</table>" if outliers else "<p>没有互动 ≥ 3 倍基线的帖子。</p>",
        "<h2>建议 Suggested actions</h2><ul>" + "".join(f"<li>{html.escape(line)}</li>" for line in data["suggestions"]) + "</ul>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>流程：账号时间线或话题搜索 → 按 id 和文本去重、过滤疑似 bot（账号注册 &lt; 30 天，或关注 ≥ 1000 且粉丝 ÷ 关注 &lt; 0.1；仅 X 有作者资料）→ 语种识别（X 的 lang 字段）→ 情感与话题聚类 → 账号基线与异常帖 → 竞品声量份额。</li>",
        "<li>互动 = 点赞 + 转发 + 回复 + 引用（X）；Reddit 为 score + 评论数；Hacker News 为 points + 评论数。缺失记「—」，不按 0 计算。</li>",
        "<li>账号互动率 = 样本帖互动中位数 ÷ 粉丝数；点赞率（Modash 口径）= 近 60 天帖子点赞中位数 ÷ 粉丝数；发帖频率 = 样本帖数 ÷ 样本跨度 × 7；互动增长 = 较新一半帖子互动中位数 ÷ 较旧一半 − 1。粉丝增长需要多次运行留下快照，本次不计算。</li>",
        "<li>对标：每个账号的指标 ÷ 其余账号的中位数（1.0 = 持平；互动增长为差值）。</li>",
        "<li>情感：VADER compound ≥ 0.05 为正面，≤ −0.05 为负面，其余中性；只给英语或未标注语种的帖子评分。净情感 = (正面 − 负面) ÷ 已评分提及 × 100（Brandwatch 口径，分母取总提及），取值 −100 到 +100。</li>",
        "<li>话题聚类：取出现在 ≥ 2 帖中的前 60 个关键词（去停用词和种子词），共现 ≥ 2 帖且 Jaccard ≥ 0.2 时互为邻居；按词频依次取未分配的关键词作种子，并入其 Jaccard 最高的未分配邻居，每簇最多 6 个关键词；每帖归入命中关键词最多的簇。</li>",
        f"<li>趋势判定按{html.escape(unit)}分桶：较新一半的桶高于较旧一半、≥ 50% 的桶有提及、≥ 3 位作者为长期趋势；单桶占 ≥ 50% 且持续 &lt; 50% 为短期热点。X recent search 只覆盖 7 天，有 X 数据时按日分桶。</li>",
        "<li>声量份额 SOV = 品牌提及（或互动）÷ 所列品牌合计 × 100；同一帖提到多个品牌时各计一次。</li>",
        "<li>异常帖 = 互动 ÷ 基线；同作者样本 ≥ 5 帖时基线为该作者互动中位数，否则为同来源中位数；≥ 3 为异常。</li>",
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


def write_xlsx(path: str, data: dict, context: dict) -> None:
    """Write the workbook: accounts, posts, topic_timeseries, benchmarks, share_of_voice, dropped_posts, and run sheets."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    generated: datetime = context["generated_at"]
    labels = bucket_labels(generated, context["granularity"], context["buckets"])
    kpi_columns = ["handle", "followers", "following", "post_count", "created_at", "sampled_posts", "posts_per_week",
                   "median_engagement", "median_impressions", "engagement_rate", "like_rate", "engagement_growth", "top_hour_utc"]
    _write_rows(workbook.add_worksheet("accounts"), bold, kpi_columns, [[row.get(name) for name in kpi_columns] for row in data["kpis"]])

    topic_of = dict(zip((post["id"] for post in data["posts"]), data["assignment"]))
    labels_by_id = {topic["id"]: topic["label"] for topic in data["topics"]}
    sheet = workbook.add_worksheet("posts")
    _write_rows(sheet, bold, [
        "id", "source", "query", "account", "created_at", "author", "author_followers", "lang", "text", "likes", "reposts", "replies",
        "quotes", "impressions", "engagement", "sentiment_compound", "sentiment", "topic", "baseline", "outlier_score", "is_outlier", "url",
    ], [[
        post.get("id"), post.get("source"), post.get("query"), post.get("account"), post.get("created_at"), post.get("author"),
        post.get("author_followers"), post.get("lang"), post.get("text"), post.get("likes"), post.get("reposts"), post.get("replies"),
        post.get("quotes"), post.get("impressions"), engagement(post), post.get("sentiment_compound"), post.get("sentiment"),
        labels_by_id.get(topic_of.get(post.get("id"))), post.get("baseline"), post.get("outlier_score"), "yes" if post.get("is_outlier") else "",
        post.get("url"),
    ] for post in data["outliers"]])
    sheet.set_column(8, 8, 60)

    _write_rows(workbook.add_worksheet("topic_timeseries"), bold,
                ["topic", "keywords", "posts", "authors", "engagement", "net_sentiment", "trend_class", "granularity"] + labels,
                [[topic["label"], ", ".join(topic["keywords"]), topic["posts"], topic["authors"], topic["engagement"], topic["net_sentiment"],
                  topic["trend_class"], context["granularity"]] + list(topic["counts"]) for topic in data["topics"]])

    _write_rows(workbook.add_worksheet("benchmarks"), bold, ["handle", "metric", "value", "peer_median", "vs_peer", "peers"],
                [[row["handle"], row["metric"], row["value"], row["peer_median"], row["vs_peer"], row["peers"]] for row in data["benchmarks"]])

    _write_rows(workbook.add_worksheet("share_of_voice"), bold,
                ["brand", "mentions", "sov_mentions_pct", "engagement", "sov_engagement_pct", "positive", "negative", "neutral", "net_sentiment"],
                [[row["brand"], row["mentions"], row["sov_mentions"], row["engagement"], row["sov_engagement"], row["sentiment"]["positive"],
                  row["sentiment"]["negative"], row["sentiment"]["neutral"], row["sentiment"]["net"]] for row in data["sov"]])

    _write_rows(workbook.add_worksheet("dropped_posts"), bold, ["id", "source", "author", "drop_reason", "text", "url"],
                [[post.get("id"), post.get("source"), post.get("author"), post.get("drop_reason"), post.get("text"), post.get("url")] for post in data["dropped"]])

    cost = context.get("x_cost") or {}
    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", generated.isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("bucket_granularity", context["granularity"]),
        ("net_sentiment_formula", "(positive − negative) ÷ scored mentions × 100; VADER compound ±0.05"),
        ("x_requests", str(cost.get("requests", 0))),
        ("x_reads", str(cost.get("reads", 0))),
        ("x_read_rate_usd", str(cost.get("rate_usd", 0.005))),
        ("x_estimated_cost_usd", f"{cost.get('cost_usd', 0.0):.4f}"),
        ("x_rate_note", cost.get("note") or "X API not called"),
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
