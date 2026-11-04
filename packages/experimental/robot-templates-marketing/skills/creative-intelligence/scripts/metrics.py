"""Creative-intelligence metrics: days running, copy clusters, weekly intensity, CTA/format mix, hook rules, landing-page parsing, and brief stubs.

Pure functions over the ad records built in collect.py (id, page_id,
page_name, bodies, link_titles, start, stop, snapshot_url, platforms,
languages, countries). Missing values stay None and are never treated as zero.
The hook and CTA lexicons below are the complete rule set; the report prints
them so readers can audit every label.
"""

from __future__ import annotations

import re
import statistics
from collections import Counter
from datetime import date, datetime, timedelta
from html.parser import HTMLParser
from typing import Optional

JACCARD_THRESHOLD = 0.8
HEAT_WEIGHTS = {"days_running": 0.6, "variants": 0.4}

#: Hook rules, checked against the first sentence of an ad's first body. Order is the primary-label priority.
HOOK_RULES = [
    ("price_shock", r"\d+\s?%\s?off|\bhalf price\b|\bfree (?:shipping|gift|trial)\b|[$€£¥]\s?\d|\d\s?(?:usd|eur|gbp)\b|\bonly \d|\bunder \d|\bsale\b|\bbogo\b|\bsave \d|\bdiscount\b|\bdeal\b"),
    ("social_proof", r"\b\d[\d,.]*\s?(?:k|m|\+)?\s?(?:customers|people|users|reviews|orders|sold|women|men|moms|parents|fans)\b|\bbest[- ]?sell(?:er|ing)\b|#1\b|\bnumber one\b|\b5[- ]star\b|\baward|\btrusted by\b|\bloved by\b|\brated\b|\bviral\b|\bjoin \d"),
    ("ugc_testimonial", r"^\s*[\"“']|^\s*(?:i|i'm|i've|i was|my|me and|we tried|honestly|pov)\b|\bobsessed\b|\bgame[- ]changer\b|\bcan't believe\b|\bcannot believe\b|\bholy grail\b|\bmy (?:skin|hair|husband|wife|kids|dog|back)\b"),
    ("contrast", r"\bvs\.?\b|\bversus\b|\binstead of\b|\bunlike\b|\bbefore (?:and|&|/) after\b|\bforget\b|\bold way\b|\bnot your (?:average|typical)\b|\bstop (?:using|buying)\b|\bbetter than\b|\bwithout the\b"),
    ("pain_point", r"\btired of\b|\bsick of\b|\bstruggl|\bfrustrat|\bannoy|\bhate\b|\bworried\b|\bembarrass|\bstuck\b|\bexhausted\b|\bpain\b|\bache|\bproblem\b|\bno more\b|\bstop wasting\b|\bcan't sleep\b|\bwaste\b"),
    ("question", r"\?\s*$|^\s*(?:why|how|what|when|who|which|ever|are you|do you|did you|is your|can you|have you|would you|should you|want to|need)\b"),
]
HOOK_LABELS = [name for name, _ in HOOK_RULES] + ["statement"]

#: Call-to-action phrases searched in bodies and link titles; first match wins.
CTA_RULES = [
    ("Shop now", r"\bshop (?:now|today|the)\b|\bshop\b"),
    ("Buy now", r"\bbuy (?:now|today)\b|\bget yours\b|\badd to cart\b"),
    ("Order now", r"\border (?:now|today|yours)\b"),
    ("Get offer", r"\bget (?:the )?offer\b|\bclaim (?:your|the)\b|\bredeem\b|\buse code\b"),
    ("Sign up", r"\bsign up\b|\bregister\b|\bjoin (?:now|today|free|us)\b"),
    ("Start free trial", r"\bfree trial\b|\btry (?:it )?(?:free|now|today)\b|\bget started\b"),
    ("Book now", r"\bbook (?:now|a|your)\b|\bschedule\b"),
    ("Download", r"\bdownload\b|\binstall\b|\bget the app\b"),
    ("Subscribe", r"\bsubscribe\b"),
    ("Learn more", r"\blearn more\b|\bdiscover\b|\bfind out\b|\bsee how\b|\bread more\b"),
    ("Contact us", r"\bcontact us\b|\bcall (?:us|now)\b|\bmessage us\b|\bsend (?:us )?a message\b"),
    ("Watch more", r"\bwatch (?:now|more|the)\b"),
]

_URL = re.compile(r"https?://\S+", re.IGNORECASE)
_DOMAIN = re.compile(r"\b(?:https?://)?(?:www\.)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|co|io|shop|store|net|org|app|eu|uk|de|fr|es|it|nl|be|se|dk|pl|ie|at|au|ca|us|me|ai|co\.uk|com\.au))\b", re.IGNORECASE)
_CJK = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]")
_WORD = re.compile(r"[a-z0-9$€£%]+(?:'[a-z]+)?|[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]")
_STOP = set("a an and are as at be but by for from has have i in is it its me my of on or our so that the this to was we with you your it's you're get now just more".split())
_OFFER = re.compile(r"\d+\s?%\s?off|free (?:shipping|delivery|returns|trial|gift)|money[- ]back|\d+[- ]day (?:guarantee|returns|trial)|bundle|subscribe (?:and|&) save|buy \d+,? get \d+", re.IGNORECASE)
_AMOUNT = r"\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?"
_PRICE = re.compile(
    rf"(?:R\$|A\$|C\$|HK\$|S\$|US\$|[$€£¥₹₩₽₺₫฿₱])\s?(?:{_AMOUNT})"
    rf"|(?:{_AMOUNT})\s?(?:€|£|円|元|₩|₽|zł|kr|Kč|Ft|lei)(?!\w)"
    rf"|\b(?:USD|EUR|GBP|JPY|CNY|RMB|CAD|AUD|CHF|SEK|NOK|DKK|PLN|INR)\s?(?:{_AMOUNT})"
    rf"|(?:{_AMOUNT})\s?(?:USD|EUR|GBP|JPY|CNY|RMB|CAD|AUD|CHF|SEK|NOK|DKK|PLN|INR)\b"
)
_SKIP = {"head", "script", "style", "noscript", "template", "svg", "iframe", "object", "canvas"}
_VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
_BLOCK = {"p", "div", "section", "article", "header", "footer", "main", "nav", "aside", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "td", "th", "table", "form", "blockquote", "figure", "figcaption"}


# --- time --------------------------------------------------------------------


def parse_day(text: Optional[str]) -> Optional[date]:
    """Parse an Ad Library date or timestamp (YYYY-MM-DD or ISO 8601) to a date; None when unknown."""
    if not text:
        return None
    return datetime.fromisoformat(text[:10]).date()


def days_running(ad: dict, today: date) -> Optional[int]:
    """Return (stop date or today) − start date in days, or None without a start date."""
    start = parse_day(ad.get("start"))
    if start is None:
        return None
    end = parse_day(ad.get("stop")) or today
    return max((end - start).days, 0)


def week_start(day: date) -> date:
    """Return the Monday of the ISO week containing day."""
    return day - timedelta(days=day.weekday())


def weekly_intensity(ads: list) -> list:
    """Return [(week Monday ISO, page, new ads)] counting ads by delivery start week, oldest week first."""
    counts: Counter = Counter()
    for ad in ads:
        start = parse_day(ad.get("start"))
        if start is not None:
            counts[(week_start(start).isoformat(), ad.get("page_name") or ad.get("page_id") or "—")] += 1
    return sorted(([week, page, count] for (week, page), count in counts.items()), key=lambda row: (row[0], row[1]))


# --- text --------------------------------------------------------------------


def normalize_copy(text: Optional[str]) -> str:
    """Lowercase, drop URLs and punctuation except $€£%, collapse whitespace."""
    if not text:
        return ""
    text = _URL.sub(" ", text.lower())
    return " ".join(_WORD.findall(text))


def shingles(text: str, size: int = 3) -> set:
    """Return word `size`-grams, or character 4-grams for CJK or texts shorter than `size` words."""
    if not text:
        return set()
    if _CJK.search(text):
        compact = text.replace(" ", "")
        return {compact[i:i + 4] for i in range(max(1, len(compact) - 3))}
    words = text.split()
    if len(words) < size:
        return {text}
    return {" ".join(words[i:i + size]) for i in range(len(words) - size + 1)}


def jaccard(left: set, right: set) -> float:
    """Return |A ∩ B| ÷ |A ∪ B|; two empty sets score 0."""
    union = left | right
    return len(left & right) / len(union) if union else 0.0


def ad_copy(ad: dict) -> str:
    """Return the text an ad is clustered on: its first body, else its first link title."""
    return (ad.get("bodies") or ad.get("link_titles") or [""])[0]


def cluster_ads(ads: list, threshold: float = JACCARD_THRESHOLD) -> list:
    """Return a cluster index per ad: single-link clusters where shingle Jaccard ≥ threshold.

    Ads without copy each get their own cluster.
    """
    sets = [shingles(normalize_copy(ad_copy(ad))) for ad in ads]
    parent = list(range(len(ads)))

    def find(index: int) -> int:
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    for i in range(len(ads)):
        if not sets[i]:
            continue
        for j in range(i + 1, len(ads)):
            if sets[j] and find(i) != find(j) and jaccard(sets[i], sets[j]) >= threshold:
                parent[find(j)] = find(i)
    roots: dict = {}
    return [roots.setdefault(find(index), len(roots)) for index in range(len(ads))]


def first_sentence(text: Optional[str]) -> str:
    """Return the first sentence of the first non-empty line, at most 200 characters."""
    for line in (text or "").splitlines():
        if line.strip():
            sentence = re.split(r"(?<=[.!?。！？])\s+|(?<=[。！？])", line.strip(), maxsplit=1)[0]
            return sentence[:200]
    return ""


def classify_hook(sentence: str) -> tuple:
    """Return (primary label, all matching labels) for a first sentence; no match is ("statement", [])."""
    lowered = sentence.lower()
    labels = [name for name, pattern in HOOK_RULES if re.search(pattern, lowered)]
    return (labels[0] if labels else ("statement" if sentence else None)), labels


def detect_cta(ad: dict) -> Optional[str]:
    """Return the first CTA rule matched in bodies or link titles, or None."""
    text = " ".join((ad.get("bodies") or []) + (ad.get("link_titles") or [])).lower()
    for name, pattern in CTA_RULES:
        if re.search(pattern, text):
            return name
    return None


def format_proxy(ad: dict) -> str:
    """Return a format label inferred from returned fields (the API returns no media type)."""
    bodies, titles = len(ad.get("bodies") or []), len(ad.get("link_titles") or [])
    if bodies > 1 or titles > 1:
        return "multi-version (carousel or dynamic creative)"
    if titles == 1:
        return "single link ad"
    if bodies == 1:
        return "copy without link card"
    return "no copy returned"


def link_domains(ad: dict) -> list:
    """Return lowercase domains written in an ad's bodies and link titles."""
    found: list = []
    for text in (ad.get("bodies") or []) + (ad.get("link_titles") or []):
        for match in _DOMAIN.findall(text or ""):
            domain = match.lower()
            if domain not in found:
                found.append(domain)
    return found


def offer_signals(text: str) -> list:
    """Return unique offer phrases (discounts, guarantees, free shipping, bundles) found in landing-page text."""
    seen: list = []
    for match in _OFFER.findall(text or ""):
        value = match.lower().strip()
        if value not in seen:
            seen.append(value)
    return seen[:12]


def price_strings(text: str, limit: int = 12) -> list:
    """Return unique price-like strings such as $19.99, €25, 19,99 €, ¥1,980, 1980円, R$ 49, or USD 20, in order."""
    seen: list = []
    for match in _PRICE.finditer(text or ""):
        value = " ".join(match.group(0).split())
        if value not in seen:
            seen.append(value)
    return seen[:limit]


class _LandingParser(HTMLParser):
    """Collect title, meta tags, headings, visible text, and CTA texts from one HTML document."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts: list = []
        self.meta: dict = {}
        self.headings: dict = {"h1": [], "h2": []}
        self.text_parts: list = []
        self.ctas: list = []
        self._skip: list = []
        self._captures: list = []
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        values = {name.lower(): (value or "") for name, value in attrs}
        if tag == "meta":
            key = (values.get("property") or values.get("name") or "").lower()
            if key in ("description", "og:title", "og:description") and key not in self.meta:
                self.meta[key] = " ".join(values.get("content", "").split())
            return
        if tag == "input":
            if not self._skip and values.get("type", "").lower() in ("submit", "button") and values.get("value"):
                self.ctas.append(("input", values["value"], ""))
            return
        if tag == "title":
            self._in_title = not self.title_parts
            return
        if tag in _VOID:
            if tag == "br" and not self._skip:
                self.text_parts.append("\n")
            return
        if self._skip or tag in _SKIP or "hidden" in values or values.get("aria-hidden") == "true":
            self._skip.append(tag)
            return
        if tag in _BLOCK:
            self.text_parts.append("\n")
        if tag in ("h1", "h2", "a", "button") or values.get("role") == "button":
            self._captures.append({"tag": tag, "attrs": values, "parts": []})

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
            return
        if self._skip:
            if tag in self._skip:
                del self._skip[len(self._skip) - 1 - self._skip[::-1].index(tag):]
            return
        if tag in _BLOCK:
            self.text_parts.append("\n")
        for index in range(len(self._captures) - 1, -1, -1):
            if self._captures[index]["tag"] == tag:
                capture = self._captures.pop(index)
                text = " ".join("".join(capture["parts"]).split())
                if text and tag in self.headings:
                    self.headings[tag].append(text)
                elif text:
                    self.ctas.append((tag, text, " ".join([capture["attrs"].get("class", ""), capture["attrs"].get("role", ""), capture["attrs"].get("id", "")]).lower()))
                break

    def handle_data(self, data):
        if self._in_title:
            self.title_parts.append(data)
            return
        if self._skip:
            return
        self.text_parts.append(data)
        for capture in self._captures:
            capture["parts"].append(data)


def parse_landing_html(page: str, max_text: int = 20_000) -> dict:
    """Return title, description, og_title, og_description, h1, h2, headline, text, prices, ctas, and offers from HTML.

    Visible text excludes head, script, style, noscript, template, svg, and
    elements marked hidden or aria-hidden. CTA texts are buttons, inputs of
    type submit/button, role=button elements, and links whose class or id
    names a button or CTA or whose text matches a CTA rule.
    """
    parser = _LandingParser()
    parser.feed(page or "")
    parser.close()
    text = "\n".join(line for line in (" ".join(chunk.split()) for chunk in "".join(parser.text_parts).split("\n")) if line)
    ctas: list = []
    for tag, label, markers in parser.ctas:
        is_cta = tag != "a" or re.search(r"btn|button|cta", markers) or any(re.search(pattern, label.lower()) for _, pattern in CTA_RULES)
        if is_cta and 1 < len(label) <= 60 and label not in ctas:
            ctas.append(label)
    h1, h2 = parser.headings["h1"], parser.headings["h2"]
    searchable = " ".join([text, parser.meta.get("description", ""), parser.meta.get("og:description", "")])
    return {
        "title": " ".join("".join(parser.title_parts).split()) or None,
        "description": parser.meta.get("description") or None,
        "og_title": parser.meta.get("og:title") or None,
        "og_description": parser.meta.get("og:description") or None,
        "h1": h1[0] if h1 else None, "h2": h2[0] if h2 else None,
        "headline": (h1 or h2 or [None])[0],
        "text": text[:max_text],
        "prices": price_strings(searchable),
        "ctas": ctas[:20],
        "offers": offer_signals(searchable),
    }


def selling_terms(ads: list, top: int = 15) -> list:
    """Return [(bigram, ads containing it)] across normalized ad copy, most frequent first."""
    counts: Counter = Counter()
    for ad in ads:
        words = [word for word in normalize_copy(" ".join(ad.get("bodies") or [])).split() if word not in _STOP and len(word) > 1]
        counts.update({f"{a} {b}" for a, b in zip(words, words[1:])})
    return [(term, count) for term, count in counts.most_common() if count > 1][:top]


# --- enrichment and ranking --------------------------------------------------


def _z(values: list) -> list:
    known = [value for value in values if value is not None]
    if len(known) < 2 or statistics.pstdev(known) == 0:
        return [0.0 if value is not None else None for value in values]
    mean, sd = statistics.mean(known), statistics.pstdev(known)
    return [None if value is None else (value - mean) / sd for value in values]


def enrich(ads: list, today: date) -> tuple:
    """Return (ads with metrics and tags, clusters ranked by heat score)."""
    assignments = cluster_ads(ads)
    rows = []
    for ad, cluster in zip(ads, assignments):
        hook_text = first_sentence((ad.get("bodies") or [""])[0])
        primary, labels = classify_hook(hook_text)
        rows.append({
            **ad, "cluster": cluster, "days_running": days_running(ad, today), "active": ad.get("stop") is None,
            "hook_text": hook_text, "hook": primary, "hook_labels": labels, "cta": detect_cta(ad),
            "format": format_proxy(ad), "domains": link_domains(ad),
        })
    groups: dict = {}
    for row in rows:
        groups.setdefault(row["cluster"], []).append(row)
    clusters = []
    for cluster_id, members in groups.items():
        days = [member["days_running"] for member in members if member["days_running"] is not None]
        lead = max(members, key=lambda member: (member["days_running"] or -1, member["id"]))
        clusters.append({
            "cluster": cluster_id, "variants": len(members), "max_days": max(days) if days else None,
            "median_days": statistics.median(days) if days else None, "active": sum(1 for member in members if member["active"]),
            "pages": sorted({member.get("page_name") or "—" for member in members}),
            "countries": sorted({country for member in members for country in member["countries"]}),
            "hook": lead["hook"], "hook_text": lead["hook_text"], "cta": lead["cta"], "format": lead["format"],
            "lead_id": lead["id"], "snapshot_url": lead.get("snapshot_url"), "copy": ad_copy(lead), "ad_ids": [member["id"] for member in members],
        })
    z_days = _z([cluster["max_days"] for cluster in clusters])
    z_variants = _z([cluster["variants"] for cluster in clusters])
    for cluster, zd, zv in zip(clusters, z_days, z_variants):
        cluster["heat"] = None if zd is None else HEAT_WEIGHTS["days_running"] * zd + HEAT_WEIGHTS["variants"] * zv
    clusters.sort(key=lambda cluster: (cluster["heat"] is None, -(cluster["heat"] or 0), -(cluster["max_days"] or 0), -cluster["variants"]))
    for rank, cluster in enumerate(clusters, start=1):
        cluster["rank"] = rank
    return rows, clusters


def distribution(values: list) -> list:
    """Return [(value, count, share)] for non-empty values, most common first; None becomes "not detected"."""
    counts = Counter("not detected" if value is None else value for value in values)
    total = sum(counts.values())
    return [(name, count, count / total) for name, count in sorted(counts.items(), key=lambda item: (-item[1], str(item[0])))] if total else []


def market_rows(ads: list) -> list:
    """Return one row per reached country: ads, median days running, top hook, top CTA, languages."""
    by_country: dict = {}
    for ad in ads:
        for country in ad["countries"] or ["—"]:
            by_country.setdefault(country, []).append(ad)
    rows = []
    for country, items in sorted(by_country.items()):
        days = [item["days_running"] for item in items if item["days_running"] is not None]
        rows.append({
            "country": country, "ads": len(items), "median_days": statistics.median(days) if days else None,
            "top_hook": Counter(item["hook"] for item in items if item["hook"]).most_common(1)[0][0] if any(item["hook"] for item in items) else None,
            "top_cta": Counter(item["cta"] for item in items if item["cta"]).most_common(1)[0][0] if any(item["cta"] for item in items) else None,
            "languages": ", ".join(sorted({language for item in items for language in item["languages"]})),
        })
    return rows


_ANGLE = {
    "question": "Open with a direct question the viewer answers yes to within one second.",
    "pain_point": "Name the pain in the viewer's words, then show the product removing it.",
    "contrast": "Show the old way and the new way side by side before naming the product.",
    "social_proof": "Lead with a concrete proof number or a recognisable review, then the product.",
    "price_shock": "Lead with the offer or price anchor, then justify it with one product benefit.",
    "ugc_testimonial": "Creator-style first-person testimonial, filmed handheld, product in hand by second two.",
    "statement": "Lead with a bold product claim and support it with a single demonstration.",
}


def brief_stubs(clusters: list, minimum: int = 3) -> list:
    """Return at least `minimum` DRAFT brief stubs drawn from the top clusters.

    Each stub cites its source cluster, ad ids, pages, and snapshot URL. When
    there are fewer clusters than `minimum`, the extra stubs test a hook type
    the sample does not use, citing the top cluster as the control.
    """
    stubs = []
    for cluster in clusters[: max(minimum, min(5, len(clusters)))]:
        stubs.append({
            "title": f"DRAFT brief {len(stubs) + 1}: iterate on cluster #{cluster['rank']} ({cluster['hook']} hook)",
            "source_cluster": cluster["rank"], "source_ads": cluster["ad_ids"][:5], "pages": cluster["pages"], "snapshot_url": cluster.get("snapshot_url"),
            "evidence": f"{cluster['variants']} variant(s), up to {cluster['max_days'] if cluster['max_days'] is not None else 'unknown'} days running, CTA {cluster['cta'] or 'not detected'}, format {cluster['format']}.",
            "hook_reference": cluster["hook_text"],
            "angle": _ANGLE.get(cluster["hook"] or "statement", _ANGLE["statement"]),
            "test": f"Test against the competitor's {cluster['hook']} hook; keep CTA '{cluster['cta'] or 'Shop now'}' and change only the opening line.",
        })
    used = {cluster["hook"] for cluster in clusters}
    unused = [label for label in HOOK_LABELS if label not in used] or HOOK_LABELS
    control = clusters[0] if clusters else None
    while len(stubs) < minimum:
        hook = unused[(len(stubs)) % len(unused)]
        stubs.append({
            "title": f"DRAFT brief {len(stubs) + 1}: whitespace test with a {hook} hook",
            "source_cluster": control["rank"] if control else None, "source_ads": control["ad_ids"][:5] if control else [],
            "pages": control["pages"] if control else [], "snapshot_url": control.get("snapshot_url") if control else None,
            "evidence": f"No competitor cluster in this sample uses a {hook} hook; the top cluster is the control.",
            "hook_reference": control["hook_text"] if control else "",
            "angle": _ANGLE[hook], "test": f"Run the {hook} opening against the control cluster's message with the same offer and CTA.",
        })
    return stubs
