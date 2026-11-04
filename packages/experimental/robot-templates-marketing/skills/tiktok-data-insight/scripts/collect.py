"""Collect TikTok accounts, hashtags, sounds, and single-video stats; network and file I/O only.

Sources share the video record format described in metrics.py:

* TikTok Display API v2 when a user access token is given (TIKTOK_ACCESS_TOKEN):
  /v2/user/info/ and /v2/video/list/ for the authorized account only. Scopes:
  user.info.basic, user.info.profile, user.info.stats, video.list.
* TikTokApi (unofficial, Playwright + ms_token from TIKTOK_MS_TOKEN) for public
  accounts, hashtags, and sounds; TikTok rate-limits and blocks it without notice.
* yt-dlp with download=False for single-video stat checks.

Every failure raises CollectionError with an actionable message.
"""

from __future__ import annotations

import asyncio
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Callable, Optional

DISPLAY_API = "https://open.tiktokapis.com/v2/"
USER_FIELDS = "open_id,union_id,avatar_url,display_name,username,bio_description,is_verified,follower_count,following_count,likes_count,video_count"
VIDEO_FIELDS = "id,create_time,title,video_description,duration,share_url,view_count,like_count,comment_count,share_count"
STATE_VERSION = 1


class CollectionError(RuntimeError):
    """A source could not be read; the message says which and why."""


def _int(value) -> Optional[int]:
    return None if value in (None, "") else int(value)


def _iso(timestamp) -> Optional[str]:
    return None if timestamp in (None, "", 0) else datetime.fromtimestamp(int(timestamp), timezone.utc).isoformat()


def http_json(url: str, token: str, body: Optional[dict] = None) -> dict:
    """GET (or POST `body` as JSON) one Display API URL with a bearer token."""
    data = None if body is None else json.dumps(body).encode()
    headers = {"Authorization": f"Bearer {token}", "User-Agent": "tomato-marketing-robot/1"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method="POST" if data is not None else "GET")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:300]
        hint = " (token expired or missing a scope: user.info.basic, user.info.profile, user.info.stats, video.list)" if error.code in (401, 403) else ""
        raise CollectionError(f"TikTok Display API returned HTTP {error.code}{hint}: {detail}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"TikTok Display API unreachable: {error.reason}") from error


class DisplayApi:
    """TikTok Display API v2 reader for the account that authorized the token."""

    def __init__(self, token: str, fetch: Callable = http_json):
        self.token = token
        self.fetch = fetch
        self.requests = 0

    def _call(self, path: str, fields: str, body: Optional[dict] = None) -> dict:
        self.requests += 1
        response = self.fetch(f"{DISPLAY_API}{path}?{urllib.parse.urlencode({'fields': fields})}", self.token, body)
        error = response.get("error") or {}
        if error.get("code") not in (None, "ok"):
            raise CollectionError(f"TikTok Display API {path}: {error.get('code')} {error.get('message', '')}".strip())
        return response.get("data") or {}

    def user(self) -> dict:
        """Return the authorized account as an account record."""
        user = self._call("user/info/", USER_FIELDS).get("user") or {}
        if not user:
            raise CollectionError("TikTok Display API user/info returned no user")
        return {
            "handle": user.get("username") or user.get("display_name") or user.get("open_id"),
            "nickname": user.get("display_name"),
            "followers": _int(user.get("follower_count")),
            "following": _int(user.get("following_count")),
            "likes_total": _int(user.get("likes_count")),
            "video_count": _int(user.get("video_count")),
            "verified": user.get("is_verified"),
            "source": "tiktok-display-api",
        }

    def videos(self, limit: int, handle: Optional[str] = None) -> list:
        """Return up to `limit` of the authorized account's videos, newest first (20 per request)."""
        records: list = []
        cursor = None
        while len(records) < limit:
            body = {"max_count": min(20, limit - len(records))}
            if cursor is not None:
                body["cursor"] = cursor
            page = self._call("video/list/", VIDEO_FIELDS, body)
            for item in page.get("videos") or []:
                records.append({
                    "id": str(item.get("id")),
                    "author": handle,
                    "description": item.get("video_description") or item.get("title"),
                    "published_at": _iso(item.get("create_time")),
                    "duration_seconds": _int(item.get("duration")),
                    "views": _int(item.get("view_count")),
                    "likes": _int(item.get("like_count")),
                    "comments": _int(item.get("comment_count")),
                    "shares": _int(item.get("share_count")),
                    "hashtags": [],
                    "sound_id": None,
                    "sound_title": None,
                    "url": item.get("share_url"),
                    "source": "tiktok-display-api",
                })
            cursor = page.get("cursor")
            if not page.get("has_more"):
                break
        return records[:limit]


def video_record(raw: dict) -> dict:
    """Map one TikTok item dict (as returned by TikTokApi) to a video record."""
    stats = raw.get("statsV2") or raw.get("stats") or {}
    author = raw.get("author") or {}
    handle = author.get("uniqueId") if isinstance(author, dict) else author
    music = raw.get("music") or {}
    return {
        "id": str(raw.get("id")),
        "author": handle,
        "description": raw.get("desc"),
        "published_at": _iso(raw.get("createTime")),
        "duration_seconds": _int((raw.get("video") or {}).get("duration")),
        "views": _int(stats.get("playCount")),
        "likes": _int(stats.get("diggCount")),
        "comments": _int(stats.get("commentCount")),
        "shares": _int(stats.get("shareCount")),
        "hashtags": [tag.get("title") for tag in raw.get("challenges") or [] if tag.get("title")],
        "sound_id": str(music["id"]) if music.get("id") else None,
        "sound_title": music.get("title"),
        "url": f"https://www.tiktok.com/@{handle}/video/{raw.get('id')}" if handle else None,
        "source": "TikTokApi",
    }


def account_record(info: dict) -> dict:
    """Map TikTokApi user detail (userInfo) to an account record."""
    user_info = info.get("userInfo") or {}
    user, stats = user_info.get("user") or {}, user_info.get("statsV2") or user_info.get("stats") or {}
    return {
        "handle": user.get("uniqueId"),
        "nickname": user.get("nickname"),
        "followers": _int(stats.get("followerCount")),
        "following": _int(stats.get("followingCount")),
        "likes_total": _int(stats.get("heartCount") or stats.get("heart")),
        "video_count": _int(stats.get("videoCount")),
        "verified": user.get("verified"),
        "source": "TikTokApi",
    }


def topic_stats(kind: str, info: dict) -> dict:
    """Return {views, videos} from a TikTokApi hashtag or sound detail response."""
    if kind == "hashtag":
        detail = info.get("challengeInfo") or {}
    else:
        detail = info.get("musicInfo") or {}
    stats = detail.get("statsV2") or detail.get("stats") or {}
    return {"views": _int(stats.get("viewCount")), "videos": _int(stats.get("videoCount"))}


async def _tiktokapi_batch(requests: list, limit: int, ms_token: str) -> dict:
    try:
        from TikTokApi import TikTokApi  # noqa: PLC0415 - optional dependency resolved at call time
    except ImportError as error:
        raise CollectionError("TikTokApi is not installed; run: python -m pip install 'TikTokApi==7.3.3' && python -m playwright install chromium") from error
    results: dict = {}
    async with TikTokApi() as api:
        await api.create_sessions(ms_tokens=[ms_token], num_sessions=1, sleep_after=3, headless=True)
        for kind, name in requests:
            try:
                target = {"account": lambda: api.user(username=name), "hashtag": lambda: api.hashtag(name=name), "sound": lambda: api.sound(id=name)}[kind]()
                info = await target.info()
                videos = [video.as_dict async for video in target.videos(count=limit)]
                results[(kind, name)] = {"info": info, "videos": videos}
            except Exception as error:  # TikTokApi raises many types; each means this target failed
                results[(kind, name)] = error
    return results


class PublicSource:
    """TikTokApi reader for public accounts, hashtags, and sounds.

    `batch(requests, limit, ms_token)` returns {(kind, name): {"info", "videos"} or an
    exception}; it defaults to one TikTokApi browser session and is injectable for tests.
    """

    def __init__(self, ms_token: Optional[str], limit: int, batch: Optional[Callable] = None):
        self.ms_token = ms_token
        self.limit = limit
        self.batch = batch or (lambda requests, count, token: asyncio.run(_tiktokapi_batch(requests, count, token)))

    def fetch(self, requests: list) -> dict:
        """Return {(kind, name): result dict or CollectionError} for every request."""
        if not requests:
            return {}
        if not self.ms_token:
            missing = CollectionError("TIKTOK_MS_TOKEN is not set; copy the msToken cookie from a logged-out tiktok.com visit and export TIKTOK_MS_TOKEN")
            return {request: missing for request in requests}
        try:
            raw = self.batch(requests, self.limit, self.ms_token)
        except CollectionError as error:
            return {request: error for request in requests}
        except Exception as error:  # Playwright and TikTokApi session failures
            failure = CollectionError(f"TikTokApi session failed (unofficial and rate-limited; refresh TIKTOK_MS_TOKEN or retry later): {error}")
            return {request: failure for request in requests}
        results = {}
        for kind, name in requests:
            item = raw.get((kind, name))
            if item is None or isinstance(item, Exception):
                results[(kind, name)] = CollectionError(f"TikTokApi could not read {kind} {name}: {item or 'no response'}")
                continue
            videos = [video_record(video) for video in item.get("videos") or [] if video.get("id")]
            info = item.get("info") or {}
            record = {"videos": videos}
            if kind == "account":
                record["account"] = account_record(info)
            else:
                record["stats"] = topic_stats(kind, info)
            if not videos and (kind != "account" or record["account"]["handle"] is None):
                results[(kind, name)] = CollectionError(f"TikTokApi returned no data for {kind} {name}")
            else:
                results[(kind, name)] = record
        return results


def ytdlp_video(url: str, extract: Optional[Callable] = None) -> dict:
    """Return one video record for a TikTok URL through yt-dlp with download=False."""
    if extract is None:
        try:
            import yt_dlp  # noqa: PLC0415 - optional dependency resolved at call time
        except ImportError as error:
            raise CollectionError("yt-dlp is not installed; run: python -m pip install 'yt-dlp==2026.10.26'") from error

        def extract(target: str) -> dict:
            with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True}) as ydl:
                return ydl.sanitize_info(ydl.extract_info(target, download=False))
    try:
        info = extract(url)
    except Exception as error:  # yt-dlp raises many types; all mean this source failed
        raise CollectionError(f"yt-dlp could not read {url}: {error}") from error
    if not info or not info.get("id"):
        raise CollectionError(f"yt-dlp returned nothing for {url}")
    return {
        "id": str(info["id"]),
        "author": info.get("uploader") or info.get("channel"),
        "description": info.get("description") or info.get("title"),
        "published_at": _iso(info.get("timestamp")),
        "duration_seconds": _int(info.get("duration")),
        "views": _int(info.get("view_count")),
        "likes": _int(info.get("like_count")),
        "comments": _int(info.get("comment_count")),
        "shares": _int(info.get("repost_count")),
        "hashtags": [tag.lstrip("#") for tag in info.get("tags") or []],
        "sound_id": None,
        "sound_title": info.get("track"),
        "url": info.get("webpage_url") or url,
        "source": "yt-dlp",
    }


def load_state(path: Optional[str]) -> dict:
    """Load the snapshot state file; a missing file starts an empty state."""
    empty = {"version": STATE_VERSION, "accounts": {}, "hashtags": {}, "sounds": {}}
    if not path:
        return empty
    try:
        with open(path, encoding="utf-8") as handle:
            state = json.load(handle)
    except FileNotFoundError:
        return empty
    except (OSError, json.JSONDecodeError) as error:
        raise CollectionError(f"state file {path} is unreadable ({error}); move it aside to start a new history") from error
    if state.get("version") != STATE_VERSION:
        raise CollectionError(f"state file {path} has version {state.get('version')!r}; expected {STATE_VERSION}")
    for key in ("accounts", "hashtags", "sounds"):
        state.setdefault(key, {})
    return state


def record_snapshot(state: dict, group: str, name: str, snapshot: dict) -> list:
    """Append one snapshot (with captured_at) unless that time is already stored; return the sorted history."""
    history = state[group].setdefault(name, [])
    if all(item["captured_at"] != snapshot["captured_at"] for item in history):
        history.append(snapshot)
    history.sort(key=lambda item: item["captured_at"])
    return history


def save_state(path: str, state: dict) -> None:
    """Write the state file through a temporary file and a rename."""
    temporary = f"{path}.tmp"
    try:
        with open(temporary, "w", encoding="utf-8") as handle:
            json.dump(state, handle, ensure_ascii=False, indent=1)
        os.replace(temporary, path)
    except OSError as error:
        raise CollectionError(f"cannot write state file {path}: {error.strerror}") from error
