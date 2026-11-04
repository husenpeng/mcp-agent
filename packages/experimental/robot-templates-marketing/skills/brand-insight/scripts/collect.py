"""Collect brand mentions and attention series from keyless public APIs and optional official APIs.

Sources (each returns plain dictionaries; see metrics.py for the mention record):

* GDELT DOC 2.0 (no key): ArtList for article mentions and TimelineVol for the
  daily share of monitored news coverage. GDELT asks for at most one request
  every five seconds; Gdelt sleeps between calls.
* Wikimedia Pageviews REST API (no key; a descriptive User-Agent is required).
* Hacker News Algolia search API (no key): stories and comments.
* Reddit through PRAW, only with REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.
* YouTube Data API v3 search.list (100 units) and videos.list (1 unit), only
  with YOUTUBE_API_KEY.

Every function raises CollectionError with an actionable message instead of
returning partial data silently; callers record the message in the report's
data gaps section and in the sources_log sheet.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Callable, Optional

USER_AGENT = "tomato-marketing-robot/1 (brand-insight skill; https://github.com/tomato-harness)"
GDELT = "https://api.gdeltproject.org/api/v2/doc/doc"
PAGEVIEWS = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
HN = "https://hn.algolia.com/api/v1/search"
YOUTUBE = "https://www.googleapis.com/youtube/v3/"


class CollectionError(RuntimeError):
    """A source could not be read; the message says which and why."""


Fetch = Callable[[str], str]


def http_text(url: str) -> str:
    """GET one URL with the skill's User-Agent and return the decoded body."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    host = urllib.parse.urlparse(url).hostname
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            return response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")[:300]
        raise CollectionError(f"{host} returned HTTP {error.code}: {body}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"{host} unreachable: {error.reason}") from error
    except TimeoutError as error:
        raise CollectionError(f"{host} timed out") from error


def _json(text: str, source: str) -> dict:
    if not text.strip():
        return {}
    try:
        return json.loads(text)
    except ValueError as error:
        raise CollectionError(f"{source} returned a message instead of JSON: {text.strip()[:200]}") from error


def _int(value) -> Optional[int]:
    return int(value) if value not in (None, "") else None


def _plain(text: Optional[str]) -> str:
    """Strip HTML tags and entities from API text."""
    return html.unescape(re.sub(r"<[^>]+>", " ", text or "")).strip()


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _gdelt_time(text: str) -> Optional[str]:
    """Convert GDELT 20261103T121500Z to ISO 8601."""
    match = re.fullmatch(r"(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?Z?", text or "")
    if not match:
        return None
    year, month, day, hour, minute, second = (part or "00" for part in match.groups())
    return f"{year}-{month}-{day}T{hour}:{minute}:{second}Z"


def gdelt_query(terms: list, extra: str = "") -> str:
    """Return a GDELT query: quoted terms joined with OR (parenthesized when several), then the extra filter."""
    quoted = [f'"{term}"' if " " in term or "-" in term else term for term in terms]
    core = quoted[0] if len(quoted) == 1 else "(" + " OR ".join(quoted) + ")"
    return f"{core} {extra}".strip()


class Gdelt:
    """GDELT DOC 2.0 reader that keeps the documented five-second spacing and retries HTTP 429 up to `retries` times."""

    def __init__(self, fetch: Fetch = http_text, sleep: Callable[[float], None] = time.sleep, spacing: float = 5.0, retries: int = 2):
        self.fetch = fetch
        self.sleep = sleep
        self.spacing = spacing
        self.retries = retries
        self.calls = 0

    def _get(self, **params) -> dict:
        url = f"{GDELT}?{urllib.parse.urlencode({**params, 'format': 'json'})}"
        for attempt in range(self.retries + 1):
            if self.calls:
                self.sleep(self.spacing * (1 + 2 * attempt))
            self.calls += 1
            try:
                return _json(self.fetch(url), "GDELT")
            except CollectionError as error:
                if "HTTP 429" not in str(error) or attempt == self.retries:
                    raise
        raise AssertionError("unreachable: the last attempt returns or raises")

    def articles(self, brand: str, query: str, start: datetime, end: datetime, limit: int = 250) -> list:
        """Return up to `limit` (≤ 250) article mentions, newest first."""
        data = self._get(query=query, mode="ArtList", maxrecords=min(limit, 250), sort="DateDesc",
                         startdatetime=start.strftime("%Y%m%d%H%M%S"), enddatetime=end.strftime("%Y%m%d%H%M%S"))
        mentions = []
        for article in data.get("articles") or []:
            mentions.append({
                "brand": brand,
                "source": "gdelt",
                "id": article.get("url"),
                "url": article.get("url"),
                "title": article.get("title") or "",
                "text": article.get("title") or "",
                "published_at": _gdelt_time(article.get("seendate", "")),
                "engagement": None,
                "author": article.get("domain"),
                "language": article.get("language"),
            })
        return mentions

    def timeline(self, query: str, start: datetime, end: datetime) -> dict:
        """Return {YYYY-MM-DD: mean volume intensity} where intensity is the percent of monitored articles."""
        data = self._get(query=query, mode="TimelineVol", startdatetime=start.strftime("%Y%m%d%H%M%S"), enddatetime=end.strftime("%Y%m%d%H%M%S"))
        buckets: dict = {}
        for series in data.get("timeline") or []:
            for point in series.get("data") or []:
                stamp = _gdelt_time(point.get("date", ""))
                if stamp is None or point.get("value") is None:
                    continue
                buckets.setdefault(stamp[:10], []).append(float(point["value"]))
        return {day: sum(values) / len(values) for day, values in sorted(buckets.items())}


def pageviews(article: str, start: datetime, end: datetime, project: str = "en.wikipedia", fetch: Fetch = http_text) -> dict:
    """Return {YYYY-MM-DD: views} of one article (user agents only, all access methods)."""
    title = urllib.parse.quote(article.replace(" ", "_"), safe="")
    url = f"{PAGEVIEWS}{project}/all-access/user/{title}/daily/{start:%Y%m%d}00/{end:%Y%m%d}00"
    try:
        data = _json(fetch(url), "Wikimedia Pageviews")
    except CollectionError as error:
        if "HTTP 404" in str(error):
            raise CollectionError(f"no {project} pageviews for “{article}”: the article title may differ; pass --wiki-article BRAND=Exact_Title") from error
        raise
    return {f"{item['timestamp'][:4]}-{item['timestamp'][4:6]}-{item['timestamp'][6:8]}": int(item["views"]) for item in data.get("items") or []}


def hacker_news(brand: str, term: str, start: datetime, limit: int = 200, fetch: Fetch = http_text) -> list:
    """Return up to `limit` Hacker News stories and comments matching a term since `start`."""
    mentions: list = []
    page = 0
    while len(mentions) < limit:
        params = {
            "query": term, "tags": "(story,comment)", "numericFilters": f"created_at_i>{int(start.timestamp())}",
            "hitsPerPage": min(100, limit - len(mentions)), "page": page,
        }
        data = _json(fetch(f"{HN}?{urllib.parse.urlencode(params)}"), "Hacker News Algolia")
        for hit in data.get("hits") or []:
            points, comments = _int(hit.get("points")), _int(hit.get("num_comments"))
            title = hit.get("title") or hit.get("story_title") or ""
            body = _plain(hit.get("comment_text") or hit.get("story_text"))
            mentions.append({
                "brand": brand,
                "source": "hackernews",
                "id": f"hn:{hit.get('objectID')}",
                "url": f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                "title": title,
                "text": f"{title}\n{body}".strip(),
                "published_at": hit.get("created_at"),
                "engagement": None if points is None and comments is None else (points or 0) + (comments or 0),
                "author": hit.get("author"),
                "language": None,
            })
        page += 1
        if page >= int(data.get("nbPages") or 0):
            break
    return mentions[:limit]


def reddit_client(client_id: str, client_secret: str):
    """Return a read-only PRAW client using application-only OAuth; no user login."""
    try:
        import praw  # noqa: PLC0415 - optional dependency resolved at call time
    except ImportError as error:
        raise CollectionError("praw is not installed; run: python -m pip install 'praw==8.0.3'") from error
    reddit = praw.Reddit(client_id=client_id, client_secret=client_secret, user_agent=USER_AGENT, check_for_updates=False)
    reddit.read_only = True
    return reddit


def _time_filter(days: int) -> str:
    return "day" if days <= 1 else "week" if days <= 7 else "month" if days <= 31 else "year"


def reddit_search(brand: str, query: str, start: datetime, days: int, limit: int, reddit, subreddit: str = "all") -> list:
    """Return Reddit submissions matching a query since `start`, newest first, through a PRAW client."""
    try:
        results = list(reddit.subreddit(subreddit).search(query, sort="new", time_filter=_time_filter(days), limit=limit))
    except Exception as error:  # PRAW and prawcore raise many types; all mean this source failed
        raise CollectionError(f"Reddit search “{query}” failed: {error}") from error
    mentions = []
    for post in results:
        created = datetime.fromtimestamp(post.created_utc, timezone.utc)
        if created < start:
            continue
        score, comments = _int(getattr(post, "score", None)), _int(getattr(post, "num_comments", None))
        mentions.append({
            "brand": brand,
            "source": "reddit",
            "id": f"reddit:{post.id}",
            "url": f"https://www.reddit.com{post.permalink}",
            "title": post.title or "",
            "text": f"{post.title or ''}\n{getattr(post, 'selftext', '') or ''}".strip(),
            "published_at": _iso(created),
            "engagement": None if score is None and comments is None else (score or 0) + (comments or 0),
            "author": f"r/{getattr(post, 'subreddit', subreddit)}",
            "language": None,
        })
    return mentions


class YouTubeSearch:
    """YouTube Data API v3 search counts and per-video engagement, with a unit counter."""

    def __init__(self, key: str, fetch: Fetch = http_text):
        self.key = key
        self.fetch = fetch
        self.units = 0

    def _get(self, method: str, cost: int, **params) -> dict:
        self.units += cost
        return _json(self.fetch(f"{YOUTUBE}{method}?{urllib.parse.urlencode({**params, 'key': self.key})}"), "YouTube Data API")

    def search(self, brand: str, query: str, start: datetime, limit: int = 50, region: Optional[str] = None) -> tuple:
        """Return (mentions, estimated total results) for videos published since `start`; one search page."""
        params = {"part": "snippet", "type": "video", "q": query, "order": "date", "publishedAfter": _iso(start), "maxResults": min(limit, 50)}
        if region:
            params["regionCode"] = region
        page = self._get("search", 100, **params)
        items = [item for item in page.get("items") or [] if item.get("id", {}).get("videoId")]
        stats: dict = {}
        if items:
            details = self._get("videos", 1, part="statistics", id=",".join(item["id"]["videoId"] for item in items))
            stats = {item["id"]: item.get("statistics", {}) for item in details.get("items") or []}
        mentions = []
        for item in items:
            video_id, snippet = item["id"]["videoId"], item.get("snippet", {})
            stat = stats.get(video_id, {})
            likes, comments = _int(stat.get("likeCount")), _int(stat.get("commentCount"))
            title = _plain(snippet.get("title"))
            mentions.append({
                "brand": brand,
                "source": "youtube",
                "id": f"yt:{video_id}",
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "title": title,
                "text": f"{title}\n{_plain(snippet.get('description'))}".strip(),
                "published_at": snippet.get("publishedAt"),
                "engagement": None if likes is None and comments is None else (likes or 0) + (comments or 0),
                "views": _int(stat.get("viewCount")),
                "author": snippet.get("channelTitle"),
                "language": None,
            })
        return mentions, _int(page.get("pageInfo", {}).get("totalResults"))
