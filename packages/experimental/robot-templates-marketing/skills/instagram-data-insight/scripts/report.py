"""Write the HTML report and the xlsx workbook for one Instagram insight run.

The HTML file is self-contained: inline CSS and inline SVG charts, no scripts or
network assets, so it opens offline. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime

from metrics import WEEKDAYS


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def _bar_chart(rows: list, label_key: str, value_key: str, title: str, percent: bool = False) -> str:
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
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{html.escape(_fmt(value, 2, percent=percent) if percent else _fmt(value, 1))}</text>'
        )
    return (
        f'<figure><figcaption>{html.escape(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">{"".join(bars)}</svg></figure>'
    )


def _heatmap(rows: list, title: str) -> str:
    """Return an inline SVG weekday × hour grid whose cell opacity follows the post count."""
    peak = max((row["posts"] for row in rows), default=0)
    if not peak:
        return ""
    cell, left, top = 28, 44, 20
    cells = [f'<text x="{left + hour * cell + 7}" y="13">{hour:02d}</text>' for hour in range(0, 24, 3)]
    for index, day in enumerate(WEEKDAYS):
        cells.append(f'<text x="0" y="{top + index * cell + 18}">{day}</text>')
    for row in rows:
        x, y = left + row["hour"] * cell, top + WEEKDAYS.index(row["weekday"]) * cell
        opacity = 0.08 if not row["posts"] else 0.2 + 0.8 * row["posts"] / peak
        cells.append(f'<rect x="{x}" y="{y}" width="{cell - 2}" height="{cell - 2}" rx="3" fill-opacity="{opacity:.2f}"></rect>')
        if row["posts"]:
            cells.append(f'<text x="{x + 9}" y="{y + 18}">{row["posts"]}</text>')
    width, height = left + 24 * cell, top + 7 * cell
    return (
        f'<figure><figcaption>{html.escape(title)}</figcaption>'
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">{"".join(cells)}</svg></figure>'
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

_ROLE = {"primary": "分析对象 Primary", "competitor": "竞品 Competitor"}
_LABEL = {"lasting": "长期趋势 lasting", "spike": "短期热点 spike", "insufficient": "样本不足 insufficient"}
_SOURCE = {"instagram-graph-api": "官方 Official (Business Discovery)", "instaloader": "公开采集 Public (instaloader)"}


def _link(url, label) -> str:
    text = html.escape(str(label or url or ""))
    return f'<a href="{html.escape(url)}">{text}</a>' if str(url or "").startswith("https://") else text


def _excerpt(text, size: int = 80) -> str:
    flat = " ".join((text or "").split())
    return flat if len(flat) <= size else flat[:size - 1] + "…"


def _table(headers: list, rows: list) -> str:
    head = "".join(f"<th>{html.escape(name)}</th>" for name in headers)
    return f"<table><tr>{head}</tr>{''.join(rows)}</table>"


def _cells(*values) -> str:
    """Return one table row; a one-item tuple holds numeric text to escape, any other value is already-escaped HTML."""
    cells = []
    for value in values:
        if isinstance(value, tuple):
            cells.append(f'<td class="n">{html.escape(value[0])}</td>')
        else:
            cells.append(f"<td>{value}</td>")
    return f"<tr>{''.join(cells)}</tr>"


def _n(value, digits: int = 0, percent: bool = False) -> tuple:
    return (_fmt(value, digits, percent=percent),)


def write_html(path: str, title: str, data: dict, context: dict) -> None:
    """Write the HTML report.

    data keys: posts, accounts, formats, heatmap, hours, contributions, trends,
    benchmarks, growth, recommendations. context keys: query (str), generated_at
    (datetime), sources (list of str), gaps (list of str), api_calls (int or
    None), utc_offset (number).
    """
    generated: datetime = context["generated_at"]
    posts, accounts = data["posts"], data["accounts"]
    gaps = context.get("gaps") or []
    offset = f"UTC{context['utc_offset']:+g}"
    rates = sorted(row["median_engagement_rate"] for row in accounts if row.get("median_engagement_rate") is not None)
    reels = sum(post.get("kind") == "reel" for post in posts)
    lasting = sum(row["label"] == "lasting" for row in data["trends"])
    top = sorted((post for post in posts if post.get("engagement") is not None), key=lambda post: -post["engagement"])[:20]
    charts = [{**post, "label": _excerpt(post.get("caption"), 40) or post["id"]} for post in top]
    account_rows = [
        _cells(
            _link(f"https://www.instagram.com/{row['username']}/", row["username"]), html.escape(_ROLE.get(row["role"], row["role"])),
            _n(row.get("followers")), _n(row.get("media_count")), _n(row["posts_sampled"]), _n(row.get("median_engagement_rate"), 2, True),
            _n(row.get("modash_rate"), 2, True), _n(row.get("posts_per_week"), 1), _n(row.get("reel_share"), 0, True),
            html.escape(row.get("last_post") or "—"), html.escape(_SOURCE.get(row.get("source"), str(row.get("source")))),
        )
        for row in accounts
    ]
    growth_rows = [
        _cells(
            html.escape(row["username"]), html.escape(str(row["previous_at"])), _n(row["days"], 1), _n(row["followers_before"]),
            _n(row["followers_after"]), _n(row["followers_delta"]), _n(row["followers_growth"], 2, True), _n(row["followers_per_day"], 1), _n(row["media_delta"]),
        )
        for row in data["growth"]
    ]
    format_rows = [
        _cells(
            html.escape(row["kind"]), _n(row["posts"]), _n(row["share"], 0, True), _n(row["median_likes"], 1), _n(row["median_comments"], 1),
            _n(row["median_views"], 1), _n(row["median_engagement"], 1), _n(row["median_engagement_rate"], 2, True),
        )
        for row in data["formats"]
    ]
    post_rows = [
        _cells(
            _link(post.get("url"), post["id"]), html.escape(str(post.get("owner") or "—")), html.escape(post.get("kind") or "unknown"),
            html.escape(_excerpt(post.get("caption"))), _n(post.get("likes")), _n(post.get("comments")), _n(post.get("views")), _n(post.get("engagement_rate"), 2, True),
        )
        for post in top
    ]
    hour_rows = [_cells(html.escape(f"{row['hour']:02d}:00"), _n(row["posts"]), _n(row["median_engagement_rate"], 2, True)) for row in data["hours"]]
    trend_rows = [
        _cells(
            html.escape(row["hashtag"]), _n(row["posts"]), _n(row["last_7d"]), _n(row["prior_7d"]), _n(row["growth"], 0, True),
            _n(row["accounts"]), _n(row["active_weeks"]), html.escape(_LABEL[row["label"]]),
        )
        for row in data["trends"][:30]
    ]
    contribution_rows = [
        _cells(
            html.escape(str(row["account"])), html.escape(row["hashtag"]), _n(row["posts"]), _n(row["mean_engagement"], 1),
            _n(row["account_mean_engagement"], 1), _n(row["contribution_index"], 2),
        )
        for row in data["contributions"][:30]
    ]
    benchmark_rows = [
        _cells(
            html.escape(row["username"]), html.escape(_ROLE.get(row["role"], row["role"])), _n(row["median_engagement_rate"], 2, True), _n(row["peer_median_engagement_rate"], 2, True),
            _n(row["engagement_index"], 2), _n(row["posts_per_week"], 1), _n(row["peer_median_posts_per_week"], 1), _n(row["cadence_index"], 2),
        )
        for row in data["benchmarks"]
    ]
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">查询 Query: {html.escape(context["query"])} · 生成时间 Generated: {generated.isoformat(timespec="minutes")} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}'
        + ("" if context.get("api_calls") is None else f' · API calls: {context["api_calls"]}')
        + "</p>",
        "<h2>摘要 Summary</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(accounts)}</b><span>账号 Accounts</span></div>",
        f"<div class=\"kpi\"><b>{len(posts)}</b><span>帖子 Posts</span></div>",
        f"<div class=\"kpi\"><b>{reels}</b><span>Reels</span></div>",
        f"<div class=\"kpi\"><b>{_fmt(rates[len(rates) // 2] if rates else None, 2, percent=True)}</b><span>账号互动率中位数 Median ER</span></div>",
        f"<div class=\"kpi\"><b>{lasting}</b><span>长期趋势话题 Lasting hashtags</span></div>",
        "</div>",
        "<h2>账号健康度 Account health</h2>",
        _table(["账号 Account", "角色 Role", "粉丝 Followers", "总帖数 Media", "样本 Sampled", "互动率 ER", "Modash ER", "周发帖 Posts/wk", "Reels 占比", "最近发帖 Last post", "来源 Source"], account_rows),
        "<h3>增长 Growth</h3>",
        _table(["账号 Account", "上次快照 Previous", "间隔天数 Days", "之前粉丝 Before", "当前粉丝 After", "变化 Delta", "增长率 Growth", "日增 Per day", "新帖 New media"], growth_rows) if growth_rows else "<p>没有上次运行的快照，本次不计算增长。No earlier snapshot, so growth is not computed.</p>",
        "<h2>内容表现 Content performance</h2>",
        "<h3>类型对比 Reels vs image vs carousel</h3>",
        _bar_chart(data["formats"], "kind", "median_engagement_rate", "互动率中位数 Median ER", percent=True),
        _table(["类型 Type", "帖子 Posts", "占比 Share", "点赞中位数 Likes", "评论中位数 Comments", "播放中位数 Views", "互动中位数 Engagement", "互动率中位数 ER"], format_rows),
        f"<h3>发布时段 Posting hours ({html.escape(offset)})</h3>",
        _heatmap(data["heatmap"], f"发帖热力图 Posts by weekday and hour ({offset})") or "<p>没有帖子带发布时间。</p>",
        _table(["小时 Hour", "帖子 Posts", "互动率中位数 ER"], hour_rows) if hour_rows else "",
        "<h3>互动 Top 20 Top posts</h3>",
        _bar_chart(charts, "label", "engagement", "互动 Engagement"),
        _table(["帖子 Post", "账号 Account", "类型 Type", "文案 Caption", "点赞 Likes", "评论 Comments", "播放 Views", "互动率 ER"], post_rows) if post_rows else "<p>没有可比较的互动数。</p>",
        "<h2>话题趋势与贡献度 Hashtag trends and contribution</h2>",
        "<h3>话题趋势 Trends (last 4 weeks)</h3>",
        _table(["话题 Hashtag", "帖子 Posts", "近 7 天", "前 7 天", "增速 Growth", "账号数 Accounts", "活跃周 Active weeks", "判定 Label"], trend_rows) if trend_rows else "<p>最近 4 周的帖子没有话题。</p>",
        "<h3>话题贡献度 Hashtag contribution index</h3>",
        _bar_chart([row for row in data["contributions"] if row["posts"] >= 2], "hashtag", "contribution_index", "贡献度（至少 2 帖）Contribution index, 2+ posts"),
        _table(["账号 Account", "话题 Hashtag", "帖子 Posts", "带话题平均互动 Mean with tag", "账号平均互动 Account mean", "贡献度 Index"], contribution_rows) if contribution_rows else "<p>没有可计算的话题贡献度。</p>",
        "<h2>竞品对标 Peer benchmark</h2>",
        _table(["账号 Account", "角色 Role", "互动率 ER", "同类中位数 Peer ER", "互动指数 Index", "周发帖 Posts/wk", "同类中位数 Peer", "发帖指数 Index"], benchmark_rows),
        "<h2>建议 Recommendations</h2><ul>",
        "".join(f"<li>{html.escape(line)}</li>" for line in data["recommendations"]),
        "</ul>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>互动率 ER = (点赞 + 评论 + 保存 + 分享) ÷ 粉丝数；帖子带 reach 时分母改用 reach。公开数据不含保存、分享和 reach，所以本报告实际为 (点赞 + 评论) ÷ 粉丝数，低于含全部互动的口径。缺少计数时记为「—」，不按 0 计算。</li>",
        "<li>Modash ER = 近 60 天帖子点赞中位数 ÷ 粉丝数。</li>",
        "<li>周发帖 = 样本首尾时间跨度内的发帖频率，置顶帖会拉长跨度。</li>",
        "<li>话题贡献度 = 带该话题帖子的平均互动 ÷ 账号平均互动；帖子少时波动大。</li>",
        "<li>话题判定：4 周内至少 3 帖且至少 3 周活跃为长期趋势，少于 3 周活跃为短期热点，不足 3 帖为样本不足。</li>",
        "<li>对标 = 账号指标 ÷ 其余账号的中位数。增长 = 本次与 --state 快照的差值，只比较两次运行。</li>",
        "<li>来源区分：Business Discovery 为官方数据，只含 Business 和 Creator 账号；instaloader 为匿名公开采集，存在服务条款风险，可能随时失效。账号健康度表逐行列出来源。两种来源的账号对比时口径基本一致，但数据完整度不同。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{html.escape(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


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
    """Write the workbook: accounts, posts, topic_series, topics, benchmarks, formats, posting_heatmap, hashtag_contribution, growth, and run sheets."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    percent = workbook.add_format({"num_format": "0.00%"})
    number = workbook.add_format({"num_format": "#,##0"})
    decimal = workbook.add_format({"num_format": "#,##0.0"})

    _write_rows(workbook, "accounts", [
        ("username", None), ("name", None), ("role", None), ("followers", number), ("following", number), ("media_count", number),
        ("posts_sampled", number), ("median_engagement_rate", percent), ("modash_rate", percent), ("posts_per_week", decimal),
        ("reel_share", percent), ("median_likes", decimal), ("median_comments", decimal), ("median_views", decimal), ("last_post", None), ("source", None),
    ], data["accounts"], bold)
    posts = [{**post, "hashtags": " ".join(f"#{tag}" for tag in post.get("hashtags", []))} for post in data["posts"]]
    _write_rows(workbook, "posts", [
        ("id", None), ("owner", None), ("kind", None), ("published_at", None), ("likes", number), ("comments", number), ("views", number),
        ("engagement", number), ("engagement_rate", percent), ("hashtags", None), ("caption", None), ("url", None), ("source", None),
    ], posts, bold)
    _write_rows(workbook, "topic_series", [("hashtag", None), ("week_start", None), ("posts", number)], data["series"], bold)
    _write_rows(workbook, "topics", [
        ("hashtag", None), ("posts", number), ("last_7d", number), ("prior_7d", number), ("growth", percent),
        ("accounts", number), ("active_weeks", number), ("label", None),
    ], data["trends"], bold)
    _write_rows(workbook, "benchmarks", [
        ("username", None), ("role", None), ("followers", number), ("median_engagement_rate", percent), ("modash_rate", percent),
        ("peer_median_engagement_rate", percent), ("engagement_index", decimal), ("posts_per_week", decimal),
        ("peer_median_posts_per_week", decimal), ("cadence_index", decimal),
    ], data["benchmarks"], bold)
    _write_rows(workbook, "formats", [
        ("kind", None), ("posts", number), ("share", percent), ("median_likes", decimal), ("median_comments", decimal),
        ("median_views", decimal), ("median_engagement", decimal), ("median_engagement_rate", percent),
    ], data["formats"], bold)
    _write_rows(workbook, "posting_heatmap", [("weekday", None), ("hour", number), ("posts", number), ("median_engagement_rate", percent)], data["heatmap"], bold)
    _write_rows(workbook, "hashtag_contribution", [
        ("account", None), ("hashtag", None), ("posts", number), ("mean_engagement", decimal),
        ("account_mean_engagement", decimal), ("contribution_index", decimal),
    ], data["contributions"], bold)
    _write_rows(workbook, "growth", [
        ("username", None), ("previous_at", None), ("days", decimal), ("followers_before", number), ("followers_after", number),
        ("followers_delta", number), ("followers_growth", percent), ("followers_per_day", decimal), ("media_delta", number),
    ], data["growth"], bold)

    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("api_calls", "" if context.get("api_calls") is None else str(context["api_calls"])),
        ("heatmap_timezone", f"UTC{context['utc_offset']:+g}"),
        ("state_file", context.get("state_path") or ""),
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
