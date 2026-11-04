"""Product-selection metrics for YouTube review videos and their comments.

Pure functions over plain dictionaries. A video record carries: id, title,
channel_id, channel_title, published_at (ISO 8601, YYYYMMDD, or None),
duration_seconds, views, likes, comments, description, and url. A comment
record carries: video_id, id, text, likes, published_at. Missing counts are
None and never treated as zero.
"""

from __future__ import annotations

import math
import re
import statistics
import unicodedata
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

#: Breakout threshold on the outlier score.
BREAKOUT = 3.0

#: Opportunity score weights over cluster percentile ranks; the report prints them.
OPPORTUNITY_WEIGHTS = {"demand": 0.5, "heat": 0.3, "affiliate": 0.2}

_URL = re.compile(r"https?://[^\s<>\"')\]]+", re.IGNORECASE)

# Comment intent lexicon: (intent key, Chinese label, English patterns, Chinese substrings).
# English patterns are case-insensitive regular expressions; Chinese entries match as substrings.
INTENTS = [
    ("link_request", "求链接", [r"\blinks?\b", r"\burl\b"], ["链接", "求链", "网址", "传送门"]),
    ("price", "问价格", [r"\bprices?\b", r"\bhow much\b", r"\bcosts?\b", r"\$\s?\d", r"\bdiscount\b", r"\bcoupon\b", r"\bpromo code\b", r"\bon sale\b"],
     ["多少钱", "价格", "价钱", "售价", "优惠", "折扣", "贵不贵", "便宜"]),
    ("where_to_buy", "问在哪买", [r"\bwhere (can|do|did|to|would|should) (i |you |we )?(buy|get|order|find)", r"\bwhere to buy\b", r"\bavailable in\b", r"\bships? to\b", r"\bin stock\b", r"\bsold out\b"],
     ["哪里买", "在哪买", "哪儿买", "哪买", "怎么买", "购买渠道", "有货", "买得到", "哪里有卖"]),
    ("comparison", "竞品比较", [r"\bvs\.?\b", r"\bversus\b", r"\bcompared? (to|with)\b", r"\bbetter than\b", r"\bworse than\b", r"\binstead of\b", r"\balternatives?\b"],
     ["对比", "比较", "相比", "哪个好", "哪款", "区别", "不如"]),
    ("complaint", "抱怨", [r"\bbr(oke|oken)\b", r"\bstopped working\b", r"\bdefect", r"\brefund", r"\breturned\b", r"\bwaste\b", r"\bdisappoint", r"\bterrible\b", r"\bworst\b", r"\bflimsy\b", r"\bwobbl", r"\bnois(y|e)\b", r"\bdoes(n't| not) work\b", r"\bjunk\b", r"\bscam\b", r"\boverpriced\b", r"\bproblems?\b", r"\bissues?\b"],
     ["坏了", "质量差", "退货", "退款", "失望", "垃圾", "故障", "难用", "智商税", "翻车", "噪音", "问题"]),
    ("feature_request", "想要功能", [r"\bi wish\b", r"\bwish (it|they|there)\b", r"\bwould be (nice|great|better)\b", r"\bif only\b", r"\bshould (have|add|come with)\b", r"\bplease add\b", r"\bneeds? (a|an|more|better)\b", r"\bhope (they|the next)\b", r"\bmissing\b", r"\blacks?\b"],
     ["希望", "要是能", "如果有", "能不能加", "建议加", "缺少", "想要", "期待"]),
]
_INTENT_RE = {key: re.compile("|".join(patterns), re.IGNORECASE) for key, _, patterns, _ in INTENTS}
INTENT_LABELS = {key: label for key, label, _, _ in INTENTS}
#: Intents that signal purchase demand rather than product feedback.
PURCHASE_INTENTS = ("link_request", "price", "where_to_buy")

# Words that never name a product in a review title.
STOPWORDS = set("""
a an the and or of for to in on with by at from as is are was be it its this that these those my your our me i you we
review reviews reviewed unboxing unbox unboxed vs versus best top honest worth buying buy bought before after
month months year years day days week weeks later long term test tested testing comparison compare compared new first
look impressions hands guide which should get why how what dont don't do does watch ultimate budget cheap cheapest
under over really actually still setup full video shorts official ft feat vlog part tips must have good better
worst bad amazing awesome finally ever every any all most more than vs. 2 in-depth indepth detailed quick update
""".split())
ZH_STOPWORDS = ["测评", "评测", "开箱", "对比", "推荐", "最好", "值得", "真实", "体验", "使用", "横评", "选购", "指南", "吗", "的", "了", "是", "买"]
_VS = re.compile(r"\bvs\.?\b|\bversus\b|对比|对决|\bPK\b", re.IGNORECASE)
_TOKEN = re.compile(r"[a-z0-9][a-z0-9+\-']*|[\u3400-\u9fff]+")


def engagement_rate(video: dict) -> Optional[float]:
    """Return (likes + comments) / views, or None when views or both counts are unknown."""
    views = video.get("views")
    likes = video.get("likes")
    comments = video.get("comments")
    if not views or (likes is None and comments is None):
        return None
    return ((likes or 0) + (comments or 0)) / views


def hours_since(published_at: Optional[str], now: datetime) -> Optional[float]:
    """Return hours between an ISO 8601 or YYYYMMDD timestamp and now, at least one hour; None when unknown."""
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
    Duplicate video ids count once.
    """
    by_channel: dict = {}
    seen: set = set()
    for video in videos:
        if video.get("views") is None or not video.get("channel_id") or video.get("id") in seen:
            continue
        seen.add(video.get("id"))
        by_channel.setdefault(video["channel_id"], []).append(video)
    baselines = {}
    for channel_id, items in by_channel.items():
        items.sort(key=lambda item: _sortable_date(item.get("published_at")), reverse=True)
        baselines[channel_id] = statistics.median(item["views"] for item in items[:window])
    return baselines


def _sortable_date(value: Optional[str]) -> str:
    if value and len(value) == 8 and value.isdigit():
        return f"{value[:4]}-{value[4:6]}-{value[6:]}"
    return value or ""


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


def network_summary(videos: Iterable[dict]) -> list:
    """Return (network, videos carrying it, total links) rows, most videos first."""
    counts: dict = {}
    for video in videos:
        networks = [link["network"] for link in video.get("affiliate_links", [])]
        for network in set(networks):
            counts.setdefault(network, [0, 0])[0] += 1
        for network in networks:
            counts[network][1] += 1
    return sorted(([name, pair[0], pair[1]] for name, pair in counts.items()), key=lambda row: (-row[1], row[0]))


def classify_intents(text: Optional[str]) -> list:
    """Return the intent keys a comment matches, in lexicon order; one comment may match several."""
    if not text:
        return []
    lowered = text.lower()
    return [key for key, _, _, zh in INTENTS if _INTENT_RE[key].search(lowered) or any(word in text for word in zh)]


def like_weight(likes: Optional[int]) -> float:
    """Return 1 + log10(1 + likes); unknown likes weigh 1."""
    return 1.0 + math.log10(1 + likes) if likes else 1.0


def comment_demand(comment: dict) -> float:
    """Return intent hits × like weight for one comment."""
    return len(comment.get("intents") or []) * like_weight(comment.get("likes"))


def tokens(text: str, extra_stop: Iterable[str] = ()) -> list:
    """Return normalized title token runs: NFKC, lowercase, bracketed text, years, and stop words removed.

    Returns a list of token lists, one per run of consecutive kept tokens, so
    n-grams never span punctuation or a removed stop word. `extra_stop` words
    (the category) are dropped without splitting the run, so "Alpha Desk Pro"
    with category "desk" yields ["alpha", "pro"]. CJK runs stay whole.
    """
    skip = {word.lower() for word in extra_stop}
    stop = STOPWORDS
    text = unicodedata.normalize("NFKC", text).lower()
    text = re.sub(r"[\[(【（].*?[\])】）]", "|", text)
    for word in ZH_STOPWORDS:
        text = text.replace(word, "|")
    runs: list = []
    for piece in re.split(r"[|,:;!?/。，：；！？、#\"“”]+|\s[-–—]\s", text):
        run: list = []
        for token in _TOKEN.findall(piece):
            token = token.strip("-'")
            if token in skip:
                continue
            if not token or token in stop or re.fullmatch(r"(19|20)\d\d", token):
                if run:
                    runs.append(run)
                run = []
            else:
                run.append(token)
        if run:
            runs.append(run)
    return [run for run in runs if any(re.search(r"[a-z\u3400-\u9fff]", token) for token in run)]


def candidate_ngrams(runs: list, max_n: int = 3) -> list:
    """Return the distinct n-grams (n = 1..max_n) inside token runs, in first-seen order."""
    found: list = []
    for run in runs:
        for n in range(1, max_n + 1):
            for start in range(len(run) - n + 1):
                phrase = " ".join(run[start:start + n])
                if phrase not in found:
                    found.append(phrase)
    return found


def title_segments(title: Optional[str]) -> list:
    """Split a title on vs / versus / 对比 so each compared product yields its own phrase."""
    return [part for part in _VS.split(title or "") if part.strip()]


def product_phrases(videos: list, query_words: Iterable[str] = (), max_n: int = 3) -> dict:
    """Return {video id: [normalized product phrases]} using a document-frequency n-gram heuristic.

    Query words (the category) are treated as stop words. For each title
    segment the chosen phrase maximizes (document frequency ≥ 2, n ≥ 2,
    document frequency, n); a segment without a usable token yields nothing.
    """
    extra = [word for query in query_words for run in tokens(query) for word in run]
    per_segment: dict = {}
    frequency: dict = {}
    for video in videos:
        segments = [candidate_ngrams(tokens(segment, extra), max_n) for segment in title_segments(video.get("title"))]
        per_segment[video["id"]] = segments
        for phrase in {phrase for grams in segments for phrase in grams}:
            frequency[phrase] = frequency.get(phrase, 0) + 1
    result = {}
    for video_id, segments in per_segment.items():
        chosen: list = []
        for grams in segments:
            if not grams:
                continue
            best = max(grams, key=lambda phrase: (frequency[phrase] >= 2, " " in phrase, frequency[phrase], phrase.count(" "), -grams.index(phrase)))
            if best not in chosen:
                chosen.append(best)
        result[video_id] = chosen
    return result


def enrich(videos: list, now: datetime, baseline_videos: Iterable[dict] = (), window: int = 30) -> list:
    """Return copies of the videos with engagement_rate, views_per_hour, outlier_score, and affiliate_links.

    `baseline_videos` (recent uploads of the same channels) join the sample when computing channel medians.
    """
    baselines = channel_baselines(list(baseline_videos) + list(videos), window)
    enriched = []
    for video in videos:
        row = dict(video)
        row["engagement_rate"] = engagement_rate(video)
        row["views_per_hour"] = views_per_hour(video, now)
        row["outlier_score"] = outlier_score(video, baselines)
        row["affiliate_links"] = affiliate_links(video)
        enriched.append(row)
    return enriched


def classify_comments(comments: list) -> list:
    """Return copies of the comments with intents and demand fields."""
    rows = []
    for comment in comments:
        row = dict(comment)
        row["intents"] = classify_intents(comment.get("text"))
        row["demand"] = comment_demand(row)
        rows.append(row)
    return rows


def percentile_ranks(values: list) -> list:
    """Return each value's share of other values strictly below it (0..1); None ranks 0 and single values rank 1."""
    known = [value for value in values if value is not None]
    if len(known) <= 1:
        return [1.0 if value is not None else 0.0 for value in values]
    return [0.0 if value is None else sum(other < value for other in known) / (len(known) - 1) for value in values]


def product_clusters(videos: list, comments: list, phrases: dict) -> list:
    """Aggregate enriched videos and classified comments into product clusters, best opportunity first.

    A video compared with another product ("A vs B") counts toward both clusters.
    Status uses two signals: content heat (a breakout video, or a median VPH at or
    above the sample median) and audience demand (at least one purchase-intent
    comment). Validated when both hold, watch when one holds, rejected otherwise.
    """
    by_video: dict = {}
    for comment in comments:
        by_video.setdefault(comment["video_id"], []).append(comment)
    sample_vph = [video["views_per_hour"] for video in videos if video.get("views_per_hour") is not None]
    sample_median_vph = statistics.median(sample_vph) if sample_vph else None
    clusters: dict = {}
    for video in videos:
        for phrase in phrases.get(video["id"], []):
            clusters.setdefault(phrase, []).append(video)
    rows = []
    for phrase, items in clusters.items():
        cluster_comments = [comment for video in items for comment in by_video.get(video["id"], [])]
        intent_counts = {key: sum(key in comment["intents"] for comment in cluster_comments) for key, _, _, _ in INTENTS}
        vph = [video["views_per_hour"] for video in items if video.get("views_per_hour") is not None]
        views = [video["views"] for video in items if video.get("views") is not None]
        median_vph = statistics.median(vph) if vph else None
        breakouts = sum((video.get("outlier_score") or 0) >= BREAKOUT for video in items)
        purchase = sum(intent_counts[key] for key in PURCHASE_INTENTS)
        heat = breakouts > 0 or (median_vph is not None and sample_median_vph is not None and median_vph >= sample_median_vph)
        status = "validated" if purchase and heat else "watch" if purchase or heat else "rejected"
        rows.append({
            "product": phrase,
            "videos": len(items),
            "channels": len({video.get("channel_id") for video in items if video.get("channel_id")}),
            "total_views": sum(views) if views else None,
            "median_vph": median_vph,
            "breakouts": breakouts,
            "affiliate_coverage": sum(bool(video.get("affiliate_links")) for video in items) / len(items),
            "comments_sampled": len(cluster_comments),
            "intent_comments": sum(bool(comment["intents"]) for comment in cluster_comments),
            "purchase_intents": purchase,
            "demand_score": sum(comment["demand"] for comment in cluster_comments) if cluster_comments else None,
            "status": status,
            "video_ids": [video["id"] for video in items],
            **{f"intent_{key}": count for key, count in intent_counts.items()},
        })
    demand_rank = percentile_ranks([row["demand_score"] for row in rows])
    heat_rank = percentile_ranks([row["median_vph"] for row in rows])
    affiliate_rank = percentile_ranks([row["affiliate_coverage"] for row in rows])
    for row, demand, heat, affiliate in zip(rows, demand_rank, heat_rank, affiliate_rank):
        weights = OPPORTUNITY_WEIGHTS
        row["opportunity_score"] = round(100 * (weights["demand"] * demand + weights["heat"] * heat + weights["affiliate"] * affiliate), 1)
    return sorted(rows, key=lambda row: (-row["opportunity_score"], -(row["demand_score"] or 0), row["product"]))


def query_summary(videos: list, now: datetime) -> list:
    """Return one search-interest proxy row per query: videos, channels, total views, median VPH, and share published in 30 days."""
    rows = []
    for query in sorted({video.get("query") for video in videos if video.get("query")}):
        items = [video for video in videos if video.get("query") == query]
        vph = [video["views_per_hour"] for video in items if video.get("views_per_hour") is not None]
        ages = [hours_since(video.get("published_at"), now) for video in items]
        dated = [age for age in ages if age is not None]
        views = [video["views"] for video in items if video.get("views") is not None]
        rows.append({
            "query": query,
            "videos": len(items),
            "channels": len({video.get("channel_id") for video in items if video.get("channel_id")}),
            "total_views": sum(views) if views else None,
            "median_vph": statistics.median(vph) if vph else None,
            "recent_share": sum(age <= 24 * 30 for age in dated) / len(dated) if dated else None,
        })
    return rows
