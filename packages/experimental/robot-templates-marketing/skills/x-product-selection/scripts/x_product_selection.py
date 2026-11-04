"""Run one X product-selection collection and write its HTML report and xlsx workbook.

Examples:
  python x_product_selection.py --keyword "desk gadget" --keyword "ice cream maker" --out ./out
  python x_product_selection.py --keyword "protein snack" --product "Ninja Creami=creami|ninja creami" --lang en --out ./out

The X API v2 recent search is used when --bearer-token or X_BEARER_TOKEN is
set (pay-per-use; the run sheet records reads and the estimated cost).
Without the token, X is not collected and never scraped: Reddit (when
REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are set) and Hacker News Algolia
search stand in as discussion sources, and the report says so in its data
gaps section. Exit status is 0 when both files were written, 2 when no
source returned any post.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import X_RATE_NOTE, X_READ_RATE_USD, CollectionError, XApi, hn_search, reddit_search  # noqa: E402
from metrics import clean_posts, extract_products, parse_lexicon, rank_products  # noqa: E402
from report import write_html, write_xlsx  # noqa: E402

NO_X_GAP = (
    "X 数据未采集：未设置 X_BEARER_TOKEN。X 没有免费 API，本技能不抓取 X 网页，也不使用需要登录账号的工具（twscrape 等，违反 X 服务条款）；"
    "本次改用 Reddit 和 Hacker News 作为替代讨论源。"
    "X data was not collected: X_BEARER_TOKEN is not set, X has no free API, and this skill does not scrape X; Reddit and Hacker News stand in."
)


def x_query(keyword: str, lang: str | None) -> str:
    """Return the X search query for one keyword: originals only, optionally one language."""
    return f"{keyword} -is:retweet" + (f" lang:{lang}" if lang else "")


def collect(args: argparse.Namespace, env: dict, now: datetime) -> tuple:
    """Return (posts, sources, gaps, x_api or None, granularity, buckets)."""
    posts: list = []
    sources: list = []
    gaps: list = []
    token = args.bearer_token or env.get("X_BEARER_TOKEN")
    api = XApi(token, max_reads=args.max_reads) if token else None
    if api is not None:
        granularity, buckets, since = "day", 7, now - timedelta(days=7)
        for keyword in args.keyword:
            try:
                found = api.search_recent(x_query(keyword, args.lang), args.limit)
                posts += found
                sources.append(f"X API v2 recent search: {keyword}")
            except CollectionError as error:
                gaps.append(f"X search “{keyword}”: {error}")
        if api.capped:
            gaps.append(f"X 读取达到上限 --max-reads {args.max_reads}，结果被截断。X reads hit the --max-reads cap; results are truncated.")
    else:
        granularity, buckets, since = "week", 5, now - timedelta(days=35)
        gaps.append(NO_X_GAP)
    if api is None or args.cross_check:
        client_id, client_secret = env.get("REDDIT_CLIENT_ID"), env.get("REDDIT_CLIENT_SECRET")
        for keyword in args.keyword:
            if client_id and client_secret:
                try:
                    posts += reddit_search(keyword, args.limit, since, now, client_id=client_id, client_secret=client_secret)
                    sources.append(f"Reddit search: {keyword}")
                except CollectionError as error:
                    gaps.append(f"Reddit “{keyword}”: {error}")
            try:
                posts += hn_search(keyword, args.limit, since)
                sources.append(f"Hacker News search: {keyword}")
            except CollectionError as error:
                gaps.append(f"Hacker News “{keyword}”: {error}")
        if not (client_id and client_secret):
            gaps.append("Reddit 未采集：未设置 REDDIT_CLIENT_ID 和 REDDIT_CLIENT_SECRET（在 https://www.reddit.com/prefs/apps 创建 script 应用；仅非商业用途免费）。Reddit skipped: no client credentials.")
    return posts, sources, gaps, api, granularity, buckets


def main(argv: list[str] | None = None, env: dict | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--keyword", action="append", default=[], help="seed keyword or category phrase; repeatable")
    parser.add_argument("--product", action="append", default=[], help='known product with aliases, "Name=alias1|alias2"; repeatable')
    parser.add_argument("--limit", type=int, default=100, help="posts per keyword per source (default 100)")
    parser.add_argument("--lang", help="X language filter such as en")
    parser.add_argument("--price-band", help="price band from the run instruction, recorded in cost_assumptions")
    parser.add_argument("--max-reads", type=int, default=2000, help="cap on X reads (posts + users) per run; default 2000 ≈ $10")
    parser.add_argument("--cross-check", action="store_true", help="with an X token, also collect Reddit and Hacker News")
    parser.add_argument("--bearer-token", help="X API bearer token; defaults to $X_BEARER_TOKEN")
    parser.add_argument("--title", default="X 选品分析报告 X product selection report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.keyword:
        parser.error("give at least one --keyword")
    env = dict(os.environ) if env is None else env

    now = datetime.now(timezone.utc)
    raw, sources, gaps, api, granularity, buckets = collect(args, env, now)
    if not raw:
        print("No posts were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2
    posts, dropped = clean_posts(raw, now)
    lexicon = parse_lexicon(args.product)
    products = rank_products(posts, extract_products(posts, lexicon, exclude=args.keyword), now, granularity, buckets)
    if len(products) < 10:
        gaps.append(f"只识别到 {len(products)} 个候选商品（少于 10 个）；扩大关键词、提高 --limit 或用 --product 补充商品词典。Fewer than 10 candidates.")
    x_cost = None if api is None else {
        "requests": api.requests, "posts_read": api.posts_read, "users_read": api.users_read, "reads": api.reads,
        "rate_usd": X_READ_RATE_USD, "cost_usd": api.cost_usd, "note": X_RATE_NOTE,
    }
    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"x-product-selection-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"x-product-selection-{stamp}.xlsx")
    context = {
        "query": "; ".join(args.keyword), "generated_at": now, "sources": sources, "gaps": gaps, "granularity": granularity,
        "buckets": buckets, "dropped": len(dropped), "x_cost": x_cost, "price_band": args.price_band,
    }
    write_html(html_path, args.title, products, posts, context)
    write_xlsx(xlsx_path, products, posts, dropped, context)
    print(html_path)
    print(xlsx_path)
    if x_cost:
        print(f"X API reads: {x_cost['reads']}, estimated cost ${x_cost['cost_usd']:.2f} (rate to verify)", file=sys.stderr)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
