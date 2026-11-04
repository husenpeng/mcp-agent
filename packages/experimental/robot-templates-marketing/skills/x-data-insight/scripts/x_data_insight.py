"""Run one X data-insight collection and write its HTML report and xlsx workbook.

Examples:
  python x_data_insight.py --account @brand --account @rival --topic "standing desk" --brand "Brand=@brand" --competitor "Rival=@rival|rival desk" --out ./out
  python x_data_insight.py --topic "ninja creami" --brand "Ninja=ninja creami" --competitor "Yonanas" --out ./out

The X API v2 is used when --bearer-token or X_BEARER_TOKEN is set: user
timelines for --account and recent search for --topic (pay-per-use; the
run sheet records reads and the estimated cost). Without the token, X is not
collected and never scraped: Reddit (when REDDIT_CLIENT_ID and
REDDIT_CLIENT_SECRET are set) and Hacker News Algolia search stand in for
topic searches, and the report says so in its data gaps section. Exit status
is 0 when both files were written, 2 when no source returned any post.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import X_RATE_NOTE, X_READ_RATE_USD, CollectionError, XApi, hn_search, reddit_search  # noqa: E402
from metrics import (  # noqa: E402
    account_kpis, benchmarks, clean_posts, cluster_summary, net_sentiment, outlier_posts, parse_lexicon,
    score_sentiment, share_of_voice, topic_clusters,
)
from report import suggestions, write_html, write_xlsx  # noqa: E402

NO_X_GAP = (
    "X 数据未采集：未设置 X_BEARER_TOKEN。X 没有免费 API，本技能不抓取 X 网页，也不使用需要登录账号的工具（twscrape 等，违反 X 服务条款）；"
    "本次改用 Reddit 和 Hacker News 作为替代讨论源，账号 KPI 无法计算。"
    "X data was not collected: X_BEARER_TOKEN is not set, X has no free API, and this skill does not scrape X; Reddit and Hacker News stand in and account KPIs are unavailable."
)


def load_polarity():
    """Return VADER's polarity_scores, or raise CollectionError when vaderSentiment is not installed."""
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer  # noqa: PLC0415 - optional dependency
    except ImportError as error:
        raise CollectionError("vaderSentiment is not installed; run: python -m pip install 'vaderSentiment==3.3.2'") from error
    return SentimentIntensityAnalyzer().polarity_scores


def collect(args: argparse.Namespace, env: dict, now: datetime, search_terms: list) -> tuple:
    """Return (posts, accounts, sources, gaps, x_api or None, granularity, buckets)."""
    posts: list = []
    accounts: list = []
    sources: list = []
    gaps: list = []
    token = args.bearer_token or env.get("X_BEARER_TOKEN")
    api = XApi(token, max_reads=args.max_reads) if token else None
    if api is not None:
        granularity, buckets, since = "day", 7, now - timedelta(days=7)
        for handle in args.account:
            try:
                account, timeline = api.user_timeline(handle, args.limit)
                accounts.append(account)
                posts += timeline
                sources.append(f"X API v2 timeline: @{account['handle']}")
            except CollectionError as error:
                gaps.append(f"X account {handle}: {error}")
        for term in search_terms:
            query = f"{term} -is:retweet" + (f" lang:{args.lang}" if args.lang else "")
            try:
                posts += api.search_recent(query, args.limit)
                sources.append(f"X API v2 recent search: {term}")
            except CollectionError as error:
                gaps.append(f"X search “{term}”: {error}")
        if api.capped:
            gaps.append(f"X 读取达到上限 --max-reads {args.max_reads}，结果被截断。X reads hit the --max-reads cap; results are truncated.")
    else:
        granularity, buckets, since = "week", 5, now - timedelta(days=35)
        gaps.append(NO_X_GAP)
        if args.account:
            gaps.append("账号时间线未采集：" + ", ".join(args.account) + " 需要 X API。Account timelines need X_BEARER_TOKEN.")
    if api is None or args.cross_check:
        client_id, client_secret = env.get("REDDIT_CLIENT_ID"), env.get("REDDIT_CLIENT_SECRET")
        for term in search_terms:
            if client_id and client_secret:
                try:
                    posts += reddit_search(term, args.limit, since, now, client_id=client_id, client_secret=client_secret)
                    sources.append(f"Reddit search: {term}")
                except CollectionError as error:
                    gaps.append(f"Reddit “{term}”: {error}")
            try:
                posts += hn_search(term, args.limit, since)
                sources.append(f"Hacker News search: {term}")
            except CollectionError as error:
                gaps.append(f"Hacker News “{term}”: {error}")
        if not (client_id and client_secret):
            gaps.append("Reddit 未采集：未设置 REDDIT_CLIENT_ID 和 REDDIT_CLIENT_SECRET（在 https://www.reddit.com/prefs/apps 创建 script 应用；仅非商业用途免费）。Reddit skipped: no client credentials.")
    return posts, accounts, sources, gaps, api, granularity, buckets


def main(argv: list[str] | None = None, env: dict | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--account", action="append", default=[], help="X @handle to analyze; repeatable (needs X_BEARER_TOKEN)")
    parser.add_argument("--topic", action="append", default=[], help="topic or keyword search; repeatable")
    parser.add_argument("--brand", action="append", default=[], help='own brand with aliases, "Name=alias1|alias2"; repeatable')
    parser.add_argument("--competitor", action="append", default=[], help='competitor with aliases, "Name=alias1|alias2"; repeatable')
    parser.add_argument("--limit", type=int, default=100, help="posts per account, topic, and source (default 100)")
    parser.add_argument("--lang", help="X language filter such as en")
    parser.add_argument("--max-reads", type=int, default=2000, help="cap on X reads (posts + users) per run; default 2000 ≈ $10")
    parser.add_argument("--cross-check", action="store_true", help="with an X token, also collect Reddit and Hacker News")
    parser.add_argument("--bearer-token", help="X API bearer token; defaults to $X_BEARER_TOKEN")
    parser.add_argument("--title", default="X 数据洞察报告 X data insight report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    brands = parse_lexicon(args.brand + args.competitor)
    if not args.account and not args.topic and not brands:
        parser.error("give at least one --account, --topic, --brand, or --competitor")
    env = dict(os.environ) if env is None else env
    search_terms = list(dict.fromkeys(args.topic + list(brands)))

    now = datetime.now(timezone.utc)
    raw, accounts, sources, gaps, api, granularity, buckets = collect(args, env, now, search_terms)
    if not raw:
        print("No posts were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2
    posts, dropped = clean_posts(raw, now, keep_accounts=[account["handle"] for account in accounts])
    try:
        polarity = load_polarity()
    except CollectionError as error:
        polarity = None
        gaps.append(f"情感未评分 Sentiment not scored: {error}")
    posts = score_sentiment(posts, polarity)
    unscored = sum(1 for post in posts if post["sentiment"] is None)
    if polarity is not None and unscored:
        gaps.append(f"{unscored} 条非英语帖子未做情感评分（VADER 只支持英语）。{unscored} non-English posts were not sentiment-scored.")
    kpis = [account_kpis(account, [post for post in posts if post.get("account") == account["handle"]], now) for account in accounts]
    if len(kpis) == 1:
        gaps.append("只有 1 个账号，无法对标；再加一个同类账号 --account。Only one account; add a peer for benchmarks.")
    if accounts:
        gaps.append("粉丝增长需要多次运行留下的粉丝快照；本次只记录当前粉丝数。Follower growth needs snapshots from repeated runs.")
    clusters, assignment = topic_clusters(posts, exclude=args.topic)
    scored = outlier_posts(posts)
    sentiment = net_sentiment(posts)
    topics = cluster_summary(posts, clusters, assignment, now, granularity, buckets)
    sov = share_of_voice(posts, brands)
    if not args.competitor:
        gaps.append("未指定竞品 --competitor，声量份额没有对照。No competitors named; share of voice has no comparison set.")
    data = {
        "posts": posts, "kpis": kpis, "benchmarks": benchmarks(kpis) if len(kpis) >= 2 else [], "sentiment": sentiment,
        "topics": topics, "assignment": assignment, "sov": sov, "outliers": scored, "dropped": dropped,
    }
    data["suggestions"] = suggestions(kpis, sentiment, topics, sov, [post for post in scored if post["is_outlier"]])
    x_cost = None if api is None else {
        "requests": api.requests, "posts_read": api.posts_read, "users_read": api.users_read, "reads": api.reads,
        "rate_usd": X_READ_RATE_USD, "cost_usd": api.cost_usd, "note": X_RATE_NOTE,
    }
    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"x-data-insight-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"x-data-insight-{stamp}.xlsx")
    context = {
        "query": "; ".join(args.account + search_terms), "generated_at": now, "sources": sources, "gaps": gaps,
        "granularity": granularity, "buckets": buckets, "dropped": len(dropped), "x_cost": x_cost,
    }
    write_html(html_path, args.title, data, context)
    write_xlsx(xlsx_path, data, context)
    print(html_path)
    print(xlsx_path)
    if x_cost:
        print(f"X API reads: {x_cost['reads']}, estimated cost ${x_cost['cost_usd']:.2f} (rate to verify)", file=sys.stderr)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
