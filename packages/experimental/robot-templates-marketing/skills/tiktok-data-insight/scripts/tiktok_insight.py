"""Run one TikTok data-insight collection and write its HTML report and xlsx workbook.

Examples:
  python tiktok_insight.py --account brand --account competitor --hashtag lipoil --state ./tt-state.json --out ./out
  python tiktok_insight.py --sound 7016547803243022337 --video-url https://www.tiktok.com/@a/video/1 --out ./out

When TIKTOK_ACCESS_TOKEN (a user-authorized Display API token) is set, the
authorized account's own profile and videos come from the TikTok Display API.
Public accounts, hashtags, and sounds use TikTokApi with TIKTOK_MS_TOKEN.
--video-url checks single videos through yt-dlp without downloading. Exit status
is 0 when both files were written, 2 when nothing was collected.
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import statistics
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import collect  # noqa: E402
from collect import CollectionError  # noqa: E402
from metrics import (  # noqa: E402
    DEFAULT_THRESHOLDS, account_metrics, benchmarks, co_hashtags, daily_series, engagement_rate,
    recommendations, snapshot_growth, topic_metrics,
)
from report import write_html, write_xlsx  # noqa: E402


def load_thresholds(path: str | None) -> dict:
    """Return the default thresholds overlaid with a JSON file."""
    thresholds = copy.deepcopy(DEFAULT_THRESHOLDS)
    if not path:
        return thresholds
    try:
        with open(path, encoding="utf-8") as handle:
            overrides = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        raise CollectionError(f"thresholds file {path} is unreadable: {error}") from error
    unknown = set(overrides) - set(thresholds)
    if unknown:
        raise CollectionError(f"thresholds file {path}: unknown keys {', '.join(sorted(unknown))}; known: {', '.join(thresholds)}")
    thresholds.update(overrides)
    return thresholds


def _with_multiples(videos: list, topic: str) -> list:
    median = statistics.median([video["views"] for video in videos if video.get("views") is not None] or [0])
    return [{**video, "topic": topic, "engagement_rate": engagement_rate(video),
             "views_multiple": video["views"] / median if median and video.get("views") is not None else None} for video in videos]


def collect_all(args: argparse.Namespace, access_token: str | None, ms_token: str | None, public: collect.PublicSource | None = None) -> dict:
    """Return accounts (handle, account, videos), topics (kind, name, stats, videos), checks, sources, gaps, and api_requests."""
    result = {"accounts": [], "topics": [], "checks": [], "sources": [], "gaps": [], "api_requests": None}
    gaps = result["gaps"]
    own_handle = None
    if access_token:
        api = collect.DisplayApi(access_token)
        try:
            account = api.user()
            own_handle = account["handle"]
            videos = api.videos(args.limit, own_handle)
            result["accounts"].append({"handle": own_handle, "account": account, "videos": videos})
            result["sources"].append(f"TikTok Display API (authorized account @{own_handle})")
        except CollectionError as error:
            gaps.append(f"Display API: {error}")
        result["api_requests"] = api.requests
    else:
        gaps.append("未设置 TIKTOK_ACCESS_TOKEN：没有授权账号的官方数据，全部账号走 TikTokApi 公开采集。No Display API token; accounts use the unofficial public path.")

    requests = [("account", handle.lstrip("@")) for handle in args.account if handle.lstrip("@") != own_handle]
    requests += [("hashtag", tag.lstrip("#")) for tag in args.hashtag] + [("sound", sound) for sound in args.sound]
    public = public or collect.PublicSource(ms_token, args.limit)
    if requests and not ms_token:
        gaps.append("未设置 TIKTOK_MS_TOKEN：无法通过 TikTokApi（非官方、需 Playwright、有限流）采集公开账号、话题和音乐。")
    for (kind, name), item in public.fetch(requests).items():
        if isinstance(item, CollectionError):
            gaps.append(f"{kind} {name}: {item}")
            continue
        if kind == "account":
            result["accounts"].append({"handle": item["account"]["handle"] or name, "account": item["account"], "videos": item["videos"]})
        else:
            result["topics"].append({"kind": kind, "name": name, "stats": item["stats"], "videos": item["videos"]})
        result["sources"].append(f"TikTokApi {kind} {name} ({len(item['videos'])} videos)")
    for url in args.video_url:
        try:
            result["checks"].append(collect.ytdlp_video(url))
            result["sources"].append(f"yt-dlp video {url}")
        except CollectionError as error:
            gaps.append(f"video {url}: {error}")
    return result


def analyse(collected: dict, state: dict, now: datetime, thresholds: dict) -> tuple:
    """Return (account rows, all videos, topic rows, emerging rows, benchmarks, tips) and record snapshots into state."""
    stamp = now.isoformat(timespec="seconds")
    accounts, videos, topics = [], [], []
    for item in collected["accounts"]:
        account = item["account"]
        history = collect.record_snapshot(state, "accounts", item["handle"], {
            "captured_at": stamp, "followers": account.get("followers"), "likes_total": account.get("likes_total"), "video_count": account.get("video_count")})
        metrics = account_metrics(account, item["videos"], now, thresholds)
        growth = snapshot_growth(history, "followers")
        metrics["follower_gain_per_day"] = growth["gain_per_day"]
        metrics["follower_acceleration"] = growth["acceleration"]
        accounts.append({"handle": item["handle"], "account": account, "metrics": metrics})
        videos += _with_multiples(item["videos"], f"@{item['handle']}")
    for item in collected["topics"]:
        label = f"#{item['name']}" if item["kind"] == "hashtag" else f"♪ {item['name']}"
        group = "hashtags" if item["kind"] == "hashtag" else "sounds"
        history = collect.record_snapshot(state, group, item["name"], {"captured_at": stamp, **item["stats"]})
        topics.append({"label": label, "kind": item["kind"], "metrics": topic_metrics(item["videos"], now, thresholds, history),
                       "series": daily_series(item["videos"], now, thresholds["window_days"])})
        videos += _with_multiples(item["videos"], label)
    videos += _with_multiples(collected["checks"], "single video check")
    requested = [item["name"] for item in collected["topics"] if item["kind"] == "hashtag"]
    unique = list({video["id"]: video for video in videos}.values())
    emerging = []
    for tag, tagged in co_hashtags(unique, requested).items():
        if len(tagged) < thresholds["min_videos"]:
            continue
        metrics = topic_metrics(tagged, now, thresholds)
        if metrics["class"] in ("trend", "spike"):
            emerging.append({"label": f"#{tag}", "kind": "co-hashtag", "metrics": metrics, "series": daily_series(tagged, now, thresholds["window_days"])})
    emerging = sorted(emerging, key=lambda topic: -topic["metrics"]["posts_window"])[:10]
    bench = benchmarks(accounts)
    return accounts, videos, topics, emerging, bench, recommendations(accounts, topics)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--account", action="append", default=[], help="public account handle (@name); repeatable")
    parser.add_argument("--hashtag", action="append", default=[], help="hashtag without #; repeatable")
    parser.add_argument("--sound", action="append", default=[], help="sound (music) id; repeatable")
    parser.add_argument("--video-url", action="append", default=[], help="single video URL checked through yt-dlp; repeatable")
    parser.add_argument("--limit", type=int, default=30, help="videos per account, hashtag, or sound (default 30)")
    parser.add_argument("--state", help="JSON file that keeps follower and view snapshots across runs")
    parser.add_argument("--thresholds", help="JSON file overriding breakout and trend thresholds")
    parser.add_argument("--access-token", help="Display API user access token; defaults to $TIKTOK_ACCESS_TOKEN")
    parser.add_argument("--ms-token", help="TikTok msToken for TikTokApi; defaults to $TIKTOK_MS_TOKEN")
    parser.add_argument("--title", default="TikTok 数据洞察报告 TikTok insight report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    access_token = args.access_token or os.environ.get("TIKTOK_ACCESS_TOKEN")
    if not (args.account or args.hashtag or args.sound or args.video_url or access_token):
        parser.error("give at least one --account, --hashtag, --sound, or --video-url, or set TIKTOK_ACCESS_TOKEN")

    now = datetime.now(timezone.utc)
    try:
        thresholds = load_thresholds(args.thresholds)
        state = collect.load_state(args.state)
    except CollectionError as error:
        print(error, file=sys.stderr)
        return 2
    collected = collect_all(args, access_token, args.ms_token or os.environ.get("TIKTOK_MS_TOKEN"))
    gaps = collected["gaps"]
    if not (collected["accounts"] or collected["topics"] or collected["checks"]):
        print("Nothing was collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2
    accounts, videos, topics, emerging, bench, tips = analyse(collected, state, now, thresholds)
    if args.state:
        try:
            collect.save_state(args.state, state)
        except CollectionError as error:
            gaps.append(str(error))
    else:
        gaps.append("未指定 --state：粉丝和话题播放的日增量、加速度需要历次快照，下次运行请带上 --state。No --state file; follower and view growth need snapshots across runs.")
    if any(row["metrics"]["follower_gain_per_day"] is None for row in accounts) or any(topic["metrics"]["views_gain_per_day"] is None for topic in topics):
        gaps.append("部分账号或话题只有一次快照：粉丝日增和话题播放日增要到第二次运行才有。Some accounts or topics have one snapshot; growth per day needs a second run.")
    if len(accounts) == 1:
        gaps.append("只有一个账号，无法同类对标；请加入至少一个同类账号。Only one account; add a peer account for benchmarks.")

    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"tiktok-insight-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"tiktok-insight-{stamp}.xlsx")
    query = "; ".join([f"@{h.lstrip('@')}" for h in args.account] + [f"#{t.lstrip('#')}" for t in args.hashtag] + [f"sound {s}" for s in args.sound] + args.video_url) or "(authorized account)"
    context = {"query": query, "generated_at": now, "sources": collected["sources"], "gaps": gaps, "thresholds": thresholds,
               "api_requests": collected["api_requests"], "state": args.state}
    unique = list({video["id"]: video for video in videos}.values())
    write_html(html_path, args.title, accounts, unique, topics, emerging, bench, tips, context)
    write_xlsx(xlsx_path, accounts, videos, topics, emerging, bench, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
