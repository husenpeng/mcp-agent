"""Product-selection metrics over discussion posts.

Pure functions over plain dictionaries. A post record (see collect.py)
carries: id, platform, source, query, author, author_followers,
author_following, author_created_at, created_at (ISO 8601), lang, text,
likes, reposts, replies, quotes, impressions, links, url, and optionally
community. Missing counts are None and never treated as zero.
"""

from __future__ import annotations

import math
import re
import statistics
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional
from urllib.parse import urlparse

#: Storefront, marketplace, short-link, and crowdfunding hosts.
COMMERCE_HOSTS = {
    "amzn.to": "Amazon",
    "amzn.eu": "Amazon",
    "a.co": "Amazon",
    "amazon.com": "Amazon",
    "geni.us": "Geniuslink",
    "shopstyle.it": "ShopStyle",
    "rstyle.me": "LTK",
    "liketk.it": "LTK",
    "shop.ltk.app": "LTK",
    "howl.me": "Howl",
    "shareasale.com": "ShareASale",
    "click.linksynergy.com": "Rakuten",
    "aliexpress.com": "AliExpress",
    "s.click.aliexpress.com": "AliExpress",
    "temu.com": "Temu",
    "shein.com": "Shein",
    "walmart.com": "Walmart",
    "target.com": "Target",
    "bestbuy.com": "Best Buy",
    "costco.com": "Costco",
    "ebay.com": "eBay",
    "etsy.com": "Etsy",
    "myshopify.com": "Shopify",
    "shop.app": "Shopify",
    "shop.tiktok.com": "TikTok Shop",
    "kickstarter.com": "Kickstarter",
    "indiegogo.com": "Indiegogo",
    "gumroad.com": "Gumroad",
}

#: Phrases that signal a purchase request, recommendation, or purchase.
DEMAND_PATTERNS = {
    "request": re.compile(r"\b(any (recs|recommendations)|recommend(ation)?s? (for|on)|looking for|which (one|should i)|best .{0,30}\bfor\b|worth it\??|should i (buy|get))\b", re.I),
    "where_to_buy": re.compile(r"\b(where (to|can i|do i) (buy|get|find)|link\?|link pls|link please|in stock)\b", re.I),
    "price": re.compile(r"\b(how much|price\?|on sale|discount|deal|coupon|promo code)\b", re.I),
    "recommendation": re.compile(r"\b(i recommend|highly recommend|game[- ]changer|must[- ]have|obsessed with|love (my|this|the))\b", re.I),
    "purchase": re.compile(r"\b(just (bought|ordered|got)|i (bought|ordered)|picked up|added to cart|copped)\b", re.I),
    "complaint": re.compile(r"\b(broke|returned it|waste of money|refund|disappointed|stopped working)\b", re.I),
}

#: English stop words; contractions use a straight apostrophe.
STOP_WORDS = frozenset("""
    a about above actually after again against all almost also although always am ama among amp an and another any
    anybody anyone anything anyway april are aren't around as ask at august away back bad basically be because been
    before being below best better between big both btw but by can can't cannot certainly clearly com comment
    comments could couldn't day days december definitely did didn't different do does doesn't doing don't done down
    dr during each easy edit either eli5 else enough even ever every everyone everything exactly february few find
    first for friday from full fwiw get gets getting give glad go goes going gone good got great had hadn't happy has
    hasn't have haven't having he he'd he's hello her here here's hers herself hey hi him himself his hn home
    honestly hope how how's however http https i i'd i'll i'm i've if imho imo in intend into is isn't it it's its
    itself january july june just keep kind know last least less let let's like likely literally little lol long look
    lot lots made make makes making many march may maybe me might mine monday more most much must my myself need
    needs never new next nice no nobody none nor not nothing november now october of off often oh ok okay old omg on
    once one ones only or other others otherwise our ours ourselves out over own part people perhaps point post
    pretty probably psa put quite rather really reddit right rt sad said same saturday say says see seem seems
    september several she she'd she's should shouldn't show simply since so some somebody someone something sometimes
    sorry still such sunday sure take tell than thank thanks that that's the their theirs them themselves then there
    there's these they they'd they'll they're they've thing things think this those though thought thread through
    thursday thus til time times tl to today together too took toward truly try trying tuesday two under unless until
    up update upon us use used using usually very via want wants was wasn't way ways we we'd we'll we're we've
    wednesday well went were weren't what what's whatever when where where's whether which while who who's whole whom
    whose why will with within without won't work works would wouldn't www yeah year years yes yet you you'd you'll
    you're you've your yours yourself
""".split())
_STOP = STOP_WORDS
_WORD = r"[A-Z][A-Za-z0-9'’&+\-]*"
_CAPITALIZED = re.compile(rf"\b{_WORD}(?:\s+(?:{_WORD}|\d[\w\-]*))*")
_HASHTAG = re.compile(r"#([A-Za-z][A-Za-z0-9_]{2,})")
_CUE = re.compile(r"\b(?:bought|ordered|got|recommend|love|using|tried|switched to)\s+(?:the|a|an|my|this)?\s*([a-z][a-z0-9\-]+(?:\s+[a-z0-9\-]+)?)", re.I)


def parse_time(text: Optional[str]) -> Optional[datetime]:
    """Parse an ISO 8601 timestamp, with or without Z, into an aware UTC datetime."""
    if not text:
        return None
    parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def engagement(post: dict) -> Optional[int]:
    """Return likes + reposts + replies + quotes, or None when every count is unknown."""
    counts = [post.get(key) for key in ("likes", "reposts", "replies", "quotes")]
    if all(count is None for count in counts):
        return None
    return sum(count or 0 for count in counts)


def squash(text: str) -> str:
    """Alias key: lowercase letters and digits only, trailing plural s removed."""
    key = re.sub(r"[^a-z0-9]", "", text.lower())
    return key[:-1] if len(key) > 4 and key.endswith("s") and not key.endswith("ss") else key


def parse_lexicon(specs: Iterable[str]) -> dict:
    """Parse `Canonical=alias1|alias2` strings into {canonical: [canonical, aliases…]}."""
    lexicon: dict = {}
    for spec in specs:
        name, _, aliases = spec.partition("=")
        name = name.strip()
        if not name:
            continue
        names = [name] + [alias.strip() for alias in aliases.split("|") if alias.strip()]
        lexicon.setdefault(name, [])
        for alias in names:
            if alias not in lexicon[name]:
                lexicon[name].append(alias)
    return lexicon


def bot_reason(post: dict, now: datetime, min_age_days: int = 30, ratio_floor: float = 0.1, following_floor: int = 1000) -> Optional[str]:
    """Return why an author looks automated (new account, or follows many with few followers), or None.

    Only posts whose source reports author metadata (X) can be judged; others return None.
    """
    created = parse_time(post.get("author_created_at"))
    if created is not None and (now - created).days < min_age_days:
        return f"account younger than {min_age_days} days"
    followers, following = post.get("author_followers"), post.get("author_following")
    if followers is not None and following is not None and following >= following_floor and followers / following < ratio_floor:
        return f"followers ÷ following below {ratio_floor} while following ≥ {following_floor}"
    return None


def clean_posts(posts: list, now: datetime) -> tuple:
    """Return (kept posts, dropped rows) after removing duplicate ids, copy-paste text, and bot-like authors."""
    kept, dropped, seen_ids, seen_text = [], [], set(), set()
    for post in posts:
        key = (post.get("platform"), post.get("id"))
        text_key = " ".join(re.sub(r"https?://\S+", "", (post.get("text") or "").lower()).split())
        if key in seen_ids:
            continue
        seen_ids.add(key)
        reason = bot_reason(post, now)
        if reason is None and len(text_key) >= 30 and text_key in seen_text:
            reason = "duplicate text"
        if reason:
            dropped.append({**post, "drop_reason": reason})
            continue
        seen_text.add(text_key)
        kept.append(post)
    return kept, dropped


def _candidates(text: str) -> list:
    found = []
    for match in _CAPITALIZED.finditer(text):
        words = match.group(0).replace("’", "'").split()
        initial = not text[:match.start()].rstrip() or text[:match.start()].rstrip()[-1] in ".!?:;\n\"(-"
        while words and words[0].lower().strip("'") in _STOP:
            words, initial = words[1:], False
        while words and words[-1].lower().strip("'") in _STOP:
            words = words[:-1]
        if initial and len(words) == 1:
            continue  # a lone capitalized word at sentence start is usually an ordinary word
        if words and len(words) <= 4 and len(" ".join(words)) >= 3 and not all(word.isdigit() for word in words):
            found.append(" ".join(words))
    for tag in _HASHTAG.findall(text):
        found.append("#" + tag)
    for phrase in _CUE.findall(text):
        words = phrase.split()
        if not any(word.lower() in _STOP for word in words) and len(" ".join(words)) >= 4:
            found.append(" ".join(words))
    return found


def _display(names: dict) -> str:
    plain = [name for name in names if not name.startswith("#")] or [name.lstrip("#") for name in names]
    return max(plain, key=lambda name: (names.get(name, names.get("#" + name, 0)), len(name), name))


def extract_products(posts: list, lexicon: dict, exclude: Iterable[str] = (), min_mentions: int = 2) -> dict:
    """Return {product: set of post indexes} after alias merging.

    Lexicon products match their aliases case-insensitively at word
    boundaries and are always kept. Automatic candidates (capitalized
    phrases, hashtags, phrases after purchase cues) merge when their alias
    keys are equal, or when one key is the tail of exactly one longer key
    (`Creami` → `Ninja Creami`); they are kept with at least `min_mentions`
    posts, and then also claim posts that spell one of their names in any
    letter case. Candidates equal to an excluded word (seed keywords) are dropped.
    """
    excluded = {squash(word) for word in exclude}
    alias_patterns = {
        canonical: re.compile(r"(?<![\w#])#?(" + "|".join(re.escape(alias) for alias in sorted(aliases, key=len, reverse=True)) + r")(?!\w)", re.I)
        for canonical, aliases in lexicon.items()
    }
    lexicon_keys = {squash(alias): canonical for canonical, aliases in lexicon.items() for alias in aliases}
    products: dict = {canonical: set() for canonical in lexicon}
    groups: dict = {}
    for index, post in enumerate(posts):
        text = post.get("text") or ""
        for canonical, pattern in alias_patterns.items():
            if pattern.search(text):
                products[canonical].add(index)
        for candidate in _candidates(text):
            key = squash(candidate)
            if len(key) < 3 or key in excluded or candidate.lower().lstrip("#") in _STOP:
                continue
            if key in lexicon_keys:
                products[lexicon_keys[key]].add(index)
                continue
            group = groups.setdefault(key, {"names": {}, "posts": set()})
            group["names"][candidate] = group["names"].get(candidate, 0) + 1
            group["posts"].add(index)
    for key in sorted(groups, key=len):
        longer = [other for other in groups if other != key and len(other) > len(key) and other.endswith(key)]
        if len(longer) == 1:
            target = groups[longer[0]]
            for name, count in groups[key]["names"].items():
                target["names"][name] = target["names"].get(name, 0) + count
            target["posts"] |= groups[key]["posts"]
            groups[key]["posts"] = set()
    for group in groups.values():
        if len(group["posts"]) >= min_mentions:
            name = _display(group["names"])
            spelled = re.compile(r"(?<![\w#])#?(" + "|".join(re.escape(alias.lstrip("#")) for alias in sorted(group["names"], key=len, reverse=True)) + r")(?!\w)", re.I)
            group["posts"] |= {index for index, post in enumerate(posts) if spelled.search(post.get("text") or "")}
            products.setdefault(name, set()).update(group["posts"])
    return products


def classify_link(url: str) -> dict:
    """Classify one URL by host into a commerce network, or network None."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    network = None
    for candidate, name in COMMERCE_HOSTS.items():
        if host == candidate or host.endswith("." + candidate):
            network = name
            break
    if network is None and re.fullmatch(r"amazon\.[a-z.]+", host):
        network = "Amazon"
    return {"url": url, "host": host, "network": network}


def commerce_links(post: dict) -> list:
    """Return the classified links of a post that point at a known commerce host."""
    return [link for link in map(classify_link, post.get("links") or []) if link["network"]]


def demand_signals(text: str) -> list:
    """Return the demand-signal kinds (see DEMAND_PATTERNS) a text contains."""
    return [kind for kind, pattern in DEMAND_PATTERNS.items() if pattern.search(text or "")]


def bucket_counts(times: list, now: datetime, granularity: str, buckets: int) -> list:
    """Count timestamps into `buckets` windows ending at now, oldest first; windows are 1 day or 7 days."""
    width = timedelta(days=1 if granularity == "day" else 7)
    counts = [0] * buckets
    for moment in times:
        if moment is None:
            continue
        age = (now - moment) / width
        slot = int(age)
        if 0 <= age and slot < buckets:
            counts[buckets - 1 - slot] += 1
    return counts


def trend_score(counts: list, total_engagement: Optional[int]) -> tuple:
    """Return (z, score): z of the latest bucket against the earlier buckets, and z × ln(1 + engagement).

    The earlier buckets' standard deviation has a floor of 1 so a flat
    baseline does not divide by zero. Score is None without engagement counts.
    """
    if len(counts) < 2:
        return None, None
    current, baseline = counts[-1], counts[:-1]
    mean = statistics.fmean(baseline)
    spread = max(statistics.pstdev(baseline), 1.0)
    z = (current - mean) / spread
    if total_engagement is None:
        return z, None
    return z, z * math.log1p(total_engagement)


def _minmax(values: list) -> list:
    known = [value for value in values if value is not None]
    if not known:
        return [0.0 for _ in values]
    low, high = min(known), max(known)
    if high == low:
        return [0.0 if value is None or high == 0 else 1.0 for value in values]
    return [0.0 if value is None else (value - low) / (high - low) for value in values]


def rank_products(posts: list, products: dict, now: datetime, granularity: str, buckets: int, min_spread_authors: int = 3) -> list:
    """Return one row per product with mentions, engagement, trend, demand, links, status, and opportunity score.

    status: validated when the trend score is positive and the product spread
    to at least `min_spread_authors` authors in at least two communities
    (X counts each author as a community); watch when one holds; rejected
    otherwise. opportunity = 100 × (0.5 trend + 0.3 engagement + 0.2 demand),
    each min-max scaled across products.
    """
    rows = []
    for name, indexes in products.items():
        items = [posts[index] for index in sorted(indexes)]
        values = [engagement(post) for post in items]
        known = [value for value in values if value is not None]
        total = sum(known) if known else None
        counts = bucket_counts([parse_time(post.get("created_at")) for post in items], now, granularity, buckets)
        z, score = trend_score(counts, total)
        authors = {post.get("author") for post in items if post.get("author")}
        communities = {post.get("community") or (post.get("author") if post.get("platform") == "x" else post.get("platform")) for post in items}
        demand: dict = {}
        for post in items:
            for kind in demand_signals(post.get("text")):
                demand[kind] = demand.get(kind, 0) + 1
        networks: dict = {}
        for post in items:
            for link in commerce_links(post):
                networks[link["network"]] = networks.get(link["network"], 0) + 1
        rising = score is not None and score > 0
        spread = len(authors) >= min_spread_authors and len(communities) >= 2
        rows.append({
            "product": name,
            "mentions": len(items),
            "authors": len(authors),
            "communities": len(communities),
            "engagement": total,
            "counts": counts,
            "z": z,
            "trend_score": score,
            "demand_posts": sum(1 for post in items if demand_signals(post.get("text"))),
            "demand": demand,
            "networks": networks,
            "status": "validated" if rising and spread else ("watch" if rising or spread else "rejected"),
            "sources": sorted({post.get("source") for post in items if post.get("source")}),
            "post_ids": [post.get("id") for post in items],
        })
    trend = _minmax([row["trend_score"] for row in rows])
    heat = _minmax([None if row["engagement"] is None else math.log1p(row["engagement"]) for row in rows])
    want = _minmax([row["demand_posts"] for row in rows])
    for row, t, h, d in zip(rows, trend, heat, want):
        row["opportunity"] = round(100 * (0.5 * t + 0.3 * h + 0.2 * d), 1)
    order = {"validated": 0, "watch": 1, "rejected": 2}
    return sorted(rows, key=lambda row: (order[row["status"]], -row["opportunity"], -row["mentions"], row["product"]))


def domain_summary(posts: Iterable[dict]) -> list:
    """Return (network, posts carrying it, total links, example host) rows, most posts first."""
    counts: dict = {}
    for post in posts:
        links = commerce_links(post)
        for network in {link["network"] for link in links}:
            counts.setdefault(network, [0, 0, set()])[0] += 1
        for link in links:
            counts[link["network"]][1] += 1
            counts[link["network"]][2].add(link["host"])
    return sorted(([name, value[0], value[1], ", ".join(sorted(value[2]))] for name, value in counts.items()), key=lambda row: (-row[1], row[0]))
