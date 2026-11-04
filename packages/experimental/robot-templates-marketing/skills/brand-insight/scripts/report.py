"""Write the HTML report and the xlsx workbook for one brand-insight run.

The HTML file is self-contained: inline CSS and inline SVG charts, no scripts
or network assets, so it opens offline. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime

from metrics import NEGATIVE, POSITIVE, SPIKE_Z

PALETTE = ["#2f81f7", "#d1242f", "#1a7f37", "#9a6700", "#8250df", "#bf3989", "#0a7d8c", "#57606a"]


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def _e(value) -> str:
    return html.escape(str(value))


def _bar_chart(rows: list, label_key: str, value_key: str, title: str) -> str:
    """Return an inline horizontal SVG bar chart for rows with positive values."""
    data = [(str(row.get(label_key) or ""), row.get(value_key)) for row in rows if row.get(value_key)]
    data = sorted(data, key=lambda item: item[1], reverse=True)[:10]
    if not data:
        return ""
    top = data[0][1]
    bar_height, gap, label_width, width = 22, 6, 200, 760
    height = len(data) * (bar_height + gap)
    bars = []
    for index, (label, value) in enumerate(data):
        y = index * (bar_height + gap)
        length = max(2, (width - label_width - 90) * value / top)
        bars.append(
            f'<text x="{label_width - 8}" y="{y + 15}" text-anchor="end">{_e(label[:30])}</text>'
            f'<rect x="{label_width}" y="{y}" width="{length:.1f}" height="{bar_height}" rx="3" fill="{PALETTE[index % len(PALETTE)]}"></rect>'
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{_e(_fmt(value, 1))}</text>'
        )
    return (
        f'<figure><figcaption>{_e(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{_e(title)}">{"".join(bars)}</svg></figure>'
    )


def _line_chart(series: dict, days: list, title: str) -> str:
    """Return an inline SVG line chart of {brand: {day: value}} with a legend; None values break the line."""
    peak = max((value for values in series.values() for value in values.values() if value is not None), default=0)
    floor = min((value for values in series.values() for value in values.values() if value is not None), default=0)
    floor = min(floor, 0)
    if peak == floor or len(days) < 2:
        return ""
    width, height, left, bottom, top_pad = 760, 240, 48, 24, 12
    plot_w, plot_h = width - left - 10, height - bottom - top_pad

    def point(index: int, value: float) -> str:
        return f"{left + plot_w * index / (len(days) - 1):.1f},{top_pad + plot_h * (peak - value) / (peak - floor):.1f}"

    lines = []
    legend = []
    for number, (brand, values) in enumerate(series.items()):
        color = PALETTE[number % len(PALETTE)]
        segments: list = [[]]
        for index, day in enumerate(days):
            value = values.get(day)
            if value is None:
                segments.append([])
            else:
                segments[-1].append(point(index, value))
        for segment in segments:
            if len(segment) > 1:
                lines.append(f'<polyline fill="none" stroke="{color}" stroke-width="2" points="{" ".join(segment)}"></polyline>')
            elif segment:
                x, y = segment[0].split(",")
                lines.append(f'<circle cx="{x}" cy="{y}" r="2.5" fill="{color}"></circle>')
        legend.append(f'<span style="color:{color}">■</span> {_e(brand)}')
    axis = (
        f'<line x1="{left}" y1="{top_pad + plot_h}" x2="{width - 10}" y2="{top_pad + plot_h}" stroke="#d0d7de"></line>'
        f'<text x="{left - 6}" y="{top_pad + 8}" text-anchor="end">{_e(_fmt(peak, 1))}</text>'
        f'<text x="{left - 6}" y="{top_pad + plot_h}" text-anchor="end">{_e(_fmt(floor, 1))}</text>'
        f'<text x="{left}" y="{height - 6}">{_e(days[0])}</text>'
        f'<text x="{width - 10}" y="{height - 6}" text-anchor="end">{_e(days[-1])}</text>'
    )
    return (
        f'<figure><figcaption>{_e(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{_e(title)}">{axis}{"".join(lines)}</svg>'
        f'<div class="legend">{" · ".join(legend)}</div></figure>'
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
figcaption{font-weight:600;margin-bottom:8px}svg{width:100%;height:auto;font-size:12px}
.legend{font-size:12px;color:#59636e}
.gap{background:#fff8c5;border:1px solid #d4a72c;border-radius:10px;padding:8px 12px}
ul{margin:4px 0}
"""


def _table(header: list, rows: list) -> str:
    head = "".join(f"<th>{_e(name)}</th>" for name in header)
    body = "".join("<tr>" + "".join(rows_cell for rows_cell in row) + "</tr>" for row in rows)
    return f"<table><tr>{head}</tr>{body}</table>"


def _td(value, numeric: bool = False) -> str:
    return f'<td class="n">{_e(value)}</td>' if numeric else f"<td>{_e(value)}</td>"


def _link(title, url) -> str:
    return f'<a href="{_e(url or "")}">{_e(title or url or "")}</a>'


def write_html(path: str, title: str, data: dict, context: dict) -> None:
    """Write the HTML report.

    data keys: brands, days, summary, daily, spikes, topics, keywords, overlap, mentions.
    context keys: query (str), generated_at (datetime), window (str), sources (list of str),
    gaps (list of str), api_units (int or None), sentiment_model (str or None).
    """
    generated: datetime = context["generated_at"]
    brands, days, summary = data["brands"], data["days"], data["summary"]
    focus = summary[0]
    gaps = context.get("gaps") or []
    daily = data["daily"]

    def series(key: str) -> dict:
        return {brand: {row["date"]: row[key] for row in daily if row["brand"] == brand} for brand in brands}

    sov_rows = [[
        _td(row["brand"]), _td(row["mentions"], True), _td(_fmt(row["sov_mentions"], 1, percent=True), True),
        _td(_fmt(row["engagement"]), True), _td(_fmt(row["sov_engagement"], 1, percent=True), True), _td(row["sources"]),
    ] for row in summary]
    sentiment_rows = [[
        _td(row["brand"]), _td(row["positive"], True), _td(row["negative"], True), _td(row["neutral"], True),
        _td(_fmt(row["net_polar"], 1), True), _td(_fmt(row["net_total"], 1), True),
    ] for row in summary]
    attention_rows = [[
        _td(row["brand"]), _td(_fmt(row["pageviews"]), True), _td(_fmt(row["attention_share"], 1, percent=True), True),
        _td(_fmt(row["gdelt_volume_mean"], 4), True), _td(_fmt(row["youtube_results"]), True),
    ] for row in summary]
    topic_rows = [[_td(row["brand"]), _td(row["topic"]), _td(row["mentions"], True), f"<td>{_link(row['example'], row['url'])}</td>"] for row in data["topics"]]
    keyword_lists = [[_td(brand), _td(", ".join(f"{row['keyword']} ({row['count']})" for row in data["keywords"] if row["brand"] == brand and row["rank"] <= 15))] for brand in brands]
    overlap_rows = [[_td(left), _td(right), _td(_fmt(value, 2), True)] for left, right, value in data["overlap"]]
    spike_rows = [[
        _td(row["date"]), _td(row["brand"]), _td(row["series"]), _td(_fmt(row["value"], 1), True), _td(_fmt(row["z"], 2), True),
        "<td>" + ("<br>".join(f"{_link(driver['title'], driver['url'])} ({_e(driver['source'])})" for driver in row["drivers"]) or "未在提及样本中找到当日内容 no sampled mention that day") + "</td>",
    ] for row in data["spikes"]]
    top_spike = max(data["spikes"], key=lambda row: row["z"], default=None)
    model = context.get("sentiment_model")

    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{_e(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{_e(title)}</h1>",
        f'<p class="meta">品牌 Brands: {_e(context["query"])} · 时间窗 Window: {_e(context["window"])} · 生成时间 Generated: {_e(generated.isoformat(timespec="minutes"))} · '
        f'数据来源 Sources: {_e(", ".join(context.get("sources") or []))}'
        + ("" if context.get("api_units") is None else f' · YouTube API units: {_e(context["api_units"])}')
        + "</p>",
        "<h2>执行摘要 Executive summary</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{_e(_fmt(focus['sov_mentions'], 1, percent=True))}</b><span>{_e(focus['brand'])} 声量份额（提及） SOV by mentions</span></div>",
        f"<div class=\"kpi\"><b>{_e(_fmt(focus['sov_engagement'], 1, percent=True))}</b><span>{_e(focus['brand'])} 声量份额（互动） SOV by engagement</span></div>",
        f"<div class=\"kpi\"><b>{_e(_fmt(focus['net_polar'], 1))}</b><span>{_e(focus['brand'])} 净情感 Net sentiment</span></div>",
        f"<div class=\"kpi\"><b>{sum(row['mentions'] for row in summary)}</b><span>提及总数 Total mentions</span></div>",
        f"<div class=\"kpi\"><b>{len(data['spikes'])}</b><span>峰值 Spikes (z &gt; {SPIKE_Z:g})</span></div>",
        "</div>",
        f"<p>最大峰值 Largest spike: {_e(top_spike['brand'] + ' ' + top_spike['date'] + ' (' + top_spike['series'] + ', z = ' + _fmt(top_spike['z'], 2) + ')') if top_spike else '无 none'}.</p>",
        "<h2>声量与 SOV Share of voice</h2>",
        _bar_chart(summary, "brand", "sov_mentions", "声量份额（按提及）SOV by mentions, %"),
        _bar_chart(summary, "brand", "sov_engagement", "声量份额（按互动）SOV by engagement, %"),
        _table(["品牌 Brand", "提及 Mentions", "SOV 提及", "互动 Engagement", "SOV 互动", "来源 Sources"], sov_rows),
        _line_chart(series("mentions"), days, "每日提及量 Daily mentions"),
        "<h2>情感与净情感趋势 Sentiment and net sentiment</h2>",
        (f"<p>情感模型 Model: {_e(model)}。</p>" if model else "<p>未运行情感模型（vaderSentiment 未安装），本节为空。</p>"),
        _table(["品牌 Brand", "正面 Positive", "负面 Negative", "中性 Neutral", "净情感（极性口径）", "净情感（总提及口径）"], sentiment_rows),
        _line_chart(series("net_polar"), days, "每日净情感（极性口径）Daily net sentiment, polar formula") if model else "",
        "<h2>搜索与关注度趋势 Search and attention trends</h2>",
        _table(["品牌 Brand", "Wikipedia 浏览量 Pageviews", "浏览量份额 Attention share", "GDELT 日均报道强度 Volume", "YouTube 结果数 Results"], attention_rows),
        _line_chart(series("pageviews"), days, "Wikipedia 每日浏览量 Daily pageviews"),
        _line_chart(series("gdelt_volume"), days, "GDELT 每日报道强度（占监测文章 %）Daily news volume intensity"),
        "<h2>话题地图 Topic map</h2>",
        _table(["品牌 Brand", "话题 Topic (bigram)", "提及 Mentions", "示例 Example"], topic_rows) if topic_rows else "<p>没有在 ≥ 2 条提及中重复出现的话题词组。</p>",
        "<h2>定位与联想词对比 Positioning and associated keywords</h2>",
        _table(["品牌 Brand", "高频联想词 Top keywords (count)"], keyword_lists),
        _table(["品牌 A", "品牌 B", "联想词 Jaccard 重叠度"], overlap_rows) if overlap_rows else "",
        "<h2>峰值事件时间线 Spike timeline</h2>",
        _table(["日期 Date", "品牌 Brand", "序列 Series", "值 Value", "z", "当日高互动内容 Likely drivers"], spike_rows) if spike_rows else f"<p>没有 z &gt; {SPIKE_Z:g} 的日期。</p>",
        "<h2>竞品官网变化 Competitor site changes</h2>",
        "<p>本技能不抓取品牌官网；如需官网和定价页变更，请另行运行网页变更监测并把结果附在回复中。This skill does not monitor brand websites.</p>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>声量份额 SOV = 本品牌指标 ÷ 品牌与竞品合计 × 100，分别按提及量和互动量计算。互动 = Reddit 分数 + 评论数、Hacker News points + 评论数、YouTube 点赞 + 评论数；GDELT 新闻没有互动数，不计入互动口径（记为「—」，不按 0 计算）。</li>",
        f"<li>情感：VADER compound ≥ {POSITIVE} 为正面，≤ {NEGATIVE} 为负面，其余为中性；只对英文文本可靠，GDELT 只有标题。</li>",
        "<li>净情感（本报告主口径，极性口径，Talkwalker）= (正面 − 负面) ÷ (正面 + 负面) × 100；另列总提及口径（Brandwatch）= (正面 − 负面) ÷ (正面 + 负面 + 中性) × 100。取值 −100 到 +100。</li>",
        f"<li>峰值：某日数值相对时间窗内该品牌日序列的 z-score =（当日值 − 均值）÷ 总体标准差 &gt; {SPIKE_Z:g}；分别对提及量、GDELT 报道强度和 Wikipedia 浏览量计算。驱动内容取当日互动最高的提及，是候选解释，需人工确认。</li>",
        "<li>关注度：Wikipedia 浏览量（user agent，全部访问方式）作为搜索热度代理；GDELT TimelineVol 为匹配文章占全部监测文章的百分比。</li>",
        "<li>话题 = 去停用词和品牌名后，在 ≥ 2 条提及中出现的相邻词对；联想词按提及计数，Jaccard 重叠度 = 两品牌前 30 联想词的交集 ÷ 并集。</li>",
        "<li>提及为各来源返回的样本（GDELT ≤ 250 篇/品牌，Hacker News、Reddit、YouTube 有上限），不是全量；同一品牌内按 URL 去重。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{_e(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


def _write_rows(sheet, columns: list, rows: list, bold) -> None:
    for col, (name, _) in enumerate(columns):
        sheet.write(0, col, name, bold)
    for row_index, row in enumerate(rows, start=1):
        for col, (name, fmt) in enumerate(columns):
            value = row.get(name)
            if value is None:
                sheet.write_blank(row_index, col, None)
            elif fmt is None or isinstance(value, bool) or not isinstance(value, (int, float)):
                sheet.write_string(row_index, col, str(value))
            else:
                sheet.write_number(row_index, col, value, fmt)
    sheet.autofilter(0, 0, max(len(rows), 1), len(columns) - 1)
    sheet.freeze_panes(1, 0)


def write_xlsx(path: str, data: dict, context: dict) -> None:
    """Write the workbook: mentions, daily_metrics, topics, keywords, sources_log, and run sheets."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    number = workbook.add_format({"num_format": "#,##0"})
    decimal = workbook.add_format({"num_format": "#,##0.00"})
    small = workbook.add_format({"num_format": "0.0000"})

    _write_rows(workbook.add_worksheet("mentions"), [
        ("brand", None), ("source", None), ("published_at", None), ("title", None), ("engagement", number), ("views", number),
        ("compound", decimal), ("sentiment", None), ("author", None), ("language", None), ("url", None), ("text", None),
    ], data["mentions"], bold)
    _write_rows(workbook.add_worksheet("daily_metrics"), [
        ("date", None), ("brand", None), ("mentions", number), ("engagement", number), ("positive", number), ("negative", number),
        ("neutral", number), ("net_polar", decimal), ("gdelt_volume", small), ("pageviews", number), ("mention_z", decimal),
    ], data["daily"], bold)
    _write_rows(workbook.add_worksheet("topics"), [
        ("brand", None), ("topic", None), ("mentions", number), ("example", None), ("url", None),
    ], data["topics"], bold)
    _write_rows(workbook.add_worksheet("keywords"), [
        ("brand", None), ("rank", number), ("keyword", None), ("count", number), ("lift", decimal),
    ], data["keywords"], bold)
    _write_rows(workbook.add_worksheet("sources_log"), [
        ("source", None), ("brand", None), ("query", None), ("status", None), ("records", number), ("detail", None),
    ], context.get("sources_log") or [], bold)

    run = workbook.add_worksheet("run")
    summary_keys = ["mentions", "engagement", "sov_mentions", "sov_engagement", "net_polar", "net_total", "pageviews", "attention_share"]
    facts = [
        ("brands", context["query"]),
        ("window", context["window"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("sentiment_model", context.get("sentiment_model") or ""),
        ("net_sentiment_formula", "(positive − negative) ÷ (positive + negative) × 100; net_total uses all scored mentions"),
        ("youtube_api_units", "" if context.get("api_units") is None else str(context["api_units"])),
    ]
    facts += [(f"summary:{row['brand']}", "; ".join(f"{key}={_fmt(row[key], 2)}" for key in summary_keys)) for row in data["summary"]]
    facts += [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
