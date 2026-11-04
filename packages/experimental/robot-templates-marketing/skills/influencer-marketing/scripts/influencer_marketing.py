"""Run one influencer-marketing collection and write its HTML report and xlsx workbook.

Examples:
  python influencer_marketing.py --niche "home espresso" --limit 20 --out ./out
  python influencer_marketing.py --channel @jameshoffmann --niche "coffee gear" --creators handles.csv --out ./out

Sources: YouTube discovery uses the Data API (search.list type=channel) when
--api-key or YOUTUBE_API_KEY is set, otherwise yt-dlp ytsearch in flat mode.
The --creators CSV has `platform,handle` columns (optional `seed` column with
yes/true/1); youtube and tiktok rows are read through yt-dlp, instagram rows
through an anonymous instaloader profile, and x rows through the X API v2 only
when X_BEARER_TOKEN is set. Exit status is 0 when both files were written, 2
when no creator was collected.
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import (  # noqa: E402
    CollectionError, XApi, YouTubeApi, dns_mx, instagram_profile, ytdlp_discover_channels, ytdlp_tiktok, ytdlp_youtube_channel,
)
from metrics import email_syntax, enrich, extract_emails, in_follower_range, is_role_account, lookalikes, mx_verdict, parse_cpm  # noqa: E402
from report import write_html, write_xlsx  # noqa: E402

PLATFORMS = {"youtube", "tiktok", "instagram", "x"}


def read_creators_csv(path: str) -> list:
    """Return (platform, handle, is_seed) rows from a CSV with platform and handle columns."""
    try:
        with open(path, newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            fields = {name.strip().lower() for name in reader.fieldnames or []}
            if not {"platform", "handle"} <= fields:
                raise CollectionError(f"{path}: the CSV needs platform and handle columns; found {sorted(fields)}")
            rows = []
            for row in reader:
                clean = {(key or "").strip().lower(): (value or "").strip() for key, value in row.items()}
                platform = clean.get("platform", "").lower()
                platform = "x" if platform in {"twitter", "x.com"} else platform
                if clean.get("handle"):
                    rows.append((platform, clean["handle"], clean.get("seed", "").lower() in {"1", "yes", "true", "y"}))
            return rows
    except OSError as error:
        raise CollectionError(f"cannot read --creators file {path}: {error}") from error


def collect(args: argparse.Namespace, api_key: str | None, x_token: str | None) -> tuple:
    """Return (creators, sources, gaps, api_units)."""
    creators: list = []
    sources: list = []
    gaps: list = []
    api = YouTubeApi(api_key) if api_key else None
    if api is None and (args.niche or args.channel):
        gaps.append("未提供 YOUTUBE_API_KEY：YouTube 改用 yt-dlp 列表模式，订阅数、点赞、评论和发布日期常缺失。No YOUTUBE_API_KEY: yt-dlp flat listing; subscribers, likes, comments, and dates are often missing.")

    def youtube(selectors: list, discovered_by: str) -> None:
        if api is not None:
            try:
                creators.extend(api.channels(selectors, args.posts, discovered_by))
                sources.append(f"YouTube Data API channels ({discovered_by}): {len(selectors)}")
            except CollectionError as error:
                gaps.append(f"YouTube channels ({discovered_by}): {error}")
            return
        for selector in selectors:
            try:
                creators.append(ytdlp_youtube_channel(selector, args.posts, discovered_by))
                sources.append(f"yt-dlp YouTube channel: {selector}")
            except CollectionError as error:
                gaps.append(f"YouTube channel {selector}: {error}")

    if args.channel:
        youtube(args.channel, "seed")
    for niche in args.niche:
        try:
            ids = api.search_channels(niche, args.limit, args.region) if api is not None else ytdlp_discover_channels(niche, args.limit)
            sources.append(f"{'YouTube Data API channel search' if api else 'yt-dlp ytsearch'}: {niche}")
            youtube(ids, f"search: {niche}")
        except CollectionError as error:
            gaps.append(f"niche “{niche}”: {error}")

    rows = []
    if args.creators:
        try:
            rows = read_creators_csv(args.creators)
        except CollectionError as error:
            gaps.append(str(error))
    x_api = XApi(x_token) if x_token else None
    skipped_x = [handle for platform, handle, _ in rows if platform == "x"] if x_api is None else []
    if skipped_x:
        gaps.append(f"未设置 X_BEARER_TOKEN：跳过 {len(skipped_x)} 个 X 账号（{', '.join(skipped_x[:10])}）。X_BEARER_TOKEN is unset, so X handles were skipped.")
    for platform, handle, seed in rows:
        discovered_by = "seed" if seed else "csv"
        try:
            if platform == "youtube":
                youtube([handle if handle.startswith(("@", "UC", "http")) else f"@{handle}"], discovered_by)
                continue
            if platform == "tiktok":
                creators.append(ytdlp_tiktok(handle, args.posts, discovered_by))
                gaps.append(f"TikTok @{handle.lstrip('@')}: yt-dlp 视频列表不含粉丝数和简介，互动率、播放/粉丝和邮箱无法计算。The yt-dlp video list carries no follower count or bio.")
            elif platform == "instagram":
                creators.append(instagram_profile(handle, args.posts, discovered_by))
            elif platform == "x":
                if x_api is None:
                    continue
                creators.append(x_api.user(handle, args.posts, discovered_by))
            else:
                gaps.append(f"CSV row {platform},{handle}: unknown platform; use one of {', '.join(sorted(PLATFORMS))}")
                continue
            sources.append(f"{creators[-1]['source']}: {platform} {handle}")
        except CollectionError as error:
            gaps.append(f"{platform} {handle}: {error}")

    unique: dict = {}
    for creator in creators:
        gaps.extend(creator.pop("notes", []))
        if creator["key"] in unique and creator.get("discovered_by") != "seed":
            continue
        unique[creator["key"]] = creator
    return list(unique.values()), sources, gaps, None if api is None else api.units


def collect_contacts(creators: list, check_mx: bool, gaps: list, resolve=None) -> list:
    """Return contact rows for emails found in bios and channel descriptions, with syntax and MX results."""
    contacts = []
    answers: dict = {}
    for creator in creators:
        found_in = "channel description" if creator["platform"] == "youtube" else "bio"
        for email in extract_emails(creator.get("bio")):
            syntax_error = email_syntax(email)
            status, hosts = "not_checked", []
            if syntax_error is None and check_mx:
                domain = email.split("@")[1]
                if domain not in answers:
                    try:
                        answers[domain] = mx_verdict(dns_mx(domain, resolve))
                    except CollectionError as error:
                        answers[domain] = ("lookup_failed", [])
                        gaps.append(f"MX lookup for {domain}: {error}")
                status, hosts = answers[domain]
            contacts.append({
                "creator": creator["key"], "email": email, "found_in": found_in,
                "syntax": "ok" if syntax_error is None else f"invalid: {syntax_error}",
                "mx_status": status if syntax_error is None else "skipped", "mx_hosts": hosts,
                "role_account": is_role_account(email), "outreach_status": "not_contacted",
            })
    return contacts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--niche", action="append", default=[], help="niche keywords for YouTube channel discovery; repeatable")
    parser.add_argument("--channel", action="append", default=[], help="seed YouTube channel id (UC…), @handle, or URL; repeatable")
    parser.add_argument("--creators", help="CSV with platform,handle columns (tiktok, instagram, x, youtube) and an optional seed column")
    parser.add_argument("--limit", type=int, default=20, help="channels discovered per niche (default 20)")
    parser.add_argument("--posts", type=int, default=30, help="recent posts read per creator (default 30)")
    parser.add_argument("--min-followers", type=int, help="drop creators with fewer known followers")
    parser.add_argument("--max-followers", type=int, help="drop creators with more known followers")
    parser.add_argument("--region", help="ISO 3166-1 alpha-2 region code for API channel search")
    parser.add_argument("--cpm", action="append", default=[], help="CPM override platform=low-high in USD, e.g. youtube=20-40; repeatable")
    parser.add_argument("--top", type=int, default=10, help="creators in the recommended list (default 10)")
    parser.add_argument("--no-mx", action="store_true", help="skip the DNS-over-HTTPS MX lookup")
    parser.add_argument("--api-key", help="YouTube Data API key; defaults to $YOUTUBE_API_KEY")
    parser.add_argument("--title", default="达人营销报告 Influencer marketing report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.niche and not args.channel and not args.creators:
        parser.error("give at least one --niche, --channel, or --creators file")
    try:
        cpm = parse_cpm(args.cpm)
    except ValueError as error:
        parser.error(str(error))

    now = datetime.now(timezone.utc)
    creators, sources, gaps, units = collect(args, args.api_key or os.environ.get("YOUTUBE_API_KEY"), os.environ.get("X_BEARER_TOKEN"))
    kept = [creator for creator in creators if in_follower_range(creator, args.min_followers, args.max_followers)]
    if len(kept) < len(creators):
        gaps.append(f"粉丝档位筛选排除了 {len(creators) - len(kept)} 位达人。Follower filter removed {len(creators) - len(kept)} creators.")
    unknown = [creator["key"] for creator in kept if creator.get("followers") is None]
    if unknown:
        gaps.append(f"{len(unknown)} 位达人没有公开粉丝数，互动率与报价分位缺失：{', '.join(unknown[:10])}。Follower count unavailable.")
    if not kept:
        print("No creators were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2
    rows = enrich(kept, now, cpm)
    contacts = collect_contacts(rows, not args.no_mx, gaps)
    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"influencer-marketing-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"influencer-marketing-{stamp}.xlsx")
    filters = [
        ("niche", ", ".join(args.niche) or "—"), ("seed channels", ", ".join(args.channel) or "—"),
        ("creators csv", args.creators or "—"), ("followers", f"{args.min_followers or 0:,} – {'∞' if args.max_followers is None else f'{args.max_followers:,}'}"),
        ("region", args.region or "—"), ("posts per creator", args.posts),
    ]
    context = {
        "query": "; ".join(args.niche + args.channel + ([args.creators] if args.creators else [])), "generated_at": now,
        "sources": sources, "gaps": gaps, "api_units": units, "filters": filters, "cpm": cpm,
        "lookalikes": lookalikes(rows), "contacts": contacts, "top": args.top,
    }
    write_html(html_path, args.title, rows, context)
    write_xlsx(xlsx_path, rows, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
