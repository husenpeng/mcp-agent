"""Collect product snapshots and TikTok content heat; network and file I/O only.

Sources:

* Product snapshot CSV supplied by the user (product_id,title,price,sold_count,
  captured_at; optional category, keyword, shop, cogs).
* Product pages over plain HTTP, only for URLs the user passes (--product-url);
  price and title come from JSON-LD Product offers, the sold count from an
  embedded `sold_count` / `soldCount` field when the page carries one.
* Hashtag video heat through TikTokApi (unofficial, needs Playwright and an
  ms_token; TikTok rate-limits and blocks it without notice).
* Keyword trend CSV supplied by the user (keyword,date,value), for example a
  TikTok Creative Center or Google Trends export.

Every failure raises CollectionError with an actionable message; callers record
it in the report's data gaps section.
"""

from __future__ import annotations

import asyncio
import csv
import html
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Callable, Optional

SNAPSHOT_COLUMNS = ("product_id", "title", "price", "sold_count", "captured_at")
STATE_VERSION = 1


class CollectionError(RuntimeError):
    """A source could not be read; the message says which and why."""


def _number(value, kind=float):
    if value in (None, ""):
        return None
    text = str(value).strip().replace(",", "").lstrip("$€£¥")
    multiplier = 1
    if text[-1:].upper() in ("K", "M"):
        multiplier = 1000 if text[-1].upper() == "K" else 1_000_000
        text = text[:-1]
    try:
        return kind(float(text) * multiplier)
    except ValueError as error:
        raise CollectionError(f"not a number: {value!r}") from error


def read_snapshot_csv(path: str) -> list:
    """Read a product snapshot CSV; missing required columns raise CollectionError."""
    try:
        with open(path, newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            missing = [name for name in SNAPSHOT_COLUMNS if name not in (reader.fieldnames or [])]
            if missing:
                raise CollectionError(f"{path} lacks columns {', '.join(missing)}; required: {','.join(SNAPSHOT_COLUMNS)}")
            rows = []
            for line, row in enumerate(reader, start=2):
                if not row.get("product_id") or not row.get("captured_at"):
                    raise CollectionError(f"{path} line {line}: product_id and captured_at are required")
                try:
                    rows.append({
                        "product_id": row["product_id"].strip(),
                        "title": (row.get("title") or "").strip() or None,
                        "price": _number(row.get("price")),
                        "sold_count": _number(row.get("sold_count"), int),
                        "captured_at": row["captured_at"].strip(),
                        "category": (row.get("category") or "").strip() or None,
                        "keyword": (row.get("keyword") or "").strip() or None,
                        "shop": (row.get("shop") or "").strip() or None,
                        "cogs": _number(row.get("cogs")),
                        "source": "csv",
                    })
                except CollectionError as error:
                    raise CollectionError(f"{path} line {line}: {error}") from error
    except OSError as error:
        raise CollectionError(f"cannot read {path}: {error.strerror}") from error
    if not rows:
        raise CollectionError(f"{path} has no product rows")
    return rows


def read_trend_csv(path: str) -> dict:
    """Read keyword,date,value rows into keyword → [(date, value)]."""
    try:
        with open(path, newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            if not {"keyword", "date", "value"} <= set(reader.fieldnames or []):
                raise CollectionError(f"{path} needs columns keyword,date,value")
            series: dict = {}
            for row in reader:
                series.setdefault(row["keyword"].strip(), []).append((row["date"].strip(), _number(row["value"])))
    except OSError as error:
        raise CollectionError(f"cannot read {path}: {error.strerror}") from error
    return series


def http_text(url: str) -> str:
    """GET one URL over plain HTTP(S) without cookies and return its decoded body."""
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (tomato-marketing-robot/1)", "Accept-Language": "en-US"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read().decode(response.headers.get_content_charset() or "utf-8", "replace")
    except urllib.error.HTTPError as error:
        raise CollectionError(f"{url} returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"{url} unreachable: {error.reason}") from error


_JSON_LD = re.compile(r"<script[^>]+application/ld\+json[^>]*>(.*?)</script>", re.IGNORECASE | re.DOTALL)
_SOLD = re.compile(r"\"(?:sold_count|soldCount|sold)\"\s*:\s*\"?([\d.,]+[KkMm]?)")


def _products_in(node):
    if isinstance(node, list):
        for item in node:
            yield from _products_in(item)
    elif isinstance(node, dict):
        kind = node.get("@type")
        if kind == "Product" or (isinstance(kind, list) and "Product" in kind):
            yield node
        for key in ("@graph", "mainEntity"):
            if key in node:
                yield from _products_in(node[key])


def parse_product_page(url: str, page: str, now: datetime) -> dict:
    """Extract one snapshot from a product page's JSON-LD; raise CollectionError without a Product price."""
    product = None
    for block in _JSON_LD.findall(page):
        try:
            data = json.loads(html.unescape(block.strip()))
        except json.JSONDecodeError:
            continue  # malformed JSON-LD block; try the next one
        product = next(_products_in(data), None)
        if product:
            break
    if product is None:
        raise CollectionError(f"{url} has no JSON-LD Product; export the product to the snapshot CSV instead")
    offers = product.get("offers") or {}
    offer = offers[0] if isinstance(offers, list) and offers else offers
    price = _number(offer.get("price") if isinstance(offer, dict) else None) if offer else None
    if price is None and isinstance(offer, dict):
        price = _number(offer.get("lowPrice"))
    if price is None:
        raise CollectionError(f"{url}: JSON-LD Product has no offers.price")
    sold = _SOLD.search(page)
    digits = re.search(r"(\d{6,})", urllib.parse.urlparse(url).path)
    brand = product.get("brand")
    return {
        "product_id": str(product.get("sku") or product.get("productID") or (digits.group(1) if digits else url)),
        "title": product.get("name"),
        "price": price,
        "sold_count": _number(sold.group(1), int) if sold else None,
        "captured_at": now.isoformat(timespec="seconds"),
        "category": product.get("category") if isinstance(product.get("category"), str) else None,
        "keyword": None,
        "shop": brand.get("name") if isinstance(brand, dict) else brand if isinstance(brand, str) else None,
        "cogs": None,
        "url": url,
        "source": "product-page",
    }


def fetch_product_page(url: str, now: datetime, fetch: Callable[[str], str] = http_text) -> dict:
    """Fetch and parse one product page the user named."""
    return parse_product_page(url, fetch(url), now)


def _int(value) -> Optional[int]:
    return None if value in (None, "") else int(value)


def video_record(raw: dict) -> dict:
    """Map one TikTok item dict (as returned by TikTokApi) to a video record."""
    stats = raw.get("statsV2") or raw.get("stats") or {}
    author = raw.get("author") or {}
    created = raw.get("createTime")
    handle = author.get("uniqueId") if isinstance(author, dict) else author
    return {
        "id": str(raw.get("id")),
        "author": handle,
        "description": raw.get("desc"),
        "published_at": None if created in (None, "") else datetime.fromtimestamp(int(created), timezone.utc).isoformat(),
        "views": _int(stats.get("playCount")),
        "likes": _int(stats.get("diggCount")),
        "comments": _int(stats.get("commentCount")),
        "shares": _int(stats.get("shareCount")),
        "hashtags": [tag.get("title") for tag in raw.get("challenges") or [] if tag.get("title")],
        "url": f"https://www.tiktok.com/@{handle}/video/{raw.get('id')}" if handle else None,
        "source": "TikTokApi",
    }


async def _tiktokapi_hashtag(name: str, limit: int, ms_token: str, api_factory: Optional[Callable] = None) -> dict:
    if api_factory is None:
        try:
            from TikTokApi import TikTokApi  # noqa: PLC0415 - optional dependency resolved at call time
        except ImportError as error:
            raise CollectionError("TikTokApi is not installed; run: python -m pip install 'TikTokApi==7.3.3' && python -m playwright install chromium") from error
        api_factory = TikTokApi
    async with api_factory() as api:
        await api.create_sessions(ms_tokens=[ms_token], num_sessions=1, sleep_after=3, headless=True)
        tag = api.hashtag(name=name)
        info = await tag.info()
        videos = [video.as_dict async for video in tag.videos(count=limit)]
    return {"info": info, "videos": videos}


def fetch_hashtag(name: str, limit: int, ms_token: Optional[str], now: datetime, run: Optional[Callable] = None) -> dict:
    """Return {"snapshot": {captured_at, views, videos}, "videos": [...]} for one hashtag.

    `run(name, limit, ms_token)` returns {"info": challenge detail, "videos": [item dicts]};
    it defaults to TikTokApi and is injectable for tests.
    """
    if not ms_token:
        raise CollectionError("TIKTOK_MS_TOKEN is not set; copy the msToken cookie from a logged-out tiktok.com browser visit and export TIKTOK_MS_TOKEN")
    try:
        raw = run(name, limit, ms_token) if run else asyncio.run(_tiktokapi_hashtag(name, limit, ms_token))
    except CollectionError:
        raise
    except Exception as error:  # TikTokApi and Playwright raise many types; all mean this source failed
        raise CollectionError(f"TikTokApi could not read #{name} (unofficial and rate-limited; refresh TIKTOK_MS_TOKEN or retry later): {error}") from error
    stats = ((raw.get("info") or {}).get("challengeInfo") or {}).get("statsV2") or ((raw.get("info") or {}).get("challengeInfo") or {}).get("stats") or {}
    videos = [video_record(item) for item in raw.get("videos") or [] if item.get("id")]
    snapshot = {"captured_at": now.isoformat(timespec="seconds"), "views": _int(stats.get("viewCount")), "videos": _int(stats.get("videoCount"))}
    if snapshot["views"] is None and not videos:
        raise CollectionError(f"TikTokApi returned no stats or videos for #{name}")
    return {"snapshot": snapshot, "videos": videos}


def load_state(path: Optional[str]) -> dict:
    """Load the snapshot state file; a missing file starts an empty state."""
    empty = {"version": STATE_VERSION, "products": {}, "hashtags": {}}
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
    state.setdefault("products", {})
    state.setdefault("hashtags", {})
    return state


def merge_snapshots(state: dict, snapshots: list, hashtags: dict) -> dict:
    """Add product and hashtag snapshots to the state, one per (id, captured_at)."""
    for snapshot in snapshots:
        history = state["products"].setdefault(snapshot["product_id"], [])
        if all(item["captured_at"] != snapshot["captured_at"] for item in history):
            history.append({key: snapshot.get(key) for key in ("product_id", "title", "price", "sold_count", "captured_at", "category", "keyword", "shop", "cogs")})
        history.sort(key=lambda item: item["captured_at"])
    for name, snapshot in hashtags.items():
        history = state["hashtags"].setdefault(name, [])
        if all(item["captured_at"] != snapshot["captured_at"] for item in history):
            history.append(snapshot)
        history.sort(key=lambda item: item["captured_at"])
    return state


def save_state(path: str, state: dict) -> None:
    """Write the state file through a temporary file and a rename."""
    temporary = f"{path}.tmp"
    try:
        with open(temporary, "w", encoding="utf-8") as handle:
            json.dump(state, handle, ensure_ascii=False, indent=1)
        os.replace(temporary, path)
    except OSError as error:
        raise CollectionError(f"cannot write state file {path}: {error.strerror}") from error
