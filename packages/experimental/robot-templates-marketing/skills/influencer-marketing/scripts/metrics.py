"""Creator metrics: Modash-style engagement, tier benchmarks, an audience-quality heuristic, rates, lookalikes, and contacts.

Pure functions over the plain dictionaries built in collect.py. A creator
record carries platform, handle, name, followers, bio, posts (list of post
records), source, and discovered_by; a post record carries id, title,
published_at, views, likes, comments, and url. Missing counts are None and are
never treated as zero.
"""

from __future__ import annotations

import math
import re
import statistics
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

#: Modash Instagram engagement-rate bands (median likes ÷ followers × 100), from
#: https://www.modash.io/engagement-rate-calculator (84M+ profiles). Each band
#: lists the lower edges, in percent, of: high, above average, average, below average.
BENCHMARKS = [
    {"tier": "nano", "followers": (1_000, 10_000), "modash_column": "1k–5k", "edges": (6.16, 3.85, 3.16, 1.85)},
    {"tier": "micro", "followers": (10_000, 100_000), "modash_column": "10k–50k", "edges": (1.27, 0.65, 0.49, 0.24)},
    {"tier": "mid", "followers": (100_000, 1_000_000), "modash_column": "100k–500k", "edges": (0.93, 0.46, 0.35, 0.16)},
    {"tier": "mega", "followers": (1_000_000, None), "modash_column": "1M+", "edges": (1.08, 0.57, 0.45, 0.22)},
]
BANDS = ("high", "above average", "average", "below average", "low")

#: Per-platform CPM ranges in USD used when the run gives no --cpm override.
#: They are planning assumptions, disclosed in the report, not market quotes.
DEFAULT_CPM = {"youtube": (15.0, 35.0), "tiktok": (8.0, 20.0), "instagram": (10.0, 25.0), "x": (5.0, 15.0)}

#: Healthy band for the median likes ÷ comments ratio of a creator's posts.
LIKE_COMMENT_BAND = (10.0, 200.0)

ER_WINDOW_DAYS = 60

_EMAIL = re.compile(r"(?<![\w.+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}(?![\w-])")
_OBFUSCATED = re.compile(
    r"([A-Za-z0-9._%+-]+)\s*[\[(]\s*at\s*[\])]\s*([A-Za-z0-9-]+(?:\s*[\[(]\s*dot\s*[\])]\s*[A-Za-z0-9-]+)+)", re.IGNORECASE
)
_DOT = re.compile(r"\s*[\[(]\s*dot\s*[\])]\s*", re.IGNORECASE)
_ROLE = {"info", "contact", "hello", "business", "partnerships", "partner", "collab", "collabs", "booking", "press", "pr", "media", "management", "sponsor", "sponsorships", "inquiries", "enquiries"}
_LABEL = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$")
_TOKEN = re.compile(r"[a-z0-9][a-z0-9'+-]*|[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]+")
_STOP = set(
    "a an and are as at be but by for from has have i in is it its me my of on or our so that the this to was we with you your "
    "new video videos channel subscribe follow link links watch here more get all just like official www com http https "
    "youtube tiktok instagram email business inquiries contact".split()
)


# --- engagement --------------------------------------------------------------


def parse_time(text: Optional[str]) -> Optional[datetime]:
    """Parse ISO 8601 or YYYYMMDD into an aware UTC datetime; None when unknown."""
    if not text:
        return None
    value = text.replace("Z", "+00:00")
    if len(value) == 8 and value.isdigit():
        value = f"{value[:4]}-{value[4:6]}-{value[6:]}T00:00:00+00:00"
    parsed = datetime.fromisoformat(value)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def window_posts(posts: list, now: datetime, days: int = ER_WINDOW_DAYS) -> tuple:
    """Return (posts, window label): posts of the last `days`, or every sampled post when no post has a date."""
    dated = [(post, parse_time(post.get("published_at"))) for post in posts]
    if not any(when for _, when in dated):
        return posts, "sample (dates missing)"
    cutoff = now - timedelta(days=days)
    return [post for post, when in dated if when and when >= cutoff], f"last {days} days"


def median_of(values: Iterable) -> Optional[float]:
    """Return the median of the non-None values, or None when there are none."""
    known = [value for value in values if value is not None]
    return float(statistics.median(known)) if known else None


def modash_engagement_rate(followers: Optional[int], posts: list) -> Optional[float]:
    """Return median likes ÷ followers × 100 (percent), or None without followers or likes."""
    likes = median_of(post.get("likes") for post in posts)
    if not followers or likes is None:
        return None
    return likes / followers * 100


def view_engagement_rate(posts: list) -> Optional[float]:
    """Return the median per-post (likes + comments) ÷ views × 100 (percent), or None."""
    rates = []
    for post in posts:
        views, likes, comments = post.get("views"), post.get("likes"), post.get("comments")
        if views and (likes is not None or comments is not None):
            rates.append(((likes or 0) + (comments or 0)) / views * 100)
    return median_of(rates)


def tier_of(followers: Optional[int]) -> Optional[dict]:
    """Return the benchmark row for a follower count, or None below 1k or when unknown."""
    if followers is None:
        return None
    for row in BENCHMARKS:
        low, high = row["followers"]
        if followers >= low and (high is None or followers < high):
            return row
    return None


def benchmark_band(rate: Optional[float], tier: Optional[dict]) -> Optional[str]:
    """Return the Modash band name for an engagement rate in percent within its tier."""
    if rate is None or tier is None:
        return None
    for name, edge in zip(BANDS, tier["edges"]):
        if rate > edge if name == "high" else rate >= edge:
            return name
    return BANDS[-1]


def percentile_rank(value: Optional[float], population: list) -> Optional[float]:
    """Return the mid-rank percentile (0–100) of value among the non-None population values."""
    known = [item for item in population if item is not None]
    if value is None or not known:
        return None
    below = sum(1 for item in known if item < value)
    equal = sum(1 for item in known if item == value)
    return (below + 0.5 * equal) / len(known) * 100


# --- audience-quality heuristic ----------------------------------------------


def _log_band_score(value: float, low: float, high: float, span: float = 1.0) -> float:
    """100 inside [low, high]; falls linearly to 0 at `span` decades outside the band."""
    if low <= value <= high:
        return 100.0
    distance = math.log10(low / value) if value < low else math.log10(value / high)
    return max(0.0, 100.0 * (1 - distance / span))


def like_comment_signal(posts: list) -> tuple:
    """Return (median likes ÷ comments, score) over posts with both counts and comments > 0."""
    ratios = [post["likes"] / post["comments"] for post in posts if post.get("likes") is not None and post.get("comments")]
    if len(ratios) < 3:
        return None, None
    ratio = statistics.median(ratios)
    if ratio == 0:
        return 0.0, 0.0
    return ratio, _log_band_score(ratio, *LIKE_COMMENT_BAND, span=1.5)


def view_follower_signal(followers: Optional[int], posts: list) -> tuple:
    """Return (median views ÷ followers, score); ≥ 0.1 scores 100, falling to 0 at 0.001."""
    views = median_of(post.get("views") for post in posts)
    if not followers or views is None:
        return None, None
    ratio = views / followers
    if ratio >= 0.1:
        return ratio, 100.0
    if ratio <= 0.001:
        return ratio, 0.0
    return ratio, 100.0 * (math.log10(ratio) + 3) / 2


def regularity_signal(posts: list) -> tuple:
    """Return (coefficient of variation of posting intervals, score) from at least four dated posts."""
    times = sorted(when for when in (parse_time(post.get("published_at")) for post in posts) if when)
    if len(times) < 4:
        return None, None
    gaps = [(later - earlier).total_seconds() / 86400 for earlier, later in zip(times, times[1:])]
    mean = statistics.mean(gaps)
    if mean == 0:
        return None, None
    cv = statistics.pstdev(gaps) / mean
    return cv, 100.0 * max(0.0, 1 - min(cv, 2.0) / 2)


def audience_quality(followers: Optional[int], posts: list) -> dict:
    """Return the heuristic score (0–100, equal weights over available signals) and its components."""
    lc_ratio, lc_score = like_comment_signal(posts)
    vf_ratio, vf_score = view_follower_signal(followers, posts)
    cv, reg_score = regularity_signal(posts)
    scores = [score for score in (lc_score, vf_score, reg_score) if score is not None]
    return {
        "aq_heuristic": round(statistics.mean(scores), 1) if scores else None,
        "aq_signals": len(scores),
        "like_comment_ratio": lc_ratio, "like_comment_score": lc_score,
        "view_follower_ratio": vf_ratio, "view_follower_score": vf_score,
        "interval_cv": cv, "regularity_score": reg_score,
    }


# --- rates -------------------------------------------------------------------


def rate_estimate(platform: str, median_views: Optional[float], cpm: dict) -> tuple:
    """Return (low, high) USD per post = CPM range × median views ÷ 1000, or (None, None)."""
    band = cpm.get(platform)
    if median_views is None or band is None:
        return None, None
    return band[0] * median_views / 1000, band[1] * median_views / 1000


def parse_cpm(values: list) -> dict:
    """Merge `platform=low-high` overrides into DEFAULT_CPM; raise ValueError on bad input."""
    table = dict(DEFAULT_CPM)
    for value in values:
        match = re.fullmatch(r"\s*([a-z]+)\s*=\s*([\d.]+)\s*-\s*([\d.]+)\s*", value or "")
        if not match or float(match.group(2)) > float(match.group(3)):
            raise ValueError(f"--cpm expects platform=low-high, for example youtube=15-35; got {value!r}")
        table[match.group(1)] = (float(match.group(2)), float(match.group(3)))
    return table


# --- lookalikes (TF-IDF, pure Python) ----------------------------------------


def tokenize(text: str) -> list:
    """Lowercase word tokens without stopwords; CJK runs become character bigrams."""
    tokens = []
    for token in _TOKEN.findall((text or "").lower()):
        if re.match(r"[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]", token):
            tokens += [token[i:i + 2] for i in range(max(1, len(token) - 1))]
        elif len(token) > 1 and token not in _STOP and not token.isdigit():
            tokens.append(token)
    return tokens


def creator_document(creator: dict) -> str:
    """Return the text compared for lookalikes: name, bio, and post titles."""
    return " ".join([creator.get("name") or "", creator.get("bio") or ""] + [post.get("title") or "" for post in creator.get("posts", [])])


def tfidf_vectors(documents: list) -> list:
    """Return L2-normalised sparse TF-IDF vectors (dicts) with smoothed idf = ln((1+N)/(1+df)) + 1."""
    tokenized = [tokenize(document) for document in documents]
    count = len(tokenized)
    df = Counter(token for tokens in tokenized for token in set(tokens))
    vectors = []
    for tokens in tokenized:
        tf = Counter(tokens)
        vector = {token: (n / len(tokens)) * (math.log((1 + count) / (1 + df[token])) + 1) for token, n in tf.items()}
        norm = math.sqrt(sum(weight * weight for weight in vector.values()))
        vectors.append({token: weight / norm for token, weight in vector.items()} if norm else {})
    return vectors


def cosine(left: dict, right: dict) -> float:
    """Return the dot product of two L2-normalised sparse vectors."""
    if len(left) > len(right):
        left, right = right, left
    return sum(weight * right.get(token, 0.0) for token, weight in left.items())


def lookalikes(creators: list, top: int = 3) -> list:
    """Return lookalike rows ranked by TF-IDF cosine similarity.

    With seeds (discovered_by == "seed"), every other creator is ranked by its
    best similarity to any seed. Without seeds, each creator lists its `top`
    nearest neighbours. Rows: creator, similar_to, similarity, rank, mode.
    """
    vectors = tfidf_vectors([creator_document(creator) for creator in creators])
    seeds = [index for index, creator in enumerate(creators) if creator.get("discovered_by") == "seed"]
    rows = []
    if seeds:
        scored = []
        for index, creator in enumerate(creators):
            if index in seeds:
                continue
            best = max(seeds, key=lambda seed: cosine(vectors[index], vectors[seed]))
            scored.append((cosine(vectors[index], vectors[best]), creator["key"], creators[best]["key"]))
        for rank, (similarity, key, seed_key) in enumerate(sorted(scored, key=lambda row: (-row[0], row[1])), start=1):
            rows.append({"creator": key, "similar_to": seed_key, "similarity": similarity, "rank": rank, "mode": "seed"})
        return rows
    for index, creator in enumerate(creators):
        neighbours = sorted(
            ((cosine(vectors[index], vectors[other]), creators[other]["key"]) for other in range(len(creators)) if other != index),
            key=lambda row: (-row[0], row[1]),
        )[:top]
        for rank, (similarity, other_key) in enumerate(neighbours, start=1):
            rows.append({"creator": creator["key"], "similar_to": other_key, "similarity": similarity, "rank": rank, "mode": "neighbour"})
    return rows


# --- contacts ----------------------------------------------------------------


def extract_emails(text: Optional[str]) -> list:
    """Return unique lowercase emails written in a bio or description, including `name [at] domain [dot] com`."""
    if not text:
        return []
    found = [match.group(0) for match in _EMAIL.finditer(text)]
    found += [f"{match.group(1)}@{_DOT.sub('.', match.group(2))}" for match in _OBFUSCATED.finditer(text)]
    unique: list = []
    for email in (item.strip(".").lower() for item in found):
        if email not in unique:
            unique.append(email)
    return unique


def email_syntax(email: str) -> Optional[str]:
    """Return None when the address passes the syntax checks, otherwise the reason it fails."""
    if email.count("@") != 1:
        return "must contain exactly one @"
    local, domain = email.split("@")
    if not local or len(local) > 64:
        return "local part must be 1–64 characters"
    if local.startswith(".") or local.endswith(".") or ".." in local:
        return "local part has a leading, trailing, or doubled dot"
    if not re.fullmatch(r"[A-Za-z0-9._%+-]+", local):
        return "local part has characters outside A–Z, 0–9, and ._%+-"
    if len(domain) > 253 or "." not in domain:
        return "domain must contain a dot and be at most 253 characters"
    labels = domain.split(".")
    if not all(_LABEL.fullmatch(label) for label in labels):
        return "domain has an empty or invalid label"
    if not re.fullmatch(r"[A-Za-z]{2,24}", labels[-1]):
        return "top-level domain must be 2–24 letters"
    return None


def mx_verdict(answer: dict) -> tuple:
    """Interpret a dns.google MX answer as (status, mx hosts); status is mx_found, no_mx_record, or domain_not_found."""
    if answer.get("Status") == 3:
        return "domain_not_found", []
    if answer.get("Status") != 0:
        return f"dns_error_status_{answer.get('Status')}", []
    hosts = sorted(
        (record.get("data") or "").split(" ")[-1].rstrip(".")
        for record in answer.get("Answer") or [] if record.get("type") == 15
    )
    hosts = [host for host in hosts if host]
    return ("mx_found", hosts) if hosts else ("no_mx_record", [])


def is_role_account(email: str) -> bool:
    """Return whether the local part is a shared role mailbox such as business@ or collab@."""
    return email.split("@")[0].split("+")[0] in _ROLE


# --- per-creator enrichment --------------------------------------------------


def enrich(creators: list, now: datetime, cpm: dict) -> list:
    """Return copies of creators with engagement, tier, band, percentiles, heuristic score, rate, and fit score."""
    rows = []
    for creator in creators:
        row = dict(creator)
        posts, window = window_posts(creator.get("posts", []), now)
        tier = tier_of(creator.get("followers"))
        row["er_window"] = window
        row["er_window_posts"] = len(posts)
        row["engagement_rate"] = modash_engagement_rate(creator.get("followers"), posts)
        row["view_engagement_rate"] = view_engagement_rate(posts)
        row["median_likes"] = median_of(post.get("likes") for post in posts)
        row["median_views"] = median_of(post.get("views") for post in posts)
        row["tier"] = tier["tier"] if tier else (None if creator.get("followers") is None else "under 1k")
        row["benchmark_column"] = tier["modash_column"] if tier else None
        row["benchmark_band"] = benchmark_band(row["engagement_rate"], tier)
        row.update(audience_quality(creator.get("followers"), creator.get("posts", [])))
        row["rate_low"], row["rate_high"] = rate_estimate(creator["platform"], row["median_views"], cpm)
        rows.append(row)
    rates = [row["engagement_rate"] for row in rows]
    for row in rows:
        row["er_percentile"] = percentile_rank(row["engagement_rate"], rates)
        same_tier = [other["engagement_rate"] for other in rows if other["tier"] == row["tier"]]
        row["er_tier_percentile"] = percentile_rank(row["engagement_rate"], same_tier) if row["tier"] else None
    best = {}
    for item in lookalikes(rows):
        if item["mode"] == "seed":
            best[item["creator"]] = item["similarity"]
    for row in rows:
        row["seed_similarity"] = best.get(row["key"])
        parts = [value for value in (row["er_percentile"], row["aq_heuristic"], None if row["seed_similarity"] is None else row["seed_similarity"] * 100) if value is not None]
        row["fit_score"] = round(statistics.mean(parts), 1) if parts else None
    return rows


def in_follower_range(creator: dict, minimum: Optional[int], maximum: Optional[int]) -> bool:
    """Return whether known followers fall in [minimum, maximum]; unknown followers always pass."""
    followers = creator.get("followers")
    if followers is None:
        return True
    return (minimum is None or followers >= minimum) and (maximum is None or followers <= maximum)
