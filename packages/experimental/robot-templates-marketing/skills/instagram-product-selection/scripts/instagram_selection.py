"""Run one Instagram demand-heat collection and write its HTML report and xlsx workbook.

Examples:
  python instagram_selection.py --hashtag skincare --hashtag glassskin --limit 20 --out ./out
  python instagram_selection.py --hashtag desksetup --profile grovemade --brand "Grovemade" --out ./out

The Instagram Graph API is used when META_ACCESS_TOKEN and IG_USER_ID are both
set; otherwise instaloader reads public posts anonymously with a low limit. This
measures demand heat only: Instagram has no sold counts, so there is no GMV.
Exit status is 0 when both files were written, 2 when no post was collected.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from typing import Callable, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import GRAPH_VERSION, AnonymousSource, CollectionError, GraphApi  # noqa: E402
from metrics import daily_posts, brand_rows, engagement, hashtag_rows, product_rows, related_hashtags, representative_reels, score_comments  # noqa: E402
from report import write_html, write_xlsx  # noqa: E402

OFFICIAL_DEFAULT_LIMIT = 30
#: Anonymous reads get rate limited quickly, so keyless runs start low and stay under a cap.
KEYLESS_DEFAULT_LIMIT = 12
KEYLESS_LIMIT_CAP = 50
EDGES = {"both": ("top_media", "recent_media"), "top": ("top_media",), "recent": ("recent_media",)}
CROSS_PLATFORM_GAP = (
    "跨平台验证不在本技能范围内：没有检查 TikTok、搜索热度等信号。建议对待观察商品词另做验证，同时上升才算趋势。"
    "Cross-platform validation is out of scope: consider checking TikTok and search interest for watch phrases."
)


def open_source(args: argparse.Namespace, env: dict) -> tuple:
    """Return (source, gaps); the official source needs both credentials."""
    token, user_id = env.get("META_ACCESS_TOKEN"), env.get("IG_USER_ID")
    if token and user_id:
        source = GraphApi(token, user_id, version=args.graph_version)
        source.load_quota()
        gaps = [] if source.quota_error is None else [f"话题配额用量未知 Hashtag quota usage unknown: {source.quota_error}"]
        return source, gaps
    missing = " and ".join(name for name, value in (("META_ACCESS_TOKEN", token), ("IG_USER_ID", user_id)) if not value)
    gaps = [f"未设置 {missing}：改用 instaloader 匿名采集，容易被限流。Missing {missing}: instaloader reads anonymously and may be rate limited."]
    try:
        return AnonymousSource(args.sleep), gaps
    except CollectionError as error:
        raise CollectionError(f"Missing {missing}, and the keyless path failed: {error}") from error


def collect_posts(source, args: argparse.Namespace) -> tuple:
    """Return (raw posts, sources, gaps); a failed target keeps the posts read before it failed."""
    is_official = isinstance(source, GraphApi)
    requested = args.limit or (OFFICIAL_DEFAULT_LIMIT if is_official else KEYLESS_DEFAULT_LIMIT)
    limit = requested if is_official else min(requested, KEYLESS_LIMIT_CAP)
    gaps = [] if limit == requested else [f"匿名路径每个目标最多 {KEYLESS_LIMIT_CAP} 帖。--limit capped at {KEYLESS_LIMIT_CAP} on the keyless path."]
    label = "Instagram Graph API" if is_official else "instaloader"
    posts: list = []
    sources: list = []
    work = [("hashtag", name, lambda value=name: source.hashtag_posts(value, limit, EDGES[args.edge])) for name in args.hashtag]
    work += [("profile", name, lambda value=name: source.profile_posts(value, limit)) for name in args.profile]
    for kind, name, read in work:
        try:
            posts += read()
            sources.append(f"{label} {kind}: {name}")
        except CollectionError as error:
            posts += error.records
            if error.records:
                sources.append(f"{label} {kind} (partial): {name}")
            gaps.append(f"{kind} “{name}”: {error}")
    return posts, sources, gaps


def sample_comments(source, posts: list, posts_to_sample: int, per_post: int) -> Optional[str]:
    """Score comments of the most engaged posts; the first refusal stops sampling and returns the gap."""
    ranked = sorted((post for post in posts if post.get("comments")), key=lambda post: -(engagement(post) or 0))
    if not ranked or posts_to_sample < 1:
        return "没有抽样评论，购买意向占比未计算。No comments were sampled, so the purchase-intent ratio is empty."
    for post in ranked[:posts_to_sample]:
        try:
            score_comments(post, source.comments(post, per_post))
        except CollectionError as error:
            return f"评论不可用，购买意向占比未计算。Comments unavailable, so the purchase-intent ratio is empty: {error}"
    return None


def _source_gaps(source, posts: list) -> list:
    gaps: list = []
    if isinstance(source, GraphApi) and any(post.get("edge") in ("top_media", "recent_media") for post in posts):
        gaps.append("Hashtag Search 不返回作者、播放量和 Reels 类型，也不返回话题总帖数；recent_media 只含最近 24 小时。Hashtag Search omits author, views, Reels type, and media count; recent_media covers 24 hours.")
    if any(post.get("likes") is None for post in posts):
        gaps.append("部分帖子隐藏或缺少点赞数，按未知处理。Some posts hide or lack like counts; they stay unknown.")
    return gaps


def main(argv: Optional[list] = None, open_source: Callable = open_source, env: Optional[dict] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--hashtag", action="append", default=[], help="hashtag without #; repeatable; each counts against the 30-per-7-days quota")
    parser.add_argument("--profile", action="append", default=[], help="public username, @name, or profile URL; repeatable")
    parser.add_argument("--product", action="append", default=[], help="product phrase to always track; repeatable")
    parser.add_argument("--brand", action="append", default=[], help="brand or competitor to count; repeatable")
    parser.add_argument("--edge", default="both", choices=sorted(EDGES), help="hashtag media to read")
    parser.add_argument("--limit", type=int, help=f"posts per hashtag edge or profile (default {OFFICIAL_DEFAULT_LIMIT}; keyless default {KEYLESS_DEFAULT_LIMIT}, cap {KEYLESS_LIMIT_CAP})")
    parser.add_argument("--sleep", type=float, default=3.0, help="seconds between anonymous posts, at least 1 (default 3)")
    parser.add_argument("--min-mentions", type=int, default=2, help="posts a phrase needs to be listed (default 2)")
    parser.add_argument("--comment-posts", type=int, default=10, help="most engaged posts to sample comments from (default 10)")
    parser.add_argument("--comments-per-post", type=int, default=50, help="comments read per sampled post (default 50)")
    parser.add_argument("--graph-version", default=GRAPH_VERSION, help=f"Graph API version (default {GRAPH_VERSION})")
    parser.add_argument("--title", default="Instagram 选品热度报告 Instagram product demand report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.hashtag and not args.profile:
        parser.error("give at least one --hashtag or --profile")
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be at least 1")
    if args.sleep < 1:
        parser.error("--sleep must be at least 1 second")

    now = datetime.now(timezone.utc)
    try:
        source, gaps = open_source(args, os.environ if env is None else env)
    except CollectionError as error:
        print("No posts were collected:", error, sep="\n  ", file=sys.stderr)
        return 2
    try:
        raw_posts, sources, collect_gaps = collect_posts(source, args)
        gaps += collect_gaps
        posts = list({post["id"]: post for post in raw_posts}.values())
        if not posts:
            print("No posts were collected:", *gaps, sep="\n  ", file=sys.stderr)
            return 2
        comment_gap = sample_comments(source, posts, args.comment_posts, args.comments_per_post)
    finally:
        source.close()
    gaps += _source_gaps(source, posts)
    gaps += [comment_gap] if comment_gap else []
    products = product_rows(posts, now, args.product, args.min_mentions)
    if len(products) < 10:
        gaps.append(f"只识别到 {len(products)} 个商品词，少于 10 个；可增加话题或用 --product 指定。Only {len(products)} product phrases; add hashtags or --product terms.")
    gaps.append(CROSS_PLATFORM_GAP)
    data = {
        "posts": posts,
        "products": products,
        "hashtags": hashtag_rows(raw_posts, source.media_counts),
        "related": related_hashtags(posts, args.hashtag),
        "daily": daily_posts(posts, now),
        "brands": brand_rows(posts, args.brand),
        "reels": representative_reels(posts),
    }
    is_official = isinstance(source, GraphApi)
    context = {
        "query": "; ".join([f"#{name.lstrip('#')}" for name in args.hashtag] + args.profile),
        "generated_at": now, "sources": sources, "gaps": gaps,
        "quota": source.quota() if is_official else None,
        "api_calls": source.calls,
    }
    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"instagram-selection-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"instagram-selection-{stamp}.xlsx")
    write_html(html_path, args.title, data, context)
    write_xlsx(xlsx_path, data, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
