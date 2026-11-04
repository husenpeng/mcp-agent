"""Run one Instagram profile insight collection and write its HTML report and xlsx workbook.

Examples:
  python instagram_insight.py --account glossier --competitor rarebeauty --limit 30 --out ./out
  python instagram_insight.py --account @brand --state ./brand-state.json --utc-offset 8 --out ./out

Business Discovery is used when META_ACCESS_TOKEN and IG_USER_ID are both set;
otherwise instaloader reads public profiles anonymously with a low limit.
--state keeps follower counts between runs, and growth appears from the second
run on. Exit status is 0 when both files were written, 2 when no post was collected.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Callable, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from collect import GRAPH_VERSION, AnonymousSource, CollectionError, GraphApi, normalize_username  # noqa: E402
from metrics import (  # noqa: E402
    account_rows, benchmark_rows, enrich, format_comparison, growth_rows, hashtag_contribution,
    hour_rows, posting_heatmap, recommendations, snapshot, topic_trends,
)
from report import write_html, write_xlsx  # noqa: E402

OFFICIAL_DEFAULT_LIMIT = 30
#: Anonymous reads get rate limited quickly, so keyless runs start low and stay under a cap.
KEYLESS_DEFAULT_LIMIT = 12
KEYLESS_LIMIT_CAP = 50
PUBLIC_COUNTS_GAP = (
    "公开数据不含保存、分享和 reach，互动率按 (点赞 + 评论) ÷ 粉丝数计算；这些数字需要账号本人授权 Insights。"
    "Saves, shares, and reach are not public, so engagement rate is (likes + comments) ÷ followers."
)


def open_source(args: argparse.Namespace, env: dict) -> tuple:
    """Return (source, gaps); the official source needs both credentials."""
    token, user_id = env.get("META_ACCESS_TOKEN"), env.get("IG_USER_ID")
    if token and user_id:
        return GraphApi(token, user_id, version=args.graph_version), []
    missing = " and ".join(name for name, value in (("META_ACCESS_TOKEN", token), ("IG_USER_ID", user_id)) if not value)
    try:
        source = AnonymousSource(args.sleep)
    except CollectionError as error:
        raise CollectionError(f"Missing {missing}, and the keyless path failed: {error}") from error
    return source, [f"未设置 {missing}：改用 instaloader 匿名采集，容易被限流。Missing {missing}: instaloader reads anonymously and may be rate limited."]


def collect_accounts(source, args: argparse.Namespace) -> tuple:
    """Return (profiles by username, posts, sources, gaps); a failed account keeps what was read first."""
    is_official = isinstance(source, GraphApi)
    requested = args.limit or (OFFICIAL_DEFAULT_LIMIT if is_official else KEYLESS_DEFAULT_LIMIT)
    limit = requested if is_official else min(requested, KEYLESS_LIMIT_CAP)
    gaps = [] if limit == requested else [f"匿名路径每个账号最多 {KEYLESS_LIMIT_CAP} 帖。--limit capped at {KEYLESS_LIMIT_CAP} on the keyless path."]
    label = "Instagram Business Discovery" if is_official else "instaloader"
    profiles: dict = {}
    posts: list = []
    sources: list = []
    seen: set = set()
    for role, value in [("primary", name) for name in args.account] + [("competitor", name) for name in args.competitor]:
        try:
            name = normalize_username(value)
            if name in seen:
                continue
            seen.add(name)
            profile, records = source.account(name, limit)
            sources.append(f"{label}: @{name}")
        except CollectionError as error:
            profile, records = error.profile, error.records
            gaps.append(f"account {value}: {error}")
            if records:
                sources.append(f"{label} (partial): @{name}")
        if records and profile:
            profiles[profile["username"]] = {**profile, "role": role}
            posts += records
        elif records:
            gaps.append(f"account {value}: 没有账号资料，丢弃 {len(records)} 帖。No profile, so its posts were dropped.")
    return profiles, posts, sources, gaps


def load_state(path: Optional[str]) -> tuple:
    """Return (accounts in the snapshot, usable, gaps); an unreadable file is reported and never overwritten."""
    if path is None:
        return {}, False, ["未提供 --state：不计算增长。Without --state, growth is not computed."]
    if not os.path.exists(path):
        return {}, True, [f"首次运行：{path} 还没有快照，本次写入基线，下次运行才有增长。First run: this snapshot is the growth baseline."]
    try:
        with open(path, encoding="utf-8") as handle:
            state = json.load(handle)
        accounts = state["accounts"]
        if not isinstance(accounts, dict) or not all(isinstance(entry, dict) for entry in accounts.values()):
            raise TypeError("accounts is not a mapping of snapshots")
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
        return {}, False, [f"快照 {path} 无法读取，未计算增长，也未覆盖该文件。Snapshot unreadable, so growth was skipped and the file was left as is: {error}"]
    return accounts, True, []


def save_state(path: str, state: dict) -> Optional[str]:
    """Replace the snapshot file in one step; return a gap on failure."""
    temporary = f"{path}.tmp"
    try:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(temporary, "w", encoding="utf-8") as handle:
            json.dump(state, handle, ensure_ascii=False, indent=2)
        os.replace(temporary, path)
    except OSError as error:
        return f"快照未保存，下次运行无法计算增长。Snapshot not saved, so the next run has no growth baseline: {error}"
    return None


def _coverage_gaps(profiles: dict, posts: list) -> list:
    gaps = [PUBLIC_COUNTS_GAP]
    if len(profiles) < 2:
        gaps.append("只有一个账号，没有同类对标；请加 --competitor。Only one account, so there is no peer benchmark; add --competitor.")
    if any(profile.get("followers") is None for profile in profiles.values()):
        gaps.append("部分账号缺少粉丝数，互动率未计算。Some accounts lack follower counts, so their engagement rate is empty.")
    if any(post.get("likes") is None for post in posts):
        gaps.append("部分帖子隐藏或缺少点赞数，按未知处理。Some posts hide or lack like counts; they stay unknown.")
    if any(post.get("kind") is None for post in posts):
        gaps.append("部分帖子类型未知。Some posts have an unknown type.")
    return gaps


def main(argv: Optional[list] = None, open_source: Callable = open_source, env: Optional[dict] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--account", action="append", default=[], help="account to analyze: username, @name, or profile URL; repeatable")
    parser.add_argument("--competitor", action="append", default=[], help="peer account to benchmark against; repeatable")
    parser.add_argument("--limit", type=int, help=f"recent posts per account (default {OFFICIAL_DEFAULT_LIMIT}; keyless default {KEYLESS_DEFAULT_LIMIT}, cap {KEYLESS_LIMIT_CAP})")
    parser.add_argument("--sleep", type=float, default=3.0, help="seconds between anonymous posts, at least 1 (default 3)")
    parser.add_argument("--utc-offset", type=float, default=0, help="hours from UTC for the posting-hour heatmap (default 0)")
    parser.add_argument("--state", help="JSON snapshot file; growth appears when an earlier run wrote it")
    parser.add_argument("--graph-version", default=GRAPH_VERSION, help=f"Graph API version (default {GRAPH_VERSION})")
    parser.add_argument("--title", default="Instagram 数据洞察报告 Instagram insight report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.account and not args.competitor:
        parser.error("give at least one --account or --competitor")
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be at least 1")
    if args.sleep < 1:
        parser.error("--sleep must be at least 1 second")
    if not -12 <= args.utc_offset <= 14:
        parser.error("--utc-offset must be between -12 and 14")

    now = datetime.now(timezone.utc)
    try:
        source, gaps = open_source(args, os.environ if env is None else env)
    except CollectionError as error:
        print("No posts were collected:", error, sep="\n  ", file=sys.stderr)
        return 2
    try:
        profiles, raw_posts, sources, collect_gaps = collect_accounts(source, args)
    finally:
        source.close()
    gaps += collect_gaps
    if not raw_posts:
        print("No posts were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2

    previous, state_usable, state_gaps = load_state(args.state)
    gaps += state_gaps + _coverage_gaps(profiles, raw_posts)
    posts = enrich(list({post["id"]: post for post in raw_posts}.values()), profiles)
    accounts = account_rows(profiles, posts, now)
    formats = format_comparison(posts)
    hours = hour_rows(posts, args.utc_offset)
    contributions = hashtag_contribution(posts)
    trends, series = topic_trends(posts, now)
    benchmarks = benchmark_rows(accounts)
    data = {
        "posts": posts, "accounts": accounts, "formats": formats, "hours": hours,
        "heatmap": posting_heatmap(posts, args.utc_offset), "contributions": contributions,
        "trends": trends, "series": series, "benchmarks": benchmarks,
        "growth": growth_rows(profiles, previous, now),
        "recommendations": recommendations(formats, hours, contributions, benchmarks, args.utc_offset),
    }
    if args.state and state_usable:
        failure = save_state(args.state, snapshot(profiles, previous, now))
        gaps += [failure] if failure else []
    context = {
        "query": "; ".join(args.account + args.competitor), "generated_at": now, "sources": sources, "gaps": gaps,
        "api_calls": source.calls, "utc_offset": args.utc_offset, "state_path": args.state,
    }
    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"instagram-insight-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"instagram-insight-{stamp}.xlsx")
    write_html(html_path, args.title, data, context)
    write_xlsx(xlsx_path, data, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
