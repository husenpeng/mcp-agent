"""Brand-insight metrics: share of voice, net sentiment, daily series, spikes, and keywords.

Pure functions over plain dictionaries. A mention record carries: brand,
source, id, url, title, text, published_at (ISO 8601 or None), engagement
(likes/points + comments, or None when the source has no counts), author,
and language; sentiment fields are added by `score_sentiment`. Missing counts
are None and never treated as zero.
"""

from __future__ import annotations

import math
import re
import statistics
from datetime import date, datetime, timedelta
from typing import Callable, Iterable, Optional

#: VADER compound thresholds recommended by its authors.
POSITIVE, NEGATIVE = 0.05, -0.05
#: A day is a spike when its z-score against the brand's window exceeds this.
SPIKE_Z = 2.0

STOPWORDS = set("""
a about above after again against all also am an and any are as at be because been before being below between both but by
can could did do does doing down during each few for from further had has have having he her here hers him his how i if in
into is it its itself just let me more most my no nor not now of off on once only or other our out over own same she should
so some such than that the their them then there these they this those through to too under until up very was we were what
when where which while who whom why will with would you your yours new says said via one two get got like make makes made
use using used just people year years time day week today news report reports update amp quot http https www com html
""".split())
_WORD = re.compile(r"[a-z][a-z0-9'+\-]{2,}")


def sov(values: dict) -> dict:
    """Return {brand: value ÷ sum × 100}; brands with None stay None; None everywhere when no brand has a positive value."""
    known = {brand: value for brand, value in values.items() if value is not None}
    total = sum(known.values())
    if not total:
        return {brand: None for brand in values}
    return {brand: None if value is None else value / total * 100 for brand, value in values.items()}


def label(compound: Optional[float]) -> Optional[str]:
    """Return positive / negative / neutral for a VADER compound score, None when unscored."""
    if compound is None:
        return None
    return "positive" if compound >= POSITIVE else "negative" if compound <= NEGATIVE else "neutral"


def score_sentiment(mentions: list, scorer: Optional[Callable[[str], float]]) -> list:
    """Return copies of the mentions with compound and sentiment; both None without a scorer."""
    rows = []
    for mention in mentions:
        row = dict(mention)
        row["compound"] = scorer(mention.get("text") or "") if scorer else None
        row["sentiment"] = label(row["compound"])
        rows.append(row)
    return rows


def net_sentiment(mentions: Iterable[dict]) -> dict:
    """Return sentiment counts and both net-sentiment variants for scored mentions.

    net_polar = (positive − negative) ÷ (positive + negative) × 100 (Talkwalker);
    net_total = (positive − negative) ÷ all scored mentions × 100 (Brandwatch).
    Each is None when its denominator is zero.
    """
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for mention in mentions:
        if mention.get("sentiment") in counts:
            counts[mention["sentiment"]] += 1
    polar = counts["positive"] + counts["negative"]
    scored = polar + counts["neutral"]
    return {
        **counts,
        "scored": scored,
        "net_polar": (counts["positive"] - counts["negative"]) / polar * 100 if polar else None,
        "net_total": (counts["positive"] - counts["negative"]) / scored * 100 if scored else None,
    }


def dedupe(mentions: list) -> list:
    """Drop repeated (brand, url or id) pairs, keeping the first occurrence."""
    seen: set = set()
    unique = []
    for mention in mentions:
        key = (mention.get("brand"), mention.get("url") or mention.get("id"))
        if key in seen:
            continue
        seen.add(key)
        unique.append(mention)
    return unique


def days_between(start: date, end: date) -> list:
    """Return ISO dates from start to end inclusive."""
    return [(start + timedelta(days=offset)).isoformat() for offset in range((end - start).days + 1)]


def daily_counts(mentions: Iterable[dict], brand: str, days: list) -> dict:
    """Return {day: mention count} for one brand over every day of the window (zero when no mention was found)."""
    counts = dict.fromkeys(days, 0)
    for mention in mentions:
        day = (mention.get("published_at") or "")[:10]
        if mention.get("brand") == brand and day in counts:
            counts[day] += 1
    return counts


def zscores(series: dict) -> dict:
    """Return {day: (value − mean) ÷ population std} over the known values; None without at least 3 values or any spread."""
    known = [value for value in series.values() if value is not None]
    if len(known) < 3:
        return {day: None for day in series}
    mean = statistics.fmean(known)
    spread = statistics.pstdev(known)
    if not spread:
        return {day: None for day in series}
    return {day: None if value is None else (value - mean) / spread for day, value in series.items()}


def spikes(series: dict, threshold: float = SPIKE_Z) -> list:
    """Return [(day, value, z)] for days whose z-score exceeds the threshold, in date order."""
    return [(day, series[day], z) for day, z in zscores(series).items() if z is not None and z > threshold]


def spike_drivers(mentions: Iterable[dict], brand: str, day: str, limit: int = 3) -> list:
    """Return the brand's mentions on a day, highest engagement first, as candidate explanations."""
    items = [mention for mention in mentions if mention.get("brand") == brand and (mention.get("published_at") or "")[:10] == day]
    return sorted(items, key=lambda mention: (-(mention.get("engagement") or 0), mention.get("title") or ""))[:limit]


def words(text: str, exclude: Iterable[str] = ()) -> list:
    """Return lowercase English content words (≥ 3 letters) without stop words or excluded brand words."""
    skip = STOPWORDS | {word.lower() for term in exclude for word in re.findall(r"[a-z0-9]+", term.lower())}
    return [word.strip("'-") for word in _WORD.findall((text or "").lower()) if word.strip("'-") not in skip]


def keyword_table(mentions: list, brands: list, exclude: Iterable[str], top: int = 30) -> list:
    """Return per-brand keyword rows with count and lift = (brand share of the word) ÷ (all-brand share).

    Each mention contributes each word once; brand names and aliases in `exclude` are skipped.
    """
    exclude = list(exclude)
    per_brand: dict = {brand: {} for brand in brands}
    for mention in mentions:
        if mention.get("brand") not in per_brand:
            continue
        for word in set(words(mention.get("text"), exclude)):
            per_brand[mention["brand"]][word] = per_brand[mention["brand"]].get(word, 0) + 1
    overall: dict = {}
    for counts in per_brand.values():
        for word, count in counts.items():
            overall[word] = overall.get(word, 0) + count
    grand = sum(overall.values())
    rows = []
    for brand, counts in per_brand.items():
        total = sum(counts.values())
        ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:top]
        for rank, (word, count) in enumerate(ranked, start=1):
            rows.append({"brand": brand, "rank": rank, "keyword": word, "count": count,
                         "lift": (count / total) / (overall[word] / grand) if total and grand else None})
    return rows


def topic_table(mentions: list, brands: list, exclude: Iterable[str], top: int = 15) -> list:
    """Return per-brand bigram topics with mention count and one example title, most frequent first."""
    exclude = list(exclude)
    found: dict = {}
    for mention in mentions:
        if mention.get("brand") not in brands:
            continue
        tokens = words(mention.get("text"), exclude)
        for pair in {f"{tokens[i]} {tokens[i + 1]}" for i in range(len(tokens) - 1)}:
            entry = found.setdefault((mention["brand"], pair), {"count": 0, "example": mention.get("title") or "", "url": mention.get("url") or ""})
            entry["count"] += 1
    rows = []
    for brand in brands:
        ranked = sorted(((pair, entry) for (owner, pair), entry in found.items() if owner == brand and entry["count"] >= 2),
                        key=lambda item: (-item[1]["count"], item[0]))[:top]
        rows += [{"brand": brand, "topic": pair, "mentions": entry["count"], "example": entry["example"], "url": entry["url"]} for pair, entry in ranked]
    return rows


def jaccard(left: set, right: set) -> Optional[float]:
    """Return |A ∩ B| ÷ |A ∪ B|, or None when both sets are empty."""
    union = left | right
    return len(left & right) / len(union) if union else None


def keyword_overlap(keywords: list, brands: list) -> list:
    """Return (brand, other, Jaccard of their top keyword sets) for every brand pair."""
    sets = {brand: {row["keyword"] for row in keywords if row["brand"] == brand} for brand in brands}
    return [(left, right, jaccard(sets[left], sets[right])) for index, left in enumerate(brands) for right in brands[index + 1:]]


def brand_summary(mentions: list, brands: list, attention: dict) -> list:
    """Return one row per brand: mentions, engagement, both SOV variants, sentiment, and attention totals.

    `attention` maps brand → {"gdelt_volume": {day: value}, "pageviews": {day: views}, "youtube_results": int or None}.
    """
    mention_counts = {brand: sum(mention.get("brand") == brand for mention in mentions) for brand in brands}
    engagement: dict = {}
    for brand in brands:
        values = [mention["engagement"] for mention in mentions if mention.get("brand") == brand and mention.get("engagement") is not None]
        engagement[brand] = sum(values) if values else None
    pageview_totals = {brand: sum((attention.get(brand) or {}).get("pageviews", {}).values()) if (attention.get(brand) or {}).get("pageviews") else None for brand in brands}
    volume_means = {}
    for brand in brands:
        series = (attention.get(brand) or {}).get("gdelt_volume") or {}
        volume_means[brand] = statistics.fmean(series.values()) if series else None
    sov_mentions, sov_engagement = sov(mention_counts), sov(engagement)
    sov_pageviews = sov(pageview_totals)
    rows = []
    for brand in brands:
        sentiment = net_sentiment(mention for mention in mentions if mention.get("brand") == brand)
        rows.append({
            "brand": brand,
            "mentions": mention_counts[brand],
            "engagement": engagement[brand],
            "sov_mentions": sov_mentions[brand],
            "sov_engagement": sov_engagement[brand],
            **{key: sentiment[key] for key in ("positive", "negative", "neutral", "scored", "net_polar", "net_total")},
            "gdelt_volume_mean": volume_means[brand],
            "pageviews": pageview_totals[brand],
            "attention_share": sov_pageviews[brand],
            "youtube_results": (attention.get(brand) or {}).get("youtube_results"),
            "sources": ", ".join(sorted({mention["source"] for mention in mentions if mention.get("brand") == brand})),
        })
    return rows


def daily_metrics(mentions: list, brands: list, days: list, attention: dict) -> list:
    """Return one row per brand and day with mentions, engagement, sentiment, attention series, and the mention z-score."""
    rows = []
    for brand in brands:
        counts = daily_counts(mentions, brand, days)
        z = zscores(counts)
        info = attention.get(brand) or {}
        for day in days:
            today = [mention for mention in mentions if mention.get("brand") == brand and (mention.get("published_at") or "")[:10] == day]
            values = [mention["engagement"] for mention in today if mention.get("engagement") is not None]
            sentiment = net_sentiment(today)
            rows.append({
                "date": day, "brand": brand, "mentions": counts[day], "engagement": sum(values) if values else None,
                "positive": sentiment["positive"], "negative": sentiment["negative"], "neutral": sentiment["neutral"],
                "net_polar": sentiment["net_polar"], "gdelt_volume": (info.get("gdelt_volume") or {}).get(day),
                "pageviews": (info.get("pageviews") or {}).get(day), "mention_z": z[day],
            })
    return rows


def spike_table(mentions: list, brands: list, days: list, attention: dict) -> list:
    """Return spike rows for mention counts, GDELT volume, and pageviews, each with up to three driver mentions."""
    rows = []
    for brand in brands:
        info = attention.get(brand) or {}
        series = {
            "mentions": daily_counts(mentions, brand, days),
            "gdelt_volume": info.get("gdelt_volume") or {},
            "pageviews": info.get("pageviews") or {},
        }
        for name, values in series.items():
            for day, value, z in spikes(values):
                drivers = spike_drivers(mentions, brand, day)
                rows.append({
                    "date": day, "brand": brand, "series": name, "value": value, "z": z,
                    "drivers": [{"title": driver.get("title") or driver.get("url"), "url": driver.get("url"), "source": driver["source"]} for driver in drivers],
                })
    return sorted(rows, key=lambda row: (row["date"], row["brand"], row["series"]))


def log_scale(value: Optional[float]) -> Optional[float]:
    """Return log10(1 + value) for chart scaling, None when unknown."""
    return None if value is None else math.log10(1 + value)


def parse_day(text: str) -> date:
    """Parse YYYY-MM-DD."""
    return datetime.strptime(text, "%Y-%m-%d").date()
