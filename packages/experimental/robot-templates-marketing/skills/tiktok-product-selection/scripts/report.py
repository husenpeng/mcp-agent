"""Write the HTML report and the xlsx workbook for one TikTok product-selection run.

The HTML file is self-contained: inline CSS and inline SVG charts, no scripts
or network assets. Every value is HTML-escaped.
"""

from __future__ import annotations

import html
import statistics
from datetime import datetime

from metrics import competition

STATUS_LABEL = {"validated": "已验证 validated", "watch": "待观察 watch", "rejected": "淘汰 rejected"}


def _e(value) -> str:
    return html.escape(str(value), quote=True)


def _fmt(value, digits: int = 0, percent: bool = False, money: bool = False) -> str:
    if value is None:
        return "—"
    if percent:
        return f"{value * 100:.{max(digits, 1)}f}%"
    if money:
        return f"${value:,.2f}"
    if isinstance(value, float):
        return f"{value:,.{digits}f}"
    return f"{value:,}" if isinstance(value, int) else str(value)


def _bar_chart(data: list, title: str, money: bool = False) -> str:
    """Return an inline horizontal SVG bar chart for (label, value) pairs with positive values."""
    data = sorted(((label, value) for label, value in data if value), key=lambda item: -item[1])[:10]
    if not data:
        return ""
    top = data[0][1]
    bar, gap, label_width, width = 22, 6, 300, 760
    bars = []
    for index, (label, value) in enumerate(data):
        y = index * (bar + gap)
        length = max(2, (width - label_width - 110) * value / top)
        short = label if len(label) <= 40 else label[:39] + "…"
        bars.append(
            f'<text x="{label_width - 8}" y="{y + 15}" text-anchor="end">{_e(short)}</text>'
            f'<rect x="{label_width}" y="{y}" width="{length:.1f}" height="{bar}" rx="3"></rect>'
            f'<text x="{label_width + length + 6:.1f}" y="{y + 15}">{_e(_fmt(value, 1, money=money))}</text>'
        )
    height = len(data) * (bar + gap)
    return f'<figure><figcaption>{_e(title)}</figcaption><svg viewBox="0 0 {width} {height}" role="img" aria-label="{_e(title)}">{"".join(bars)}</svg></figure>'


def _line_chart(points: list, title: str) -> str:
    """Return an inline SVG polyline for (label, value) points; empty with fewer than two."""
    points = [(label, value) for label, value in points if value is not None]
    if len(points) < 2:
        return f'<p class="muted">{_e(title)}：需要至少两个区间 needs two intervals.</p>'
    width, height, pad = 360, 120, 24
    top = max(value for _, value in points) or 1
    step = (width - 2 * pad) / (len(points) - 1)
    coords = " ".join(f"{pad + i * step:.1f},{height - pad - (height - 2 * pad) * value / top:.1f}" for i, (_, value) in enumerate(points))
    return (
        f'<svg class="line" viewBox="0 0 {width} {height}" role="img" aria-label="{_e(title)}"><polyline points="{coords}"></polyline>'
        f'<text x="{pad}" y="{height - 4}">{_e(points[0][0][:10])}</text><text x="{width - pad}" y="{height - 4}" text-anchor="end">{_e(points[-1][0][:10])}</text>'
        f'<text x="{pad}" y="14">{_e(_fmt(top, 0, money=True))}/日 max</text></svg>'
    )


def _waterfall(unit: dict) -> str:
    """Return an inline SVG waterfall from price to net for one margin model."""
    if not unit:
        return '<p class="muted">无价格，无法测算利润 no price.</p>'
    steps = [("Price 售价", unit["price"], "base")] + [(label, -amount, "cost") for label, amount in unit["lines"]] + [("Net 净利", unit["net"], "net")]
    width, row, label_width = 360, 18, 170
    scale = (width - label_width - 60) / max(unit["price"], 1e-9)
    parts, running = [], 0.0
    for index, (label, amount, kind) in enumerate(steps):
        y = index * (row + 4)
        if kind == "base":
            start, end, running = 0.0, amount, amount
        elif kind == "cost":
            start, end = running + amount, running
            running += amount
        else:
            start, end = min(0.0, amount), max(0.0, amount)
        x = label_width + max(start, 0) * scale
        length = max(1.5, abs(end - start) * scale)
        parts.append(
            f'<text x="{label_width - 6}" y="{y + 13}" text-anchor="end">{_e(label)}</text>'
            f'<rect class="{kind}" x="{x:.1f}" y="{y}" width="{length:.1f}" height="{row}"></rect>'
            f'<text x="{x + length + 4:.1f}" y="{y + 13}">{_e(_fmt(amount, money=True))}</text>'
        )
    height = len(steps) * (row + 4)
    return f'<svg class="wf" viewBox="0 0 {width} {height}" role="img" aria-label="利润瀑布 margin waterfall">{"".join(parts)}</svg>'


_CSS = """
body{font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;margin:0;color:#1f2328;background:#f6f8fa}
main{max-width:1100px;margin:0 auto;padding:32px 24px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 12px;border-bottom:1px solid #d0d7de;padding-bottom:6px}h3{font-size:15px;margin:0 0 6px}
.meta,.muted{color:#59636e;font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-top:16px}
.kpi{background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}.kpi b{display:block;font-size:20px}.kpi span{color:#59636e;font-size:12px}
table{width:100%;border-collapse:collapse;background:#fff;font-size:13px}
th,td{border:1px solid #d0d7de;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f0f3f6}td.n{text-align:right;white-space:nowrap}
figure{margin:12px 0;background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}
figcaption{font-weight:600;margin-bottom:8px}svg{width:100%;height:auto;font-size:11px}svg rect{fill:#2f81f7}
svg rect.cost{fill:#cf222e}svg rect.net{fill:#1a7f37}svg rect.base{fill:#2f81f7}
svg.line polyline{fill:none;stroke:#2f81f7;stroke-width:2}svg.line,svg.wf{max-width:360px}
.gap,.notice{background:#fff8c5;border:1px solid #d4a72c;border-radius:10px;padding:8px 12px}
.quad{display:grid;grid-template-columns:1fr 1fr;gap:12px}.quad div{background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:10px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}
.card{background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:12px}
.validated{color:#1a7f37;font-weight:600}.watch{color:#9a6700;font-weight:600}.rejected{color:#cf222e;font-weight:600}
ul{margin:4px 0}
"""


def _quadrant(rows: list) -> str:
    cells = {(True, True): [], (True, False): [], (False, True): [], (False, False): []}
    unknown = []
    for row in rows:
        heat = (row.get("heat") or {}).get("growing")
        trend = row.get("trend")
        if heat is None or trend is None:
            unknown.append(row)
            continue
        cells[(bool(heat), trend["slope_per_week"] > 0)].append(row)

    def names(items):
        return "、".join(_e(item.get("title") or item["product_id"]) for item in items[:12]) or "—"

    return (
        '<div class="quad">'
        f'<div><h3>热度↑ 搜索↑ heat up, search up</h3>{names(cells[(True, True)])}</div>'
        f'<div><h3>热度↑ 搜索↓ heat up, search flat/down</h3>{names(cells[(True, False)])}</div>'
        f'<div><h3>热度↓ 搜索↑ heat flat/down, search up</h3>{names(cells[(False, True)])}</div>'
        f'<div><h3>热度↓ 搜索↓ heat flat/down, search flat/down</h3>{names(cells[(False, False)])}</div>'
        "</div>"
        + (f'<p class="muted">信号不足、未入象限 Not placed (missing heat or trend): {names(unknown)}</p>' if unknown else "")
    )


def _categories(rows: list) -> list:
    groups: dict = {}
    for row in rows:
        groups.setdefault(row.get("category") or "（未标注 unlabeled）", []).append(row)
    result = []
    for name, items in sorted(groups.items()):
        gmv = [item["latest_daily_gmv"] for item in items if item.get("latest_daily_gmv") is not None]
        prices = [item["price"] for item in items if item.get("price") is not None]
        result.append({
            "category": name, "products": len(items), "daily_gmv": sum(gmv) if gmv else None,
            "median_price": statistics.median(prices) if prices else None,
            "validated": sum(item["status"] == "validated" for item in items),
        })
    return result


def write_html(path: str, title: str, rows: list, videos: list, context: dict) -> None:
    """Write the HTML report.

    context keys: query (str), generated_at (datetime), sources, gaps (lists of str),
    assumptions (dict), first_run (bool), top (int), hashtag_videos (dict).
    """
    generated: datetime = context["generated_at"]
    gaps = context.get("gaps") or []
    assumptions = context["assumptions"]
    top = rows[: context.get("top", 10)]
    counts = {status: sum(row["status"] == status for row in rows) for status in STATUS_LABEL}
    total_gmv = [row["latest_daily_gmv"] for row in rows if row.get("latest_daily_gmv") is not None]
    header = "<tr><th>#</th><th>商品 Product</th><th>价格 Price</th><th>累计已售 Sold</th><th>日销量 Daily sold（估）</th><th>日 GMV（估）</th><th>净利率 Net margin（估）</th><th>机会分 Score</th><th>判定 Status</th></tr>"
    product_rows = "".join(
        "<tr>"
        f'<td class="n">{index}</td><td>{_e(row.get("title") or row["product_id"])}<br><span class="muted">{_e(row["product_id"])} · {_e(row.get("keyword") or "—")}</span></td>'
        f'<td class="n">{_fmt(row.get("price"), money=True)}</td><td class="n">{_fmt(row.get("sold_count"))}</td>'
        f'<td class="n">{_fmt(row.get("latest_daily_sold"), 1)}</td><td class="n">{_fmt(row.get("latest_daily_gmv"), money=True)}</td>'
        f'<td class="n">{_fmt((row.get("margin") or {}).get("net_rate"), 1, percent=True)}</td><td class="n">{_fmt(row.get("score"), 1)}</td>'
        f'<td class="{_e(row["status"])}">{_e(STATUS_LABEL[row["status"]])}</td></tr>'
        for index, row in enumerate(top, start=1)
    )
    category_table = "".join(
        f'<tr><td>{_e(item["category"])}</td><td class="n">{item["products"]}</td><td class="n">{_fmt(item["daily_gmv"], money=True)}</td>'
        f'<td class="n">{_fmt(item["median_price"], money=True)}</td><td class="n">{item["validated"]}</td></tr>'
        for item in _categories(rows)
    )
    cards = []
    for row in top:
        heat = row.get("heat") or {}
        trend = row.get("trend")
        gmv_points = [(interval["to"], interval["gmv"] / interval["days"] if interval["gmv"] is not None else None) for interval in row["intervals"]]
        cards.append(
            '<div class="card">'
            f'<h3>{_e(row.get("title") or row["product_id"])}</h3>'
            f'<p class="muted">{_e(row["product_id"])} · 快照 snapshots {row["snapshots"]} · <span class="{_e(row["status"])}">{_e(STATUS_LABEL[row["status"]])}</span></p>'
            f'<p><b>日 GMV 曲线（估）Daily GMV (estimate)</b></p>{_line_chart(gmv_points, "日 GMV Daily GMV")}'
            f'<p><b>内容热度 Content heat</b> #{_e(row.get("hashtag") or "—")}：播放 views {_fmt(heat.get("views"))}，'
            f'增速 growth {_fmt(heat.get("rate"), 2, percent=True)}/日（{_e(heat.get("basis") or "无数据 no data")}）；'
            f'搜索趋势 keyword slope {_fmt(trend["slope_per_week"] if trend else None, 2)}/周，p={_fmt(trend["p_value"] if trend else None, 3)}</p>'
            f'<ul>{"".join(f"<li>{_e(reason)}</li>" for reason in row["reasons"])}</ul>'
            f'<p><b>利润瀑布（估）Margin waterfall (estimate)</b> 达人佣金 commission {_fmt((row.get("margin") or {}).get("commission_rate"), 0, percent=True)}</p>{_waterfall(row.get("margin"))}'
            "</div>"
        )
    competition_rows = "".join(
        f'<tr><td>{_e(item["keyword"])}</td><td class="n">{item["products"]}</td><td class="n">{_fmt(item["shops"])}</td>'
        f'<td class="n">{_fmt(item["cr3"], 1, percent=True)}</td><td class="n">{_fmt(item["creators"])}</td></tr>'
        for item in competition(rows, context.get("hashtag_videos") or {})
    )
    risks = [
        "已售数是 TikTok 页面显示值，常被取整（如 1.2K），小幅变动可能看不到；已售数下降的区间按缺失处理。",
        "GMV 为估算：只计已售数变化 × 当前价格，未扣取消、退款，不含运费和折扣；看方向和占比，不看绝对值。",
        "TikTokApi 是非官方接口，需要 Playwright 和 ms_token，随时可能被限流或失效；话题播放是全量累计值，不区分地区。",
        "利润模型的成本项是默认假设，请用卖家后台的真实数字替换 --assumptions。",
    ]
    method = [
        "日销量 = (本次已售 − 上次已售) ÷ 两次快照间隔天数；GMV ≈ 已售增量 × 价格（估算）。",
        f"统计窗口 {assumptions['window_days']} 天；GMV 环比 = 窗口后半段日均 GMV ÷ 前半段 − 1。",
        "内容热度增速：有两次话题快照时 = 话题播放日增量 ÷ 上次播放；只有一次时，用样本视频每日发布量的线性斜率 ÷ 日均发布量作代理。",
        f"关键词趋势：窗口内搜索热度对天数做最小二乘回归，斜率 > 0 且 p < {assumptions['trend_p_threshold']} 视为上升。",
        "双验证：内容热度上升且关键词趋势上升 → 已验证；热度未上升且关键词斜率 ≤ 0 → 淘汰；其余（含信号缺失）→ 待观察。",
        "净利（估）= 售价 − 商品成本 − 平台佣金 − 达人佣金（品类中位数）− 履约 − 分摊广告 − 退货准备金（FastMoss 2026 美区口径）。",
        "机会分 = 各信号（日 GMV、内容热度增速、关键词相对斜率、净利率）在候选商品间 min-max 归一后的加权和 × 100；缺失信号不计，其余权重重新归一。权重：" + ", ".join(f"{k} {v}" for k, v in assumptions["weights"].items()) + "。",
    ]
    parts = [
        f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>{_e(title)}</title><style>{_CSS}</style></head><body><main>',
        f"<h1>{_e(title)}</h1>",
        f'<p class="meta">查询 Query: {_e(context["query"])} · 生成时间 Generated: {_e(generated.isoformat(timespec="minutes"))} · 数据来源 Sources: {_e(", ".join(context.get("sources") or []))}</p>',
        (
            '<p class="notice"><b>首次快照 First snapshot：</b>本次运行只有一次已售数快照，日销量和 GMV 差分需要第二次快照才能计算。'
            "请保留 --state 文件，隔天用同一参数再运行一次。Daily sold and GMV deltas need a second snapshot; keep the --state file and run again tomorrow.</p>"
        ) if context.get("first_run") else "",
        "<h2>结论与 Top N Conclusion and top products</h2><div class=\"kpis\">",
        f'<div class="kpi"><b>{len(rows)}</b><span>候选商品 Candidates</span></div>',
        f'<div class="kpi"><b>{counts["validated"]}</b><span>已验证 Validated</span></div>',
        f'<div class="kpi"><b>{counts["watch"]}</b><span>待观察 Watch</span></div>',
        f'<div class="kpi"><b>{counts["rejected"]}</b><span>淘汰 Rejected</span></div>',
        f'<div class="kpi"><b>{_fmt(sum(total_gmv) if total_gmv else None, money=True)}</b><span>日 GMV 合计（估）Daily GMV (est.)</span></div>',
        f'<div class="kpi"><b>{len(videos)}</b><span>样本视频 Videos</span></div>',
        "</div>",
        _bar_chart([(row.get("title") or row["product_id"], row.get("score")) for row in top], "机会分 Opportunity score"),
        f"<table>{header}{product_rows}</table>",
        "<h2>估算口径声明 Estimation statement</h2>",
        "<p>TikTok 不公开商品销量。本报告的日销量、GMV、利润全部是<b>估算值</b>：基于页面可见的累计已售数在两次快照之间的差值（FastMoss 快照差分法）和默认成本假设。适合比较方向和相对大小，不能当作财务数据。</p>",
        "<h2>品类大盘 Category overview</h2>",
        "<table><tr><th>品类 Category</th><th>商品数 Products</th><th>日 GMV 合计（估）</th><th>价格中位数 Median price</th><th>已验证 Validated</th></tr>" + category_table + "</table>",
        "<h2>双验证四象限 Dual-validation quadrant</h2>",
        _quadrant(rows),
        "<h2>单品卡片 Product cards</h2>",
        f'<div class="cards">{"".join(cards)}</div>',
        "<h2>竞争格局 Competition</h2>",
        "<table><tr><th>关键词 Keyword</th><th>商品数 Products</th><th>店铺数 Shops</th><th>CR3（日 GMV）</th><th>话题内发布达人数 Creators</th></tr>" + competition_rows + "</table>",
        "<h2>风险 Risks</h2><ul>" + "".join(f"<li>{_e(item)}</li>" for item in risks) + "</ul>",
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
            elif isinstance(value, bool) or not isinstance(value, (int, float)):
                sheet.write_string(row, col, str(value))
            else:
                sheet.write_number(row, col, value)
    sheet.freeze_panes(1, 0)
    sheet.autofilter(0, 0, max(len(records), 1), len(columns) - 1)


def write_xlsx(path: str, rows: list, videos: list, trends: dict, histories: dict, context: dict) -> None:
    """Write the workbook: products, videos, search_interest, cost_assumptions, snapshots, competition, and run."""
    import xlsxwriter  # noqa: PLC0415 - bundled runtime dependency

    workbook = xlsxwriter.Workbook(path)
    bold = workbook.add_format({"bold": True, "bg_color": "#F0F3F6"})
    products = [{
        **{key: row.get(key) for key in ("product_id", "title", "category", "shop", "keyword", "hashtag", "price", "sold_count", "captured_at", "snapshots")},
        "needs_second_snapshot": "yes" if row["needs_second_snapshot"] else "no",
        "latest_daily_sold_est": row.get("latest_daily_sold"), "latest_daily_gmv_est": row.get("latest_daily_gmv"),
        "window_sold_est": row.get("window_sold"), "window_gmv_est": row.get("window_gmv"), "gmv_growth": row.get("gmv_growth"),
        "heat_basis": (row.get("heat") or {}).get("basis"), "heat_growth_rate": (row.get("heat") or {}).get("rate"),
        "trend_slope_per_week": (row.get("trend") or {}).get("slope_per_week"), "trend_p_value": (row.get("trend") or {}).get("p_value"),
        "commission_rate": (row.get("margin") or {}).get("commission_rate"), "net_margin_est": (row.get("margin") or {}).get("net"),
        "net_margin_rate_est": (row.get("margin") or {}).get("net_rate"), "score": row.get("score"), "status": row["status"],
        "reasons": "; ".join(row["reasons"]),
    } for row in rows]
    _write_table(workbook, "products", list(products[0].keys()) if products else ["product_id"], products, bold)
    _write_table(workbook, "videos", ["id", "hashtag", "author", "published_at", "views", "likes", "comments", "shares", "engagement_rate", "description", "url", "source"], videos, bold)
    search = [{"keyword": keyword, "date": day, "value": value} for keyword, series in sorted(trends.items()) for day, value in series]
    _write_table(workbook, "search_interest", ["keyword", "date", "value"], search, bold)
    assumptions = context["assumptions"]
    cost = [{"assumption": key, "value": value} for key, value in assumptions.items() if not isinstance(value, dict)]
    cost += [{"assumption": f"commission_by_category.{name}", "value": value} for name, value in assumptions["commission_by_category"].items()]
    cost += [{"assumption": f"weights.{name}", "value": value} for name, value in assumptions["weights"].items()]
    _write_table(workbook, "cost_assumptions", ["assumption", "value"], cost, bold)
    snapshots = [snapshot for history in histories.values() for snapshot in history]
    _write_table(workbook, "snapshots", ["product_id", "title", "price", "sold_count", "captured_at", "category", "keyword", "shop", "cogs"], snapshots, bold)
    _write_table(workbook, "competition", ["keyword", "products", "shops", "cr3", "creators"], competition(rows, context.get("hashtag_videos") or {}), bold)
    run = workbook.add_worksheet("run")
    facts = [
        ("query", context["query"]),
        ("generated_at", context["generated_at"].isoformat(timespec="seconds")),
        ("sources", ", ".join(context.get("sources") or [])),
        ("first_run", "yes: deltas need a second snapshot" if context.get("first_run") else "no"),
        ("state_file", context.get("state") or ""),
    ] + [("data_gap", gap) for gap in context.get("gaps") or []]
    for row, (key, value) in enumerate(facts):
        run.write_string(row, 0, key, bold)
        run.write_string(row, 1, value)
    workbook.close()
