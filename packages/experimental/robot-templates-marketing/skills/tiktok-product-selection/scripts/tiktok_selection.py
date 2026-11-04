"""Run one TikTok product-selection pass and write its HTML report and xlsx workbook.

Examples:
  python tiktok_selection.py --snapshot-csv products.csv --keyword "lip oil" --trend-csv trends.csv \
      --state ./tiktok-state.json --out ./out
  python tiktok_selection.py --product-url https://shop.tiktok.com/view/product/1729... --keyword "lip oil" \
      --state ./tiktok-state.json --out ./out

Sold counts come from the user's snapshot CSV or from product pages the user
names (plain HTTP, JSON-LD). Every run appends its snapshots to --state, so the
second run can compute daily sold = sold_t − sold_t−1 and GMV ≈ sold × price.
Hashtag heat uses TikTokApi when TIKTOK_MS_TOKEN is set. Exit status is 0 when
both files were written, 2 when no product snapshot was collected.
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import collect  # noqa: E402
from collect import CollectionError  # noqa: E402
from metrics import DEFAULT_ASSUMPTIONS, engagement_rate, hashtag_name, product_rows  # noqa: E402
from report import write_html, write_xlsx  # noqa: E402


def load_assumptions(path: str | None) -> dict:
    """Return the defaults overlaid with a JSON file; nested tables merge key by key."""
    assumptions = copy.deepcopy(DEFAULT_ASSUMPTIONS)
    if not path:
        return assumptions
    try:
        with open(path, encoding="utf-8") as handle:
            overrides = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        raise CollectionError(f"assumptions file {path} is unreadable: {error}") from error
    for key, value in overrides.items():
        if key not in assumptions:
            raise CollectionError(f"assumptions file {path}: unknown key {key!r}; known: {', '.join(assumptions)}")
        if isinstance(assumptions[key], dict):
            assumptions[key].update(value)
        else:
            assumptions[key] = value
    return assumptions


def collect_all(args: argparse.Namespace, now: datetime, ms_token: str | None) -> tuple:
    """Return (snapshots, keyword → hashtag, hashtag snapshots, hashtag videos, trends, sources, gaps)."""
    snapshots: list = []
    sources: list = []
    gaps: list = []
    for path in args.snapshot_csv:
        try:
            rows = collect.read_snapshot_csv(path)
            snapshots += rows
            sources.append(f"snapshot CSV: {os.path.basename(path)} ({len(rows)} rows)")
        except CollectionError as error:
            gaps.append(f"snapshot CSV {path}: {error}")
    for url in args.product_url:
        try:
            snapshot = collect.fetch_product_page(url, now)
            if snapshot["sold_count"] is None:
                gaps.append(f"{url}: 页面没有可见已售数，无法做销量差分 the page shows no sold count")
            snapshots.append(snapshot)
            sources.append(f"product page (HTTP, JSON-LD): {url}")
        except CollectionError as error:
            gaps.append(f"product page {url}: {error}")
    if args.category:
        for snapshot in snapshots:
            snapshot["category"] = snapshot.get("category") or args.category

    hashtags = dict(item.split("=", 1) for item in args.hashtag if "=" in item)
    keyword_hashtags = {keyword: hashtags.get(keyword) or hashtag_name(keyword) for keyword in args.keyword}
    keyword_hashtags.update({keyword: hashtag for keyword, hashtag in hashtags.items() if keyword not in keyword_hashtags})
    hashtag_snapshots: dict = {}
    hashtag_videos: dict = {}
    if not ms_token and keyword_hashtags:
        gaps.append("未设置 TIKTOK_MS_TOKEN：跳过话题视频热度采集（TikTokApi，非官方接口，需 Playwright）。TIKTOK_MS_TOKEN is not set; content heat was not collected.")
    elif keyword_hashtags:
        for tag in sorted(set(keyword_hashtags.values())):
            try:
                result = collect.fetch_hashtag(tag, args.limit, ms_token, now)
                hashtag_snapshots[tag] = result["snapshot"]
                hashtag_videos[tag] = [{**video, "hashtag": tag, "engagement_rate": engagement_rate(video)} for video in result["videos"]]
                sources.append(f"TikTokApi hashtag #{tag} ({len(result['videos'])} videos)")
            except CollectionError as error:
                gaps.append(f"hashtag #{tag}: {error}")

    trends: dict = {}
    for path in args.trend_csv:
        try:
            for keyword, series in collect.read_trend_csv(path).items():
                trends.setdefault(keyword.lower(), []).extend(series)
            sources.append(f"keyword trend CSV: {os.path.basename(path)}")
        except CollectionError as error:
            gaps.append(f"trend CSV {path}: {error}")
    if not args.trend_csv:
        gaps.append("未提供 --trend-csv：没有关键词搜索热度，双验证只能给出「待观察」。No keyword trend CSV (Creative Center or Google Trends export); dual validation cannot pass.")
    missing = [keyword for keyword in args.keyword if keyword.lower() not in trends and args.trend_csv]
    if missing:
        gaps.append(f"趋势 CSV 中缺少关键词 keywords missing from the trend CSV: {', '.join(missing)}")
    return snapshots, keyword_hashtags, hashtag_snapshots, hashtag_videos, trends, sources, gaps


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--snapshot-csv", action="append", default=[], help="product snapshot CSV: product_id,title,price,sold_count,captured_at[,category,keyword,shop,cogs]; repeatable")
    parser.add_argument("--product-url", action="append", default=[], help="product page to fetch over plain HTTP; repeatable")
    parser.add_argument("--keyword", action="append", default=[], help="product keyword; matched to product titles; repeatable")
    parser.add_argument("--hashtag", action="append", default=[], help="keyword=hashtag override for content heat; repeatable")
    parser.add_argument("--trend-csv", action="append", default=[], help="keyword,date,value search-interest CSV; repeatable")
    parser.add_argument("--category", help="category for products whose snapshot has none (selects the commission median)")
    parser.add_argument("--price-min", type=float)
    parser.add_argument("--price-max", type=float)
    parser.add_argument("--limit", type=int, default=30, help="videos per hashtag (default 30)")
    parser.add_argument("--top", type=int, default=10, help="products in the top list (default 10)")
    parser.add_argument("--state", help="JSON file that keeps snapshots across runs; required for deltas")
    parser.add_argument("--assumptions", help="JSON file overriding margin and scoring defaults")
    parser.add_argument("--ms-token", help="TikTok msToken; defaults to $TIKTOK_MS_TOKEN")
    parser.add_argument("--title", default="TikTok 选品分析报告 TikTok product selection report")
    parser.add_argument("--out", default=".", help="output directory")
    args = parser.parse_args(argv)
    if not args.snapshot_csv and not args.product_url:
        parser.error("give at least one --snapshot-csv or --product-url")

    now = datetime.now(timezone.utc)
    try:
        assumptions = load_assumptions(args.assumptions)
        state = collect.load_state(args.state)
    except CollectionError as error:
        print(error, file=sys.stderr)
        return 2
    snapshots, keyword_hashtags, hashtag_snapshots, hashtag_videos, trends, sources, gaps = collect_all(args, now, args.ms_token or os.environ.get("TIKTOK_MS_TOKEN"))
    if not snapshots:
        print("No product snapshots were collected:", *gaps, sep="\n  ", file=sys.stderr)
        return 2

    collect.merge_snapshots(state, snapshots, hashtag_snapshots)
    current = {snapshot["product_id"] for snapshot in snapshots}
    histories = {product_id: state["products"][product_id] for product_id in sorted(current)}
    if args.state:
        try:
            collect.save_state(args.state, state)
        except CollectionError as error:
            gaps.append(str(error))
    else:
        gaps.append("未指定 --state：本次快照不会保存，下次运行无法计算差分。No --state file; this run's snapshots are not kept for the next run.")
    single = [product_id for product_id, history in histories.items() if len(history) < 2]
    first_run = len(single) == len(histories)
    if single:
        gaps.append(f"{len(single)} 个商品只有一次快照，日销量和 GMV 差分需要第二次快照（隔天用同一 --state 再运行）。"
                    f"{len(single)} products have one snapshot; daily sold and GMV deltas need a second snapshot.")

    keywords = list(dict.fromkeys(args.keyword + [s["keyword"] for s in snapshots if s.get("keyword")]))
    for keyword in keywords:
        keyword_hashtags.setdefault(keyword, hashtag_name(keyword))
    rows = product_rows(histories, keywords, keyword_hashtags, state["hashtags"], hashtag_videos, trends, assumptions, now, (args.price_min, args.price_max))
    if len(rows) < 10:
        gaps.append(f"只有 {len(rows)} 个候选商品（目标 ≥ 10）；在快照 CSV 中补充商品。Only {len(rows)} candidates; add products to the snapshot CSV.")
    videos = [video for tag_videos in hashtag_videos.values() for video in tag_videos]

    os.makedirs(args.out, exist_ok=True)
    stamp = now.strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(args.out, f"tiktok-selection-{stamp}.html")
    xlsx_path = os.path.join(args.out, f"tiktok-selection-{stamp}.xlsx")
    context = {
        "query": "; ".join(keywords) or "(no keyword)", "generated_at": now, "sources": sources, "gaps": gaps,
        "assumptions": assumptions, "first_run": first_run, "top": args.top, "hashtag_videos": hashtag_videos, "state": args.state,
    }
    write_html(html_path, args.title, rows, videos, context)
    write_xlsx(xlsx_path, rows, videos, trends, histories, context)
    print(html_path)
    print(xlsx_path)
    for gap in gaps:
        print("data gap:", gap, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
