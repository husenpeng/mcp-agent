"""Demand-heat metrics for Instagram product selection.

Instagram shows no sold counts, so nothing here estimates sales or GMV; every
number measures attention. Pure functions over plain dictionaries. A post record
carries: id, url, owner, caption, kind (reel, video, image, carousel, or None),
published_at, likes, comments, views, target, edge, and source. Missing counts
are None and never treated as zero.
"""

from __future__ import annotations

import math
import re
import statistics
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

#: Mentions below this mark a phrase as rejected for this sample.
WATCH_MIN_MENTIONS = 3
#: Mention growth at or below this marks a phrase as declining.
DECLINE_GROWTH = -0.5

_URL = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_HASHTAG = re.compile(r"[#＃](\w+)")
_MENTION = re.compile(r"@[\w.]+")
_CLAUSE = re.compile(r"[\n\r.!?,;:|/•·…()\[\]{}\"“”。！？，；：、]+")
_TOKEN = re.compile(r"[^\W_][\w'\-]*")
_INTENT = re.compile(
    r"\blinks?\b|\bwhere\b.{0,20}\b(?:buy|get|find|order|from)\b|\bprice\b|\bhow much\b|\bcost\b|\bavailable in\b|\bship(?:ping)? to\b"
    r"|\bneed (?:this|these|it)\b|\bwant (?:this|these|it)\b|\bdónde comprar\b|\bprecio\b|\bcuánto cuesta\b"
    r"|链接|多少钱|价格|哪里买|在哪买|怎么买|求购",
    re.IGNORECASE,
)
_STOPWORDS = frozenset(
    """a about above after again all also always am an and any are as at be because been before being below best better between
    big bio both but by can check click code come comment could day days did discount do does doing done down dm during each
    even ever every favorite favourite feel few find first follow following follower followers for free from full fun get
    gets getting gift give go going good got great had happy has have having he hello her here hers hey hi him his how i i'm
    i've if in into is it it's its just keep know last late let life like link little live look looks lot love loved loving
    made make makes many may me more most much must my myself need never new next nice no nor not now of off oh ok okay on
    once one only or other our ours out over own people perfect please post posts really right sale same save say see shall
    she shop should show since so some still such sure swipe take tag thank thanks than that the their theirs them then
    there these they thing things think this those through time to today together tomorrow too try under until up us use
    used using very video want was watch way we week well were what when where which while who why will with without
    won't would year years yes yet you you're your yours""".split()
)


def parse_time(value: Optional[str]) -> Optional[datetime]:
    """Parse an ISO 8601 timestamp, treating a naive value as UTC; None when absent or unreadable."""
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def engagement(post: dict) -> Optional[int]:
    """Return likes + comments using the known counts, or None when both are unknown."""
    likes, comments = post.get("likes"), post.get("comments")
    if likes is None and comments is None:
        return None
    return (likes or 0) + (comments or 0)


def _median(values: Iterable) -> Optional[float]:
    known = [value for value in values if value is not None]
    return statistics.median(known) if known else None


def extract_hashtags(caption: Optional[str]) -> list:
    """Return the caption's hashtags, lowercased, without repeats, in order."""
    return list(dict.fromkeys(tag.lower() for tag in _HASHTAG.findall(caption or "")))


def candidate_phrases(caption: Optional[str]) -> set:
    """Return two- and three-word phrases inside one clause of a caption.

    URLs, mentions, and hashtags end a clause. A phrase contains no stop word and
    starts with a non-numeric token of at least two characters.
    """
    if not caption:
        return set()
    text = _HASHTAG.sub(".", _MENTION.sub(".", _URL.sub(".", caption))).replace("’", "'").lower()
    phrases: set = set()
    for clause in _CLAUSE.split(text):
        tokens = _TOKEN.findall(clause)
        for size in (2, 3):
            for start in range(len(tokens) - size + 1):
                gram = tokens[start:start + size]
                if len(gram[0]) >= 2 and not gram[0].isdigit() and not _STOPWORDS.intersection(gram):
                    phrases.add(" ".join(gram))
    return phrases


def contains_term(term: str, text: str) -> bool:
    """Return whether lowercase `text` holds `term`; ASCII terms must match whole words."""
    if not term.isascii():
        return term in text
    return re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text) is not None


def mention_index(posts: Iterable, seeds: Iterable = (), min_posts: int = 2) -> dict:
    """Map each product phrase to the posts mentioning it.

    Identical captions count once, so reposted copy cannot inflate a phrase. Seeds
    are kept from one mention up. A phrase is dropped when a kept phrase of at
    least its length shares a word and covers the same posts, because sliding
    windows over one longer name otherwise fill the ranking.
    """
    seed_terms = [seed.strip().lower() for seed in seeds if seed.strip()]
    index: dict = {}
    seen: set = set()
    for post in posts:
        caption = " ".join((post.get("caption") or "").lower().split())
        if not caption or caption in seen:
            continue
        seen.add(caption)
        found = candidate_phrases(post.get("caption"))
        found.update(seed for seed in seed_terms if contains_term(seed, caption))
        for phrase in found:
            index.setdefault(phrase, []).append(post)
    kept: dict = {}
    for phrase in sorted(index, key=lambda item: (-len(item.split()), item)):
        items = index[phrase]
        if len(items) < min_posts and phrase not in seed_terms:
            continue
        ids = {post["id"] for post in items}
        words = set(phrase.split())
        covered = any(words.intersection(other.split()) and ids == {post["id"] for post in kept[other]} for other in kept)
        if phrase in seed_terms or not covered:
            kept[phrase] = items
    return kept


def weekly_counts(posts: Iterable, now: datetime, weeks: int = 5) -> Optional[list]:
    """Return post counts per 7-day bucket, newest first; None when no post has a date."""
    dates = [parse_time(post.get("published_at")) for post in posts]
    known = [date for date in dates if date is not None]
    if not known:
        return None
    counts = [0] * weeks
    for date in known:
        bucket = (now - date) // timedelta(days=7)
        if 0 <= bucket < weeks:
            counts[bucket] += 1
    return counts


def mention_growth(counts: Optional[list]) -> Optional[float]:
    """Return latest week ÷ prior week − 1, or None without a prior-week mention."""
    if not counts or len(counts) < 2 or not counts[1]:
        return None
    return counts[0] / counts[1] - 1


def trend_score(counts: Optional[list], total_engagement: Optional[int]) -> Optional[float]:
    """Return the latest week's z-score against the 4 prior weeks × log(total engagement); None when undefined."""
    if not counts or len(counts) < 5 or total_engagement is None:
        return None
    spread = statistics.pstdev(counts[1:5])
    if spread == 0:
        return None
    return (counts[0] - statistics.mean(counts[1:5])) / spread * math.log1p(total_engagement)


def intent_hit(text: str) -> bool:
    """Return whether a comment asks for a link, a price, or where to buy."""
    return bool(_INTENT.search(text))


def score_comments(post: dict, texts: Iterable) -> None:
    """Attach comments_sampled and intent_hits to a post; comment text is not retained."""
    sampled = list(texts)
    post["comments_sampled"] = len(sampled)
    post["intent_hits"] = sum(intent_hit(text) for text in sampled)


def intent_ratio(posts: Iterable) -> Optional[float]:
    """Return purchase-intent comments ÷ sampled comments, or None when no comment was available."""
    items = [post for post in posts if post.get("comments_sampled")]
    sampled = sum(post["comments_sampled"] for post in items)
    return sum(post["intent_hits"] for post in items) / sampled if sampled else None


def heat_score(mentions: int, total_engagement: Optional[int], ratio: Optional[float]) -> float:
    """Return mentions × log10(10 + total engagement) × (1 + intent ratio when known)."""
    return mentions * math.log10(10 + (total_engagement or 0)) * (1 + (ratio or 0))


def status(mentions: int, growth: Optional[float]) -> str:
    """Return watch or rejected; validated needs search-interest evidence this skill does not collect."""
    if mentions < WATCH_MIN_MENTIONS or (growth is not None and growth <= DECLINE_GROWTH):
        return "rejected"
    return "watch"


def product_rows(posts: Iterable, now: datetime, seeds: Iterable = (), min_posts: int = 2) -> list:
    """Return one row per product phrase, highest heat first."""
    rows = []
    for phrase, items in mention_index(posts, seeds, min_posts).items():
        engagements = [value for value in map(engagement, items) if value is not None]
        total = sum(engagements) if engagements else None
        views = [post["views"] for post in items if post.get("views") is not None]
        owners = {post["owner"] for post in items if post.get("owner")}
        counts = weekly_counts(items, now)
        growth = mention_growth(counts)
        ratio = intent_ratio(items)
        rows.append({
            "phrase": phrase,
            "mentions": len(items),
            "authors": len(owners) if owners else None,
            "total_engagement": total,
            "median_engagement": _median(engagements),
            "total_views": sum(views) if views else None,
            "reel_mentions": sum(post.get("kind") in ("reel", "video") for post in items),
            "last_7d": None if counts is None else counts[0],
            "prior_7d": None if counts is None else counts[1],
            "mention_growth": growth,
            "trend_score": trend_score(counts, total),
            "comments_sampled": sum(post.get("comments_sampled") or 0 for post in items) or None,
            "intent_ratio": ratio,
            "heat_score": heat_score(len(items), total, ratio),
            "status": status(len(items), growth),
            "sample_url": items[0].get("url"),
        })
    return sorted(rows, key=lambda row: (-row["heat_score"], row["phrase"]))


def hashtag_rows(raw_posts: Iterable, media_counts: dict) -> list:
    """Return one row per collected hashtag from posts before deduplication, most posts first."""
    grouped: dict = {}
    for post in raw_posts:
        if str(post.get("target", "")).startswith("#"):
            grouped.setdefault(post["target"], []).append(post)
    rows = []
    for target, items in grouped.items():
        video = sum(post.get("kind") in ("reel", "video") for post in items)
        known_kind = sum(post.get("kind") is not None for post in items)
        rows.append({
            "hashtag": target,
            "media_count": media_counts.get(target[1:]),
            "posts": len(items),
            "top_posts": sum(post.get("edge") == "top_media" for post in items),
            "recent_posts": sum(post.get("edge") == "recent_media" for post in items),
            "median_likes": _median(post.get("likes") for post in items),
            "median_comments": _median(post.get("comments") for post in items),
            "video_share": video / known_kind if known_kind else None,
        })
    return sorted(rows, key=lambda row: (-row["posts"], row["hashtag"]))


def related_hashtags(posts: Iterable, exclude: Iterable = (), top: int = 20) -> list:
    """Return (hashtag, posts) rows co-occurring in captions, without the queried hashtags."""
    skip = {tag.lstrip("#＃").lower() for tag in exclude}
    counts: Counter = Counter()
    for post in posts:
        counts.update(tag for tag in extract_hashtags(post.get("caption")) if tag not in skip)
    return [{"hashtag": f"#{tag}", "posts": count} for tag, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:top]]


def daily_posts(posts: Iterable, now: datetime, days: int = 14) -> list:
    """Return {day, posts} rows for the last `days` days, oldest first, including empty days."""
    counts: Counter = Counter()
    for post in posts:
        date = parse_time(post.get("published_at"))
        if date is not None:
            counts[date.astimezone(timezone.utc).date()] += 1
    today = now.astimezone(timezone.utc).date()
    return [{"day": (today - timedelta(days=offset)).isoformat(), "posts": counts[today - timedelta(days=offset)]} for offset in range(days - 1, -1, -1)]


def brand_rows(posts: Iterable, brands: Iterable) -> list:
    """Return mentions, mention share, and median engagement per brand; a post may mention several brands."""
    items = list(posts)
    rows = []
    for brand in filter(str.strip, brands):
        term = brand.strip().lower()
        joined = term.replace(" ", "")
        matched = [post for post in items if contains_term(term, (post.get("caption") or "").lower()) or contains_term(joined, (post.get("caption") or "").lower())]
        rows.append({"brand": brand, "mentions": len(matched), "median_engagement": _median(map(engagement, matched))})
    total = sum(row["mentions"] for row in rows)
    for row in rows:
        row["mention_share"] = row["mentions"] / total if total else None
    return sorted(rows, key=lambda row: (-row["mentions"], row["brand"]))


def representative_reels(posts: Iterable, top: int = 10) -> list:
    """Return video posts ranked by views, then engagement; unknown counts sort last."""
    items = [post for post in posts if post.get("kind") in ("reel", "video")]
    return sorted(items, key=lambda post: (-(post.get("views") or 0), -(engagement(post) or 0)))[:top]
