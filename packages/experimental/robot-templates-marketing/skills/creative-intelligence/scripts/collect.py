"""Collect competitor ads from the Meta Ad Library API and, optionally, landing-page text.

* Meta Ad Library API (Graph API v21.0 `ads_archive`) when an access token is
  given: one query per search term or page-id batch and per reached country,
  ad_type=ALL, ad_active_status=ALL, following `paging.next`. Commercial ads
  are returned only for EU and UK delivery; elsewhere only political and
  issue ads come back.
* A saved ads_archive JSON file (`{"data": [...]}` or a list) for offline
  re-analysis of a previous export.
* Landing pages through stdlib urllib (HTML only, at most MAX_PAGE_BYTES);
  metrics.parse_landing_html extracts the fields.

Media (images, video) is never downloaded. Every function raises
CollectionError with an actionable message; network callables are injectable
for tests.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Callable, Optional

GRAPH = "https://graph.facebook.com/v21.0/ads_archive"
FIELDS = [
    "id", "page_id", "page_name", "ad_creative_bodies", "ad_creative_link_titles", "ad_delivery_start_time",
    "ad_delivery_stop_time", "ad_snapshot_url", "publisher_platforms", "languages",
]

MAX_PAGE_BYTES = 2_000_000

#: Countries where the Ad Library API returns commercial (non-political) ads: EU member states plus the UK.
COMMERCIAL_COVERAGE = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
    "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB",
}


class CollectionError(RuntimeError):
    """A source could not be read; the message says which and why."""


Fetch = Callable[[str], dict]


def http_json(url: str) -> dict:
    """GET one Graph API URL and decode its JSON body; Graph error messages are surfaced."""
    request = urllib.request.Request(url, headers={"User-Agent": "tomato-marketing-robot/1"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")[:400]
        hint = " Check that the token is valid and that the app's identity verification for the Ad Library API is complete." if error.code in (400, 401, 403) else ""
        raise CollectionError(f"Meta Ad Library API returned HTTP {error.code}: {body}{hint}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"Meta Ad Library API unreachable: {error.reason}") from error
    except ValueError as error:
        raise CollectionError(f"Meta Ad Library API returned a body that is not JSON: {error}") from error


def ad_record(raw: dict, country: Optional[str], query: str) -> dict:
    """Return the normalized ad record; absent fields are None or empty lists."""
    return {
        "id": str(raw.get("id") or ""),
        "page_id": raw.get("page_id"),
        "page_name": raw.get("page_name"),
        "bodies": [body for body in raw.get("ad_creative_bodies") or [] if body],
        "link_titles": [title for title in raw.get("ad_creative_link_titles") or [] if title],
        "start": raw.get("ad_delivery_start_time"),
        "stop": raw.get("ad_delivery_stop_time"),
        "snapshot_url": raw.get("ad_snapshot_url"),
        "platforms": list(raw.get("publisher_platforms") or []),
        "languages": list(raw.get("languages") or []),
        "countries": [country] if country else [],
        "queries": [query],
    }


def merge_ads(ads: list) -> list:
    """Merge records with the same id, uniting countries and queries; order of first appearance is kept."""
    merged: dict = {}
    for ad in ads:
        if not ad["id"]:
            continue
        if ad["id"] not in merged:
            merged[ad["id"]] = {**ad, "countries": list(ad["countries"]), "queries": list(ad["queries"])}
            continue
        target = merged[ad["id"]]
        target["countries"] += [value for value in ad["countries"] if value not in target["countries"]]
        target["queries"] += [value for value in ad["queries"] if value not in target["queries"]]
    return list(merged.values())


class AdLibrary:
    """Meta Ad Library API reader that counts requests."""

    def __init__(self, token: str, fetch: Fetch = http_json):
        self.token = token
        self.fetch = fetch
        self.requests = 0

    def search(
        self, countries: list, limit: int, terms: Optional[str] = None, page_ids: Optional[list] = None,
        since: Optional[str] = None, until: Optional[str] = None,
    ) -> list:
        """Return up to `limit` ads per country for search terms or up to 10 page ids, following paging.next."""
        if not terms and not page_ids:
            raise CollectionError("give search terms or page ids for the Ad Library query")
        query = terms or ",".join(page_ids or [])
        ads: list = []
        for country in countries:
            params = {
                "ad_reached_countries": json.dumps([country]), "ad_type": "ALL", "ad_active_status": "ALL",
                "fields": ",".join(FIELDS), "limit": min(limit, 250), "access_token": self.token,
            }
            if terms:
                params["search_terms"] = terms
            else:
                params["search_page_ids"] = json.dumps(page_ids)
            if since:
                params["ad_delivery_date_min"] = since
            if until:
                params["ad_delivery_date_max"] = until
            url: Optional[str] = f"{GRAPH}?{urllib.parse.urlencode(params)}"
            found = 0
            while url and found < limit:
                self.requests += 1
                page = self.fetch(url)
                if "error" in page:
                    raise CollectionError(f"Meta Ad Library API error for {query} in {country}: {page['error'].get('message', page['error'])}")
                for raw in page.get("data", [])[: limit - found]:
                    ads.append(ad_record(raw, country, query))
                    found += 1
                url = (page.get("paging") or {}).get("next")
        return ads


def load_ads_file(path: str) -> list:
    """Return ad records from a saved ads_archive JSON file (`{"data": [...]}`, a list, or JSON lines)."""
    try:
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as error:
        raise CollectionError(f"cannot read --ads-file {path}: {error}") from error
    try:
        payload = json.loads(text)
        rows = payload.get("data", []) if isinstance(payload, dict) else payload
    except ValueError:
        try:
            rows = [json.loads(line) for line in text.splitlines() if line.strip()]
        except ValueError as error:
            raise CollectionError(f"{path} is neither JSON nor JSON lines: {error}") from error
    if not isinstance(rows, list) or not rows:
        raise CollectionError(f"{path} contains no ads (expected a list or an object with a data list)")
    return [ad_record(raw, (raw.get("country") or None), f"file:{path}") for raw in rows if isinstance(raw, dict)]


def http_html(url: str) -> str:
    """GET one landing page and return its decoded HTML, reading at most MAX_PAGE_BYTES."""
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; tomato-marketing-robot/1)", "Accept": "text/html"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            kind = response.headers.get_content_type()
            if kind not in ("text/html", "application/xhtml+xml"):
                raise CollectionError(f"{url} returned {kind}, not an HTML page")
            body = response.read(MAX_PAGE_BYTES)
            charset = response.headers.get_content_charset()
    except urllib.error.HTTPError as error:
        raise CollectionError(f"{url} returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise CollectionError(f"{url} unreachable: {error.reason}") from error
    except TimeoutError as error:
        raise CollectionError(f"{url} timed out after 30 s") from error
    if not charset:
        declared = re.search(rb"<meta[^>]+charset=[\"']?([A-Za-z0-9_-]+)", body[:4096], re.IGNORECASE)
        charset = declared.group(1).decode("ascii") if declared else "utf-8"
    try:
        return body.decode(charset, "replace")
    except LookupError:
        return body.decode("utf-8", "replace")


def fetch_landing_html(domain: str, fetch: Optional[Callable[[str], str]] = None) -> tuple:
    """Return (url, html) for https://<domain>/ or a full URL; `fetch` is injectable and failures raise CollectionError."""
    url = domain if domain.startswith("http") else f"https://{domain}/"
    try:
        page = (fetch or http_html)(url)
    except CollectionError:
        raise
    except Exception as error:  # injected fetchers and the socket layer raise many types
        raise CollectionError(f"could not fetch {url}: {error}") from error
    if not page or not page.strip():
        raise CollectionError(f"{url} returned an empty page")
    return url, page
