"""TikTok account, hashtag, and sound metrics.

Pure functions over plain dictionaries. A video record carries: id, author,
description, published_at (ISO 8601 or None), duration_seconds, views, likes,
comments, shares, hashtags (list), sound_id, sound_title, url, source. Missing
counts are None and never treated as zero.
"""

from __future__ import annotations

import statistics
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

#: Classification thresholds; every value is overridable from --thresholds.
DEFAULT_THRESHOLDS = {
    "breakout_multiple": 3.0,
    "window_days": 28,
    "min_videos": 5,
    "trend_min_active_weeks": 3,
    "trend_min_creators": 5,
    "trend_max_top_creator_share": 0.5,
    "spike_peak_share": 0.5,
    "fad_decay_ratio": 0.5,
}


def parse_time(text: str) -> datetime:
    """Parse ISO 8601 or YYYY-MM-DD into an aware UTC datetime."""
    value = datetime.fromisoformat(text.strip().replace("Z", "+00:00"))
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def engagement_rate(video: dict) -> Optional[float]:
    """Return (likes + comments) / views, or None when views or both counts are unknown."""
    views, likes, comments = video.get("views"), video.get("likes"), video.get("comments")
    if not views or (likes is None and comments is None):
        return None
    return ((likes or 0) + (comments or 0)) / views


def _median(values: Iterable[Optional[float]]) -> Optional[float]:
    known = [value for value in values if value is not None]
    return statistics.median(known) if known else None


def account_metrics(account: dict, videos: list, now: datetime, thresholds: dict) -> dict:
    """Return the metrics of one account from its profile and its sampled videos.

    median_views, median_er (per video), follower_er (Modash: median likes of the last
    60 days' videos ÷ followers), breakout_rate (share of videos with views >
    breakout_multiple × the account median), posts_per_week and median_gap_days over the
    sampled span, and best_hour_utc (the posting hour with the highest median views).
    """
    multiple = thresholds["breakout_multiple"]
    median_views = _median(video.get("views") for video in videos)
    with_views = [video for video in videos if video.get("views") is not None]
    breakouts = [video for video in with_views if median_views and video["views"] > multiple * median_views]
    dated = sorted(parse_time(video["published_at"]) for video in videos if video.get("published_at"))
    recent_likes = [video.get("likes") for video in videos if video.get("published_at") and parse_time(video["published_at"]) >= now - timedelta(days=60)]
    followers = account.get("followers")
    likes_median = _median(recent_likes)
    posts_per_week = median_gap = None
    if len(dated) >= 2:
        span_days = max((dated[-1] - dated[0]).total_seconds() / 86400, 1.0)
        posts_per_week = (len(dated) - 1) / span_days * 7
        median_gap = statistics.median((later - earlier).total_seconds() / 86400 for earlier, later in zip(dated, dated[1:]))
    by_hour: dict = {}
    for video in with_views:
        if video.get("published_at"):
            by_hour.setdefault(parse_time(video["published_at"]).hour, []).append(video["views"])
    best_hour = max(by_hour, key=lambda hour: (statistics.median(by_hour[hour]), len(by_hour[hour]))) if by_hour else None
    return {
        "videos": len(videos),
        "median_views": median_views,
        "median_er": _median(engagement_rate(video) for video in videos),
        "follower_er": likes_median / followers if likes_median is not None and followers else None,
        "breakout_rate": len(breakouts) / len(with_views) if with_views and median_views else None,
        "breakouts": len(breakouts),
        "posts_per_week": posts_per_week,
        "median_gap_days": median_gap,
        "best_hour_utc": best_hour,
        "last_post": dated[-1].isoformat() if dated else None,
    }


def snapshot_growth(history: list, key: str) -> dict:
    """Return per-day growth of `key` between the last two snapshots and its acceleration.

    gain_per_day = Δvalue ÷ Δdays (last two snapshots); acceleration = gain_per_day −
    the previous interval's gain_per_day (needs three snapshots). Values are None when
    the history is too short.
    """
    ordered = sorted((item for item in history if item.get(key) is not None), key=lambda item: parse_time(item["captured_at"]))
    gains = []
    for before, after in zip(ordered, ordered[1:]):
        days = (parse_time(after["captured_at"]) - parse_time(before["captured_at"])).total_seconds() / 86400
        if days > 0:
            gains.append(((after[key] - before[key]) / days, before[key]))
    latest = gains[-1] if gains else None
    return {
        "value": ordered[-1][key] if ordered else None,
        "snapshots": len(ordered),
        "gain_per_day": latest[0] if latest else None,
        "growth_rate_per_day": latest[0] / latest[1] if latest and latest[1] else None,
        "acceleration": gains[-1][0] - gains[-2][0] if len(gains) >= 2 else None,
    }


def daily_series(videos: list, now: datetime, days: int) -> list:
    """Return [(YYYY-MM-DD, posts, views of the videos posted that day)] for the last `days` days, oldest first.

    A day's views are None when a video posted that day has no view count.
    """
    first = (now - timedelta(days=days - 1)).date()
    posts: dict = {}
    views: dict = {}
    for video in videos:
        if not video.get("published_at"):
            continue
        day = parse_time(video["published_at"]).date()
        if day < first or day > now.date():
            continue
        posts[day] = posts.get(day, 0) + 1
        if video.get("views") is None or views.get(day, 0) is None:
            views[day] = None
        else:
            views[day] = views.get(day, 0) + video["views"]
    rows = []
    for offset in range(days):
        day = first + timedelta(days=offset)
        rows.append((day.isoformat(), posts.get(day, 0), views.get(day, 0) if day in views else 0))
    return rows


def _ratio(later: float, earlier: float) -> Optional[float]:
    return None if not earlier else later / earlier - 1


def change_point(values: list) -> Optional[int]:
    """Return the index where a single mean shift best splits the series (least squared error), or None for < 4 values."""
    if len(values) < 4:
        return None
    best, best_cost = None, None
    for split in range(2, len(values) - 1):
        left, right = values[:split], values[split:]
        cost = sum((v - statistics.mean(left)) ** 2 for v in left) + sum((v - statistics.mean(right)) ** 2 for v in right)
        if best_cost is None or cost < best_cost:
            best, best_cost = split, cost
    total = sum((v - statistics.mean(values)) ** 2 for v in values)
    return best if total and best_cost is not None and best_cost < 0.5 * total else None


def topic_metrics(videos: list, now: datetime, thresholds: dict, history: Optional[list] = None) -> dict:
    """Return growth, spread, persistence, and the Exolyt-style class of one hashtag or sound.

    From the sampled videos' posting dates over 56 days:
    growth_7d = posts in the last 7 days ÷ the 7 days before − 1;
    growth_28d = posts in the last 28 days ÷ the 28 days before − 1;
    acceleration = growth_7d − the previous week's growth_7d;
    active_weeks = weeks of the last four with at least one post;
    creators and top_creator_share measure spread;
    peak_share = largest 3-day share of the window's posts;
    change_point = first day of the post-count mean shift, if any.
    With a snapshot `history`, views_gain_per_day and views_acceleration come from it.
    """
    window = thresholds["window_days"]
    series = daily_series(videos, now, 2 * window)
    posts = [count for _, count, _ in series]
    last7, prev7, prev14 = sum(posts[-7:]), sum(posts[-14:-7]), sum(posts[-21:-14])
    last_window, prev_window = sum(posts[-window:]), sum(posts[:-window])
    recent = posts[-window:]
    weeks = [sum(recent[i:i + 7]) for i in range(0, window, 7)]
    authors = [video.get("author") for video in videos if video.get("author") and video.get("published_at")
               and parse_time(video["published_at"]) >= now - timedelta(days=window)]
    top_share = max(authors.count(author) for author in set(authors)) / len(authors) if authors else None
    peak = max((sum(recent[i:i + 3]) for i in range(max(len(recent) - 2, 1))), default=0)
    split = change_point(recent)
    growth_7d = _ratio(last7, prev7)
    previous_growth = _ratio(prev7, prev14)
    snapshot = snapshot_growth(history or [], "views")
    metrics = {
        "videos": len(videos),
        "posts_window": last_window,
        "growth_7d": growth_7d,
        "growth_28d": _ratio(last_window, prev_window),
        "acceleration": growth_7d - previous_growth if growth_7d is not None and previous_growth is not None else None,
        "active_weeks": sum(1 for count in weeks if count),
        "creators": len(set(authors)),
        "top_creator_share": top_share,
        "peak_share": peak / last_window if last_window else None,
        "peak_week_ratio": (weeks[-1] / max(weeks)) if weeks and max(weeks) else None,
        "change_point": series[-window + split][0] if split is not None else None,
        "median_er": _median(engagement_rate(video) for video in videos),
        "views_total": snapshot["value"],
        "views_gain_per_day": snapshot["gain_per_day"],
        "views_acceleration": snapshot["acceleration"],
        "snapshots": snapshot["snapshots"],
    }
    metrics["class"], metrics["why"] = classify(metrics, thresholds)
    return metrics


def classify(metrics: dict, thresholds: dict) -> tuple:
    """Exolyt-style class from growth, spread, and persistence.

    * insufficient — fewer than min_videos sampled videos in the window.
    * fad — the window peaked and the latest week fell below fad_decay_ratio × the peak week.
    * spike — at least spike_peak_share of the window's posts fall in one 3-day span, or one
      creator posts more than trend_max_top_creator_share of them.
    * trend — 28-day growth > 0 (or more posts than the previous window), posts in at least
      trend_min_active_weeks of the last four weeks, and at least trend_min_creators creators.
    * declining — 28-day growth < 0; stable — anything else.
    Returns (class, reason).
    """
    if metrics["posts_window"] < thresholds["min_videos"]:
        return "insufficient", f"窗口内样本视频 {metrics['posts_window']} 条 < {thresholds['min_videos']}"
    if metrics["peak_week_ratio"] is not None and metrics["peak_week_ratio"] < thresholds["fad_decay_ratio"] and metrics["active_weeks"] >= 2:
        return "fad", f"最近一周发布量只有峰值周的 {metrics['peak_week_ratio']:.0%}，快起快落"
    if (metrics["peak_share"] or 0) >= thresholds["spike_peak_share"]:
        return "spike", f"{metrics['peak_share']:.0%} 的发布集中在 3 天内"
    if (metrics["top_creator_share"] or 0) > thresholds["trend_max_top_creator_share"]:
        return "spike", f"单一达人贡献 {metrics['top_creator_share']:.0%} 的发布，扩散不足"
    rising = metrics["growth_28d"] > 0 if metrics["growth_28d"] is not None else metrics["posts_window"] > 0
    if rising and metrics["active_weeks"] >= thresholds["trend_min_active_weeks"] and metrics["creators"] >= thresholds["trend_min_creators"]:
        return "trend", f"28 天增长、{metrics['active_weeks']}/4 周持续、{metrics['creators']} 位达人参与"
    if metrics["growth_28d"] is not None and metrics["growth_28d"] < 0:
        return "declining", f"28 天发布量下降 {metrics['growth_28d']:.0%}"
    return "stable", "增长、扩散或持续性未同时达标"


def co_hashtags(videos: list, exclude: Iterable[str]) -> dict:
    """Return hashtag → the sampled videos that carry it, excluding the requested topics."""
    skip = {name.lower() for name in exclude}
    groups: dict = {}
    for video in videos:
        for tag in {tag.lower() for tag in video.get("hashtags") or []}:
            if tag not in skip:
                groups.setdefault(tag, []).append(video)
    return groups


def benchmarks(account_rows: list) -> list:
    """Return per-metric peer medians across accounts and each account's ratio to it."""
    keys = ["median_views", "median_er", "follower_er", "breakout_rate", "posts_per_week", "follower_gain_per_day"]
    rows = []
    for key in keys:
        peer = _median(row["metrics"].get(key) for row in account_rows)
        for row in account_rows:
            value = row["metrics"].get(key)
            rows.append({"account": row["handle"], "metric": key, "value": value, "peer_median": peer,
                         "ratio": value / peer if value is not None and peer else None, "peers": len(account_rows)})
    return rows


def recommendations(account_rows: list, topics: list) -> list:
    """Return plain-language actions derived from the computed metrics only."""
    tips = []
    for row in account_rows:
        metrics = row["metrics"]
        if metrics.get("best_hour_utc") is not None:
            tips.append(f"@{row['handle']}：样本中 {metrics['best_hour_utc']:02d}:00 UTC 发布的视频播放中位数最高，可优先在该时段发布。")
        if metrics.get("breakout_rate") is not None and metrics["breakout_rate"] == 0:
            tips.append(f"@{row['handle']}：样本内没有爆款（> 3× 中位数），参考同类账号的爆款选题。")
    for topic in topics:
        if topic["metrics"]["class"] == "trend":
            tips.append(f"{topic['label']} 是持续趋势（{topic['metrics']['why']}），适合排进内容日历。")
        elif topic["metrics"]["class"] == "spike":
            tips.append(f"{topic['label']} 是短期热点（{topic['metrics']['why']}），如要跟进需在几天内发布。")
    return tips
