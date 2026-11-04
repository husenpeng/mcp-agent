"""Write the HTML report and the xlsx workbook for one creative-intelligence run.

The HTML file is self-contained: inline CSS and an inline SVG bar chart, no
scripts, images, or network assets (snapshots are links, never embedded).
Every value is HTML-escaped.
"""

from __future__ import annotations

import html
from datetime import datetime

from collect import COMMERCIAL_COVERAGE
from metrics import CTA_RULES, HEAT_WEIGHTS, HOOK_RULES, JACCARD_THRESHOLD, distribution, market_rows, selling_terms, weekly_intensity

COVERAGE_NOTE = (
    "Meta 广告库 API 只对欧盟成员国和英国返回商业广告；其他国家只返回政治与议题广告，投放金额与曝光区间只对政治广告提供。"
    "The Meta Ad Library API returns commercial ads only for ads delivered in the EU and the UK; elsewhere it returns political and issue ads only."
)


def _fmt(value, digits: int = 0, percent: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:.{max(digits, 1)}f}%"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def _e(value, digits: int = 0, percent: bool = False) -> str:
    return html.escape(_fmt(value, digits, percent))


def _bar_chart(data: list, title: str) -> str:
    """Return an inline horizontal SVG bar chart for (label, value) pairs, in the given order, at most 16."""
    data = [(str(label), value) for label, value in data if value][:16]
    if not data:
        return ""
    top = max(value for _, value in data)
    bar_height, gap, label_width, width = 22, 6, 240, 760
    height = len(data) * (bar_height + gap)
    bars = []
    for index, (label, value) in enumerate(data):
        y = index * (bar_height + gap)
        length = max(2, (width - label_width - 70) * value / top)
        short = label if len(label) <= 34 else label[:33] + "…"
        bars.append(
            f'<text x="{label_width - 8}" y="{y + 15}" text-anchor="end">{html.escape(short)}</text>'
            f'<rect x="{label_width}" y="{y}" width="{length:.1f}" height="{bar_height}" rx="3"></rect>'
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{html.escape(_fmt(value))}</text>'
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
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.card{background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}
.draft{border:2px dashed #bf8700;background:#fffdf3}
.draft b.tag{color:#9a6700}
code{font-size:12px;background:#f0f3f6;padding:0 3px;border-radius:4px}
ul{margin:4px 0}
"""


def _table(header: list, rows: list) -> str:
    head = "".join(f"<th>{html.escape(name)}</th>" for name in header)
    return f"<table><tr>{head}</tr>{''.join(rows)}</table>"


def _dist_table(title: str, rows: list) -> str:
    return _table([title, "广告数 Ads", "占比 Share"], [
        f"<tr><td>{html.escape(str(name))}</td><td class=\"n\">{count}</td><td class=\"n\">{_e(share, 1, percent=True)}</td></tr>" for name, count, share in rows
    ])


def write_html(path: str, title: str, ads: list, clusters: list, context: dict) -> None:
    """Write the HTML report.

    context keys: query (str), generated_at (datetime), sources, gaps,
    countries (list), landing_pages (list), briefs (list), requests (int or None).
    """
    generated: datetime = context["generated_at"]
    gaps = context.get("gaps") or []
    countries = context.get("countries") or []
    uncovered = [country for country in countries if country not in COMMERCIAL_COVERAGE]
    pages = distribution([ad.get("page_name") or ad.get("page_id") for ad in ads])
    days = sorted(ad["days_running"] for ad in ads if ad["days_running"] is not None)
    long_running = [cluster for cluster in clusters if (cluster["max_days"] or 0) >= 30]
    weekly = weekly_intensity(ads)
    week_totals: dict = {}
    for week, _, count in weekly:
        week_totals[week] = week_totals.get(week, 0) + count

    page_rows = []
    for name, count, _ in pages:
        items = [ad for ad in ads if (ad.get("page_name") or ad.get("page_id")) == name]
        item_days = sorted(ad["days_running"] for ad in items if ad["days_running"] is not None)
        page_rows.append(
            f"<tr><td>{html.escape(str(name))}</td><td class=\"n\">{count}</td><td class=\"n\">{sum(1 for ad in items if ad['active'])}</td>"
            f"<td class=\"n\">{_e(item_days[len(item_days) // 2] if item_days else None)}</td><td class=\"n\">{len({ad['cluster'] for ad in items})}</td>"
            f"<td>{html.escape(', '.join(sorted({p for ad in items for p in ad['platforms']})))}</td></tr>"
        )

    gallery = []
    for cluster in clusters[:12]:
        snapshot = cluster.get("snapshot_url")
        link = f'<a href="{html.escape(snapshot)}">广告快照 Ad snapshot</a>' if snapshot else "无快照链接 No snapshot URL"
        gallery.append(
            f"<div class=\"card\"><b>#{cluster['rank']} · {html.escape(', '.join(cluster['pages']))}</b>"
            f"<p class=\"meta\">投放 {_e(cluster['max_days'])} 天 days · 变体 {cluster['variants']} variants · 在投 {cluster['active']} active · hook {html.escape(str(cluster['hook']))}</p>"
            f"<p>“{html.escape(cluster['hook_text'] or cluster['copy'] or '')}”</p><p>{link}（首帧见快照，未下载媒体 First frame: open the snapshot; media not downloaded）</p></div>"
        )

    hook_dist = distribution([ad["hook"] for ad in ads])
    cluster_rows = [
        f"<tr><td class=\"n\">{cluster['rank']}</td><td>{html.escape(', '.join(cluster['pages']))}</td><td class=\"n\">{cluster['variants']}</td>"
        f"<td class=\"n\">{_e(cluster['max_days'])}</td><td class=\"n\">{_e(cluster['heat'], 2)}</td><td>{html.escape(str(cluster['hook']))}</td>"
        f"<td>{html.escape(cluster['cta'] or '—')}</td><td>{html.escape(cluster['hook_text'] or '')}</td></tr>"
        for cluster in clusters[:30]
    ]
    landing = context.get("landing_pages") or []
    landing_rows = [
        f"<tr><td><a href=\"{html.escape(page['url'])}\">{html.escape(page['domain'])}</a></td><td>{html.escape(page.get('title') or page.get('og_title') or '—')}</td>"
        f"<td>{html.escape(page.get('headline') or '—')}</td><td>{html.escape((page.get('description') or page.get('og_description') or '')[:240])}</td>"
        f"<td>{html.escape(', '.join(page.get('prices') or []) or '—')}</td><td>{html.escape(', '.join(page.get('offers') or []) or '—')}</td>"
        f"<td>{html.escape(' · '.join((page.get('ctas') or [])[:8]) or '—')}</td><td class=\"n\">{len(page.get('text') or '')}</td></tr>"
        for page in landing
    ]
    markets = market_rows(ads)
    market_html = [
        f"<tr><td>{html.escape(row['country'])}</td><td>{'商业+政治 commercial + political' if row['country'] in COMMERCIAL_COVERAGE else '仅政治与议题 political/issue only'}</td>"
        f"<td class=\"n\">{row['ads']}</td><td class=\"n\">{_e(row['median_days'])}</td><td>{html.escape(row['top_hook'] or '—')}</td><td>{html.escape(row['top_cta'] or '—')}</td><td>{html.escape(row['languages'] or '—')}</td></tr>"
        for row in markets
    ]
    briefs = context.get("briefs") or []
    brief_html = [
        f"<div class=\"card draft\"><b class=\"tag\">草稿 DRAFT — 待模型完善 for the model to refine</b><h3>{html.escape(brief['title'])}</h3><ul>"
        f"<li>借鉴素材 Source: cluster #{html.escape(str(brief['source_cluster']))}, ads {html.escape(', '.join(brief['source_ads']))} ({html.escape(', '.join(brief['pages']))})</li>"
        f"<li>证据 Evidence: {html.escape(brief['evidence'])}</li>"
        f"<li>参考 hook: “{html.escape(brief['hook_reference'] or '')}”</li>"
        f"<li>角度 Angle: {html.escape(brief['angle'])}</li>"
        f"<li>测试 Test: {html.escape(brief['test'])}</li>"
        "<li>待补充 To fill: 目标人群 audience · 核心卖点 key benefit · 分镜 shot list · 版本 variants</li></ul></div>"
        for brief in briefs
    ]
    terms = selling_terms(ads)
    parts = [
        f"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>{html.escape(title)}</title><style>{_CSS}</style></head><body><main>",
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="meta">查询 Query: {html.escape(context["query"])} · 国家 Countries: {html.escape(", ".join(countries) or "—")} · 生成时间 Generated: {html.escape(generated.isoformat(timespec="minutes"))} · '
        f'数据来源 Sources: {html.escape(", ".join(context.get("sources") or []))}'
        + ("" if context.get("requests") is None else f" · API requests: {html.escape(str(context['requests']))}")
        + "</p>",
        "<h2>执行摘要 Executive summary</h2><div class=\"kpis\">",
        f"<div class=\"kpi\"><b>{len(ads)}</b><span>广告 Ads</span></div>",
        f"<div class=\"kpi\"><b>{len(pages)}</b><span>主页 Pages</span></div>",
        f"<div class=\"kpi\"><b>{len(clusters)}</b><span>文案簇 Copy clusters</span></div>",
        f"<div class=\"kpi\"><b>{len(long_running)}</b><span>长投簇（≥ 30 天）Long-running</span></div>",
        f"<div class=\"kpi\"><b>{_e(days[len(days) // 2] if days else None)}</b><span>投放天数中位数 Median days</span></div>",
        f"<div class=\"kpi\"><b>{html.escape(hook_dist[0][0] if hook_dist else '—')}</b><span>最常见 hook Top hook</span></div>",
        "</div>",
        f"<p class=\"gap\">{html.escape(COVERAGE_NOTE)}"
        + (f" 本次以下国家只含政治与议题广告 Political/issue only here: {html.escape(', '.join(uncovered))}." if uncovered else "")
        + "</p>",
        "<h2>竞品投放概况 Competitor activity</h2>",
        _table(["主页 Page", "广告 Ads", "在投 Active", "投放天数中位数 Median days", "文案簇 Clusters", "版位 Platforms"], page_rows),
        _bar_chart(sorted(week_totals.items()), "每周新上广告 New ads per week (by delivery start)"),
        _table(["周（周一）Week", "主页 Page", "新广告 New ads"], [f"<tr><td>{html.escape(w)}</td><td>{html.escape(str(p))}</td><td class=\"n\">{c}</td></tr>" for w, p, c in weekly[-40:]]),
        "<h2>长投素材画廊 Long-running creatives</h2>",
        "<p>按热度分排序（投放天数与变体数的加权 z-score）；每张卡片给出 hook 文案和广告快照链接。</p>",
        f"<div class=\"cards\">{''.join(gallery)}</div>",
        "<h2>hook 与形式拆解 Hooks and formats</h2>",
        _bar_chart([(name, count) for name, count, _ in hook_dist], "hook 类型 Hook type (first sentence)"),
        _dist_table("hook 类型 Hook", hook_dist),
        _dist_table("形式（字段推断）Format proxy", distribution([ad["format"] for ad in ads])),
        _dist_table("版位 Publisher platform", distribution([platform for ad in ads for platform in ad["platforms"]] or [None])),
        _table(["排名 Rank", "主页 Pages", "变体 Variants", "最长天数 Max days", "热度 Heat", "Hook", "CTA", "Hook 文案"], cluster_rows),
        "<h2>卖点与 CTA Selling points and CTAs</h2>",
        _dist_table("CTA", distribution([ad["cta"] for ad in ads])),
        _table(["高频短语 Frequent phrase", "广告数 Ads"], [f"<tr><td>{html.escape(term)}</td><td class=\"n\">{count}</td></tr>" for term, count in terms]) if terms else "<p>文案中没有重复出现的短语。</p>",
        "<h2>落地页对比 Landing pages</h2>",
        _table(["域名 Domain", "标题 Title", "主标题 Headline (h1/h2)", "描述 Description", "价格 Prices", "Offer 信号", "CTA 文案 CTA texts", "正文字符 Text chars"], landing_rows) if landing_rows else "<p>未抓取落地页（未加 --landing-pages，或文案中没有可识别的域名）。</p>",
        "<h2>市场差异 Market differences</h2>",
        _table(["国家 Country", "API 覆盖 Coverage", "广告 Ads", "投放天数中位数 Median days", "Top hook", "Top CTA", "语言 Languages"], market_html),
        "<h2>创意 brief 与测试建议 Creative briefs</h2>",
        "<p>以下 brief 是按规则生成的模板草稿，需由模型结合品牌信息改写后再使用。These are rule-generated DRAFT stubs.</p>",
        f"<div class=\"cards\">{''.join(brief_html)}</div>",
        "<h2>方法与口径 Method</h2><ul>",
        "<li>投放天数 = (ad_delivery_stop_time 或今天) − ad_delivery_start_time。</li>",
        f"<li>变体簇：首条文案（无文案时用链接标题）小写、去链接与标点后取 3 词 shingle（中日韩文字取 4 字符），Jaccard ≥ {JACCARD_THRESHOLD} 即单链接合并。</li>",
        f"<li>热度分 = {HEAT_WEIGHTS['days_running']} × z(最长投放天数) + {HEAT_WEIGHTS['variants']} × z(变体数)；竞品素材没有互动数据，故不含互动率。</li>",
        "<li>每周新上广告 = 按投放开始日所在 ISO 周（周一）计数。</li>",
        "<li>hook 规则（按优先级取第一条命中的为主标签，全部命中写入 creative_tags）：" + "".join(f"<br><code>{html.escape(name)}</code>: <code>{html.escape(pattern)}</code>" for name, pattern in HOOK_RULES) + "<br>都不命中记为 <code>statement</code>。</li>",
        "<li>CTA 规则（在文案与链接标题中找，第一条命中为准）：" + html.escape("; ".join(name for name, _ in CTA_RULES)) + "。API 不返回 CTA 按钮类型，未命中记为 not detected。</li>",
        "<li>形式是由返回字段推断的代理：多条文案或标题 = 多版本（轮播或动态创意）；API 不返回素材类型，未下载图片或视频。</li>",
        "<li>落地页：用标准库 urllib 抓取链接域名首页（只读 HTML，不执行脚本），html.parser 提取 title、meta description、og:title / og:description、首个 h1 / h2、可见正文、价格字符串（$ € £ ¥ ₹ 円 元 及 ISO 币种代码）、按钮与 CTA 链接文案；依赖脚本渲染的页面正文为空。</li>",
        "</ul>",
        "<h2>数据局限与服务条款 Limitations and terms</h2><ul>",
        f"<li>{html.escape(COVERAGE_NOTE)}</li>",
        "<li>只使用官方 Ad Library API 与公开落地页，未登录、未抓取 Ad Library 网页、未下载媒体；使用数据须遵守 Meta Ad Library API 条款。</li>",
        "<li>Hook rate、Hold rate 需要投放方一手数据，竞品素材只能用投放天数和变体数作代理。</li>",
        "</ul>",
        "<h2>数据缺口 Data gaps</h2>",
        ("<div class=\"gap\"><ul>" + "".join(f"<li>{html.escape(gap)}</li>" for gap in gaps) + "</ul></div>") if gaps else "<p>无。</p>",
        "</main></body></html>",
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(parts))


def write_xlsx(path: str, ads: list, clusters: list, context: dict) -> None:
    """Write the workbook: ads, creative_tags, clusters, landing_pages, frames_index, briefs, run."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    formats = {"int": workbook.add_format({"num_format": "#,##0"}), "dec": workbook.add_format({"num_format": "0.00"})}

    def sheet(name: str, columns: list, rows: list) -> None:
        worksheet = workbook.add_worksheet(name)
        for col, (header, _) in enumerate(columns):
            worksheet.write(0, col, header, bold)
        for row_index, row in enumerate(rows, start=1):
            for col, (header, kind) in enumerate(columns):
                value = row.get(header)
                if isinstance(value, list):
                    value = ", ".join(str(item) for item in value)
                if value is None or value == "":
                    worksheet.write_blank(row_index, col, None)
                elif kind is None or isinstance(value, (str, bool)):
                    worksheet.write_string(row_index, col, str(value))
                else:
                    worksheet.write_number(row_index, col, value, formats[kind])
        worksheet.freeze_panes(1, 0)
        worksheet.autofilter(0, 0, max(len(rows), 1), len(columns) - 1)

    sheet("ads", [
        ("id", None), ("page_name", None), ("page_id", None), ("start", None), ("stop", None), ("days_running", "int"), ("active", None),
        ("cluster", "int"), ("countries", None), ("platforms", None), ("languages", None), ("body", None), ("link_titles", None), ("snapshot_url", None),
    ], [{**ad, "body": (ad.get("bodies") or [""])[0]} for ad in ads])
    sheet("creative_tags", [
        ("id", None), ("hook", None), ("hook_labels", None), ("hook_text", None), ("cta", None), ("format", None), ("domains", None), ("tagger", None),
    ], [{**ad, "tagger": "rule lexicon v1"} for ad in ads])
    sheet("clusters", [
        ("rank", "int"), ("cluster", "int"), ("pages", None), ("variants", "int"), ("max_days", "int"), ("median_days", "dec"), ("active", "int"),
        ("heat", "dec"), ("hook", None), ("cta", None), ("format", None), ("countries", None), ("lead_id", None), ("hook_text", None), ("ad_ids", None), ("snapshot_url", None),
    ], clusters)
    sheet("landing_pages", [
        ("domain", None), ("url", None), ("title", None), ("description", None), ("og_title", None), ("og_description", None), ("h1", None), ("h2", None),
        ("prices", None), ("offers", None), ("ctas", None), ("text_chars", "int"), ("ads_linking", "int"),
    ], [
        {**page, "text_chars": len(page.get("text") or "")} for page in context.get("landing_pages") or []
    ])
    sheet("frames_index", [("ad_id", None), ("cluster", "int"), ("snapshot_url", None), ("frame", None)], [
        {"ad_id": ad["id"], "cluster": ad["cluster"], "snapshot_url": ad.get("snapshot_url"), "frame": "not extracted (media download disabled)"} for ad in ads
    ])
    sheet("briefs", [("title", None), ("source_cluster", "int"), ("source_ads", None), ("pages", None), ("evidence", None), ("hook_reference", None), ("angle", None), ("test", None), ("status", None)], [
        {**brief, "status": "DRAFT — refine before use"} for brief in context.get("briefs") or []
    ])
    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("countries", ", ".join(context.get("countries") or [])),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("api_requests", "" if context.get("requests") is None else str(context["requests"])),
        ("coverage", COVERAGE_NOTE),
        ("cluster_threshold", f"shingle Jaccard >= {JACCARD_THRESHOLD}"),
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
