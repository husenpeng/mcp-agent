"""Write the HTML report and the xlsx workbook for one TikTok data-insight run.

The HTML file is self-contained: inline CSS and inline SVG charts, no scripts
or network assets. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime

CLASS_LABEL = {
    "trend": "趋势 trend", "spike": "短期热点 spike", "fad": "昙花一现 fad", "stable": "平稳 stable",
    "declining": "下降 declining", "insufficient": "样本不足 insufficient",
}


def _e(value) -> str:
    return html.escape(str(value), quote=True)


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def _bar_chart(data: list, title: str) -> str:
    """Return an inline horizontal SVG bar chart for (label, value) pairs with positive values."""
    data = sorted(((label, value) for label, value in data if value), key=lambda item: -item[1])[:10]
    if not data:
        return ""
    top = data[0][1]
    bar, gap, label_width, width = 22, 6, 300, 760
    bars = []
    for index, (label, value) in enumerate(data):
        y = index * (bar + gap)
        length = max(2, (width - label_width - 100) * value / top)
        short = label if len(label) <= 40 else label[:39] + "…"
        bars.append(
            f'<text x="{label_width - 8}" y="{y + 15}" text-anchor="end">{_e(short)}</text>'
            f'<rect x="{label_width}" y="{y}" width="{length:.1f}" height="{bar}" rx="3"></rect>'
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{_e(_fmt(value, 1))}</text>'
        )
    height = len(data) * (bar + gap)
    return f'<figure><figcaption>{_e(title)}</figcaption><svg viewBox="0 0 {width} {height}" role="img" aria-label="{_e(title)}">{"".join(bars)}</svg></figure>'


def _spark(series: list, change_point: str | None, title: str) -> str:
    """Return an inline SVG column chart of daily post counts with the change point marked."""
    if not series or not any(count for _, count, _ in series):
        return '<p class="muted">无日期数据 no dated videos.</p>'
    width, height, pad = 520, 90, 4
    top = max(count for _, count, _ in series)
    step = (width - 2 * pad) / len(series)
    bars = []
    for index, (day, count, _) in enumerate(series):
        h = (height - 22) * count / top
        cls = ' class="cp"' if day == change_point else ""
        bars.append(f'<rect{cls} x="{pad + index * step:.1f}" y="{height - 14 - h:.1f}" width="{max(step - 1, 1):.1f}" height="{h:.1f}"></rect>')
    return (
        f'<svg class="spark" viewBox="0 0 {width} {height}" role="img" aria-label="{_e(title)}">{"".join(bars)}'
        f'<text x="{pad}" y="{height - 2}">{_e(series[0][0])}</text><text x="{width - pad}" y="{height - 2}" text-anchor="end">{_e(series[-1][0])}</text></svg>'
    )


_CSS = """
body{font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;margin:0;color:#1f2328;background:#f6f8fa}
main{max-width:1100px;margin:0 auto;padding:32px 24px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 12px;border-bottom:1px solid #d0d7de;padding-bottom:6px}h3{font-size:15px;margin:0 0 6px}
.meta,.muted{color:#59636e;font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-top:16px}
.kpi{background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}.kpi b{display:block;font-size:20px}.kpi span{color:#59636e;font-size:12px}
table{width:100%;border-collapse:collapse;background:#fff;font-size:13px}
th,td{border:1px solid #d0d7de;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f0f3f6}td.n{text-align:right;white-space:nowrap}
figure,.topic{margin:12px 0;background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}
figcaption{font-weight:600;margin-bottom:8px}svg{width:100%;height:auto;font-size:11px}svg rect{fill:#2f81f7}svg rect.cp{fill:#cf222e}svg.spark{max-width:520px}
.gap{background:#fff8c5;border:1px solid #d4a72c;border-radius:10px;padding:8px 12px}
ul{margin:4px 0}
"""


def _video_table(videos: list) -> str:
    header = "<tr><th>视频 Video</th><th>账号 Account</th><th>发布 Posted</th><th>播放 Views</th><th>互动率 ER</th><th>分享 Shares</th><th>倍数 × median</th></tr>"
    rows = "".join(
        "<tr>"
        f'<td><a href="{_e(video.get("url") or "")}">{_e((video.get("description") or video["id"])[:90])}</a></td>'
        f'<td>{_e(video.get("author") or "")}</td><td>{_e((video.get("published_at") or "")[:10])}</td>'
        f'<td class="n">{_fmt(video.get("views"))}</td><td class="n">{_fmt(video.get("engagement_rate"), 2, percent=True)}</td>'
        f'<td class="n">{_fmt(video.get("shares"))}</td><td class="n">{_fmt(video.get("views_multiple"), 1)}</td>'
        "</tr>"
        for video in videos
    )
    return f"<table>{header}{rows}</table>" if videos else "<p>无。</p>"


def _topic_table(topics: list) -> str:
    header = ("<tr><th>话题/音乐 Topic</th><th>分类 Class</th><th>样本视频 Videos</th><th>7 天增速</th><th>28 天增速</th><th>加速度 Accel.</th>"
              "<th>持续周数 Weeks</th><th>达人数 Creators</th><th>总播放 Views</th><th>播放日增 Views/day</th><th>变点 Change point</th></tr>")
    rows = "".join(
        "<tr>"
        f'<td>{_e(topic["label"])}</td><td>{_e(CLASS_LABEL[topic["metrics"]["class"]])}<br><span class="muted">{_e(topic["metrics"]["why"])}</span></td>'
        f'<td class="n">{_fmt(topic["metrics"]["videos"])}</td><td class="n">{_fmt(topic["metrics"]["growth_7d"], 0, percent=True)}</td>'
        f'<td class="n">{_fmt(topic["metrics"]["growth_28d"], 0, percent=True)}</td><td class="n">{_fmt(topic["metrics"]["acceleration"], 0, percent=True)}</td>'
        f'<td class="n">{topic["metrics"]["active_weeks"]}/4</td><td class="n">{_fmt(topic["metrics"]["creators"])}</td>'
        f'<td class="n">{_fmt(topic["metrics"]["views_total"])}</td><td class="n">{_fmt(topic["metrics"]["views_gain_per_day"], 0)}</td>'
        f'<td>{_e(topic["metrics"]["change_point"] or "—")}</td>'
        "</tr>"
        for topic in topics
    )
    return f"<table>{header}{rows}</table>"


def write_html(path: str, title: str, accounts: list, videos: list, topics: list, emerging: list, bench: list, tips: list, context: dict) -> None:
    """Write the HTML report.

    context keys: query (str), generated_at (datetime), sources and gaps (lists of str),
    thresholds (dict), api_requests (int or None).
    """
    generated: datetime = context["generated_at"]
    gaps = context.get("gaps") or []
    thresholds = context["thresholds"]
    ranked = sorted((video for video in videos if video.get("views") is not None), key=lambda video: -video["views"])
    account_header = ("<tr><th>账号 Account</th><th>粉丝 Followers</th><th>粉丝日增 /day</th><th>样本视频 Videos</th><th>播放中位数 Median views</th>"
                      "<th>互动率中位数 Median ER</th><th>粉丝互动率 Follower ER</th><th>爆款率 Breakout rate</th><th>每周发布 Posts/week</th>"
                      "<th>发布间隔中位数 Gap days</th><th>最佳时段 Best hour UTC</th><th>来源 Source</th></tr>")
    account_rows = "".join(
        "<tr>"
        f'<td>@{_e(row["handle"])}</td><td class="n">{_fmt(row["account"].get("followers"))}</td>'
        f'<td class="n">{_fmt(row["metrics"].get("follower_gain_per_day"), 0)}</td><td class="n">{row["metrics"]["videos"]}</td>'
        f'<td class="n">{_fmt(row["metrics"]["median_views"])}</td><td class="n">{_fmt(row["metrics"]["median_er"], 2, percent=True)}</td>'
        f'<td class="n">{_fmt(row["metrics"]["follower_er"], 2, percent=True)}</td><td class="n">{_fmt(row["metrics"]["breakout_rate"], 0, percent=True)}</td>'
        f'<td class="n">{_fmt(row["metrics"]["posts_per_week"], 1)}</td><td class="n">{_fmt(row["metrics"]["median_gap_days"], 1)}</td>'
        f'<td class="n">{_fmt(row["metrics"]["best_hour_utc"])}</td><td>{_e(row["account"].get("source") or "")}</td>'
        "</tr>"
        for row in accounts
    )
    bench_rows = "".join(
        f'<tr><td>@{_e(item["account"])}</td><td>{_e(item["metric"])}</td><td class="n">{_fmt(item["value"], 4)}</td>'
        f'<td class="n">{_fmt(item["peer_median"], 4)}</td><td class="n">{_fmt(item["ratio"], 2)}</td></tr>'
        for item in bench if item["value"] is not None
    )
    topic_blocks = "".join(
        f'<div class="topic"><h3>{_e(topic["label"])} · {_e(CLASS_LABEL[topic["metrics"]["class"]])}</h3>'
        f'{_spark(topic["series"], topic["metrics"]["change_point"], topic["label"])}'
        f'<p class="muted">每日发布量（样本视频）；红色柱为变点 red = change point.</p></div>'
        for topic in topics
    )
    trend_count = sum(topic["metrics"]["class"] == "trend" for topic in topics)
    breakout_total = sum(row["metrics"]["breakouts"] for row in accounts)
    method = [
        "互动率 ER（视频）= (点赞 + 评论) ÷ 播放；缺少计数时记为「—」，不按 0 计算。",
        "粉丝互动率（Modash 口径）= 近 60 天视频点赞数中位数 ÷ 粉丝数。",
        f"爆款率 = 播放 > 账号样本播放中位数 × {thresholds['breakout_multiple']} 的视频占比。",
        "发布节奏：每周发布 = (样本视频数 − 1) ÷ 首末发布间隔天数 × 7；另给发布间隔中位数和播放中位数最高的发布小时（UTC）。",
        "粉丝和话题播放的日增量来自 --state 中的历次快照：日增 = 两次快照差 ÷ 间隔天数；加速度 = 最近区间日增 − 上一区间日增。",
        "话题/音乐增速基于样本视频的发布日期：7 天增速 = 最近 7 天发布数 ÷ 前 7 天 − 1；28 天同理；加速度 = 本周 7 天增速 − 上周 7 天增速。",
        "变点：在窗口内每日发布量上找一处均值突变（最小平方误差），误差至少减半才标注。",
        f"Exolyt 式分类：样本 < {thresholds['min_videos']} 为样本不足；最近一周发布量 < 峰值周 × {thresholds['fad_decay_ratio']} 为昙花一现；"
        f"3 天内集中 ≥ {thresholds['spike_peak_share']:.0%} 发布或单一达人 > {thresholds['trend_max_top_creator_share']:.0%} 为短期热点；"
        f"28 天增长且 ≥ {thresholds['trend_min_active_weeks']}/4 周有发布且 ≥ {thresholds['trend_min_creators']} 位达人为趋势；其余为下降或平稳。",
        "样本视频是 TikTokApi 返回的前 N 条，不是全量；增速衡量样本内的发布节奏，用于方向判断。",
        "Display API 只返回授权账号自己的数据；TikTokApi 是非官方接口，随时可能被限流或失效；yt-dlp 只取元数据，不下载视频。",
    ]
    parts = [
        f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>{_e(title)}</title><style>{_CSS}</style></head><body><main>',
        f"<h1>{_e(title)}</h1>",
        f'<p class="meta">查询 Query: {_e(context["query"])} · 生成时间 Generated: {_e(generated.isoformat(timespec="minutes"))} · 数据来源 Sources: {_e(", ".join(context.get("sources") or []))}'
        + ("" if context.get("api_requests") is None else f' · Display API requests: {context["api_requests"]}') + "</p>",
        "<h2>摘要 Summary</h2><div class=\"kpis\">",
        f'<div class="kpi"><b>{len(accounts)}</b><span>账号 Accounts</span></div>',
        f'<div class="kpi"><b>{len(videos)}</b><span>视频 Videos</span></div>',
        f'<div class="kpi"><b>{breakout_total}</b><span>爆款（&gt; {_e(thresholds["breakout_multiple"])}× 中位数）</span></div>',
        f'<div class="kpi"><b>{len(topics)}</b><span>话题/音乐 Topics</span></div>',
        f'<div class="kpi"><b>{trend_count}</b><span>持续趋势 Trends</span></div>',
        "</div>",
        "<h2>账号概览与对标 Accounts and benchmarks</h2>",
        f"<table>{account_header}{account_rows}</table>" if accounts else "<p>本次未请求账号。</p>",
        _bar_chart([("@" + row["handle"], row["metrics"]["median_views"]) for row in accounts], "播放中位数 Median views"),
        ("<p>对标 = 各账号指标 ÷ 所有请求账号的中位数（≥ 2 个账号时才有意义）。</p><table><tr><th>账号</th><th>指标 Metric</th><th>值 Value</th><th>同类中位数 Peer median</th><th>比值 Ratio</th></tr>"
         + bench_rows + "</table>") if len(accounts) >= 2 else "<p>只有一个账号，无法对标；请在运行指令中加入至少一个同类账号。</p>",
        "<h2>Top / Bottom 视频 Top and bottom videos</h2>",
        _bar_chart([((video.get("description") or video["id"])[:40], video["views"]) for video in ranked[:10]], "播放 Top 10 Views"),
        "<h3>Top 10</h3>", _video_table(ranked[:10]),
        "<h3>Bottom 10</h3>", _video_table(list(reversed(ranked[-10:])) if len(ranked) > 10 else []),
        "<h2>话题与音乐趋势 Hashtag and sound trends</h2>",
        (_topic_table(topics) + topic_blocks) if topics else "<p>本次未请求话题或音乐。</p>",
        "<h2>新兴趋势 Emerging trends</h2>",
        "<p>样本视频中共同出现的其他话题，按同一规则分类，只列出趋势和短期热点。</p>",
        _topic_table(emerging) if emerging else "<p>没有发现达到阈值的共现话题。</p>",
        "<h2>建议 Recommendations</h2>",
        ("<ul>" + "".join(f"<li>{_e(tip)}</li>" for tip in tips) + "</ul>") if tips else "<p>数据不足，暂无建议。</p>",
        "<h2>方法与口径 Method</h2><ul>" + "".join(f"<li>{_e(item)}</li>" for item in method) + "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ('<div class="gap"><ul>' + "".join(f"<li>{_e(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


def _write_table(workbook, name: str, columns: list, records: list, bold) -> None:
    sheet = workbook.add_worksheet(name)
    for col, column in enumerate(columns):
        sheet.write(0, col, column, bold)
    for row, record in enumerate(records, start=1):
        for col, column in enumerate(columns):
            value = record.get(column)
            if value is None:
                sheet.write_blank(row, col, None)
            elif isinstance(value, (list, tuple)):
                sheet.write_string(row, col, ", ".join(str(item) for item in value))
            elif isinstance(value, bool) or not isinstance(value, (int, float)):
                sheet.write_string(row, col, str(value))
            else:
                sheet.write_number(row, col, value)
    sheet.freeze_panes(1, 0)
    sheet.autofilter(0, 0, max(len(records), 1), len(columns) - 1)


def write_xlsx(path: str, accounts: list, videos: list, topics: list, emerging: list, bench: list, context: dict) -> None:
    """Write the workbook: accounts, videos, topic_timeseries, topics, benchmarks, and run."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    account_records = [{"handle": row["handle"], **{f"profile_{key}": value for key, value in row["account"].items() if key != "handle"}, **row["metrics"]} for row in accounts]
    account_columns = list(account_records[0].keys()) if account_records else ["handle"]
    _write_table(workbook, "accounts", account_columns, account_records, bold)
    _write_table(workbook, "videos", ["id", "topic", "author", "published_at", "duration_seconds", "views", "likes", "comments", "shares",
                                      "engagement_rate", "views_multiple", "hashtags", "sound_title", "description", "url", "source"], videos, bold)
    series = [{"topic": topic["label"], "date": day, "posts": posts, "views_of_posts": views}
              for topic in topics + emerging for day, posts, views in topic["series"]]
    _write_table(workbook, "topic_timeseries", ["topic", "date", "posts", "views_of_posts"], series, bold)
    topic_columns = ["topic", "class", "why", "videos", "posts_window", "growth_7d", "growth_28d", "acceleration", "active_weeks", "creators",
                     "top_creator_share", "peak_share", "change_point", "median_er", "views_total", "views_gain_per_day", "views_acceleration", "snapshots", "emerging"]
    topic_records = [{"topic": topic["label"], "emerging": "yes" if topic in emerging else "no", **topic["metrics"]} for topic in topics + emerging]
    _write_table(workbook, "topics", topic_columns, topic_records, bold)
    _write_table(workbook, "benchmarks", ["account", "metric", "value", "peer_median", "ratio", "peers"], bench, bold)
    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("api_requests", "" if context.get("api_requests") is None else str(context["api_requests"])),
        ("state_file", context.get("state") or ""),
    ] + [(f"threshold.{key}", str(value)) for key, value in context["thresholds"].items()] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
