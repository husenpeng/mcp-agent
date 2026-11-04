"""Marketing metrics for YouTube videos and channels.

Pure functions over plain dictionaries so collection and reporting stay
separable. A video record carries: id, title, channel_id, channel_title,
published_at (ISO 8601 or None), duration_seconds, views, likes, comments,
description, and url. Missing counts are None and never treated as zero.
"""

from __future__ import annotations

import re
import statistics
from datetime import datetime, timezone
from typing import Iterable, Optional
from urllib.parse import parse_qs, urlparse

#: Short-link and storefront hosts that usually carry affiliate traffic.
AFFILIATE_HOSTS = {
    "amzn.to": "Amazon",
    "amazon.com": "Amazon",
    "geni.us": "Geniuslink",
    "bit.ly": "Bitly",
    "shopstyle.it": "ShopStyle",
    "howl.me": "Howl",
    "go.magik.ly": "Magiclinks",
    "rstyle.me": "LTK",
    "liketk.it": "LTK",
    "shareasale.com": "ShareASale",
    "click.linksynergy.com": "Rakuten",
    "tidd.ly": "Rakuten",
    "anrdoezrs.net": "CJ",
    "kqzyfj.com": "CJ",
    "jdoqocy.com": "CJ",
    "tkqlhce.com": "CJ",
    "dpbolvw.net": "CJ",
    "aliexpress.com": "AliExpress",
    "s.click.aliexpress.com": "AliExpress",
    "temu.com": "Temu",
    "walmart.com": "Walmart",
    "bestbuy.com": "Best Buy",
    "ebay.com": "eBay",
    "etsy.com": "Etsy",
    "shopify.com": "Shopify",
}

_URL = re.compile(r"https?://[^\s<>\"')\]]+", re.IGNORECASE)


def engagement_rate(video: dict) -> Optional[float]:
    """Return (likes + comments) / views, or None when views or both counts are unknown."""
    views = video.get("views")
    likes = video.get("likes")
    comments = video.get("comments")
    if not views or (likes is None and comments is None):
        return None
    return ((likes or 0) + (comments or 0)) / views


def hours_since(published_at: Optional[str], now: datetime) -> Optional[float]:
    """Return hours between an ISO 8601 timestamp and now, at least one hour; None when unknown."""
    if not published_at:
        return None
    text = published_at.replace("Z", "+00:00")
    if len(text) == 8 and text.isdigit():
        text = f"{text[:4]}-{text[4:6]}-{text[6:]}T00:00:00+00:00"
    published = datetime.fromisoformat(text)
    if published.tzinfo is None:
        published = published.replace(tzinfo=timezone.utc)
    return max((now - published).total_seconds() / 3600, 1.0)


def views_per_hour(video: dict, now: datetime) -> Optional[float]:
    """Return lifetime views divided by hours since publication."""
    hours = hours_since(video.get("published_at"), now)
    views = video.get("views")
    if hours is None or views is None:
        return None
    return views / hours


def channel_baselines(videos: Iterable[dict], window: int = 30) -> dict:
    """Return the median views of each channel's latest `window` videos that have a view count.

    Videos are ordered newest first by published_at; videos without a date sort last.
    """
    by_channel: dict = {}
    for video in videos:
        if video.get("views") is None or not video.get("channel_id"):
            continue
        by_channel.setdefault(video["channel_id"], []).append(video)
    baselines = {}
    for channel_id, items in by_channel.items():
        items.sort(key=lambda item: item.get("published_at") or "", reverse=True)
        baselines[channel_id] = statistics.median(item["views"] for item in items[:window])
    return baselines


def outlier_score(video: dict, baselines: dict) -> Optional[float]:
    """Return views divided by the channel's median views, or None without a positive baseline."""
    baseline = baselines.get(video.get("channel_id"))
    views = video.get("views")
    if not baseline or views is None:
        return None
    return views / baseline


def extract_links(description: Optional[str]) -> list:
    """Return every http(s) URL in a description, without trailing punctuation, in order."""
    if not description:
        return []
    return [match.rstrip(".,;:!?") for match in _URL.findall(description)]


def classify_link(url: str) -> dict:
    """Classify one URL by host; Amazon links with a `tag` query parameter report the associate tag."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    network = None
    for candidate, name in AFFILIATE_HOSTS.items():
        if host == candidate or host.endswith("." + candidate):
            network = name
            break
    if network is None and re.fullmatch(r"amazon\.[a-z.]+", host):
        network = "Amazon"
    tag = parse_qs(parsed.query).get("tag", [None])[0]
    return {"url": url, "host": host, "network": network, "affiliate_tag": tag}


def affiliate_links(video: dict) -> list:
    """Return the classified links of a video's description that belong to a known commerce network."""
    return [link for link in map(classify_link, extract_links(video.get("description"))) if link["network"]]


def enrich(videos: list, now: datetime, window: int = 30) -> list:
    """Return copies of the videos with engagement_rate, views_per_hour, outlier_score, and affiliate_links."""
    baselines = channel_baselines(videos, window)
    enriched = []
    for video in videos:
        row = dict(video)
        row["engagement_rate"] = engagement_rate(video)
        row["views_per_hour"] = views_per_hour(video, now)
        row["outlier_score"] = outlier_score(video, baselines)
        row["affiliate_links"] = affiliate_links(video)
        enriched.append(row)
    return enriched


def network_summary(videos: Iterable[dict]) -> list:
    """Return (network, videos carrying it, total links) rows, most videos first."""
    counts: dict = {}
    for video in videos:
        networks = [link["network"] for link in video.get("affiliate_links", [])]
        for network in set(networks):
            entry = counts.setdefault(network, [0, 0])
            entry[0] += 1
        for network in networks:
            counts[network][1] += 1
    return sorted(([name, pair[0], pair[1]] for name, pair in counts.items()), key=lambda row: (-row[1], row[0]))
