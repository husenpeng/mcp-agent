"""Data-insight metrics over X posts or substitute discussion posts.

Pure functions over plain dictionaries. A post record (see collect.py)
carries: id, platform, source, query, author, author_followers,
author_following, author_created_at, created_at (ISO 8601), lang, text,
likes, reposts, replies, quotes, impressions, links, url, and optionally
account and community. Missing counts are None and never treated as zero.
"""

from __future__ import annotations

import re
import statistics
from datetime import datetime, timedelta, timezone
from typing import Callable, Iterable, Optional

#: VADER compound thresholds recommended by its authors.
POSITIVE, NEGATIVE = 0.05, -0.05
#: Languages VADER scores; posts without a language tag are scored too.
SENTIMENT_LANGS = {"en", None, ""}

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
_TOKEN = re.compile(r"#?[a-z][a-z0-9'’\-]{2,}")
_URL = re.compile(r"https?://\S+")


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


def clean_posts(posts: list, now: datetime, keep_accounts: Iterable[str] = ()) -> tuple:
    """Return (kept posts, dropped rows) after removing duplicate ids, copy-paste text, and bot-like authors.

    Posts from `keep_accounts` (the requested accounts) are never dropped as bots.
    """
    keep = {handle.lower().lstrip("@") for handle in keep_accounts}
    kept, dropped, seen_ids, seen_text = [], [], set(), set()
    for post in posts:
        key = (post.get("platform"), post.get("id"))
        if key in seen_ids:
            continue
        seen_ids.add(key)
        text_key = " ".join(_URL.sub("", (post.get("text") or "").lower()).split())
        reason = None if (post.get("author") or "").lower() in keep else bot_reason(post, now)
        if reason is None and len(text_key) >= 30 and text_key in seen_text:
            reason = "duplicate text"
        if reason:
            dropped.append({**post, "drop_reason": reason})
            continue
        seen_text.add(text_key)
        kept.append(post)
    return kept, dropped


def bucket_counts(times: list, now: datetime, granularity: str, buckets: int) -> list:
    """Count timestamps into `buckets` windows ending at now, oldest first; windows are 1 day or 7 days."""
    width = timedelta(days=1 if granularity == "day" else 7)
    counts = [0] * buckets
    for moment in times:
        if moment is None:
            continue
        age = (now - moment) / width
        if 0 <= age and int(age) < buckets:
            counts[buckets - 1 - int(age)] += 1
    return counts


def _median(values: Iterable) -> Optional[float]:
    known = [value for value in values if value is not None]
    return statistics.median(known) if known else None


def account_kpis(account: dict, posts: list, now: datetime) -> dict:
    """Return KPIs for one account from its sampled timeline posts.

    engagement_rate = median engagement ÷ followers; like_rate (Modash) =
    median likes of posts from the last 60 days ÷ followers; cadence = posts per
    week over the sampled span; engagement_growth = median engagement of the
    newer half of the posts ÷ the older half − 1.
    """
    times = sorted(moment for moment in (parse_time(post.get("created_at")) for post in posts) if moment)
    span_days = max((times[-1] - times[0]).total_seconds() / 86400, 1.0) if len(times) >= 2 else None
    followers = account.get("followers")
    median_engagement = _median(engagement(post) for post in posts)
    recent = [post for post in posts if (parse_time(post.get("created_at")) or now) >= now - timedelta(days=60)]
    median_likes = _median(post.get("likes") for post in recent)
    ordered = sorted(posts, key=lambda post: post.get("created_at") or "")
    half = len(ordered) // 2
    older, newer = _median(engagement(post) for post in ordered[:half]), _median(engagement(post) for post in ordered[half:])
    hours = [moment.hour for moment in times]
    return {
        "handle": account.get("handle"),
        "followers": followers,
        "following": account.get("following"),
        "post_count": account.get("post_count"),
        "created_at": account.get("created_at"),
        "sampled_posts": len(posts),
        "posts_per_week": None if span_days is None else round(len(posts) / span_days * 7, 2),
        "median_engagement": median_engagement,
        "median_impressions": _median(post.get("impressions") for post in posts),
        "engagement_rate": None if not followers or median_engagement is None else median_engagement / followers,
        "like_rate": None if not followers or median_likes is None else median_likes / followers,
        "engagement_growth": None if half == 0 or not older or newer is None else newer / older - 1,
        "top_hour_utc": statistics.mode(hours) if hours else None,
    }


def benchmarks(kpis: list) -> list:
    """Return each account's KPIs against the median of the other accounts (ratio, 1.0 = at peer median)."""
    rows = []
    for row in kpis:
        peers = [other for other in kpis if other is not row]
        for metric in ("engagement_rate", "like_rate", "posts_per_week", "median_engagement", "engagement_growth"):
            peer = _median(other.get(metric) for other in peers)
            value = row.get(metric)
            ratio = None if value is None or not peer else value / peer
            if metric == "engagement_growth":
                ratio = None if value is None or peer is None else value - peer
            rows.append({"handle": row["handle"], "metric": metric, "value": value, "peer_median": peer, "vs_peer": ratio, "peers": len(peers)})
    return rows


def label_sentiment(compound: Optional[float]) -> Optional[str]:
    """Map a VADER compound score to positive, negative, or neutral."""
    if compound is None:
        return None
    return "positive" if compound >= POSITIVE else ("negative" if compound <= NEGATIVE else "neutral")


def score_sentiment(posts: list, polarity: Optional[Callable[[str], dict]]) -> list:
    """Return copies of the posts with sentiment_compound and sentiment; non-English or unscored posts stay None."""
    scored = []
    for post in posts:
        row = dict(post)
        compound = None
        if polarity is not None and post.get("lang") in SENTIMENT_LANGS:
            compound = polarity(_URL.sub("", post.get("text") or "")).get("compound")
        row["sentiment_compound"] = compound
        row["sentiment"] = label_sentiment(compound)
        scored.append(row)
    return scored


def net_sentiment(posts: Iterable[dict]) -> dict:
    """Return counts and net sentiment = (positive − negative) ÷ scored mentions × 100 (Brandwatch), or None when nothing was scored."""
    labels = [post.get("sentiment") for post in posts]
    positive, negative, neutral = labels.count("positive"), labels.count("negative"), labels.count("neutral")
    scored = positive + negative + neutral
    return {
        "positive": positive, "negative": negative, "neutral": neutral, "scored": scored,
        "net": None if scored == 0 else round((positive - negative) / scored * 100, 1),
    }


def keywords(text: Optional[str], exclude: set) -> set:
    """Return the distinct lowercase keywords and hashtags of a text, without stop words and excluded words."""
    tokens = set()
    for token in _TOKEN.findall(_URL.sub("", (text or "").lower()).replace("’", "'")):
        token = token.strip("'-")
        bare = token.lstrip("#")
        if len(bare) >= 3 and bare not in _STOP and bare not in exclude:
            tokens.add(bare)
    return tokens


def topic_clusters(posts: list, exclude: Iterable[str] = (), top_k: int = 60, min_docs: int = 2, min_pair: int = 2,
                   min_jaccard: float = 0.2, max_keywords: int = 6) -> tuple:
    """Cluster keywords by co-occurrence and assign posts to clusters.

    The `top_k` keywords present in at least `min_docs` posts are candidates.
    Two keywords are neighbours when they co-occur in at least `min_pair`
    posts with Jaccard ≥ `min_jaccard`. Clusters grow greedily: the most
    frequent unassigned keyword seeds a cluster and takes its unassigned
    neighbours in descending Jaccard order, up to `max_keywords` keywords, so
    common words cannot chain every topic into one. Clusters of two or more
    keywords are kept and labelled by their three most frequent keywords. A
    post joins the cluster whose keywords it contains most often; posts with
    none stay unassigned (cluster None). Returns (clusters, assignment list aligned with posts).
    """
    excluded = {word.lower() for phrase in exclude for word in phrase.split()}
    docs = [keywords(post.get("text"), excluded) for post in posts]
    frequency: dict = {}
    for doc in docs:
        for word in doc:
            frequency[word] = frequency.get(word, 0) + 1
    vocab = [word for word, count in sorted(frequency.items(), key=lambda item: (-item[1], item[0])) if count >= min_docs][:top_k]
    allowed = set(vocab)
    together: dict = {}
    for doc in docs:
        present = sorted(word for word in doc if word in allowed)
        for left_pos, left in enumerate(present):
            for right in present[left_pos + 1:]:
                together[(left, right)] = together.get((left, right), 0) + 1
    neighbours: dict = {word: [] for word in vocab}
    for (left, right), count in together.items():
        jaccard = count / (frequency[left] + frequency[right] - count)
        if count >= min_pair and jaccard >= min_jaccard:
            neighbours[left].append((jaccard, right))
            neighbours[right].append((jaccard, left))
    assigned: set = set()
    clusters = []
    for seed in vocab:
        if seed in assigned:
            continue
        words = [seed]
        for _, word in sorted(neighbours[seed], key=lambda item: (-item[0], item[1])):
            if word not in assigned and len(words) < max_keywords:
                words.append(word)
        if len(words) < 2:
            continue
        assigned.update(words)
        words.sort(key=lambda word: (-frequency[word], word))
        clusters.append({"label": " · ".join(words[:3]), "keywords": words})
    for number, cluster in enumerate(clusters, start=1):
        cluster["id"] = number
    assignment = []
    for doc in docs:
        best, hits = None, 0
        for cluster in clusters:
            count = len(doc & set(cluster["keywords"]))
            if count > hits:
                best, hits = cluster["id"], count
        assignment.append(best)
    return clusters, assignment


def classify_trend(counts: list, authors: int) -> str:
    """Classify a mention series: trend (rising, persistent, spread), spike (one bucket dominates, not persistent), fading, or steady.

    persistence = share of buckets with at least one mention; growth compares
    the newer half of the buckets with the older half.
    """
    total = sum(counts)
    if total == 0:
        return "none"
    persistence = sum(1 for count in counts if count) / len(counts)
    half = len(counts) // 2
    older, newer = sum(counts[:half]) / max(half, 1), sum(counts[half:]) / max(len(counts) - half, 1)
    if newer > older and persistence >= 0.5 and authors >= 3:
        return "trend"
    if max(counts) >= 0.5 * total and persistence < 0.5:
        return "spike"
    if newer < older:
        return "fading"
    return "steady"


def cluster_summary(posts: list, clusters: list, assignment: list, now: datetime, granularity: str, buckets: int) -> list:
    """Return one row per cluster with posts, authors, engagement, net sentiment, bucket counts, and trend class."""
    rows = []
    for cluster in clusters:
        members = [post for post, cid in zip(posts, assignment) if cid == cluster["id"]]
        values = [engagement(post) for post in members]
        known = [value for value in values if value is not None]
        authors = len({post.get("author") for post in members if post.get("author")})
        counts = bucket_counts([parse_time(post.get("created_at")) for post in members], now, granularity, buckets)
        rows.append({
            "id": cluster["id"], "label": cluster["label"], "keywords": cluster["keywords"], "posts": len(members), "authors": authors,
            "engagement": sum(known) if known else None, "net_sentiment": net_sentiment(members)["net"], "counts": counts,
            "trend_class": classify_trend(counts, authors),
        })
    return rows


def share_of_voice(posts: list, brands: dict) -> list:
    """Return mention and engagement share of voice for each brand (canonical → aliases), plus its net sentiment.

    A post that names several brands counts once for each. Shares are percent
    of the named brands' totals; engagement share is None when no matching post has counts.
    """
    patterns = {
        name: re.compile(r"(?<![\w])[@#]?(" + "|".join(re.escape(alias) for alias in sorted(aliases, key=len, reverse=True)) + r")(?!\w)", re.I)
        for name, aliases in brands.items()
    }
    rows = []
    for name, pattern in patterns.items():
        members = [post for post in posts if pattern.search(post.get("text") or "")]
        known = [value for value in (engagement(post) for post in members) if value is not None]
        rows.append({"brand": name, "mentions": len(members), "engagement": sum(known) if known else None, "sentiment": net_sentiment(members)})
    total_mentions = sum(row["mentions"] for row in rows)
    total_engagement = sum(row["engagement"] or 0 for row in rows)
    for row in rows:
        row["sov_mentions"] = None if total_mentions == 0 else round(row["mentions"] / total_mentions * 100, 1)
        row["sov_engagement"] = None if not total_engagement or row["engagement"] is None else round(row["engagement"] / total_engagement * 100, 1)
    return sorted(rows, key=lambda row: (-row["mentions"], row["brand"]))


def outlier_posts(posts: list, min_author_posts: int = 5, threshold: float = 3.0) -> list:
    """Return copies of the posts with outlier_score and baseline; scores ≥ `threshold` are outliers.

    The baseline is the median engagement of the same author's sampled posts
    when the author has at least `min_author_posts`, otherwise the median of
    the same source's posts. Posts without engagement or a positive baseline score None.
    """
    by_author: dict = {}
    by_source: dict = {}
    for post in posts:
        value = engagement(post)
        if value is None:
            continue
        by_author.setdefault(post.get("author"), []).append(value)
        by_source.setdefault(post.get("source"), []).append(value)
    rows = []
    for post in posts:
        row = dict(post)
        own = by_author.get(post.get("author"), [])
        if len(own) >= min_author_posts and post.get("author"):
            baseline, kind = statistics.median(own), "author median"
        else:
            pool = by_source.get(post.get("source"), [])
            baseline, kind = (statistics.median(pool), "source median") if pool else (None, None)
        value = engagement(post)
        row["baseline"] = baseline
        row["baseline_kind"] = kind
        row["outlier_score"] = None if value is None or not baseline else value / baseline
        row["is_outlier"] = row["outlier_score"] is not None and row["outlier_score"] >= threshold
        rows.append(row)
    return rows


def language_mix(posts: Iterable[dict]) -> list:
    """Return (language, posts) rows, most posts first; untagged posts count as 'unknown'."""
    counts: dict = {}
    for post in posts:
        lang = post.get("lang") or "unknown"
        counts[lang] = counts.get(lang, 0) + 1
    return sorted(([lang, count] for lang, count in counts.items()), key=lambda row: (-row[1], row[0]))
