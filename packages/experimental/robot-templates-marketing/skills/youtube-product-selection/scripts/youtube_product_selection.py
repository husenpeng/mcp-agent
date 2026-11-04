"""Run one YouTube product-selection collection and write its HTML report and xlsx workbook.

Examples:
  python youtube_product_selection.py --category "standing desk" --limit 30 --out ./out
  python youtube_product_selection.py --category "robot vacuum" --search "roborock vs dreame" --region US --out ./out

Each --category expands into four searches: "<category> review", "<category>
unboxing", "<category> vs", and "best <category>". The YouTube Data API is
used when --api-key or YOUTUBE_API_KEY is set; otherwise yt-dlp lists videos
in flat mode and reads comments with getcomments=True. Exit status is 0 when
both files were written, 2 when no source returned any video.
"""

from __future__ import annotations

import argparse
import os
import sys
import urllib.parse
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import CollectionError, DataApi, ytdlp_comments, ytdlp_list  # noqa: E402
from metrics import classify_comments, enrich, product_clusters, product_phrases, query_summary  # noqa: E402
from report import write_html, write_xlsx  # noqa: E402

SEARCH_TEMPLATES = ("{} review", "{} unboxing", "{} vs", "best {}")


def expand_queries(categories: list, searches: list) -> list:
    """Return the category expansions followed by explicit searches, without duplicates."""
    queries = [template.format(category) for category in categories for template in SEARCH_TEMPLATES] + list(searches)
    return list(dict.fromkeys(queries))


def parse_assumptions(items: list) -> list:
    """Parse repeated `name=value [unit]` strings into cost-assumption rows; a missing list yields placeholders."""
    rows = []
    for item in items:
        name, _, rest = item.partition("=")
        value_text, _, unit = rest.strip().partition(" ")
        try:
            value = float(value_text)
        except ValueError as error:
            raise SystemExit(f"--assumption {item!r}: value must be a number, as in 'unit cost=12.5 USD'") from error
        rows.append({"assumption": name.strip(), "value": value, "unit": unit.strip(), "source": "run instruction"})
    if not rows:
        rows = [
            {"assumption": name, "value": None, "unit": unit, "source": "未提供，请补充 not provided"}
            for name, unit in [("unit cost", "currency"), ("selling price", "currency"), ("affiliate commission", "%"), ("shipping per unit", "currency")]
        ]
    return rows


def _search_url(query: str, order: str) -> str:
    sort = {"viewCount": "&sp=CAM%253D", "date": "&sp=CAI%253D"}.get(order, "")
    return f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query)}{sort}"


def collect(args: argparse.Namespace, queries: list, api: DataApi | None) -> tuple[list, list, list, list]:
    """Return (videos, baseline videos, sources, gaps); each video carries the first query that found it."""
    found: dict = {}
    sources: list = []
    gaps: list = []
    if api is None:
        gaps.append("未提供 YOUTUBE_API_KEY：改用 yt-dlp 列表模式，点赞、评论数和完整描述（含联盟链接）可能缺失。No API key: yt-dlp flat listing; likes, comment counts, and full descriptions with affiliate links may be missing.")
    for query in queries:
        try:
            if api is not None:
                videos = api.videos(api.search(query, args.limit, order=args.order, region=args.region))
                sources.append(f"YouTube Data API search: {query}")
            else:
                videos = ytdlp_list(_search_url(query, args.order), args.limit)
                sources.append(f"yt-dlp search: {query}")
        except CollectionError as error:
            gaps.append(f"search “{query}”: {error}")
            continue
        for video in videos:
            found.setdefault(video["id"], {**video, "query": query})
    videos = list(found.values())

    baseline: list = []
    channels = []
    for video in sorted(videos, key=lambda item: -(item.get("views") or 0)):
        if video.get("channel_id") and video["channel_id"] not in channels:
            channels.append(video["channel_id"])
    channels = channels[:args.baseline_channels]
    for channel in channels:
        try:
            if api is not None:
                baseline += api.videos(api.channel_uploads(channel, 30))
            else:
                baseline += ytdlp_list(f"https://www.youtube.com/channel/{channel}/videos", 30)
        except CollectionError as error:
            gaps.append(f"channel baseline {channel}: {error}")
    if channels:
        sources.append(f"channel baselines: {len(channels)} channels × latest 30 uploads")
    if len({video.get("channel_id") for video in videos}) > len(channels):
        gaps.append(f"Outlier 基线只补抓了播放最高的 {len(channels)} 个频道；其余频道仅用搜索样本内的视频作基线。Baselines fetched for the top {len(channels)} channels only.")
    return videos, baseline, sources, gaps


def collect_comments(args: argparse.Namespace, videos: list, api: DataApi | None, gaps: list) -> tuple[list, list]:
    """Return (comments, sources) for the top --comment-videos videos by outlier score then VPH."""
    if args.comments <= 0 or args.comment_videos <= 0:
        return [], []
    ranked = sorted(videos, key=lambda video: (-(video.get("outlier_score") or 0), -(video.get("views_per_hour") or 0)))
    comments: list = []
    read = 0
    for video in ranked[:args.comment_videos]:
        try:
            comments += api.comments(video["id"], args.comments) if api is not None else ytdlp_comments(video["id"], args.comments)
            read += 1
        except CollectionError as error:
            gaps.append(f"comments {video['id']}: {error}")
    method = "YouTube Data API commentThreads.list (order=relevance)" if api is not None else "yt-dlp getcomments (sort=top)"
    return comments, [f"{method}: top {args.comments} comments × {read} videos"] if read else []


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--category", action="append", default=[], help="category phrase; expands into review/unboxing/vs/best searches; repeatable")
    parser.add_argument("--search", action="append", default=[], help="extra literal search query; repeatable")
    parser.add_argument("--limit", type=int, default=30, help="videos per search (default 30)")
    parser.add_argument("--order", default="relevance", choices=["relevance", "viewCount", "date"], help="search order")
    parser.add_argument("--region", help="ISO 3166-1 alpha-2 region code for API searches")
    parser.add_argument("--comment-videos", type=int, default=10, help="videos whose comments are read, top by outlier then VPH (default 10)")
    parser.add_argument("--comments", type=int, default=50, help="top comments read per video (default 50)")
    parser.add_argument("--baseline-channels", type=int, default=15, help="channels whose latest 30 uploads form the outlier baseline (default 15)")
    parser.add_argument("--assumption", action="append", default=[], help="cost assumption 'name=value unit', e.g. 'unit cost=12.5 USD'; repeatable")
    parser.add_argument("--api-key", help="YouTube Data API key; defaults to $YOUTUBE_API_KEY")
    parser.add_argument("--title", default="YouTube 选品分析报告 YouTube product selection report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.category and not args.search:
        parser.error("give at least one --category or --search")
    assumptions = parse_assumptions(args.assumption)

    now = datetime.now(timezone.utc)
    api_key = args.api_key or os.environ.get("YOUTUBE_API_KEY")
    queries = expand_queries(args.category, args.search)
    api = DataApi(api_key) if api_key else None
    videos, baseline, sources, gaps = collect(args, queries, api)
    if not videos:
        print("No videos were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2
    rows = enrich(videos, now, baseline)
    comments, comment_sources = collect_comments(args, rows, api, gaps)
    comments = classify_comments(comments)
    phrases = product_phrases(rows, args.category)
    for row in rows:
        row["product_phrases"] = phrases.get(row["id"], [])
    products = product_clusters(rows, comments, phrases)
    if not args.assumption:
        gaps.append("未提供成本假设（--assumption）：cost_assumptions 表只有待补充的占位行，报告不含利润测算。No cost assumptions given; margin is not estimated.")
    if comments and not any(comment.get("intents") for comment in comments):
        gaps.append("抽样评论没有命中意图词表；需求分全部为 0。No sampled comment matched the intent lexicon.")

    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"youtube-product-selection-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"youtube-product-selection-{stamp}.xlsx")
    context = {
        "query": "; ".join(queries), "generated_at": now, "sources": sources + comment_sources, "gaps": gaps,
        "api_units": None if api is None else api.units, "search_interest": query_summary(rows, now), "cost_assumptions": assumptions,
    }
    write_html(html_path, args.title, rows, comments, products, context)
    write_xlsx(xlsx_path, rows, comments, products, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
