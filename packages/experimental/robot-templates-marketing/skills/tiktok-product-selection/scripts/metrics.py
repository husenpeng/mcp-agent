"""Product-selection metrics for TikTok Shop candidates.

Pure functions over plain dictionaries. Missing counts stay None and are never
treated as zero.

Records:

* snapshot: product_id, title, price, sold_count, captured_at (ISO 8601).
* video: id, author, published_at, views, likes, comments, shares, hashtags.
* hashtag snapshot: captured_at, views (lifetime hashtag views), videos.
* trend point: (ISO date, value).

Sales follow the snapshot-difference method: daily sold = (sold_t − sold_t−1)
÷ days between the snapshots, and GMV ≈ sold × price. A single snapshot has no
delta; every sales value is then None and `needs_second_snapshot` is True.
"""

from __future__ import annotations

import math
import re
import statistics
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

#: Margin-model defaults (FastMoss US 2026). Every value is overridable from --assumptions.
DEFAULT_ASSUMPTIONS = {
    "platform_fee_rate": 0.06,
    "fulfillment_per_unit": 3.57,
    "ad_cost_rate": 0.10,
    "return_reserve_rate": 0.05,
    "cogs_rate": 0.30,
    "default_commission_rate": 0.10,
    "commission_by_category": {
        "beauty": 0.15,
        "womenswear": 0.10,
        "health": 0.20,
        "fashion accessories": 0.08,
        "sports & outdoor": 0.10,
    },
    "weights": {"gmv": 0.35, "heat": 0.25, "trend": 0.20, "margin": 0.20},
    "window_days": 28,
    "trend_p_threshold": 0.1,
}


def parse_time(text: str) -> datetime:
    """Parse ISO 8601 (or YYYY-MM-DD) into an aware UTC datetime."""
    value = datetime.fromisoformat(text.strip().replace("Z", "+00:00"))
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def engagement_rate(video: dict) -> Optional[float]:
    """Return (likes + comments) / views, or None when views or both counts are unknown."""
    views, likes, comments = video.get("views"), video.get("likes"), video.get("comments")
    if not views or (likes is None and comments is None):
        return None
    return ((likes or 0) + (comments or 0)) / views


def sales_intervals(snapshots: Iterable[dict]) -> list:
    """Return one row per consecutive snapshot pair, oldest first.

    daily_sold = Δsold ÷ Δdays; gmv = Δsold × the later snapshot's price.
    A decreasing or missing count yields None values and a `problem` note.
    """
    ordered = sorted((s for s in snapshots if s.get("captured_at")), key=lambda s: parse_time(s["captured_at"]))
    rows = []
    for before, after in zip(ordered, ordered[1:]):
        days = (parse_time(after["captured_at"]) - parse_time(before["captured_at"])).total_seconds() / 86400
        row = {"from": before["captured_at"], "to": after["captured_at"], "days": days, "sold": None, "daily_sold": None,
               "price": after.get("price"), "gmv": None, "problem": None}
        if before.get("sold_count") is None or after.get("sold_count") is None:
            row["problem"] = "sold count missing"
        elif days <= 0:
            row["problem"] = "same capture time"
        elif after["sold_count"] < before["sold_count"]:
            row["problem"] = "sold count decreased (rounded display or relisting)"
        else:
            row["sold"] = after["sold_count"] - before["sold_count"]
            row["daily_sold"] = row["sold"] / days
            if row["price"] is not None:
                row["gmv"] = row["sold"] * row["price"]
        rows.append(row)
    return rows


def sales_summary(snapshots: list, now: datetime, window_days: int = 28) -> dict:
    """Summarize the snapshot history of one product.

    Returns snapshots, needs_second_snapshot, latest_daily_sold, latest_daily_gmv,
    window_sold and window_gmv (intervals ending inside the window), gmv_growth
    (later half of the window's intervals vs the earlier half, by daily GMV), and intervals.
    """
    intervals = sales_intervals(snapshots)
    valid = [row for row in intervals if row["daily_sold"] is not None]
    start = now - timedelta(days=window_days)
    in_window = [row for row in valid if parse_time(row["to"]) >= start]
    latest = valid[-1] if valid else None
    summary = {
        "snapshots": len(snapshots),
        "needs_second_snapshot": len(snapshots) < 2,
        "latest_daily_sold": latest["daily_sold"] if latest else None,
        "latest_daily_gmv": latest["daily_sold"] * latest["price"] if latest and latest["price"] is not None else None,
        "window_sold": sum(row["sold"] for row in in_window) if in_window else None,
        "window_gmv": sum(row["gmv"] for row in in_window if row["gmv"] is not None) if in_window else None,
        "gmv_growth": None,
        "intervals": intervals,
    }
    daily_gmv = [row["gmv"] / row["days"] for row in in_window if row["gmv"] is not None]
    if len(daily_gmv) >= 2:
        half = len(daily_gmv) // 2
        early = statistics.mean(daily_gmv[:half])
        late = statistics.mean(daily_gmv[half:])
        summary["gmv_growth"] = None if early == 0 else late / early - 1
    return summary


def _betacf(a: float, b: float, x: float) -> float:
    """Continued fraction for the regularized incomplete beta function (Numerical Recipes)."""
    qab, qap, qam = a + b, a + 1, a - 1
    c, d = 1.0, 1 - qab * x / qap
    d = 1 / (d if abs(d) > 1e-30 else 1e-30)
    h = d
    for m in range(1, 200):
        m2 = 2 * m
        for aa in (m * (b - m) * x / ((qam + m2) * (a + m2)), -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))):
            d = 1 + aa * d
            d = 1 / (d if abs(d) > 1e-30 else 1e-30)
            c = 1 + aa / c
            c = c if abs(c) > 1e-30 else 1e-30
            h *= d * c
        if abs(d * c - 1) < 1e-12:
            break
    return h


def _betai(a: float, b: float, x: float) -> float:
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    front = math.exp(math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log(1 - x))
    if x < (a + 1) / (a + b + 2):
        return front * _betacf(a, b, x) / a
    return 1 - front * _betacf(b, a, 1 - x) / b


def t_two_sided_p(t: float, df: int) -> float:
    """Return the two-sided p-value of Student's t with `df` degrees of freedom."""
    return _betai(df / 2, 0.5, df / (df + t * t))


def slope_test(points: list) -> Optional[dict]:
    """OLS slope of (x_days, y) points with a two-sided t-test.

    Returns slope_per_week, p_value, n, and mean, or None with fewer than three
    points or no spread in x.
    """
    if len(points) < 3:
        return None
    xs = [float(x) for x, _ in points]
    ys = [float(y) for _, y in points]
    n = len(points)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    if sxx == 0:
        return None
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
    residual = sum((y - my - slope * (x - mx)) ** 2 for x, y in zip(xs, ys))
    if residual == 0:
        p_value = 0.0 if slope != 0 else 1.0
    else:
        se = math.sqrt(residual / (n - 2) / sxx)
        p_value = t_two_sided_p(slope / se, n - 2)
    return {"slope_per_week": slope * 7, "p_value": p_value, "n": n, "mean": my}


def keyword_trend(series: list, now: datetime, window_days: int = 28) -> Optional[dict]:
    """Return slope_test over the series' points inside the last `window_days`, x in days."""
    start = now - timedelta(days=window_days)
    points = []
    for day, value in series:
        when = parse_time(day)
        if when >= start and value is not None:
            points.append(((when - start).total_seconds() / 86400, value))
    return slope_test(points)


def posting_volume(videos: Iterable[dict], now: datetime, window_days: int = 28) -> list:
    """Return (YYYY-MM-DD, videos posted that day) for each day of the window, oldest first."""
    counts: dict = {}
    for video in videos:
        if video.get("published_at"):
            day = parse_time(video["published_at"]).date().isoformat()
            counts[day] = counts.get(day, 0) + 1
    first = (now - timedelta(days=window_days - 1)).date()
    return [((first + timedelta(days=i)).isoformat(), counts.get((first + timedelta(days=i)).isoformat(), 0)) for i in range(window_days)]


def content_heat(history: list, videos: list, now: datetime, window_days: int = 28) -> Optional[dict]:
    """Return the content-heat growth of one hashtag, or None without any heat data.

    With two or more hashtag snapshots the basis is `hashtag views`: views_gain_per_day
    = Δviews ÷ Δdays between the last two, rate = that gain ÷ the earlier views.
    Otherwise the basis is the proxy `posting volume`: the OLS slope of videos posted
    per day in the sampled videos over the window, rate = slope ÷ mean daily posts.
    `growing` is True when the gain or slope is positive.
    """
    ordered = sorted((h for h in history if h.get("views") is not None), key=lambda h: parse_time(h["captured_at"]))
    latest_views = ordered[-1]["views"] if ordered else None
    if len(ordered) >= 2:
        before, after = ordered[-2], ordered[-1]
        days = (parse_time(after["captured_at"]) - parse_time(before["captured_at"])).total_seconds() / 86400
        if days > 0:
            gain = (after["views"] - before["views"]) / days
            return {"basis": "hashtag views", "views": latest_views, "views_gain_per_day": gain,
                    "rate": gain / before["views"] if before["views"] else None, "growing": gain > 0}
    dated = [video for video in videos if video.get("published_at")]
    if len(dated) >= 3:
        volume = posting_volume(dated, now, window_days)
        test = slope_test([(index, count) for index, (_, count) in enumerate(volume)])
        if test is not None and test["mean"] > 0:
            return {"basis": "posting volume (proxy)", "views": latest_views, "views_gain_per_day": None,
                    "rate": test["slope_per_week"] / 7 / test["mean"], "growing": test["slope_per_week"] > 0}
    if latest_views is None:
        return None
    return {"basis": "single hashtag snapshot", "views": latest_views, "views_gain_per_day": None, "rate": None, "growing": None}


def validate(heat: Optional[dict], trend: Optional[dict], p_threshold: float = 0.1) -> tuple:
    """Dual validation: content heat growing AND keyword trend slope > 0 with p < threshold.

    Returns (status, reasons): `validated` when both hold, `rejected` when heat is not
    growing and the keyword slope is ≤ 0, otherwise `watch`.
    """
    reasons = []
    heat_up = trend_up = None
    if heat is None or heat.get("growing") is None:
        reasons.append("内容热度增速未知，需要第二次快照 content heat growth needs a second hashtag snapshot")
    else:
        heat_up = heat["growing"]
        reasons.append(f"内容热度{'上升' if heat_up else '未上升'}（{heat['basis']}）content heat {'up' if heat_up else 'flat or down'}")
    if trend is None:
        reasons.append("关键词趋势点数不足 keyword trend has fewer than 3 points")
    else:
        trend_up = trend["slope_per_week"] > 0 and trend["p_value"] < p_threshold
        reasons.append(f"关键词趋势斜率 {trend['slope_per_week']:+.3g}/周, p={trend['p_value']:.3f}")
    if heat_up and trend_up:
        return "validated", reasons
    if heat_up is False and trend is not None and trend["slope_per_week"] <= 0:
        return "rejected", reasons
    return "watch", reasons


def commission_rate(category: Optional[str], assumptions: dict) -> float:
    """Return the category commission median, or the default when the category is unknown."""
    table = {key.lower(): value for key, value in assumptions["commission_by_category"].items()}
    return table.get((category or "").strip().lower(), assumptions["default_commission_rate"])


def margin(price: Optional[float], category: Optional[str], assumptions: dict, cogs: Optional[float] = None) -> Optional[dict]:
    """FastMoss-style unit economics; every line is an estimate.

    net = price − COGS − platform fee − creator commission − fulfillment − ads − return reserve.
    Returns the lines (label, amount) for a waterfall, net, net_rate, and commission_rate.
    """
    if price is None:
        return None
    rate = commission_rate(category, assumptions)
    lines = [
        ("COGS 商品成本", cogs if cogs is not None else price * assumptions["cogs_rate"]),
        ("Platform fee 平台佣金", price * assumptions["platform_fee_rate"]),
        ("Creator commission 达人佣金", price * rate),
        ("Fulfillment 履约", assumptions["fulfillment_per_unit"]),
        ("Ads 分摊广告", price * assumptions["ad_cost_rate"]),
        ("Return reserve 退货准备金", price * assumptions["return_reserve_rate"]),
    ]
    net = price - sum(amount for _, amount in lines)
    return {"price": price, "lines": lines, "net": net, "net_rate": net / price if price else None, "commission_rate": rate}


def match_keyword(title: Optional[str], keywords: list) -> Optional[str]:
    """Return the first keyword whose words all occur in the title, case-insensitively."""
    words = set(re.findall(r"\w+", (title or "").lower()))
    for keyword in keywords:
        parts = re.findall(r"\w+", keyword.lower())
        if parts and all(part in words for part in parts):
            return keyword
    return None


def concentration(values: Iterable[Optional[float]], top: int = 3) -> Optional[float]:
    """Return the share of the `top` largest values in the total (CR3 by default)."""
    known = sorted((v for v in values if v is not None), reverse=True)
    total = sum(known)
    return sum(known[:top]) / total if total else None


def _normalize(values: dict) -> dict:
    known = {key: value for key, value in values.items() if value is not None}
    if not known:
        return {}
    low, high = min(known.values()), max(known.values())
    return {key: 1.0 if high == low else (value - low) / (high - low) for key, value in known.items()}


def opportunity_scores(rows: list, weights: dict) -> dict:
    """Return product_id → (score 0–100 or None, signals used).

    Each signal (gmv = latest daily GMV, heat = hashtag daily growth rate, trend =
    keyword slope relative to its mean, margin = net margin rate) is min-max scaled
    across products; missing signals drop out and the remaining weights are renormalized.
    """
    signals = {name: _normalize({row["product_id"]: row.get(f"signal_{name}") for row in rows}) for name in weights}
    result = {}
    for row in rows:
        used = [name for name in weights if row["product_id"] in signals[name] and weights[name] > 0]
        total = sum(weights[name] for name in used)
        score = None if not total else 100 * sum(weights[name] * signals[name][row["product_id"]] for name in used) / total
        result[row["product_id"]] = (score, used)
    return result


def hashtag_name(keyword: str) -> str:
    """Return the hashtag for a keyword: lowercase letters and digits only."""
    return re.sub(r"[\W_]+", "", keyword.lower())


def product_rows(histories: dict, keywords: list, keyword_hashtags: dict, hashtag_history: dict, hashtag_videos: dict,
                 trends: dict, assumptions: dict, now: datetime, price_band: tuple = (None, None)) -> list:
    """Return one analysed row per product, ranked by opportunity score (unknown scores last).

    histories: product_id → snapshots (oldest first); keyword_hashtags: keyword → hashtag;
    hashtag_history: hashtag → hashtag snapshots; hashtag_videos: hashtag → video records;
    trends: lowercase keyword → [(date, value)]. Products whose latest price falls outside
    price_band are dropped.
    """
    window = assumptions["window_days"]
    low, high = price_band
    rows = []
    for product_id, history in histories.items():
        latest = history[-1]
        price = latest.get("price")
        if price is not None and ((low is not None and price < low) or (high is not None and price > high)):
            continue
        keyword = latest.get("keyword") or match_keyword(latest.get("title"), keywords)
        tag = keyword_hashtags.get(keyword) or (hashtag_name(keyword) if keyword else None)
        heat = content_heat(hashtag_history.get(tag, []), hashtag_videos.get(tag, []), now, window) if tag else None
        trend = keyword_trend(trends.get((keyword or "").lower(), []), now, window) if keyword else None
        status, reasons = validate(heat, trend, assumptions["trend_p_threshold"])
        sales = sales_summary(history, now, window)
        unit = margin(price, latest.get("category"), assumptions, latest.get("cogs"))
        rows.append({
            "product_id": product_id, "title": latest.get("title"), "price": price, "sold_count": latest.get("sold_count"),
            "category": latest.get("category"), "shop": latest.get("shop"), "keyword": keyword, "hashtag": tag,
            "captured_at": latest.get("captured_at"), **{key: value for key, value in sales.items()},
            "heat": heat, "trend": trend, "status": status, "reasons": reasons, "margin": unit,
            "signal_gmv": sales["latest_daily_gmv"],
            "signal_heat": heat.get("rate") if heat else None,
            "signal_trend": trend["slope_per_week"] / trend["mean"] if trend and trend["mean"] else None,
            "signal_margin": unit["net_rate"] if unit else None,
        })
    scores = opportunity_scores(rows, assumptions["weights"])
    for row in rows:
        row["score"], row["score_signals"] = scores[row["product_id"]]
    rows.sort(key=lambda row: (row["score"] is None, -(row["score"] or 0)))
    return rows


def competition(rows: list, hashtag_videos: dict) -> list:
    """Return one row per keyword: products, shops, CR3 of latest daily GMV, and creators posting in its hashtag."""
    groups: dict = {}
    for row in rows:
        groups.setdefault(row.get("keyword") or "（未归类 unmatched）", []).append(row)
    result = []
    for keyword, items in sorted(groups.items()):
        tag = items[0].get("hashtag")
        authors = {video.get("author") for video in hashtag_videos.get(tag, []) if video.get("author")}
        result.append({
            "keyword": keyword, "products": len(items),
            "shops": len({item["shop"] for item in items if item.get("shop")}) or None,
            "cr3": concentration(item.get("latest_daily_gmv") for item in items),
            "creators": len(authors) if tag in hashtag_videos else None,
        })
    return result
