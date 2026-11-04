"""Collect public Instagram posts for demand-heat analysis without downloading media.

Two sources share one record format (see metrics.py) and one interface:
`hashtag_posts`, `profile_posts`, `comments`, and `close`.

* GraphApi, when META_ACCESS_TOKEN and IG_USER_ID are set: Hashtag Search
  (ig_hashtag_search, then top_media and recent_media), Business Discovery for
  profiles. Instagram allows 30 unique hashtags per account in a rolling 7 days;
  fetching media for a hashtag counts as querying it, and the reader tracks the
  usage through recently_searched_hashtags.
* AnonymousSource otherwise: instaloader Hashtag and Profile iteration without
  login, with a pause between posts. It never downloads media and fails fast
  instead of waiting out a long rate-limit window.

Every failure raises CollectionError with an actionable message. Records read
before the failure stay on `error.records`, so callers can keep them and report
the gap.
"""

from __future__ import annotations

import http.client
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import timezone
from itertools import islice
from typing import Callable, Iterable, Optional

GRAPH_HOST = "https://graph.facebook.com"
GRAPH_VERSION = "v26.0"
HASHTAG_QUOTA = 30
MEDIA_PAGE_SIZE = 50
HASHTAG_MEDIA_FIELDS = "id,caption,comments_count,like_count,media_type,permalink,timestamp"
PROFILE_MEDIA_FIELDS = "id,caption,comments_count,like_count,media_type,media_product_type,permalink,timestamp,view_count"
#: Longest instaloader-requested wait the collector sits through; a robot run cannot idle for its usual 30 minutes.
MAX_RATE_LIMIT_WAIT_SECONDS = 120
_RATE_LIMIT_CODES = {4, 17, 32, 613}
_PERMISSION_CODES = {10, 200}
_USERNAME = re.compile(r"[A-Za-z0-9._]{1,30}")
_HASHTAG = re.compile(r"\w+")


class CollectionError(RuntimeError):
    """A source could not be read; `records` holds whatever was read first."""

    def __init__(self, message: str, records: Iterable = ()):
        super().__init__(message)
        self.records = list(records)


Fetch = Callable[[str], dict]


def normalize_hashtag(name: str) -> str:
    """Return a hashtag without `#`, lowercased; raise CollectionError when it is not one word."""
    tag = name.strip().lstrip("#＃").lower()
    if not _HASHTAG.fullmatch(tag):
        raise CollectionError(f"“{name}” is not a hashtag; use one word without spaces")
    return tag


def normalize_username(value: str) -> str:
    """Return the username of `@name`, `name`, or a profile URL; raise CollectionError otherwise."""
    text = value.strip()
    if "instagram.com/" in text:
        text = text.split("instagram.com/", 1)[1].split("?", 1)[0].strip("/").split("/", 1)[0]
    name = text.lstrip("@").lower()
    if not _USERNAME.fullmatch(name):
        raise CollectionError(f"“{value}” is not an Instagram username")
    return name


def _count(value) -> Optional[int]:
    """Return a non-negative count, or None; Instagram reports hidden counts as -1."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def _graph_hint(code) -> str:
    if code == 190:
        return " Refresh META_ACCESS_TOKEN; it is invalid or expired."
    if code in _RATE_LIMIT_CODES:
        return " The app or account hit a rate limit; wait and rerun with fewer targets."
    if code in _PERMISSION_CODES:
        return " Check the app permissions; Hashtag Search needs the Instagram Public Content Access feature."
    return ""


def http_json(url: str) -> dict:
    """GET one URL and decode its JSON body."""
    request = urllib.request.Request(url, headers={"User-Agent": "tomato-marketing-robot/1"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        with error:
            body = error.read().decode("utf-8", "replace")
        try:
            detail = json.loads(body).get("error", {})
        except (ValueError, AttributeError):
            raise CollectionError(f"Instagram Graph API returned HTTP {error.code}: {body[:300]}") from error
        message = detail.get("message", body[:300])
        raise CollectionError(f"Instagram Graph API returned HTTP {error.code}: {message}.{_graph_hint(detail.get('code'))}") from error
    except (OSError, http.client.HTTPException) as error:
        raise CollectionError(f"Instagram Graph API unreachable: {getattr(error, 'reason', error)}") from error
    except ValueError as error:
        raise CollectionError(f"Instagram Graph API returned invalid JSON: {error}") from error


def _graph_kind(media_type: Optional[str], product_type: Optional[str]) -> Optional[str]:
    if product_type == "REELS":
        return "reel"
    return {"VIDEO": "video", "IMAGE": "image", "CAROUSEL_ALBUM": "carousel"}.get(media_type or "")


def _graph_record(item: dict, target: str, edge: str, owner: Optional[str]) -> dict:
    return {
        "id": str(item["id"]),
        "url": item.get("permalink"),
        "owner": owner,
        "caption": item.get("caption"),
        "kind": _graph_kind(item.get("media_type"), item.get("media_product_type")),
        "published_at": item.get("timestamp"),
        "likes": _count(item.get("like_count")),
        "comments": _count(item.get("comments_count")),
        "views": _count(item.get("view_count")),
        "target": target,
        "edge": edge,
        "source": "instagram-graph-api",
    }


class GraphApi:
    """Instagram Graph API reader that counts calls and hashtag quota usage."""

    def __init__(self, token: str, ig_user_id: str, fetch: Fetch = http_json, version: str = GRAPH_VERSION):
        self.token = token
        self.ig_user_id = ig_user_id
        self.fetch = fetch
        self.version = version
        self.calls = 0
        self.media_counts: dict = {}
        self.queried: set = set()
        self.counted_before: Optional[set] = None
        self.quota_error: Optional[str] = None
        self._hashtag_ids: dict = {}

    def close(self) -> None:
        """Release nothing; the interface matches AnonymousSource."""

    def _get(self, path: str, **params) -> dict:
        query = urllib.parse.urlencode({**params, "access_token": self.token})
        self.calls += 1
        try:
            return self.fetch(f"{GRAPH_HOST}/{self.version}/{path}?{query}")
        except CollectionError as error:
            raise CollectionError(str(error).replace(self.token, "[redacted]")) from None

    def load_quota(self) -> None:
        """Read which hashtags already count against the 30-per-7-days limit; failure leaves usage unknown."""
        try:
            page = self._get(f"{urllib.parse.quote(self.ig_user_id, safe='')}/recently_searched_hashtags", fields="id", limit=HASHTAG_QUOTA)
        except CollectionError as error:
            self.quota_error = str(error)
            return
        self.counted_before = {str(item["id"]) for item in page.get("data", []) if item.get("id")}

    def quota(self) -> dict:
        """Return hashtag quota usage; used_before, used_after, and remaining are None when unknown."""
        before = None if self.counted_before is None else len(self.counted_before)
        after = None if self.counted_before is None else len(self.counted_before | self.queried)
        return {
            "limit": HASHTAG_QUOTA,
            "used_before": before,
            "queried_this_run": len(self.queried),
            "used_after": after,
            "remaining": None if after is None else max(HASHTAG_QUOTA - after, 0),
        }

    def _hashtag_id(self, tag: str) -> str:
        if tag not in self._hashtag_ids:
            found = self._get("ig_hashtag_search", user_id=self.ig_user_id, q=tag).get("data", [])
            if not found:
                raise CollectionError(f"Instagram Graph API has no hashtag #{tag}, or Instagram treats it as sensitive")
            self._hashtag_ids[tag] = str(found[0]["id"])
        return self._hashtag_ids[tag]

    def _reserve(self, hashtag_id: str, tag: str) -> None:
        counted = (self.counted_before or set()) | self.queried
        if hashtag_id not in counted and len(counted) >= HASHTAG_QUOTA:
            raise CollectionError(f"#{tag} skipped: all {HASHTAG_QUOTA} unique hashtags of the rolling 7-day quota are used; rerun with hashtags already queried or wait")
        self.queried.add(hashtag_id)

    def _hashtag_edge(self, hashtag_id: str, tag: str, edge: str, limit: int) -> list:
        records: list = []
        after = None
        while len(records) < limit:
            params = {"user_id": self.ig_user_id, "fields": HASHTAG_MEDIA_FIELDS, "limit": min(MEDIA_PAGE_SIZE, limit - len(records))}
            if after:
                params["after"] = after
            try:
                page = self._get(f"{hashtag_id}/{edge}", **params)
            except CollectionError as error:
                raise CollectionError(f"#{tag} {edge}: {error}", records) from None
            items = page.get("data", [])
            records += [_graph_record(item, f"#{tag}", edge, None) for item in items]
            after = page.get("paging", {}).get("cursors", {}).get("after")
            if not after or not items:
                break
        return records[:limit]

    def hashtag_posts(self, name: str, limit: int, edges: Iterable = ("top_media", "recent_media")) -> list:
        """Return up to `limit` posts per edge; recent_media only reaches the last 24 hours."""
        tag = normalize_hashtag(name)
        hashtag_id = self._hashtag_id(tag)
        self._reserve(hashtag_id, tag)
        self.media_counts[tag] = None
        records: list = []
        failures: list = []
        for edge in edges:
            try:
                records += self._hashtag_edge(hashtag_id, tag, edge, limit)
            except CollectionError as error:
                records += error.records
                failures.append(str(error))
        if failures:
            raise CollectionError("; ".join(failures), records)
        if not records:
            raise CollectionError(f"#{tag} returned no public media")
        return records

    def profile_posts(self, username: str, limit: int) -> list:
        """Return up to `limit` recent posts of a Business or Creator account through Business Discovery."""
        name = normalize_username(username)
        records: list = []
        after = None
        while len(records) < limit:
            cursor = f".after({after})" if after else ""
            media = f"media{cursor}.limit({min(MEDIA_PAGE_SIZE, limit - len(records))}){{{PROFILE_MEDIA_FIELDS}}}"
            fields = f"business_discovery.username({name}){{username,{media}}}"
            try:
                found = self._get(urllib.parse.quote(self.ig_user_id, safe=""), fields=fields).get("business_discovery") or {}
            except CollectionError as error:
                raise CollectionError(f"@{name}: {error} Business Discovery reads only Business and Creator accounts.", records) from None
            page = found.get("media") or {}
            items = page.get("data", [])
            records += [_graph_record(item, f"@{name}", "profile", name) for item in items]
            after = page.get("paging", {}).get("cursors", {}).get("after")
            if not after or not items:
                break
        if not records:
            raise CollectionError(f"@{name} returned no media")
        return records[:limit]

    def comments(self, record: dict, limit: int) -> list:
        """Return comment texts of one post; Instagram allows this only for the token owner's media."""
        page = self._get(f"{urllib.parse.quote(record['id'], safe='')}/comments", fields="text", limit=min(MEDIA_PAGE_SIZE, limit))
        return [item["text"] for item in page.get("data", []) if item.get("text")]


def _import_instaloader():
    try:
        import instaloader  # noqa: PLC0415 - optional dependency resolved at call time
    except ImportError as error:
        raise CollectionError("instaloader is not installed; run: python -m pip install 'instaloader==4.16'") from error
    return instaloader


def _safe(read: Callable):
    """Return a lazily read field, or None; instaloader's properties raise many library types when a field is absent."""
    try:
        return read()
    except CollectionError:
        raise
    except Exception:  # noqa: BLE001 - see docstring: an unreadable field stays unknown
        return None


def _explain(target: str, error: Exception) -> str:
    text = str(error) or type(error).__name__
    lowered = text.lower()
    if any(word in lowered for word in ("login", "401", "403", "429", "too many", "redirect", "checkpoint")):
        return (
            f"{target}: Instagram refused anonymous access ({text}). Wait before retrying, lower --limit, "
            "or set META_ACCESS_TOKEN and IG_USER_ID; this skill never logs in."
        )
    return f"{target}: instaloader failed: {text}"


def post_record(post, target: str, edge: str, owner: Optional[str] = None) -> dict:
    """Map one instaloader Post to the shared record without triggering a media download.

    instaloader normalizes an absent like or comment count to 0 and hidden counts
    to -1; both stay None here. Its `_asdict` is the library's own serialization
    of the raw node and needs no request.
    """
    raw = _safe(post._asdict) or {}
    is_web_media = "code" in raw
    device = raw.get("iphone_struct") or {}
    hidden = bool(raw.get("like_and_view_counts_disabled") or device.get("like_and_view_counts_disabled"))
    likes = None if hidden or (is_web_media and raw.get("like_count") is None) else _count(_safe(lambda: post.likes))
    if is_web_media and raw.get("comment_count") is None:
        comments = None
    elif "comments" in raw:
        comments = _count(raw["comments"])
    else:
        comments = _count(_safe(lambda: post.comments))
    typename = _safe(lambda: post.typename)
    is_reel = "clips" in (raw.get("product_type"), device.get("product_type"))
    kind = {"GraphImage": "image", "GraphSidecar": "carousel", "GraphVideo": "reel" if is_reel else "video"}.get(typename)
    views = None
    if typename == "GraphVideo" and not hidden:
        views = _count(_safe(lambda: post.video_view_count))
        views = _count(_safe(lambda: post.video_play_count)) if views is None else views
    published = _safe(lambda: post.date_utc)
    shortcode = post.shortcode
    node = raw.get("owner") or {}
    author = str(node.get("username") or node.get("id") or "").lower() or None
    return {
        "id": shortcode,
        "url": f"https://www.instagram.com/p/{shortcode}/",
        "owner": owner or author,
        "caption": _safe(lambda: post.caption),
        "kind": kind,
        "published_at": None if published is None else published.replace(tzinfo=timezone.utc).isoformat(),
        "likes": likes,
        "comments": comments,
        "views": views,
        "target": target,
        "edge": edge,
        "source": "instaloader",
    }


class AnonymousSource:
    """instaloader reader without login. `module` and `pause` are injectable for tests."""

    def __init__(self, sleep_seconds: float = 3.0, module=None, pause: Callable = time.sleep):
        self.module = _import_instaloader() if module is None else module
        self.sleep_seconds = sleep_seconds
        self.pause = pause
        self.media_counts: dict = {}
        self.calls = None
        self.blocked: Optional[str] = None
        self._posts: dict = {}
        self.loader = self.module.Instaloader(
            sleep=True,
            quiet=True,
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            max_connection_attempts=2,
            request_timeout=30.0,
            rate_controller=self._rate_controller(),
            resume_prefix=None,
        )

    def _rate_controller(self):
        class FailFast(self.module.RateController):
            """Raise instead of sleeping through a long rate-limit window."""

            def sleep(self, secs: float) -> None:
                if secs > MAX_RATE_LIMIT_WAIT_SECONDS:
                    raise CollectionError(f"Instagram rate limit: instaloader asked to wait {round(secs)} s; stop now and rerun later with a lower --limit")
                super().sleep(secs)

        return FailFast

    def close(self) -> None:
        """Close the instaloader session."""
        self.loader.close()

    def _guard(self) -> None:
        if self.blocked:
            raise CollectionError(f"skipped after rate limit: {self.blocked}")

    def _take(self, open_iterator: Callable, limit: int, target: str, edge: str, owner: Optional[str] = None) -> list:
        self._guard()
        records: list = []
        try:
            for post in islice(open_iterator(), limit):
                record = post_record(post, target, edge, owner)
                self._posts[record["id"]] = post
                records.append(record)
                self.pause(self.sleep_seconds)
        except CollectionError as error:
            self.blocked = str(error)
            raise CollectionError(f"{target}: {error}", records) from error
        except Exception as error:  # noqa: BLE001 - instaloader raises many types; all mean this source failed
            raise CollectionError(_explain(target, error), records) from error
        return records

    def hashtag_posts(self, name: str, limit: int, edges: Iterable = ("top_media", "recent_media")) -> list:
        """Return up to `limit` top and recent posts of a hashtag."""
        self._guard()
        tag = normalize_hashtag(name)
        target = f"#{tag}"
        try:
            hashtag = self.module.Hashtag.from_name(self.loader.context, tag)
            self.media_counts[tag] = _count(_safe(lambda: hashtag.mediacount))
        except CollectionError as error:
            self.blocked = str(error)
            raise
        except Exception as error:  # noqa: BLE001 - instaloader raises many types; all mean this source failed
            raise CollectionError(_explain(target, error)) from error
        openers = {"top_media": hashtag.get_top_posts, "recent_media": hashtag.get_posts_resumable}
        records: list = []
        failures: list = []
        for edge in edges:
            try:
                records += self._take(openers[edge], limit, target, edge)
            except CollectionError as error:
                records += error.records
                failures.append(str(error))
        if failures:
            raise CollectionError("; ".join(failures), records)
        if not records:
            raise CollectionError(f"{target} returned no public posts")
        return records

    def profile_posts(self, username: str, limit: int) -> list:
        """Return up to `limit` recent posts of a public profile; each post costs one request."""
        self._guard()
        name = normalize_username(username)
        target = f"@{name}"
        try:
            profile = self.module.Profile.from_username(self.loader.context, name)
            private = _safe(lambda: profile.is_private)
        except CollectionError as error:
            self.blocked = str(error)
            raise
        except Exception as error:  # noqa: BLE001 - instaloader raises many types; all mean this source failed
            raise CollectionError(_explain(target, error)) from error
        if private:
            raise CollectionError(f"{target} is private; this skill reads public profiles only and never logs in")
        records = self._take(profile.get_posts, limit, target, "profile", name)
        if not records:
            raise CollectionError(f"{target} returned no public posts")
        return records

    def comments(self, record: dict, limit: int) -> list:
        """Return comment texts of one post; instaloader requires login for this, so anonymous runs raise."""
        self._guard()
        try:
            return [comment.text for comment in islice(self._posts[record["id"]].get_comments(), limit)]
        except Exception as error:  # noqa: BLE001 - instaloader raises many types; all mean this source failed
            raise CollectionError(_explain(f"comments of {record['id']}", error)) from error
