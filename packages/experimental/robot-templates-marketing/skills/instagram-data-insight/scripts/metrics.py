"""Marketing metrics for Instagram accounts and posts.

Pure functions over plain dictionaries so collection and reporting stay
separable. A post record carries: id, url, owner, caption, kind (reel, video,
image, carousel, or None), published_at, likes, comments, views, and source;
saves, shares, and reach are read when a record has them. A profile record
carries: username, name, followers, following, media_count, and source. Missing
counts are None and never treated as zero.
"""

from __future__ import annotations

import re
import statistics
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

MODASH_WINDOW_DAYS = 60
TREND_WEEKS = 4
#: A hashtag on fewer posts stays out of trend labels and recommendations.
MIN_TOPIC_POSTS = 3
#: Active weeks out of TREND_WEEKS that make a hashtag a lasting trend.
LASTING_WEEKS = 3
#: Posts a format needs before a recommendation may name it.
MIN_FORMAT_POSTS = 3
#: Posts an hour or a hashtag needs before a recommendation may name it.
MIN_SLOT_POSTS = 2
WEEKDAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
KINDS = ("reel", "video", "image", "carousel")

_HASHTAG = re.compile(r"[#＃](\w+)")


def parse_time(value: Optional[str]) -> Optional[datetime]:
    """Parse an ISO 8601 timestamp, treating a naive value as UTC; None when absent or unreadable."""
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _median(values: Iterable) -> Optional[float]:
    known = [value for value in values if value is not None]
    return statistics.median(known) if known else None


def _mean(values: Iterable) -> Optional[float]:
    known = [value for value in values if value is not None]
    return statistics.fmean(known) if known else None


def _ratio(numerator, denominator) -> Optional[float]:
    return None if numerator is None or not denominator else numerator / denominator


def engagement(post: dict) -> Optional[int]:
    """Return likes + comments + saves + shares over the known counts, or None when all are unknown."""
    counts = [post.get(key) for key in ("likes", "comments", "saves", "shares")]
    known = [count for count in counts if count is not None]
    return sum(known) if known else None


def engagement_rate(post: dict, followers: Optional[int]) -> Optional[float]:
    """Return engagement ÷ reach when a post has reach, otherwise engagement ÷ followers; None when unknown."""
    return _ratio(engagement(post), post.get("reach") or followers)


def extract_hashtags(caption: Optional[str]) -> list:
    """Return the caption's hashtags, lowercased, without repeats, in order."""
    return list(dict.fromkeys(tag.lower() for tag in _HASHTAG.findall(caption or "")))


def enrich(posts: Iterable, profiles: dict) -> list:
    """Return copies of the posts with engagement, engagement_rate, and hashtags."""
    rows = []
    for post in posts:
        profile = profiles.get(post.get("owner")) or {}
        rows.append({
            **post,
            "engagement": engagement(post),
            "engagement_rate": engagement_rate(post, profile.get("followers")),
            "hashtags": extract_hashtags(post.get("caption")),
        })
    return rows


def posts_per_week(posts: Iterable) -> Optional[float]:
    """Return posting cadence over the sample's date span; None with fewer than two dated posts."""
    dates = sorted(date for date in (parse_time(post.get("published_at")) for post in posts) if date)
    span = (dates[-1] - dates[0]).total_seconds() / 86400 if len(dates) > 1 else 0
    return (len(dates) - 1) / span * 7 if span else None


def modash_rate(posts: Iterable, followers: Optional[int], now: datetime) -> Optional[float]:
    """Return the median likes of posts from the last 60 days ÷ followers; None when unknown."""
    cutoff = now - timedelta(days=MODASH_WINDOW_DAYS)
    recent = [post for post in posts if (parse_time(post.get("published_at")) or cutoff) > cutoff]
    return _ratio(_median(post.get("likes") for post in recent), followers)


def account_rows(profiles: dict, posts: list, now: datetime) -> list:
    """Return one health row per profile, most followers first; unknown followers sort last."""
    rows = []
    for username, profile in profiles.items():
        items = [post for post in posts if post.get("owner") == username]
        dates = [date for date in (parse_time(post.get("published_at")) for post in items) if date]
        typed = [post for post in items if post.get("kind")]
        rows.append({
            **profile,
            "role": profile.get("role", "account"),
            "posts_sampled": len(items),
            "median_engagement_rate": _median(post.get("engagement_rate") for post in items),
            "modash_rate": modash_rate(items, profile.get("followers"), now),
            "posts_per_week": posts_per_week(items),
            "reel_share": sum(post["kind"] == "reel" for post in typed) / len(typed) if typed else None,
            "median_likes": _median(post.get("likes") for post in items),
            "median_comments": _median(post.get("comments") for post in items),
            "median_views": _median(post.get("views") for post in items),
            "last_post": max(dates).date().isoformat() if dates else None,
        })
    return sorted(rows, key=lambda row: (-(row.get("followers") or -1), row["username"]))


def format_comparison(posts: Iterable) -> list:
    """Compare Reels, other video, images, carousels, and unknown types; empty groups are omitted."""
    items = list(posts)
    rows = []
    for kind in (*KINDS, None):
        group = [post for post in items if post.get("kind") == kind]
        if group:
            rows.append({
                "kind": kind or "unknown",
                "posts": len(group),
                "share": len(group) / len(items),
                "median_likes": _median(post.get("likes") for post in group),
                "median_comments": _median(post.get("comments") for post in group),
                "median_views": _median(post.get("views") for post in group),
                "median_engagement": _median(post.get("engagement") for post in group),
                "median_engagement_rate": _median(post.get("engagement_rate") for post in group),
            })
    return rows


def posting_heatmap(posts: Iterable, utc_offset: float = 0) -> list:
    """Return {weekday, hour, posts, median_engagement_rate} for all 168 slots at the given UTC offset."""
    shift = timedelta(hours=utc_offset)
    slots: dict = {}
    for post in posts:
        date = parse_time(post.get("published_at"))
        if date is not None:
            local = date.astimezone(timezone.utc) + shift
            slots.setdefault((local.weekday(), local.hour), []).append(post)
    rows = []
    for weekday in range(7):
        for hour in range(24):
            group = slots.get((weekday, hour), [])
            rows.append({
                "weekday": WEEKDAYS[weekday],
                "hour": hour,
                "posts": len(group),
                "median_engagement_rate": _median(post.get("engagement_rate") for post in group),
            })
    return rows


def hour_rows(posts: Iterable, utc_offset: float = 0) -> list:
    """Return {hour, posts, median_engagement_rate} per hour of day with at least one post."""
    groups: dict = {}
    shift = timedelta(hours=utc_offset)
    for post in posts:
        date = parse_time(post.get("published_at"))
        if date is not None:
            groups.setdefault((date.astimezone(timezone.utc) + shift).hour, []).append(post)
    return [
        {"hour": hour, "posts": len(groups[hour]), "median_engagement_rate": _median(post.get("engagement_rate") for post in groups[hour])}
        for hour in sorted(groups)
    ]


def hashtag_contribution(posts: list) -> list:
    """Return one row per (account, hashtag): mean engagement with the hashtag ÷ the account's mean engagement.

    Posts without a known engagement are left out of both means. The index is
    None when the account's mean is unknown or zero.
    """
    by_owner: dict = {}
    for post in posts:
        if post.get("engagement") is not None:
            by_owner.setdefault(post.get("owner"), []).append(post)
    rows = []
    for owner, items in by_owner.items():
        baseline = _mean(post["engagement"] for post in items)
        tagged: dict = {}
        for post in items:
            for tag in post.get("hashtags", []):
                tagged.setdefault(tag, []).append(post["engagement"])
        for tag, values in tagged.items():
            mean = _mean(values)
            rows.append({
                "account": owner,
                "hashtag": f"#{tag}",
                "posts": len(values),
                "mean_engagement": mean,
                "account_mean_engagement": baseline,
                "contribution_index": _ratio(mean, baseline),
            })
    return sorted(rows, key=lambda row: (-(row["contribution_index"] or 0), -row["posts"], row["hashtag"], str(row["account"])))


def topic_trends(posts: Iterable, now: datetime, weeks: int = TREND_WEEKS) -> tuple:
    """Return (trends, series) for hashtags in the last `weeks` 7-day windows.

    A trend row carries growth (latest week ÷ prior week − 1), spread (accounts),
    and persistence (active weeks). Its label is lasting with at least 3 active
    weeks, spike with fewer, and insufficient below 3 posts. Series rows are one
    per hashtag and week, oldest week first.
    """
    grouped: dict = {}
    for post in posts:
        date = parse_time(post.get("published_at"))
        bucket = None if date is None else (now - date) // timedelta(days=7)
        if bucket is None or not 0 <= bucket < weeks:
            continue
        for tag in post.get("hashtags", []):
            entry = grouped.setdefault(tag, {"counts": [0] * weeks, "accounts": set()})
            entry["counts"][bucket] += 1
            entry["accounts"].add(post.get("owner"))
    trends, series = [], []
    for tag, entry in grouped.items():
        counts = entry["counts"]
        total, active = sum(counts), sum(count > 0 for count in counts)
        if total < MIN_TOPIC_POSTS:
            label = "insufficient"
        else:
            label = "lasting" if active >= LASTING_WEEKS else "spike"
        trends.append({
            "hashtag": f"#{tag}", "posts": total, "last_7d": counts[0], "prior_7d": counts[1],
            "growth": _ratio(counts[0], counts[1]) - 1 if counts[1] else None,
            "accounts": len(entry["accounts"]), "active_weeks": active, "label": label,
        })
        for bucket in range(weeks - 1, -1, -1):
            start = (now - timedelta(days=7 * (bucket + 1))).date().isoformat()
            series.append({"hashtag": f"#{tag}", "week_start": start, "posts": counts[bucket]})
    trends.sort(key=lambda row: (-row["posts"], row["hashtag"]))
    return trends, series


def benchmark_rows(accounts: list) -> list:
    """Return each account against the median of the other accounts; indexes are None without peers."""
    rows = []
    for account in accounts:
        peers = [other for other in accounts if other is not account]
        peer_rate = _median(peer.get("median_engagement_rate") for peer in peers)
        peer_cadence = _median(peer.get("posts_per_week") for peer in peers)
        rows.append({
            "username": account["username"],
            "role": account["role"],
            "followers": account.get("followers"),
            "median_engagement_rate": account.get("median_engagement_rate"),
            "modash_rate": account.get("modash_rate"),
            "posts_per_week": account.get("posts_per_week"),
            "peer_median_engagement_rate": peer_rate,
            "engagement_index": _ratio(account.get("median_engagement_rate"), peer_rate),
            "peer_median_posts_per_week": peer_cadence,
            "cadence_index": _ratio(account.get("posts_per_week"), peer_cadence),
        })
    return rows


def snapshot(profiles: dict, previous: dict, now: datetime) -> dict:
    """Return the state to save: known counts per account, keeping earlier accounts this run did not refresh."""
    accounts = dict(previous)
    for username, profile in profiles.items():
        if profile.get("followers") is not None:
            accounts[username] = {"taken_at": now.isoformat(timespec="seconds"), "followers": profile["followers"], "media_count": profile.get("media_count")}
    return {"version": 1, "accounts": accounts}


def growth_rows(profiles: dict, previous: dict, now: datetime) -> list:
    """Return follower and media growth since each account's previous snapshot; no snapshot, no row."""
    rows = []
    for username, profile in profiles.items():
        earlier = previous.get(username)
        if earlier is None:
            continue
        taken = parse_time(earlier.get("taken_at"))
        days = None if taken is None else (now - taken).total_seconds() / 86400
        before, after = earlier.get("followers"), profile.get("followers")
        delta = None if before is None or after is None else after - before
        media_before, media_after = earlier.get("media_count"), profile.get("media_count")
        rows.append({
            "username": username,
            "previous_at": earlier.get("taken_at"),
            "days": days,
            "followers_before": before,
            "followers_after": after,
            "followers_delta": delta,
            "followers_growth": _ratio(delta, before),
            "followers_per_day": delta / days if delta is not None and days and days > 0 else None,
            "media_delta": None if media_before is None or media_after is None else media_after - media_before,
        })
    return rows


def recommendations(formats: list, hours: list, contributions: list, benchmarks: list, utc_offset: float) -> list:
    """Return actions backed by the numbers; a rule without enough posts stays silent."""
    lines = []
    ranked = sorted((row for row in formats if row["posts"] >= MIN_FORMAT_POSTS and row["median_engagement_rate"] is not None), key=lambda row: -row["median_engagement_rate"])
    if len(ranked) > 1:
        best, worst = ranked[0], ranked[-1]
        lines.append(f"多发 {best['kind']}：互动率中位数 {best['median_engagement_rate'] * 100:.2f}%，高于 {worst['kind']} 的 {worst['median_engagement_rate'] * 100:.2f}%。Favor {best['kind']} over {worst['kind']}.")
    slots = sorted((row for row in hours if row["posts"] >= MIN_SLOT_POSTS and row["median_engagement_rate"] is not None), key=lambda row: -row["median_engagement_rate"])
    if slots:
        lines.append(f"测试在 {slots[0]['hour']:02d}:00（UTC{utc_offset:+g}）发布：样本 {slots[0]['posts']} 帖，互动率中位数 {slots[0]['median_engagement_rate'] * 100:.2f}%。Test posting around this hour.")
    tags = [row for row in contributions if row["posts"] >= MIN_SLOT_POSTS and (row["contribution_index"] or 0) > 1]
    if tags:
        lines.append(f"保留话题 {tags[0]['hashtag']}（账号 {tags[0]['account']}）：贡献度 {tags[0]['contribution_index']:.2f}，样本 {tags[0]['posts']} 帖。Keep this hashtag.")
    for row in benchmarks:
        if row["role"] == "primary" and row["engagement_index"] is not None and row["engagement_index"] < 1:
            lines.append(f"{row['username']} 的互动率只有同类中位数的 {row['engagement_index']:.2f} 倍，优先拆解对标账号的高互动帖子。Study the peers' top posts.")
    return lines or ["样本太小，无法给出有依据的建议；请增加 --limit 或账号。The sample is too small for a grounded recommendation."]
