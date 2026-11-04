"""Collect public discussion posts for X marketing analysis without scraping X.

Three sources share one post record (see metrics.py):

* X API v2 when a bearer token is given: recent search (last 7 days) and
  user timelines, billed pay-per-use. Every returned post object and user
  object counts as one read for the cost estimate.
* Reddit through PRAW with app-only (client id and secret) read access.
* Hacker News through the public Algolia search API.

X web pages are never scraped, and no tool that needs a logged-in account
(twscrape, twikit, Scweet) is used. Every function raises CollectionError
with an actionable message instead of returning partial data silently;
callers record the message in the report's data gaps section.
"""

from __future__ import annotations

import html
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Callable, Optional

X_API = "https://api.x.com/2/"
HN_API = "https://hn.algolia.com/api/v1/search"
#: USD per read under X pay-per-use pricing. From 2026 secondary sources
#: (postproxy.dev/blog/x-api-pricing-2026), not verified on docs.x.com.
X_READ_RATE_USD = 0.005
X_RATE_NOTE = (
    "X pay-per-use rate $0.005 per read comes from 2026 secondary sources "
    "(postproxy.dev/blog/x-api-pricing-2026) and must be checked against developer.x.com before budgeting."
)
#: `entities` is added to the required fields so links resolve past t.co.
X_TWEET_FIELDS = "public_metrics,created_at,lang,author_id,entities"
X_USER_FIELDS = "public_metrics,created_at"
USER_AGENT = "tomato-marketing-robot/1 (read-only research)"

_HINTS = {
    400: "the query or a parameter was rejected; simplify the query",
    401: "the bearer token was rejected; check X_BEARER_TOKEN",
    402: "the X developer account has no pay-per-use credit; add credit at developer.x.com",
    403: "the token's project lacks access to this endpoint",
    429: "rate limited; wait for the window to reset and retry",
}
_URL = re.compile(r"https?://[^\s<>\"')\]]+", re.IGNORECASE)
_TAG = re.compile(r"<[^>]+>")


class CollectionError(RuntimeError):
    """A source could not be read; the message says which and why."""


Fetch = Callable[[str, dict], dict]


def _label(url: str) -> str:
    host = urllib.parse.urlparse(url).hostname or url
    return {"api.x.com": "X API v2", "hn.algolia.com": "Hacker News Algolia API"}.get(host, host)


def http_json(url: str, headers: dict) -> dict:
    """GET one URL with extra headers and decode its JSON body."""
    label = _label(url)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **headers})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")[:300]
        error.close()
        hint = _HINTS.get(error.code)
        raise CollectionError(f"{label} returned HTTP {error.code}{': ' + hint if hint else ''}; body: {body}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"{label} unreachable: {error.reason}; check network access") from error
    except ValueError as error:
        raise CollectionError(f"{label} returned a body that is not JSON") from error


def _int(value) -> Optional[int]:
    return int(value) if value not in (None, "") else None


def _utc_iso(seconds: float) -> str:
    return datetime.fromtimestamp(seconds, timezone.utc).isoformat().replace("+00:00", "Z")


def urls_in(text: Optional[str]) -> list:
    """Return every http(s) URL in a text, without trailing punctuation, in order."""
    if not text:
        return []
    return [match.rstrip(".,;:!?") for match in _URL.findall(text)]


def _x_posts(page: dict, query: Optional[str]) -> list:
    users = {user["id"]: user for user in (page.get("includes") or {}).get("users", [])}
    posts = []
    for tweet in page.get("data") or []:
        metrics = tweet.get("public_metrics") or {}
        author = users.get(tweet.get("author_id"), {})
        author_metrics = author.get("public_metrics") or {}
        entity_urls = (tweet.get("entities") or {}).get("urls", [])
        links = [item.get("unwound_url") or item.get("expanded_url") or item.get("url") for item in entity_urls]
        handle = author.get("username")
        posts.append({
            "id": tweet["id"],
            "platform": "x",
            "source": "x-api-v2",
            "query": query,
            "author": handle,
            "author_id": tweet.get("author_id"),
            "author_followers": _int(author_metrics.get("followers_count")),
            "author_following": _int(author_metrics.get("following_count")),
            "author_created_at": author.get("created_at"),
            "created_at": tweet.get("created_at"),
            "lang": tweet.get("lang"),
            "text": tweet.get("text") or "",
            "likes": _int(metrics.get("like_count")),
            "reposts": _int(metrics.get("retweet_count")),
            "replies": _int(metrics.get("reply_count")),
            "quotes": _int(metrics.get("quote_count")),
            "impressions": _int(metrics.get("impression_count")),
            "links": [link for link in links if link] or urls_in(tweet.get("text")),
            "url": f"https://x.com/{handle or 'i'}/status/{tweet['id']}",
        })
    return posts


class XApi:
    """X API v2 reader that counts reads for the pay-per-use cost estimate."""

    def __init__(self, token: str, fetch: Fetch = http_json, max_reads: Optional[int] = None):
        self.token = token
        self.fetch = fetch
        self.max_reads = max_reads
        self.capped = False
        self.requests = 0
        self.posts_read = 0
        self.users_read = 0

    @property
    def reads(self) -> int:
        """Post objects plus user objects returned so far."""
        return self.posts_read + self.users_read

    def _page_size(self, wanted: int, floor: int) -> int:
        """Return a page size that keeps posts plus their authors within max_reads, or 0 when the budget is spent."""
        size = min(100, wanted)
        if self.max_reads is not None:
            size = min(size, (self.max_reads - self.reads) // 2)
        if size <= 0:
            self.capped = True
            return 0
        return max(size, floor)

    @property
    def cost_usd(self) -> float:
        """Estimated spend: reads × X_READ_RATE_USD."""
        return round(self.reads * X_READ_RATE_USD, 4)

    def _get(self, path: str, params: dict) -> dict:
        self.requests += 1
        page = self.fetch(f"{X_API}{path}?{urllib.parse.urlencode(params)}", {"Authorization": f"Bearer {self.token}"})
        if not page.get("data") and page.get("errors"):
            first = page["errors"][0]
            detail = first.get("detail") or first.get("message") or first.get("title") or "unknown error"
            raise CollectionError(f"X API v2 {path}: {detail}")
        data = page.get("data")
        if isinstance(data, list):
            self.posts_read += len(data)
        elif isinstance(data, dict):
            self.users_read += 1
        self.users_read += len((page.get("includes") or {}).get("users", []))
        return page

    def search_recent(self, query: str, limit: int) -> list:
        """Return up to `limit` posts from the last 7 days matching an X search query."""
        posts: list = []
        token = None
        while len(posts) < limit:
            size = self._page_size(limit - len(posts), 10)
            if not size:
                break
            params = {
                "query": query,
                "max_results": size,
                "tweet.fields": X_TWEET_FIELDS,
                "expansions": "author_id",
                "user.fields": X_USER_FIELDS,
            }
            if token:
                params["next_token"] = token
            page = self._get("tweets/search/recent", params)
            posts += _x_posts(page, query)
            token = (page.get("meta") or {}).get("next_token")
            if not token:
                break
        return posts[:limit]

    def user_timeline(self, username: str, limit: int) -> tuple:
        """Return (account record, up to `limit` latest original posts) for an @handle; retweets are excluded."""
        handle = username.strip().lstrip("@")
        found = self._get(f"users/by/username/{urllib.parse.quote(handle)}", {"user.fields": X_USER_FIELDS}).get("data")
        if not isinstance(found, dict):
            raise CollectionError(f"X account @{handle} was not found")
        metrics = found.get("public_metrics") or {}
        account = {
            "handle": found.get("username") or handle,
            "id": found["id"],
            "followers": _int(metrics.get("followers_count")),
            "following": _int(metrics.get("following_count")),
            "post_count": _int(metrics.get("tweet_count")),
            "created_at": found.get("created_at"),
            "source": "x-api-v2",
        }
        posts: list = []
        token = None
        while len(posts) < limit:
            size = self._page_size(limit - len(posts), 5)
            if not size:
                break
            params = {
                "max_results": size,
                "exclude": "retweets",
                "tweet.fields": X_TWEET_FIELDS,
                "expansions": "author_id",
                "user.fields": X_USER_FIELDS,
            }
            if token:
                params["pagination_token"] = token
            page = self._get(f"users/{found['id']}/tweets", params)
            posts += _x_posts(page, None)
            token = (page.get("meta") or {}).get("next_token")
            if not token:
                break
        for post in posts:
            post["account"] = account["handle"]
        return account, posts[:limit]


def reddit_search(query: str, limit: int, since: datetime, now: datetime, reddit=None,
                  client_id: Optional[str] = None, client_secret: Optional[str] = None) -> list:
    """Return up to `limit` Reddit submissions across r/all newer than `since`, newest first.

    `reddit` is injectable for tests; it defaults to an app-only, read-only
    `praw.Reddit` built from the client id and secret. No user account is used.
    """
    if reddit is None:
        if not client_id or not client_secret:
            raise CollectionError("REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are not set; create a script app at https://www.reddit.com/prefs/apps")
        try:
            import praw  # noqa: PLC0415 - optional dependency resolved at call time
        except ImportError as error:
            raise CollectionError("praw is not installed; run: python -m pip install 'praw==8.0.3'") from error
        reddit = praw.Reddit(client_id=client_id, client_secret=client_secret, user_agent=USER_AGENT, check_for_async=False)
        reddit.read_only = True
    window = "month" if (now - since).days <= 30 else "year"
    try:
        results = list(reddit.subreddit("all").search(query, sort="new", time_filter=window, limit=limit))
    except Exception as error:  # PRAW and prawcore raise many types; all mean this source failed
        raise CollectionError(f"Reddit search “{query}” failed: {error}") from error
    posts = []
    for item in results:
        created = getattr(item, "created_utc", None)
        if created is None or created < since.timestamp():
            continue
        body = getattr(item, "selftext", "") or ""
        links = urls_in(body)
        if not getattr(item, "is_self", True) and str(getattr(item, "url", "")).startswith("http"):
            links.insert(0, item.url)
        author = getattr(item, "author", None)
        name = getattr(author, "name", None) if author is not None else None
        subreddit = getattr(item, "subreddit", None)
        posts.append({
            "id": item.id,
            "platform": "reddit",
            "source": "reddit",
            "query": query,
            "author": name,
            "author_id": name,
            "author_followers": None,
            "author_following": None,
            "author_created_at": None,
            "created_at": _utc_iso(created),
            "lang": None,
            "text": " ".join(part for part in [getattr(item, "title", "") or "", body] if part),
            "likes": _int(getattr(item, "score", None)),
            "reposts": None,
            "replies": _int(getattr(item, "num_comments", None)),
            "quotes": None,
            "impressions": None,
            "links": links,
            "url": "https://www.reddit.com" + (getattr(item, "permalink", "") or f"/comments/{item.id}"),
            "community": f"r/{subreddit}" if subreddit is not None else None,
        })
    return posts


def _hn_record(hit: dict, query: str) -> dict:
    raw = hit.get("story_text") or hit.get("comment_text") or ""
    links = urls_in(html.unescape(raw))
    body = html.unescape(_TAG.sub(" ", raw))
    title = hit.get("title") or ""
    if hit.get("url"):
        links.insert(0, hit["url"])
    return {
        "id": str(hit["objectID"]),
        "platform": "hn",
        "source": "hacker-news-algolia",
        "query": query,
        "author": hit.get("author"),
        "author_id": hit.get("author"),
        "author_followers": None,
        "author_following": None,
        "author_created_at": None,
        "created_at": hit.get("created_at") or (_utc_iso(hit["created_at_i"]) if hit.get("created_at_i") else None),
        "lang": None,
        "text": " ".join(" ".join(part for part in [title, body] if part).split()),
        "likes": _int(hit.get("points")),
        "reposts": None,
        "replies": _int(hit.get("num_comments")),
        "quotes": None,
        "impressions": None,
        "links": links,
        "url": f"https://news.ycombinator.com/item?id={hit['objectID']}",
        "community": "Hacker News",
    }


def hn_search(query: str, limit: int, since: datetime, fetch: Fetch = http_json) -> list:
    """Return up to `limit` Hacker News stories and comments newer than `since` through Algolia search."""
    posts: list = []
    page = 0
    per_page = max(1, min(100, limit))
    while len(posts) < limit:
        params = {
            "query": query,
            "tags": "(story,comment)",
            "numericFilters": f"created_at_i>{int(since.timestamp())}",
            "hitsPerPage": per_page,
            "page": page,
        }
        data = fetch(f"{HN_API}?{urllib.parse.urlencode(params)}", {})
        hits = data.get("hits")
        if hits is None:
            raise CollectionError(f"Hacker News Algolia API returned no hits field for “{query}”")
        posts += [_hn_record(hit, query) for hit in hits if hit.get("objectID") is not None]
        page += 1
        if not hits or page >= int(data.get("nbPages") or 0):
            break
    return posts[:limit]
