"""Collect public Instagram profiles and posts without downloading media.

Two sources share one interface, `account(username, limit)`, which returns
(profile, posts) in the formats metrics.py documents:

* GraphApi, when META_ACCESS_TOKEN and IG_USER_ID are set: Business Discovery
  reads other Business and Creator accounts. Meta allows about 200 calls per
  user per hour.
* AnonymousSource otherwise: instaloader Profile post iteration without login,
  with a pause between posts. It never downloads media and fails fast instead of
  waiting out a long rate-limit window.

Every failure raises CollectionError with an actionable message. Data read
before the failure stays on `error.profile` and `error.records`, so callers can
keep it and report the gap.
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
MEDIA_PAGE_SIZE = 50
PROFILE_FIELDS = "username,name,followers_count,follows_count,media_count"
MEDIA_FIELDS = "id,caption,comments_count,like_count,media_type,media_product_type,permalink,timestamp,view_count"
#: Longest instaloader-requested wait the collector sits through; a robot run cannot idle for its usual 30 minutes.
MAX_RATE_LIMIT_WAIT_SECONDS = 120
_RATE_LIMIT_CODES = {4, 17, 32, 613}
_PERMISSION_CODES = {10, 200}
_USERNAME = re.compile(r"[A-Za-z0-9._]{1,30}")


class CollectionError(RuntimeError):
    """A source could not be read; `profile` and `records` hold whatever was read first."""

    def __init__(self, message: str, records: Iterable = (), profile: Optional[dict] = None):
        super().__init__(message)
        self.records = list(records)
        self.profile = profile


Fetch = Callable[[str], dict]


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
        return " The app or account hit a rate limit; wait and rerun with fewer accounts."
    if code in _PERMISSION_CODES:
        return " Check that the token has instagram_basic and Business Discovery access."
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


def _graph_post(item: dict, owner: str) -> dict:
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
        "source": "instagram-graph-api",
    }


class GraphApi:
    """Business Discovery reader with a call counter."""

    def __init__(self, token: str, ig_user_id: str, fetch: Fetch = http_json, version: str = GRAPH_VERSION):
        self.token = token
        self.ig_user_id = ig_user_id
        self.fetch = fetch
        self.version = version
        self.calls = 0

    def close(self) -> None:
        """Release nothing; the interface matches AnonymousSource."""

    def _discover(self, name: str, media: str) -> dict:
        query = urllib.parse.urlencode({
            "fields": f"business_discovery.username({name}){{{PROFILE_FIELDS},{media}}}",
            "access_token": self.token,
        })
        self.calls += 1
        path = urllib.parse.quote(self.ig_user_id, safe="")
        try:
            return self.fetch(f"{GRAPH_HOST}/{self.version}/{path}?{query}").get("business_discovery") or {}
        except CollectionError as error:
            raise CollectionError(str(error).replace(self.token, "[redacted]")) from None

    def account(self, username: str, limit: int) -> tuple:
        """Return (profile, up to `limit` recent posts) of a Business or Creator account."""
        name = normalize_username(username)
        posts: list = []
        profile: Optional[dict] = None
        after = None
        while len(posts) < limit:
            cursor = f".after({after})" if after else ""
            media = f"media{cursor}.limit({min(MEDIA_PAGE_SIZE, limit - len(posts))}){{{MEDIA_FIELDS}}}"
            try:
                found = self._discover(name, media)
            except CollectionError as error:
                raise CollectionError(f"{error} Business Discovery reads only Business and Creator accounts.", posts, profile) from None
            if profile is None and found:
                profile = {
                    "username": name,
                    "name": found.get("name"),
                    "followers": _count(found.get("followers_count")),
                    "following": _count(found.get("follows_count")),
                    "media_count": _count(found.get("media_count")),
                    "source": "instagram-graph-api",
                }
            page = found.get("media") or {}
            items = page.get("data", [])
            posts += [_graph_post(item, name) for item in items]
            after = page.get("paging", {}).get("cursors", {}).get("after")
            if not after or not items:
                break
        if not posts:
            raise CollectionError("the account returned no media", profile=profile)
        return profile, posts[:limit]


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


def _explain(error: Exception) -> str:
    text = str(error) or type(error).__name__
    lowered = text.lower()
    if any(word in lowered for word in ("login", "401", "403", "429", "too many", "redirect", "checkpoint")):
        return (
            f"Instagram refused anonymous access ({text}). Wait before retrying, lower --limit, "
            "or set META_ACCESS_TOKEN and IG_USER_ID; this skill never logs in."
        )
    return f"instaloader failed: {text}"


def post_record(post, owner: str) -> dict:
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
    return {
        "id": shortcode,
        "url": f"https://www.instagram.com/p/{shortcode}/",
        "owner": owner,
        "caption": _safe(lambda: post.caption),
        "kind": kind,
        "published_at": None if published is None else published.replace(tzinfo=timezone.utc).isoformat(),
        "likes": likes,
        "comments": comments,
        "views": views,
        "source": "instaloader",
    }


class AnonymousSource:
    """instaloader reader without login. `module` and `pause` are injectable for tests."""

    def __init__(self, sleep_seconds: float = 3.0, module=None, pause: Callable = time.sleep):
        self.module = _import_instaloader() if module is None else module
        self.sleep_seconds = sleep_seconds
        self.pause = pause
        self.calls = None
        self.blocked: Optional[str] = None
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

    def account(self, username: str, limit: int) -> tuple:
        """Return (profile, up to `limit` recent posts) of a public profile; each post costs one request."""
        if self.blocked:
            raise CollectionError(f"skipped after rate limit: {self.blocked}")
        name = normalize_username(username)
        try:
            found = self.module.Profile.from_username(self.loader.context, name)
            private = _safe(lambda: found.is_private)
            profile = {
                "username": name,
                "name": _safe(lambda: found.full_name),
                "followers": _count(_safe(lambda: found.followers)),
                "following": _count(_safe(lambda: found.followees)),
                "media_count": _count(_safe(lambda: found.mediacount)),
                "source": "instaloader",
            }
        except CollectionError as error:
            self.blocked = str(error)
            raise
        except Exception as error:  # noqa: BLE001 - instaloader raises many types; all mean this source failed
            raise CollectionError(_explain(error)) from error
        if private:
            raise CollectionError("the profile is private; this skill reads public profiles only and never logs in")
        posts: list = []
        try:
            for post in islice(found.get_posts(), limit):
                posts.append(post_record(post, name))
                self.pause(self.sleep_seconds)
        except CollectionError as error:
            self.blocked = str(error)
            raise CollectionError(str(error), posts, profile) from error
        except Exception as error:  # noqa: BLE001 - instaloader raises many types; all mean this source failed
            raise CollectionError(_explain(error), posts, profile) from error
        if not posts:
            raise CollectionError("the profile returned no public posts", profile=profile)
        return profile, posts
