"""Collect YouTube review-video metadata and top comments without downloading media.

Two sources share one record format (see metrics.py):

* YouTube Data API v3 when an API key is given: search.list (100 units per
  call), videos.list (1 unit per 50 ids), channels.list and playlistItems.list
  (1 unit each, for channel baselines), and commentThreads.list (1 unit per
  page of up to 100 top-level comments).
* yt-dlp otherwise: flat-playlist search listings, and per-video comment
  extraction with getcomments=True limited by the max_comments extractor
  argument. Counts that yt-dlp does not return stay None.

Every function raises CollectionError with an actionable message instead of
returning partial data silently; callers record the message in the report's
data gaps section.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Callable, Optional

API = "https://www.googleapis.com/youtube/v3/"


class CollectionError(RuntimeError):
    """A source could not be read; the message says which and why."""


Fetch = Callable[[str], dict]


def http_json(url: str) -> dict:
    """GET one URL and decode its JSON body."""
    request = urllib.request.Request(url, headers={"User-Agent": "tomato-marketing-robot/1"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")[:300]
        raise CollectionError(f"YouTube Data API returned HTTP {error.code}: {body}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"YouTube Data API unreachable: {error.reason}") from error
    except ValueError as error:
        raise CollectionError(f"YouTube Data API returned a body that is not JSON: {error}") from error


def _int(value) -> Optional[int]:
    return int(value) if value not in (None, "") else None


def _iso_duration_seconds(text: Optional[str]) -> Optional[int]:
    """Parse an ISO 8601 duration such as PT1H2M3S."""
    if not text or not text.startswith("P"):
        return None
    total, number, in_time = 0, "", False
    for char in text[1:]:
        if char == "T":
            in_time = True
        elif char.isdigit():
            number += char
        else:
            unit = {"D": 86400, "H": 3600, "M": 60 if in_time else 0, "S": 1}.get(char, 0)
            total += int(number or 0) * unit
            number = ""
    return total


def _from_timestamp(value) -> Optional[str]:
    return None if value is None else datetime.fromtimestamp(value, timezone.utc).isoformat()


class DataApi:
    """YouTube Data API v3 reader with a unit counter."""

    def __init__(self, key: str, fetch: Fetch = http_json):
        self.key = key
        self.fetch = fetch
        self.units = 0

    def _get(self, method: str, cost: int, **params) -> dict:
        query = urllib.parse.urlencode({**params, "key": self.key})
        self.units += cost
        return self.fetch(f"{API}{method}?{query}")

    def search(self, query: str, limit: int, order: str = "relevance", region: Optional[str] = None) -> list:
        """Return up to `limit` video ids for a search query."""
        ids: list = []
        token = None
        while len(ids) < limit:
            params = {"part": "id", "type": "video", "q": query, "order": order, "maxResults": min(50, limit - len(ids))}
            if region:
                params["regionCode"] = region
            if token:
                params["pageToken"] = token
            page = self._get("search", 100, **params)
            ids += [item["id"]["videoId"] for item in page.get("items", []) if item.get("id", {}).get("videoId")]
            token = page.get("nextPageToken")
            if not token:
                break
        return ids[:limit]

    def videos(self, ids: list) -> list:
        """Return full records for video ids, 50 per call, in the given order."""
        records: dict = {}
        for start in range(0, len(ids), 50):
            batch = ids[start:start + 50]
            page = self._get("videos", 1, part="snippet,statistics,contentDetails", id=",".join(batch))
            for item in page.get("items", []):
                snippet, stats = item.get("snippet", {}), item.get("statistics", {})
                records[item["id"]] = {
                    "id": item["id"],
                    "title": snippet.get("title"),
                    "channel_id": snippet.get("channelId"),
                    "channel_title": snippet.get("channelTitle"),
                    "published_at": snippet.get("publishedAt"),
                    "duration_seconds": _iso_duration_seconds(item.get("contentDetails", {}).get("duration")),
                    "views": _int(stats.get("viewCount")),
                    "likes": _int(stats.get("likeCount")),
                    "comments": _int(stats.get("commentCount")),
                    "description": snippet.get("description"),
                    "url": f"https://www.youtube.com/watch?v={item['id']}",
                    "source": "youtube-data-api",
                }
        return [records[video_id] for video_id in ids if video_id in records]

    def channel_uploads(self, channel_id: str, limit: int) -> list:
        """Return up to `limit` recent upload ids for a channel id (UC…); costs 1 unit plus 1 per page."""
        found = self._get("channels", 1, part="contentDetails", id=channel_id).get("items", [])
        if not found:
            raise CollectionError(f"channel {channel_id} was not found")
        playlist = found[0]["contentDetails"]["relatedPlaylists"]["uploads"]
        page = self._get("playlistItems", 1, part="contentDetails", playlistId=playlist, maxResults=min(50, limit))
        return [item["contentDetails"]["videoId"] for item in page.get("items", [])][:limit]

    def comments(self, video_id: str, limit: int) -> list:
        """Return up to `limit` top-level comments ordered by relevance (YouTube's "top comments")."""
        found: list = []
        token = None
        while len(found) < limit:
            params = {
                "part": "snippet", "videoId": video_id, "order": "relevance", "textFormat": "plainText",
                "maxResults": min(100, limit - len(found)),
            }
            if token:
                params["pageToken"] = token
            page = self._get("commentThreads", 1, **params)
            for item in page.get("items", []):
                top = item.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
                found.append({
                    "video_id": video_id,
                    "id": item.get("id"),
                    "text": top.get("textOriginal") or top.get("textDisplay") or "",
                    "likes": _int(top.get("likeCount")),
                    "published_at": top.get("publishedAt"),
                    "source": "youtube-data-api",
                })
            token = page.get("nextPageToken")
            if not token:
                break
        return found[:limit]


def _ytdlp_record(entry: dict) -> dict:
    video_id = entry.get("id")
    return {
        "id": video_id,
        "title": entry.get("title"),
        "channel_id": entry.get("channel_id"),
        "channel_title": entry.get("channel") or entry.get("uploader"),
        "published_at": entry.get("upload_date") or _from_timestamp(entry.get("timestamp")),
        "duration_seconds": _int(entry.get("duration")),
        "views": _int(entry.get("view_count")),
        "likes": _int(entry.get("like_count")),
        "comments": _int(entry.get("comment_count")),
        "description": entry.get("description"),
        "url": entry.get("url") if str(entry.get("url", "")).startswith("http") else f"https://www.youtube.com/watch?v={video_id}",
        "source": "yt-dlp",
    }


def _ytdlp_extractor(params: dict) -> Callable:
    try:
        import yt_dlp  # noqa: PLC0415 - optional dependency resolved at call time
    except ImportError as error:
        raise CollectionError("yt-dlp is not installed; run: python -m pip install 'yt-dlp==2026.10.26'") from error

    def extract(url: str) -> dict:
        with yt_dlp.YoutubeDL(params) as ydl:
            return ydl.sanitize_info(ydl.extract_info(url, download=False))

    return extract


def ytdlp_list(target: str, limit: int, extract: Optional[Callable] = None) -> list:
    """List videos for a search URL or `ytsearchN:query` through yt-dlp in flat mode.

    `extract` is injectable for tests; it defaults to `yt_dlp.YoutubeDL(...).extract_info`.
    """
    if extract is None:
        extract = _ytdlp_extractor({
            "quiet": True, "skip_download": True, "extract_flat": "in_playlist", "playlistend": limit, "lazy_playlist": True,
        })
    try:
        info = extract(target)
    except Exception as error:  # yt-dlp raises many types; all mean this source failed
        raise CollectionError(f"yt-dlp could not read {target}: {error}") from error
    if not info:
        raise CollectionError(f"yt-dlp returned nothing for {target}")
    entries = info.get("entries") if "entries" in info else [info]
    records = [_ytdlp_record(entry) for entry in (entries or [])[:limit] if entry and entry.get("id")]
    if not records:
        raise CollectionError(f"yt-dlp found no videos for {target}")
    return records


def ytdlp_comments(video_id: str, limit: int, extract: Optional[Callable] = None) -> list:
    """Return up to `limit` top-level comments of one video through yt-dlp, sorted by "top".

    Uses getcomments=True with the youtube extractor argument
    max_comments=<limit>,<limit>,0,0 (comments, parents, replies, replies per thread).
    """
    if extract is None:
        extract = _ytdlp_extractor({
            "quiet": True,
            "skip_download": True,
            "getcomments": True,
            "ignore_no_formats_error": True,
            "extractor_args": {"youtube": {"max_comments": [str(limit), str(limit), "0", "0"], "comment_sort": ["top"]}},
        })
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        info = extract(url)
    except Exception as error:  # yt-dlp raises many types; all mean this source failed
        raise CollectionError(f"yt-dlp could not read comments of {video_id}: {error}") from error
    raw = (info or {}).get("comments")
    if raw is None:
        raise CollectionError(
            f"yt-dlp returned no comments for {video_id}: comments may be disabled, or full video extraction "
            "needs deno and yt-dlp-ejs; set YOUTUBE_API_KEY to read comments through commentThreads.list"
        )
    return [
        {
            "video_id": video_id,
            "id": comment.get("id"),
            "text": comment.get("text") or "",
            "likes": _int(comment.get("like_count")),
            "published_at": _from_timestamp(comment.get("timestamp")),
            "source": "yt-dlp",
        }
        for comment in raw
        if comment and comment.get("parent", "root") == "root"
    ][:limit]
