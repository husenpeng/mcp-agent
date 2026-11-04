"""Offline tests for the TikTok data-insight skill: metrics, all three collectors, state, and both report files."""

from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
import zipfile
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))

import collect  # noqa: E402
import metrics  # noqa: E402
import tiktok_insight  # noqa: E402

NOW = datetime(2026, 11, 4, 12, 0, tzinfo=timezone.utc)
T = metrics.DEFAULT_THRESHOLDS
SHEETS = ["accounts", "videos", "topic_timeseries", "topics", "benchmarks", "run"]


def video(video_id, author="a", views=100, likes=10, comments=2, days_ago=1.0, hashtags=(), hour=None):
    published = NOW - timedelta(days=days_ago)
    if hour is not None:
        published = published.replace(hour=hour)
    return {"id": str(video_id), "author": author, "description": f"video {video_id}", "published_at": published.isoformat(),
            "views": views, "likes": likes, "comments": comments, "shares": 1, "hashtags": list(hashtags), "url": None, "source": "fixture"}


def raw_item(video_id, author, days_ago, views=1000, tags=("lipoil",)):
    return {"id": str(video_id), "desc": f"<i>{video_id}</i>", "createTime": int((NOW - timedelta(days=days_ago)).timestamp()),
            "author": {"uniqueId": author}, "music": {"id": 99, "title": "song"},
            "stats": {"playCount": views, "diggCount": 50, "commentCount": 5, "shareCount": 2},
            "challenges": [{"title": tag} for tag in tags]}


class AccountMetricsTest(unittest.TestCase):
    def test_engagement_breakout_and_cadence(self):
        videos = [video(i, views=100, days_ago=i * 2, hour=9) for i in range(1, 6)] + [video(9, views=1000, days_ago=12, hour=18)]
        result = metrics.account_metrics({"followers": 1000}, videos, NOW, T)
        self.assertEqual(result["median_views"], 100)
        self.assertAlmostEqual(result["median_er"], 0.12)
        self.assertAlmostEqual(result["follower_er"], 0.01)
        self.assertAlmostEqual(result["breakout_rate"], 1 / 6)
        self.assertEqual(result["breakouts"], 1)
        self.assertAlmostEqual(result["posts_per_week"], 5 / (10 - 9 / 24) * 7)
        self.assertAlmostEqual(result["median_gap_days"], 2.0)
        self.assertEqual(result["best_hour_utc"], 18)

    def test_missing_counts_stay_none(self):
        result = metrics.account_metrics({"followers": None}, [video(1, views=None, likes=None, comments=None, days_ago=1)], NOW, T)
        self.assertIsNone(result["median_views"])
        self.assertIsNone(result["median_er"])
        self.assertIsNone(result["breakout_rate"])
        self.assertIsNone(result["follower_er"])
        self.assertIsNone(result["posts_per_week"])
        self.assertIsNone(metrics.engagement_rate({"views": 0, "likes": 1}))

    def test_snapshot_growth_and_acceleration(self):
        history = [{"captured_at": "2026-11-01", "followers": 100}, {"captured_at": "2026-11-02", "followers": 110},
                   {"captured_at": "2026-11-04", "followers": 150}]
        growth = metrics.snapshot_growth(history, "followers")
        self.assertAlmostEqual(growth["gain_per_day"], 20.0)
        self.assertAlmostEqual(growth["acceleration"], 10.0)
        self.assertAlmostEqual(growth["growth_rate_per_day"], 20 / 110)
        single = metrics.snapshot_growth(history[:1], "followers")
        self.assertIsNone(single["gain_per_day"])
        self.assertEqual(single["value"], 100)

    def test_benchmarks_against_peer_median(self):
        rows = [{"handle": "a", "metrics": {"median_views": 100}}, {"handle": "b", "metrics": {"median_views": 300}}]
        bench = [row for row in metrics.benchmarks(rows) if row["metric"] == "median_views"]
        self.assertEqual(bench[0]["peer_median"], 200)
        self.assertAlmostEqual(bench[0]["ratio"], 0.5)


class TopicMetricsTest(unittest.TestCase):
    def test_trend_needs_growth_spread_and_persistence(self):
        videos = [video(f"o{i}", author=f"c{i % 6}", days_ago=30 + i) for i in range(3)]
        videos += [video(f"n{i}", author=f"c{i % 6}", days_ago=1 + i * 1.3) for i in range(20)]
        result = metrics.topic_metrics(videos, NOW, T)
        self.assertEqual(result["class"], "trend", result["why"])
        self.assertGreater(result["growth_28d"], 0)
        self.assertEqual(result["active_weeks"], 4)
        self.assertEqual(result["creators"], 6)

    def test_spike_from_concentration_or_single_creator(self):
        burst = [video(f"b{i}", author=f"c{i}", days_ago=0.2 + (i % 2) * 0.5) for i in range(12)]
        burst += [video("x", author="z", days_ago=15), video("y", author="z2", days_ago=20)]
        self.assertEqual(metrics.topic_metrics(burst, NOW, T)["class"], "spike")
        solo = [video(f"s{i}", author="one" if i < 8 else f"o{i}", days_ago=1 + i * 2.5) for i in range(10)]
        result = metrics.topic_metrics(solo, NOW, T)
        self.assertEqual(result["class"], "spike")
        self.assertIn("单一达人", result["why"])

    def test_fad_and_insufficient(self):
        fad = [video(f"f{i}", author=f"c{i}", days_ago=15 + i * 0.6) for i in range(10)] + [video("late", author="q", days_ago=2)]
        self.assertEqual(metrics.topic_metrics(fad, NOW, T)["class"], "fad")
        self.assertEqual(metrics.topic_metrics([video(1)], NOW, T)["class"], "insufficient")

    def test_growth_acceleration_and_change_point(self):
        videos = [video(f"p{i}", days_ago=8 + i * 3) for i in range(2)] + [video(f"q{i}", days_ago=0.2 + i * 0.3) for i in range(6)]
        result = metrics.topic_metrics(videos, NOW, T)
        self.assertAlmostEqual(result["growth_7d"], 6 / 2 - 1)
        self.assertIsNone(result["acceleration"])
        self.assertEqual(metrics.change_point([0, 0, 0, 0, 5, 5, 5, 5]), 4)
        self.assertIsNone(metrics.change_point([1, 1, 1, 1]))
        self.assertIsNone(metrics.change_point([1, 2]))

    def test_daily_series_keeps_unknown_views(self):
        series = metrics.daily_series([video(1, views=None, days_ago=0.1), video(2, views=5, days_ago=0.1)], NOW, 3)
        self.assertEqual(series[-1][1], 2)
        self.assertIsNone(series[-1][2])
        self.assertEqual(series[0], ((NOW - timedelta(days=2)).date().isoformat(), 0, 0))

    def test_co_hashtags_exclude_requested(self):
        groups = metrics.co_hashtags([video(1, hashtags=["LipOil", "GRWM"]), video(2, hashtags=["grwm"])], ["lipoil"])
        self.assertEqual(list(groups), ["grwm"])
        self.assertEqual(len(groups["grwm"]), 2)


class DisplayApiTest(unittest.TestCase):
    def test_user_and_paged_video_list(self):
        calls = []
        pages = iter([
            {"data": {"videos": [{"id": 1, "create_time": 1_762_000_000, "view_count": 500, "like_count": 50, "comment_count": 5,
                                  "share_count": 1, "share_url": "https://t/1", "video_description": "d"}], "cursor": 11, "has_more": True}},
            {"data": {"videos": [{"id": 2, "create_time": 1_762_100_000, "view_count": 50}], "has_more": False}},
        ])

        def fetch(url, token, body=None):
            calls.append((url, token, body))
            if "user/info" in url:
                return {"data": {"user": {"username": "brand", "follower_count": 1200, "video_count": 2}}, "error": {"code": "ok"}}
            return next(pages)

        api = collect.DisplayApi("TOKEN", fetch)
        self.assertEqual(api.user()["followers"], 1200)
        records = api.videos(5, "brand")
        self.assertEqual([record["id"] for record in records], ["1", "2"])
        self.assertIsNone(records[1]["likes"])
        self.assertEqual(calls[2][2], {"max_count": 4, "cursor": 11})
        self.assertIn("fields=", calls[1][0])
        self.assertEqual(api.requests, 3)

    def test_api_error_becomes_collection_error(self):
        api = collect.DisplayApi("T", lambda url, token, body=None: {"error": {"code": "access_token_invalid", "message": "expired"}})
        with self.assertRaisesRegex(collect.CollectionError, "access_token_invalid"):
            api.user()
        empty = collect.DisplayApi("T", lambda url, token, body=None: {"data": {}, "error": {"code": "ok"}})
        with self.assertRaisesRegex(collect.CollectionError, "no user"):
            empty.user()


class PublicSourceTest(unittest.TestCase):
    def test_maps_accounts_hashtags_and_sounds(self):
        def batch(requests, limit, token):
            return {
                ("account", "brand"): {"info": {"userInfo": {"user": {"uniqueId": "brand"}, "stats": {"followerCount": 900, "heartCount": 10}}},
                                       "videos": [raw_item(1, "brand", 1)]},
                ("hashtag", "lipoil"): {"info": {"challengeInfo": {"statsV2": {"viewCount": "5000", "videoCount": "7"}}}, "videos": [raw_item(2, "x", 2)]},
                ("sound", "99"): {"info": {"musicInfo": {"stats": {"videoCount": 3}}}, "videos": [raw_item(3, "y", 3)]},
            }

        results = collect.PublicSource("MS", 10, batch).fetch([("account", "brand"), ("hashtag", "lipoil"), ("sound", "99")])
        self.assertEqual(results[("account", "brand")]["account"]["followers"], 900)
        self.assertEqual(results[("hashtag", "lipoil")]["stats"], {"views": 5000, "videos": 7})
        self.assertEqual(results[("sound", "99")]["stats"]["views"], None)
        record = results[("hashtag", "lipoil")]["videos"][0]
        self.assertEqual((record["views"], record["sound_title"], record["hashtags"]), (1000, "song", ["lipoil"]))

    def test_failures_become_collection_errors(self):
        missing = collect.PublicSource(None, 5).fetch([("hashtag", "x")])
        self.assertIn("TIKTOK_MS_TOKEN", str(missing[("hashtag", "x")]))

        def broken(requests, limit, token):
            raise RuntimeError("playwright not installed")

        session = collect.PublicSource("MS", 5, broken).fetch([("hashtag", "x")])
        self.assertIsInstance(session[("hashtag", "x")], collect.CollectionError)
        self.assertIn("playwright", str(session[("hashtag", "x")]))
        partial = collect.PublicSource("MS", 5, lambda r, l, t: {("hashtag", "x"): ValueError("captcha"), ("hashtag", "y"): {"info": {}, "videos": []}})
        result = partial.fetch([("hashtag", "x"), ("hashtag", "y")])
        self.assertIn("captcha", str(result[("hashtag", "x")]))
        self.assertIn("no data", str(result[("hashtag", "y")]))
        self.assertEqual(collect.PublicSource(None, 5).fetch([]), {})


class YtDlpTest(unittest.TestCase):
    def test_single_video_stats(self):
        info = {"id": "7", "uploader": "maker", "timestamp": 1_762_000_000, "view_count": 900, "like_count": 90, "comment_count": 9,
                "repost_count": 3, "tags": ["#grwm"], "webpage_url": "https://www.tiktok.com/@maker/video/7"}
        record = collect.ytdlp_video("u", extract=lambda url: info)
        self.assertEqual((record["views"], record["shares"], record["hashtags"]), (900, 3, ["grwm"]))

    def test_failures(self):
        def boom(url):
            raise ValueError("blocked")

        with self.assertRaisesRegex(collect.CollectionError, "blocked"):
            collect.ytdlp_video("u", extract=boom)
        with self.assertRaisesRegex(collect.CollectionError, "nothing"):
            collect.ytdlp_video("u", extract=lambda url: {})


class StateTest(unittest.TestCase):
    def test_round_trip_and_bad_files(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "state.json")
            state = collect.load_state(path)
            collect.record_snapshot(state, "accounts", "a", {"captured_at": "2026-11-01", "followers": 1})
            collect.record_snapshot(state, "accounts", "a", {"captured_at": "2026-11-01", "followers": 1})
            collect.save_state(path, state)
            self.assertEqual(len(collect.load_state(path)["accounts"]["a"]), 1)
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(json.dumps({"version": 0}))
            with self.assertRaisesRegex(collect.CollectionError, "version"):
                collect.load_state(path)


class EndToEndTest(unittest.TestCase):
    def _run(self, argv):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            status = tiktok_insight.main(argv)
        return status, stdout.getvalue(), stderr.getvalue()

    def test_main_writes_html_and_xlsx(self):
        followers = iter([1000, 1300])

        def batch(requests, limit, token):
            count = next(followers)
            return {
                ("account", "brand"): {"info": {"userInfo": {"user": {"uniqueId": "brand"}, "stats": {"followerCount": count}}},
                                       "videos": [raw_item(f"b{i}", "brand", 1 + i * 2, views=100 if i else 5000, tags=("lipoil", "grwm")) for i in range(8)]},
                ("account", "peer"): {"info": {"userInfo": {"user": {"uniqueId": "peer"}, "stats": {"followerCount": 500}}},
                                      "videos": [raw_item(f"p{i}", "peer", 1 + i * 3, views=200, tags=("grwm",)) for i in range(6)]},
                ("hashtag", "lipoil"): {"info": {"challengeInfo": {"stats": {"viewCount": 10_000 * count}}},
                                        "videos": [raw_item(f"h{i}", f"c{i % 6}", 1 + i * 1.3) for i in range(20)]},
            }

        original_init = collect.PublicSource.__init__
        collect.PublicSource.__init__ = lambda self, token, limit, batch_=None: original_init(self, token, limit, batch)
        os.environ.pop("TIKTOK_ACCESS_TOKEN", None)
        try:
            with tempfile.TemporaryDirectory() as folder:
                out = os.path.join(folder, "out")
                state = os.path.join(folder, "state.json")
                argv = ["--account", "@brand", "--account", "peer", "--hashtag", "#lipoil", "--ms-token", "MS", "--state", state, "--out", out]
                status, _, stderr = self._run(argv)
                self.assertEqual(status, 0)
                self.assertIn("growth per day needs a second run", stderr)
                with open(state, encoding="utf-8") as handle:
                    saved = json.load(handle)
                saved["accounts"]["brand"][0]["captured_at"] = "2026-11-01T00:00:00+00:00"
                saved["hashtags"]["lipoil"][0]["captured_at"] = "2026-11-01T00:00:00+00:00"
                with open(state, "w", encoding="utf-8") as handle:
                    json.dump(saved, handle)
                for name in os.listdir(out):
                    os.remove(os.path.join(out, name))
                status, stdout, stderr = self._run(argv)
                self.assertEqual(status, 0)
                html_path, xlsx_path = stdout.split()
                with open(html_path, encoding="utf-8") as handle:
                    page = handle.read()
                self.assertIn("&lt;i&gt;b0&lt;/i&gt;", page)
                self.assertNotIn("<i>b0</i>", page)
                self.assertIn("趋势 trend", page)
                self.assertIn("#grwm", page)
                self.assertIn("未设置 TIKTOK_ACCESS_TOKEN", page)
                for section in ["摘要 Summary", "账号概览与对标", "Top / Bottom 视频", "话题与音乐趋势", "新兴趋势", "建议", "方法与口径 Method", "数据缺口 Data gaps"]:
                    self.assertIn(section, page)
                with zipfile.ZipFile(xlsx_path) as book:
                    sheets = book.read("xl/workbook.xml").decode()
                for name in SHEETS:
                    self.assertIn(f'name="{name}"', sheets)
        finally:
            collect.PublicSource.__init__ = original_init

    def test_display_api_path(self):
        original = collect.DisplayApi.__init__

        def fetch(url, token, body=None):
            if "user/info" in url:
                return {"data": {"user": {"username": "me", "follower_count": 10}}}
            return {"data": {"videos": [{"id": i, "create_time": int((NOW - timedelta(days=i)).timestamp()), "view_count": 10 * (i + 1)} for i in range(3)], "has_more": False}}

        collect.DisplayApi.__init__ = lambda self, token, fetch_=None: original(self, token, fetch)
        try:
            with tempfile.TemporaryDirectory() as out:
                status, stdout, _ = self._run(["--access-token", "T", "--out", out])
                self.assertEqual(status, 0)
                with open(stdout.split()[0], encoding="utf-8") as handle:
                    page = handle.read()
                self.assertIn("TikTok Display API (authorized account @me)", page)
                self.assertIn("Display API requests: 2", page)
        finally:
            collect.DisplayApi.__init__ = original

    def test_exit_2_when_nothing_collected(self):
        os.environ.pop("TIKTOK_MS_TOKEN", None)
        os.environ.pop("TIKTOK_ACCESS_TOKEN", None)
        with tempfile.TemporaryDirectory() as folder:
            out = os.path.join(folder, "out")
            status, _, stderr = self._run(["--hashtag", "x", "--out", out])
            self.assertEqual(status, 2)
            self.assertIn("hashtag x", stderr)
            self.assertFalse(os.path.exists(out))


if __name__ == "__main__":
    unittest.main()
