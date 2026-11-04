"""Run one creative-intelligence collection and write its HTML report and xlsx workbook.

Examples:
  python creative_intelligence.py --search "Brand Name" --country DE --country FR --out ./out
  python creative_intelligence.py --page-id 123456789 --country GB --since 2026-08-01 --landing-pages --out ./out
  python creative_intelligence.py --ads-file saved_ads.json --out ./out

The Meta Ad Library API (Graph API v21.0 ads_archive) is used when
--access-token or META_ACCESS_TOKEN is set. Commercial ads are returned only
for ads delivered in the EU and the UK; other countries return political and
issue ads only. --ads-file re-analyses a saved ads_archive export offline.
Media is never downloaded. Exit status is 0 when both files were written, 2
when no ad was collected.
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import Counter
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import COMMERCIAL_COVERAGE, AdLibrary, CollectionError, fetch_landing_html, load_ads_file, merge_ads  # noqa: E402
from metrics import brief_stubs, enrich, parse_landing_html  # noqa: E402
from report import write_html, write_xlsx  # noqa: E402


def collect(args: argparse.Namespace, token: str | None) -> tuple:
    """Return (ads, sources, gaps, requests)."""
    ads: list = []
    sources: list = []
    gaps: list = []
    library = AdLibrary(token) if token else None
    if (args.search or args.page_id) and library is None:
        gaps.append("未设置 META_ACCESS_TOKEN：无法查询 Meta 广告库 API。Set META_ACCESS_TOKEN (a Meta app token with Ad Library API access after identity verification at facebook.com/ID).")
    if library is not None:
        for term in args.search:
            try:
                ads += library.search(args.country, args.limit, terms=term, since=args.since, until=args.until)
                sources.append(f"Meta Ad Library API search_terms: {term}")
            except CollectionError as error:
                gaps.append(f"search “{term}”: {error}")
        for start in range(0, len(args.page_id), 10):
            batch = args.page_id[start:start + 10]
            try:
                ads += library.search(args.country, args.limit, page_ids=batch, since=args.since, until=args.until)
                sources.append(f"Meta Ad Library API search_page_ids: {', '.join(batch)}")
            except CollectionError as error:
                gaps.append(f"page ids {', '.join(batch)}: {error}")
    for path in args.ads_file:
        try:
            ads += load_ads_file(path)
            sources.append(f"saved ads_archive file: {path}")
        except CollectionError as error:
            gaps.append(str(error))
    uncovered = [country for country in args.country if country not in COMMERCIAL_COVERAGE]
    if uncovered and library is not None:
        gaps.append(f"{', '.join(uncovered)} 不在欧盟或英国：这些国家只返回政治与议题广告。Outside the EU/UK only political and issue ads are returned.")
    return merge_ads(ads), sources, gaps, None if library is None else library.requests


def collect_landing_pages(ads: list, limit: int, gaps: list, fetch=None) -> list:
    """Return parsed landing-page rows for the most-linked domains in ad copy, at most `limit`."""
    counts = Counter(domain for ad in ads for domain in ad["domains"])
    if not counts:
        gaps.append("广告文案中没有识别到落地页域名。No landing-page domain appears in the ad copy or link titles.")
    pages = []
    for domain, linking in counts.most_common(limit):
        try:
            url, page = fetch_landing_html(domain, fetch)
        except CollectionError as error:
            gaps.append(f"landing page {domain}: {error}")
            continue
        parsed = parse_landing_html(page)
        if not parsed["text"]:
            gaps.append(f"landing page {domain}: no visible text in the HTML (likely rendered by scripts); only meta tags were read")
        pages.append({"domain": domain, "url": url, "ads_linking": linking, **parsed})
    return pages


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--search", action="append", default=[], help="Ad Library search_terms (brand or product); repeatable")
    parser.add_argument("--page-id", action="append", default=[], help="Facebook page id for search_page_ids; repeatable")
    parser.add_argument("--country", action="append", default=[], help="ISO country for ad_reached_countries; repeatable (default GB)")
    parser.add_argument("--since", help="ad_delivery_date_min, YYYY-MM-DD")
    parser.add_argument("--until", help="ad_delivery_date_max, YYYY-MM-DD")
    parser.add_argument("--limit", type=int, default=200, help="ads per query and country (default 200)")
    parser.add_argument("--ads-file", action="append", default=[], help="saved ads_archive JSON to analyse offline; repeatable")
    parser.add_argument("--landing-pages", action="store_true", help="fetch the home pages of linked domains (HTML only, stdlib parser)")
    parser.add_argument("--landing-limit", type=int, default=5, help="landing pages to fetch (default 5)")
    parser.add_argument("--briefs", type=int, default=3, help="creative brief stubs to draft, at least 3")
    parser.add_argument("--access-token", help="Meta access token; defaults to $META_ACCESS_TOKEN")
    parser.add_argument("--title", default="素材与竞品情报报告 Creative intelligence report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.search and not args.page_id and not args.ads_file:
        parser.error("give at least one --search, --page-id, or --ads-file")
    args.country = [country.upper() for country in args.country] or ["GB"]

    now = datetime.now(timezone.utc)
    ads, sources, gaps, requests = collect(args, args.access_token or os.environ.get("META_ACCESS_TOKEN"))
    if not ads:
        print("No ads were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2
    rows, clusters = enrich(ads, now.date())
    missing_copy = sum(1 for ad in rows if not ad["bodies"])
    if missing_copy:
        gaps.append(f"{missing_copy} 条广告没有返回文案，无法判定 hook。{missing_copy} ads returned no creative body.")
    landing = collect_landing_pages(rows, args.landing_limit, gaps) if args.landing_pages else []
    briefs = brief_stubs(clusters, max(3, args.briefs))
    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"creative-intelligence-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"creative-intelligence-{stamp}.xlsx")
    context = {
        "query": "; ".join(args.search + args.page_id + args.ads_file), "generated_at": now, "sources": sources, "gaps": gaps,
        "countries": args.country, "landing_pages": landing, "briefs": briefs, "requests": requests,
    }
    write_html(html_path, args.title, rows, clusters, context)
    write_xlsx(xlsx_path, rows, clusters, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
