"""Run one brand-insight collection and write its HTML report and xlsx workbook.

Examples:
  python brand_insight.py --brand Notion --competitor Coda --competitor Obsidian --days 30 --out ./out
  python brand_insight.py --brand "Liquid Death" --alias "Liquid Death=liquiddeath" --competitor Topo Chico \
      --wiki-article "Topo Chico=Topo_Chico" --out ./out

The first --brand is the focus brand; each --competitor joins the comparison
set. Keyless sources (GDELT DOC 2.0, Wikimedia Pageviews, Hacker News Algolia)
always run; Reddit runs when REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are
set, and YouTube when YOUTUBE_API_KEY is set. Exit status is 0 when both files
were written, 2 when no source returned any mention or attention series.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import collect  # noqa: E402
from collect import CollectionError  # noqa: E402
from metrics import (  # noqa: E402
    brand_summary, daily_metrics, days_between, dedupe, keyword_overlap, keyword_table, score_sentiment, spike_table, topic_table,
)
from report import write_html, write_xlsx  # noqa: E402

REDDIT_TERMS = "Reddit Data API 免费额度仅限非商业用途；商业使用需与 Reddit 签订数据协议。Reddit's free Data API tier is for non-commercial use only; commercial use requires a Reddit data agreement."


def _pairs(items: list, flag: str) -> dict:
    """Parse repeated BRAND=value options into {brand: [values]}."""
    found: dict = {}
    for item in items:
        brand, sep, value = item.partition("=")
        if not sep or not brand.strip() or not value.strip():
            raise SystemExit(f"{flag} {item!r}: use BRAND=value")
        found.setdefault(brand.strip(), []).append(value.strip())
    return found


def vader_scorer():
    """Return (scorer, model name) for VADER, or (None, None) when vaderSentiment is not installed."""
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer  # noqa: PLC0415 - optional dependency
    except ImportError:
        return None, None
    analyzer = SentimentIntensityAnalyzer()
    return (lambda text: analyzer.polarity_scores(text)["compound"]), "VADER (vaderSentiment 3.3.2) compound"


class Run:
    """Accumulates mentions, attention series, source log rows, and data gaps for one collection."""

    def __init__(self):
        self.mentions: list = []
        self.attention: dict = {}
        self.sources: list = []
        self.log: list = []
        self.gaps: list = []

    def record(self, source: str, brand: str, query: str, records: int | None = None, error: CollectionError | None = None) -> None:
        self.log.append({"source": source, "brand": brand, "query": query, "status": "error" if error else "ok",
                         "records": records, "detail": str(error) if error else ""})
        if error:
            self.gaps.append(f"{source} {brand} “{query}”: {error}")
        elif source not in self.sources:
            self.sources.append(source)


def collect_all(args: argparse.Namespace, brands: list, terms: dict, start: datetime, end: datetime, env: dict, factories: dict | None = None) -> tuple:
    """Collect every source for every brand; return (Run, YouTube units or None).

    `factories` overrides source constructors for tests: gdelt, pageviews, hacker_news, reddit, youtube.
    """
    make = {
        "gdelt": collect.Gdelt, "pageviews": collect.pageviews, "hacker_news": collect.hacker_news,
        "reddit": collect.reddit_client, "youtube": collect.YouTubeSearch, **(factories or {}),
    }
    run = Run()
    wiki = _pairs(args.wiki_article, "--wiki-article")
    gdelt = make["gdelt"]()
    for brand in brands:
        info = run.attention.setdefault(brand, {})
        query = collect.gdelt_query(terms[brand], args.gdelt_filter or "")
        try:
            found = gdelt.articles(brand, query, start, end, args.limit)
            run.mentions += found
            run.record("GDELT ArtList", brand, query, len(found))
        except CollectionError as error:
            run.record("GDELT ArtList", brand, query, error=error)
        try:
            info["gdelt_volume"] = gdelt.timeline(query, start, end)
            run.record("GDELT TimelineVol", brand, query, len(info["gdelt_volume"]))
        except CollectionError as error:
            run.record("GDELT TimelineVol", brand, query, error=error)
        article = (wiki.get(brand) or [brand])[0]
        try:
            info["pageviews"] = make["pageviews"](article, start, end, args.wiki_project)
            run.record("Wikimedia Pageviews", brand, article, len(info["pageviews"]))
        except CollectionError as error:
            run.record("Wikimedia Pageviews", brand, article, error=error)
        for term in terms[brand]:
            try:
                found = make["hacker_news"](brand, term, start, args.limit)
                run.mentions += found
                run.record("Hacker News Algolia", brand, term, len(found))
            except CollectionError as error:
                run.record("Hacker News Algolia", brand, term, error=error)

    if env.get("REDDIT_CLIENT_ID") and env.get("REDDIT_CLIENT_SECRET"):
        run.gaps.append(REDDIT_TERMS)
        try:
            reddit = make["reddit"](env["REDDIT_CLIENT_ID"], env["REDDIT_CLIENT_SECRET"])
        except CollectionError as error:
            reddit = None
            run.record("Reddit", "all", "client", error=error)
        for brand in brands if reddit is not None else []:
            query = " OR ".join(f'"{term}"' for term in terms[brand])
            try:
                found = collect.reddit_search(brand, query, start, args.days, args.limit, reddit)
                run.mentions += found
                run.record("Reddit (PRAW)", brand, query, len(found))
            except CollectionError as error:
                run.record("Reddit (PRAW)", brand, query, error=error)
    else:
        run.gaps.append("未设置 REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET：未采集 Reddit。No Reddit credentials; Reddit was skipped. " + REDDIT_TERMS)

    units = None
    if env.get("YOUTUBE_API_KEY"):
        youtube = make["youtube"](env["YOUTUBE_API_KEY"])
        for brand in brands:
            query = "|".join(f'"{term}"' for term in terms[brand])
            try:
                found, total = youtube.search(brand, query, start, min(args.limit, 50), args.region)
                run.mentions += found
                run.attention[brand]["youtube_results"] = total
                run.record("YouTube Data API search", brand, query, len(found))
            except CollectionError as error:
                run.record("YouTube Data API search", brand, query, error=error)
        units = youtube.units
    else:
        run.gaps.append("未设置 YOUTUBE_API_KEY：未采集 YouTube 视频提及和搜索结果数。No YOUTUBE_API_KEY; YouTube mentions and result counts were skipped.")
    return run, units


def main(argv: list[str] | None = None, factories: dict | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--brand", action="append", default=[], help="focus brand first; repeatable")
    parser.add_argument("--competitor", action="append", default=[], help="competitor brand; repeatable")
    parser.add_argument("--alias", action="append", default=[], help="extra search term BRAND=alias; repeatable")
    parser.add_argument("--wiki-article", action="append", default=[], help="Wikipedia title BRAND=Exact_Title; defaults to the brand name")
    parser.add_argument("--wiki-project", default="en.wikipedia", help="Wikimedia project such as de.wikipedia (default en.wikipedia)")
    parser.add_argument("--gdelt-filter", help="extra GDELT operators such as 'sourcecountry:US sourcelang:english'")
    parser.add_argument("--region", help="ISO 3166-1 alpha-2 region code for YouTube searches")
    parser.add_argument("--days", type=int, default=30, help="window length in days ending yesterday (default 30, GDELT covers about 90)")
    parser.add_argument("--limit", type=int, default=100, help="mentions per brand and source (default 100; GDELT at most 250)")
    parser.add_argument("--title", default="品牌营销洞察报告 Brand insight report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    brands = list(dict.fromkeys(args.brand + args.competitor))
    if not brands:
        parser.error("give at least one --brand")
    aliases = _pairs(args.alias, "--alias")
    terms = {brand: list(dict.fromkeys([brand, *aliases.get(brand, [])])) for brand in brands}

    now = datetime.now(timezone.utc)
    end = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=args.days)
    days = days_between(start.date(), (end - timedelta(days=1)).date())
    run, units = collect_all(args, brands, terms, start, end, os.environ, factories)
    has_attention = any(info.get("pageviews") or info.get("gdelt_volume") for info in run.attention.values())
    if not run.mentions and not has_attention:
        print("No mentions or attention series were collected:", *run.gaps, sep="\n  ", file=sys.stderr)
        return 2

    scorer, model = vader_scorer()
    if scorer is None:
        run.gaps.append("vaderSentiment 未安装：未计算情感与净情感。vaderSentiment is not installed; run: python -m pip install 'vaderSentiment==3.3.2'")
    mentions = score_sentiment(dedupe(run.mentions), scorer)
    if any(mention["source"] == "gdelt" for mention in mentions):
        run.gaps.append("GDELT 只返回标题，没有互动数；新闻提及只计入提及口径 SOV，情感只基于标题。GDELT returns titles only and no engagement counts.")
    excluded = [term for brand in brands for term in terms[brand]]
    keywords = keyword_table(mentions, brands, excluded)
    data = {
        "brands": brands, "days": days, "mentions": mentions,
        "summary": brand_summary(mentions, brands, run.attention),
        "daily": daily_metrics(mentions, brands, days, run.attention),
        "spikes": spike_table(mentions, brands, days, run.attention),
        "topics": topic_table(mentions, brands, excluded),
        "keywords": keywords,
        "overlap": keyword_overlap(keywords, brands),
    }

    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"brand-insight-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"brand-insight-{stamp}.xlsx")
    context = {
        "query": ", ".join(brands), "window": f"{days[0]} – {days[-1]} (UTC)", "generated_at": now, "sources": run.sources,
        "gaps": run.gaps, "api_units": units, "sentiment_model": model, "sources_log": run.log,
    }
    write_html(html_path, args.title, data, context)
    write_xlsx(xlsx_path, data, context)
    print(html_path)
    print(xlsx_path)
    for gap in run.gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
