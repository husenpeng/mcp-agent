"""Collect public creator profiles and recent posts without logging in or downloading media.

Sources and the record format they share (see metrics.py):

* YouTube Data API v3 when an API key is given: search.list with type=channel
  (100 units), channels.list (1 unit per 50 ids), playlistItems.list and
  videos.list (1 unit each per 50 items).
* yt-dlp otherwise: `ytsearchN:` in flat mode for discovery, then each
  channel's /videos tab in flat mode. Likes, comments, and dates are usually
  missing and stay None.
* yt-dlp for TikTok profile video lists (`https://www.tiktok.com/@handle`);
  follower counts and bios are not exposed and stay None.
* instaloader anonymous Profile for Instagram; no login, no downloads.
* X API v2 user lookup and user timeline when a bearer token is given.
* DNS-over-HTTPS MX lookups through https://dns.google/resolve.

Every function raises CollectionError with an actionable message instead of
returning partial data silently. Network callables are injectable for tests.
"""

from __future__ import annotations

import itertools
import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Callable, Optional

YOUTUBE_API = "https://www.googleapis.com/youtube/v3/"
X_API = "https://api.x.com/2/"
DOH = "https://dns.google/resolve"


class CollectionError(RuntimeError):
    """A source could not be read; the message says which and why."""


Fetch = Callable[[str], dict]


def http_json(url: str, headers: Optional[dict] = None, label: str = "HTTP source") -> dict:
    """GET one URL and decode its JSON body; failures raise CollectionError naming `label`."""
    request = urllib.request.Request(url, headers={"User-Agent": "tomato-marketing-robot/1", **(headers or {})})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")[:300]
        raise CollectionError(f"{label} returned HTTP {error.code}: {body}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"{label} unreachable: {error.reason}") from error
    except ValueError as error:
        raise CollectionError(f"{label} returned a body that is not JSON: {error}") from error


def _int(value) -> Optional[int]:
    return int(value) if value not in (None, "") else None


def _iso(timestamp) -> Optional[str]:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(int(timestamp), timezone.utc).isoformat()


def creator_record(platform: str, handle: str, **fields) -> dict:
    """Return a creator record with every field present; unknown values are None."""
    record = {
        "platform": platform, "handle": handle, "channel_id": None, "name": None, "url": None,
        "followers": None, "following": None, "bio": None, "external_url": None, "posts_count": None,
        "source": None, "discovered_by": None, "posts": [], "notes": [],
    }
    record.update(fields)
    record["key"] = f"{platform}:{(handle or record['channel_id'] or '').lower()}"
    return record


def post_record(platform: str, post_id: str, **fields) -> dict:
    """Return a post record with every field present; unknown counts are None, never 0."""
    record = {
        "platform": platform, "id": post_id, "title": None, "published_at": None,
        "views": None, "likes": None, "comments": None, "url": None, "is_video": None,
    }
    record.update(fields)
    return record


# --- YouTube Data API --------------------------------------------------------


class YouTubeApi:
    """YouTube Data API v3 reader with a unit counter."""

    def __init__(self, key: str, fetch: Optional[Fetch] = None):
        self.key = key
        self.fetch = fetch or (lambda url: http_json(url, label="YouTube Data API"))
        self.units = 0

    def _get(self, method: str, cost: int, **params) -> dict:
        query = urllib.parse.urlencode({**params, "key": self.key})
        self.units += cost
        return self.fetch(f"{YOUTUBE_API}{method}?{query}")

    def search_channels(self, query: str, limit: int, region: Optional[str] = None) -> list:
        """Return up to `limit` channel ids for a niche query (search.list type=channel)."""
        ids: list = []
        token = None
        while len(ids) < limit:
            params = {"part": "id", "type": "channel", "q": query, "maxResults": min(50, limit - len(ids))}
            if region:
                params["regionCode"] = region
            if token:
                params["pageToken"] = token
            page = self._get("search", 100, **params)
            ids += [item["id"]["channelId"] for item in page.get("items", []) if item.get("id", {}).get("channelId")]
            token = page.get("nextPageToken")
            if not token:
                break
        return ids[:limit]

    def channels(self, selectors: list, posts: int, discovered_by: str) -> list:
        """Return creator records for channel ids (UC…) or handles (@name), each with up to `posts` recent uploads."""
        items: list = []
        ids = [value for value in selectors if not value.startswith("@")]
        for start in range(0, len(ids), 50):
            page = self._get("channels", 1, part="snippet,statistics,contentDetails", id=",".join(ids[start:start + 50]))
            items += page.get("items", [])
        for handle in (value for value in selectors if value.startswith("@")):
            found = self._get("channels", 1, part="snippet,statistics,contentDetails", forHandle=handle).get("items", [])
            if not found:
                raise CollectionError(f"YouTube channel {handle} was not found")
            items += found
        creators = []
        for item in items:
            snippet, stats = item.get("snippet", {}), item.get("statistics", {})
            handle = snippet.get("customUrl") or item["id"]
            creator = creator_record(
                "youtube", handle, channel_id=item["id"], name=snippet.get("title"),
                url=f"https://www.youtube.com/channel/{item['id']}",
                followers=None if stats.get("hiddenSubscriberCount") else _int(stats.get("subscriberCount")),
                bio=snippet.get("description"), posts_count=_int(stats.get("videoCount")),
                source="youtube-data-api", discovered_by=discovered_by,
            )
            uploads = item.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
            if uploads and posts > 0:
                creator["posts"] = self._uploads(uploads, posts)
            creators.append(creator)
        return creators

    def _uploads(self, playlist: str, limit: int) -> list:
        page = self._get("playlistItems", 1, part="contentDetails", playlistId=playlist, maxResults=min(50, limit))
        ids = [item["contentDetails"]["videoId"] for item in page.get("items", [])][:limit]
        if not ids:
            return []
        videos = self._get("videos", 1, part="snippet,statistics", id=",".join(ids)).get("items", [])
        return [
            post_record(
                "youtube", video["id"], title=video.get("snippet", {}).get("title"),
                published_at=video.get("snippet", {}).get("publishedAt"),
                views=_int(video.get("statistics", {}).get("viewCount")),
                likes=_int(video.get("statistics", {}).get("likeCount")),
                comments=_int(video.get("statistics", {}).get("commentCount")),
                url=f"https://www.youtube.com/watch?v={video['id']}", is_video=True,
            )
            for video in videos
        ]


# --- yt-dlp (YouTube keyless and TikTok) -------------------------------------


def _default_extract(limit: int) -> Callable[[str], dict]:
    try:
        import yt_dlp  # noqa: PLC0415 - optional dependency resolved at call time
    except ImportError as error:
        raise CollectionError("yt-dlp is not installed; run: python -m pip install 'yt-dlp==2026.10.26'") from error
    params = {"quiet": True, "skip_download": True, "extract_flat": "in_playlist", "playlistend": limit, "lazy_playlist": True}

    def extract(url: str) -> dict:
        with yt_dlp.YoutubeDL(params) as ydl:
            return ydl.sanitize_info(ydl.extract_info(url, download=False))
    return extract


def _ytdlp(target: str, limit: int, extract: Optional[Callable]) -> dict:
    extract = extract or _default_extract(limit)
    try:
        info = extract(target)
    except Exception as error:  # yt-dlp raises many types; all mean this source failed
        raise CollectionError(f"yt-dlp could not read {target}: {error}") from error
    if not info:
        raise CollectionError(f"yt-dlp returned nothing for {target}")
    return info


def ytdlp_discover_channels(query: str, limit: int, extract: Optional[Callable] = None) -> list:
    """Return channel ids from a flat `ytsearch` video search, most frequent first, at most `limit`."""
    info = _ytdlp(f"ytsearch{max(limit * 3, 10)}:{query}", max(limit * 3, 10), extract)
    counts: dict = {}
    for entry in info.get("entries") or []:
        if entry and entry.get("channel_id"):
            counts[entry["channel_id"]] = counts.get(entry["channel_id"], 0) + 1
    if not counts:
        raise CollectionError(f"yt-dlp search for “{query}” returned no channels")
    return [channel for channel, _ in sorted(counts.items(), key=lambda item: -item[1])][:limit]


def ytdlp_youtube_channel(channel: str, posts: int, discovered_by: str, extract: Optional[Callable] = None) -> dict:
    """Return a creator record for a YouTube channel id, @handle, or URL from its flat /videos tab."""
    if channel.startswith("http"):
        url = channel.rstrip("/") + "/videos"
    elif channel.startswith("@"):
        url = f"https://www.youtube.com/{channel}/videos"
    else:
        url = f"https://www.youtube.com/channel/{channel}/videos"
    info = _ytdlp(url, posts, extract)
    channel_id = info.get("channel_id") or info.get("id")
    creator = creator_record(
        "youtube", info.get("uploader_id") or channel, channel_id=channel_id,
        name=info.get("channel") or info.get("title"), url=info.get("channel_url") or url,
        followers=_int(info.get("channel_follower_count")), bio=info.get("description"),
        source="yt-dlp", discovered_by=discovered_by,
    )
    creator["posts"] = [
        post_record(
            "youtube", entry["id"], title=entry.get("title"),
            published_at=entry.get("upload_date") or _iso(entry.get("timestamp")),
            views=_int(entry.get("view_count")), likes=_int(entry.get("like_count")),
            comments=_int(entry.get("comment_count")), url=f"https://www.youtube.com/watch?v={entry['id']}", is_video=True,
        )
        for entry in (info.get("entries") or [])[:posts] if entry and entry.get("id")
    ]
    return creator


def ytdlp_tiktok(handle: str, posts: int, discovered_by: str, extract: Optional[Callable] = None) -> dict:
    """Return a creator record for a TikTok @handle from its flat profile video list (followers and bio stay None)."""
    name = handle.lstrip("@")
    info = _ytdlp(f"https://www.tiktok.com/@{name}", posts, extract)
    entries = [entry for entry in (info.get("entries") or [])[:posts] if entry and entry.get("id")]
    if not entries:
        raise CollectionError(f"yt-dlp found no TikTok videos for @{name} (private account or blocked request)")
    first = entries[0]
    creator = creator_record(
        "tiktok", name, channel_id=first.get("channel_id"), name=first.get("channel") or name,
        url=f"https://www.tiktok.com/@{name}", source="yt-dlp", discovered_by=discovered_by,
    )
    creator["posts"] = [
        post_record(
            "tiktok", entry["id"], title=entry.get("description") or entry.get("title"),
            published_at=_iso(entry.get("timestamp")), views=_int(entry.get("view_count")),
            likes=_int(entry.get("like_count")), comments=_int(entry.get("comment_count")),
            url=entry.get("url") or entry.get("webpage_url") or f"https://www.tiktok.com/@{name}/video/{entry['id']}", is_video=True,
        )
        for entry in entries
    ]
    return creator


# --- Instagram (instaloader, anonymous) --------------------------------------


def _default_instagram_profile(handle: str):
    try:
        import instaloader  # noqa: PLC0415 - optional dependency resolved at call time
    except ImportError as error:
        raise CollectionError("instaloader is not installed; run: python -m pip install 'instaloader==4.16'") from error
    loader = instaloader.Instaloader(
        quiet=True, download_pictures=False, download_videos=False, download_video_thumbnails=False,
        download_geotags=False, download_comments=False, save_metadata=False, compress_json=False,
        max_connection_attempts=1,
    )
    return instaloader.Profile.from_username(loader.context, handle)


def instagram_profile(handle: str, posts: int, discovered_by: str, load: Optional[Callable] = None) -> dict:
    """Return a creator record for an Instagram handle through an anonymous instaloader Profile.

    `load(handle)` is injectable and returns an object with instaloader's
    Profile attributes. A failure after some posts keeps those posts and adds
    a note; a failure before the profile loads raises CollectionError.
    """
    name = handle.lstrip("@")
    try:
        profile = (load or _default_instagram_profile)(name)
        creator = creator_record(
            "instagram", name, channel_id=str(getattr(profile, "userid", "") or "") or None,
            name=profile.full_name or name, url=f"https://www.instagram.com/{name}/",
            followers=_int(profile.followers), following=_int(profile.followees), bio=profile.biography,
            external_url=profile.external_url, posts_count=_int(profile.mediacount),
            source="instaloader (anonymous)", discovered_by=discovered_by,
        )
    except CollectionError:
        raise
    except Exception as error:  # instaloader raises its own hierarchy plus network errors
        raise CollectionError(f"instaloader could not read Instagram @{name} anonymously: {error}") from error
    try:
        for post in itertools.islice(profile.get_posts(), posts):
            creator["posts"].append(post_record(
                "instagram", post.shortcode, title=(post.caption or "")[:300] or None,
                published_at=post.date_utc.replace(tzinfo=timezone.utc).isoformat(),
                views=_int(post.video_view_count) if post.is_video else None,
                likes=_int(post.likes), comments=_int(post.comments),
                url=f"https://www.instagram.com/p/{post.shortcode}/", is_video=bool(post.is_video),
            ))
    except Exception as error:  # anonymous post paging is often refused after the first page
        creator["notes"].append(f"Instagram @{name}: post listing stopped after {len(creator['posts'])} posts: {error}")
    return creator


# --- X API v2 ----------------------------------------------------------------


class XApi:
    """X API v2 reader for a public user profile and recent original posts."""

    def __init__(self, bearer: str, fetch: Optional[Callable[[str, dict], dict]] = None):
        self.headers = {"Authorization": f"Bearer {bearer}"}
        self.fetch = fetch or (lambda url, headers: http_json(url, headers, label="X API"))

    def user(self, handle: str, posts: int, discovered_by: str) -> dict:
        """Return a creator record with up to `posts` recent posts (retweets and replies excluded)."""
        name = handle.lstrip("@")
        fields = urllib.parse.urlencode({"user.fields": "description,public_metrics,url,created_at"})
        found = self.fetch(f"{X_API}users/by/username/{urllib.parse.quote(name)}?{fields}", self.headers)
        user = found.get("data")
        if not user:
            raise CollectionError(f"X user @{name} was not found: {found.get('errors')}")
        metrics = user.get("public_metrics", {})
        creator = creator_record(
            "x", name, channel_id=user.get("id"), name=user.get("name"), url=f"https://x.com/{name}",
            followers=_int(metrics.get("followers_count")), following=_int(metrics.get("following_count")),
            bio=user.get("description"), external_url=user.get("url"), posts_count=_int(metrics.get("tweet_count")),
            source="x-api-v2", discovered_by=discovered_by,
        )
        query = urllib.parse.urlencode({
            "max_results": max(5, min(100, posts)), "exclude": "retweets,replies", "tweet.fields": "created_at,public_metrics",
        })
        timeline = self.fetch(f"{X_API}users/{user['id']}/tweets?{query}", self.headers)
        for tweet in (timeline.get("data") or [])[:posts]:
            stats = tweet.get("public_metrics", {})
            creator["posts"].append(post_record(
                "x", tweet["id"], title=(tweet.get("text") or "")[:300], published_at=tweet.get("created_at"),
                views=_int(stats.get("impression_count")), likes=_int(stats.get("like_count")),
                comments=_int(stats.get("reply_count")), url=f"https://x.com/{name}/status/{tweet['id']}",
            ))
        return creator


# --- DNS over HTTPS -----------------------------------------------------------


def dns_mx(domain: str, fetch: Optional[Fetch] = None) -> dict:
    """Return the dns.google JSON answer for an MX query; interpret it with metrics.mx_verdict."""
    url = f"{DOH}?{urllib.parse.urlencode({'name': domain, 'type': 'MX'})}"
    return (fetch or (lambda target: http_json(target, label="dns.google DNS-over-HTTPS")))(url)
