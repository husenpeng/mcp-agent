"""Run one YouTube insight collection and write its HTML report and xlsx workbook.

Examples:
  python youtube_insight.py --search "standing desk review" --limit 50 --out ./out
  python youtube_insight.py --channel @mkbhd --channel UCBJycsmduvYEL83R_U4JriQ --limit 30 --out ./out

The YouTube Data API is used when --api-key or the YOUTUBE_API_KEY
environment variable is set; otherwise yt-dlp lists videos in flat mode and
the report records the missing counts as a data gap. Exit status is 0 when
both files were written, 2 when no source returned any video.
"""

from __future__ import annotations

import argparse
import os
import sys
import urllib.parse
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import CollectionError, DataApi, ytdlp_list  # noqa: E402
from metrics import enrich  # noqa: E402
from report import write_html, write_xlsx  # noqa: E402


def _channel_url(channel: str) -> str:
    if channel.startswith("http"):
        return channel.rstrip("/") + "/videos"
    if channel.startswith("@"):
        return f"https://www.youtube.com/{channel}/videos"
    return f"https://www.youtube.com/channel/{channel}/videos"


def collect(args: argparse.Namespace, api_key: str | None) -> tuple[list, list, list, int | None]:
    """Return (videos, sources, gaps, api_units)."""
    videos: list = []
    sources: list = []
    gaps: list = []
    api = DataApi(api_key) if api_key else None
    if api is None:
        gaps.append("未提供 YOUTUBE_API_KEY：改用 yt-dlp 列表模式，点赞、评论数和完整描述可能缺失。No API key: yt-dlp flat listing; likes, comments, and full descriptions may be missing.")
    for query in args.search:
        try:
            if api is not None:
                videos += api.videos(api.search(query, args.limit, order=args.order, region=args.region))
                sources.append(f"YouTube Data API search: {query}")
            else:
                sort = {"viewCount": "&sp=CAM%253D", "date": "&sp=CAI%253D"}.get(args.order, "")
                url = f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query)}{sort}"
                videos += ytdlp_list(url, args.limit)
                sources.append(f"yt-dlp search: {query}")
        except CollectionError as error:
            gaps.append(f"search “{query}”: {error}")
    for channel in args.channel:
        try:
            if api is not None:
                videos += api.videos(api.channel_uploads(channel, args.limit))
                sources.append(f"YouTube Data API uploads: {channel}")
            else:
                videos += ytdlp_list(_channel_url(channel), args.limit)
                sources.append(f"yt-dlp channel: {channel}")
        except CollectionError as error:
            gaps.append(f"channel {channel}: {error}")
    unique = list({video["id"]: video for video in videos}.values())
    return unique, sources, gaps, None if api is None else api.units


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--search", action="append", default=[], help="search query; repeatable")
    parser.add_argument("--channel", action="append", default=[], help="channel id (UC…), @handle, or URL; repeatable")
    parser.add_argument("--limit", type=int, default=50, help="videos per search or channel (default 50)")
    parser.add_argument("--order", default="relevance", choices=["relevance", "viewCount", "date"], help="search order")
    parser.add_argument("--region", help="ISO 3166-1 alpha-2 region code for API searches")
    parser.add_argument("--api-key", help="YouTube Data API key; defaults to $YOUTUBE_API_KEY")
    parser.add_argument("--title", default="YouTube 数据洞察报告 YouTube insight report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.search and not args.channel:
        parser.error("give at least one --search or --channel")

    now = datetime.now(timezone.utc)
    videos, sources, gaps, units = collect(args, args.api_key or os.environ.get("YOUTUBE_API_KEY"))
    if not videos:
        print("No videos were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2
    rows = enrich(videos, now)
    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"youtube-insight-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"youtube-insight-{stamp}.xlsx")
    context = {"query": "; ".join(args.search + args.channel), "generated_at": now, "sources": sources, "gaps": gaps, "api_units": units}
    write_html(html_path, args.title, rows, context)
    write_xlsx(xlsx_path, rows, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
