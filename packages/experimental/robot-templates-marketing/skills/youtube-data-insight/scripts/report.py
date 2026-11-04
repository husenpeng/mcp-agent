"""Write the HTML report and the xlsx workbook for one YouTube insight run.

The HTML file is self-contained: inline CSS and an inline SVG bar chart, no
scripts or network assets, so it opens offline. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime
from typing import Optional

from metrics import network_summary


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


def write_html(path: str, title: str, videos: list, context: dict) -> None:
    """Write the HTML report.

    context keys: query (str), generated_at (datetime), sources (list of str),
    gaps (list of str), api_units (int or None).
    """
    generated: datetime = context["generated_at"]
    with_views = [video for video in videos if video.get("views") is not None]
    total_views = sum(video["views"] for video in with_views)
    rates = sorted(video["engagement_rate"] for video in videos if video.get("engagement_rate") is not None)
    median_rate: Optional[float] = rates[len(rates) // 2] if rates else None
    outliers = sorted((video for video in videos if (video.get("outlier_score") or 0) >= 3), key=lambda video: -video["outlier_score"])
    networks = network_summary(videos)
    channels = len({video.get("channel_id") for video in videos if video.get("channel_id")})

    def video_rows(items: list) -> str:
        return "".join(
            "<tr>"
            f'<td><a href="{html.escape(video.get("url") or "")}">{html.escape(video.get("title") or video["id"])}</a></td>'
            f'<td>{html.escape(video.get("channel_title") or "")}</td>'
            f'<td class="n">{_fmt(video.get("views"))}</td>'
            f'<td class="n">{_fmt(video.get("engagement_rate"), 2, percent=True)}</td>'
            f'<td class="n">{_fmt(video.get("views_per_hour"), 1)}</td>'
            f'<td class="n">{_fmt(video.get("outlier_score"), 1)}</td>'
            "</tr>"
            for video in items
        )

    header = "<tr><th>视频 Video</th><th>频道 Channel</th><th>播放 Views</th><th>互动率 ER</th><th>VPH</th><th>Outlier</th></tr>"
    top = sorted(with_views, key=lambda video: -video["views"])[:20]
    gaps = context.get("gaps") or []
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">查询 Query: {html.escape(context["query"])} · 生成时间 Generated: {generated.isoformat(timespec="minutes")} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}'
        + ("" if context.get("api_units") is None else f' · API units: {context["api_units"]}')
        + "</p>",
        "<h2>摘要 Summary</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(videos)}</b><span>视频 Videos</span></div>",
        f"<div class=\"kpi\"><b>{channels}</b><span>频道 Channels</span></div>",
        f"<div class=\"kpi\"><b>{_fmt(total_views)}</b><span>总播放 Total views</span></div>",
        f"<div class=\"kpi\"><b>{_fmt(median_rate, 2, percent=True)}</b><span>互动率中位数 Median ER</span></div>",
        f"<div class=\"kpi\"><b>{len(outliers)}</b><span>爆款（Outlier ≥ 3）</span></div>",
        "</div>",
        "<h2>播放 Top 20 Top videos by views</h2>",
        _bar_chart(top, "title", "views", "播放量 Views"),
        f"<table>{header}{video_rows(top)}</table>",
        "<h2>爆款视频 Outlier videos</h2>",
        "<p>Outlier = 播放 ÷ 同频道最近 30 个视频播放中位数；≥ 3 视为爆款。</p>",
        f"<table>{header}{video_rows(outliers[:20])}</table>" if outliers else "<p>没有 Outlier ≥ 3 的视频。</p>",
        "<h2>联盟链接与渠道 Affiliate links</h2>",
        (
            "<table><tr><th>网络 Network</th><th>含该链接的视频 Videos</th><th>链接数 Links</th></tr>"
            + "".join(f"<tr><td>{html.escape(name)}</td><td class=\"n\">{count}</td><td class=\"n\">{links}</td></tr>" for name, count, links in networks)
            + "</table>"
        ) if networks else "<p>描述中没有识别到电商或联盟链接（列表模式不含完整描述时，此处为空）。</p>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>互动率 ER = (点赞 + 评论) ÷ 播放；缺少计数时记为「—」，不按 0 计算。</li>",
        "<li>VPH = 播放 ÷ 发布至今小时数（下限 1 小时）。</li>",
        "<li>Outlier = 播放 ÷ 同频道最近 30 个视频播放中位数；样本中同频道视频越少，基线越不稳。</li>",
        "<li>联盟链接按域名归类；Amazon 链接的 tag 参数记为 associate tag。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{html.escape(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


def write_xlsx(path: str, videos: list, context: dict) -> None:
    """Write the workbook: videos, affiliate_links, networks, and run sheets."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    percent = workbook.add_format({"num_format": "0.00%"})
    number = workbook.add_format({"num_format": "#,##0"})
    decimal = workbook.add_format({"num_format": "#,##0.0"})

    sheet = workbook.add_worksheet("videos")
    columns = [
        ("id", None), ("title", None), ("channel_title", None), ("channel_id", None), ("published_at", None),
        ("duration_seconds", number), ("views", number), ("likes", number), ("comments", number),
        ("engagement_rate", percent), ("views_per_hour", decimal), ("outlier_score", decimal), ("url", None), ("source", None),
    ]
    for col, (name, _) in enumerate(columns):
        sheet.write(0, col, name, bold)
    for row, video in enumerate(videos, start=1):
        for col, (name, fmt) in enumerate(columns):
            value = video.get(name)
            if value is None:
                sheet.write_blank(row, col, None)
            elif fmt is None:
                sheet.write_string(row, col, str(value))
            else:
                sheet.write_number(row, col, value, fmt)
    sheet.autofilter(0, 0, max(len(videos), 1), len(columns) - 1)
    sheet.freeze_panes(1, 0)
    sheet.set_column(1, 1, 48)

    links = workbook.add_worksheet("affiliate_links")
    for col, name in enumerate(["video_id", "network", "host", "affiliate_tag", "url"]):
        links.write(0, col, name, bold)
    row = 1
    for video in videos:
        for link in video.get("affiliate_links", []):
            for col, value in enumerate([video["id"], link["network"], link["host"], link["affiliate_tag"] or "", link["url"]]):
                links.write_string(row, col, value)
            row += 1

    networks = workbook.add_worksheet("networks")
    for col, name in enumerate(["network", "videos", "links"]):
        networks.write(0, col, name, bold)
    for row, (name, count, total) in enumerate(network_summary(videos), start=1):
        networks.write_string(row, 0, name)
        networks.write_number(row, 1, count)
        networks.write_number(row, 2, total)

    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("api_units", "" if context.get("api_units") is None else str(context["api_units"])),
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
