"""Offline tests for the Instagram insight skill: metrics, both collectors, the state file, and both report files."""

from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import types
import unittest
import urllib.error
import urllib.parse
import zipfile
from datetime import datetime, timedelta, timezone
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))

import collect  # noqa: E402
import instagram_insight  # noqa: E402
import metrics  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)


def post(post_id, owner="a", likes=10, comments=2, views=None, kind="image", published="2026-11-02T09:00:00+00:00", caption=""):
    return {
        "id": post_id, "url": f"https://www.instagram.com/p/{post_id}/", "owner": owner, "caption": caption, "kind": kind,
        "published_at": published, "likes": likes, "comments": comments, "views": views, "source": "fixture",
    }


def profile(name="a", followers=1000, media=50, role="primary"):
    return {"username": name, "name": name, "followers": followers, "following": 10, "media_count": media, "source": "fixture", "role": role}


class EngagementTest(unittest.TestCase):
    def test_engagement_uses_known_counts_only(self):
        self.assertEqual(metrics.engagement({"likes": 8, "comments": 2, "saves": 1, "shares": 1}), 12)
        self.assertEqual(metrics.engagement({"likes": None, "comments": 2}), 2)
        self.assertIsNone(metrics.engagement({"likes": None, "comments": None}))

    def test_engagement_rate_prefers_reach_and_keeps_unknowns(self):
        self.assertAlmostEqual(metrics.engagement_rate(post("a", likes=8, comments=2), 100), 0.1)
        self.assertAlmostEqual(metrics.engagement_rate({**post("a", likes=8, comments=2), "reach": 50}, 100), 0.2)
        self.assertIsNone(metrics.engagement_rate(post("a"), None))
        self.assertIsNone(metrics.engagement_rate(post("a"), 0))
        self.assertIsNone(metrics.engagement_rate(post("a", likes=None, comments=None), 100))

    def test_hashtags_and_enrich(self):
        self.assertEqual(metrics.extract_hashtags("#Glow #glow ＃skin text"), ["glow", "skin"])
        self.assertEqual(metrics.extract_hashtags(None), [])
        rows = metrics.enrich([post("x", caption="#a")], {"a": profile(followers=120)})
        self.assertEqual((rows[0]["engagement"], rows[0]["engagement_rate"], rows[0]["hashtags"]), (12, 0.1, ["a"]))
        self.assertIsNone(metrics.enrich([post("x", owner="missing")], {})[0]["engagement_rate"])

    def test_time_parsing(self):
        self.assertEqual(metrics.parse_time("2026-11-01T00:00:00+0000"), datetime(2026, 11, 1, tzinfo=timezone.utc))
        self.assertEqual(metrics.parse_time("2026-11-01T00:00:00"), datetime(2026, 11, 1, tzinfo=timezone.utc))
        self.assertIsNone(metrics.parse_time("soon"))
        self.assertIsNone(metrics.parse_time(None))


class AccountTest(unittest.TestCase):
    def test_cadence(self):
        posts = [post(str(i), published=f"2026-10-{1 + i * 7:02d}T00:00:00+00:00") for i in range(3)]
        self.assertAlmostEqual(metrics.posts_per_week(posts), 1.0)
        self.assertIsNone(metrics.posts_per_week(posts[:1]))
        self.assertIsNone(metrics.posts_per_week([post("x", published=None)]))

    def test_modash_rate_uses_last_60_days_median_likes(self):
        posts = [post("a", likes=100), post("b", likes=300), post("c", likes=9999, published="2026-01-01T00:00:00+00:00"), post("d", likes=9999, published=None)]
        self.assertEqual(metrics.modash_rate(posts, 1000, NOW), 0.2)
        self.assertIsNone(metrics.modash_rate(posts, None, NOW))
        self.assertIsNone(metrics.modash_rate([post("a", likes=None)], 1000, NOW))

    def test_account_rows_sort_and_summarize(self):
        profiles = {"a": profile("a", 1000), "b": profile("b", None), "c": profile("c", 5000)}
        posts = metrics.enrich([post("1", "a", kind="reel", views=100), post("2", "a"), post("3", "c")], profiles)
        rows = metrics.account_rows(profiles, posts, NOW)
        self.assertEqual([row["username"] for row in rows], ["c", "a", "b"])
        self.assertEqual(rows[1]["reel_share"], 0.5)
        self.assertEqual(rows[1]["last_post"], "2026-11-02")
        self.assertEqual(rows[2]["posts_sampled"], 0)
        self.assertIsNone(rows[2]["median_engagement_rate"])
        self.assertIsNone(rows[2]["reel_share"])


class ContentTest(unittest.TestCase):
    def test_format_comparison(self):
        posts = metrics.enrich([
            post("1", kind="reel", views=100, likes=30), post("2", kind="reel", views=None, likes=None, comments=None),
            post("3", kind="image"), post("4", kind="carousel"), post("5", kind=None),
        ], {"a": profile(followers=100)})
        rows = {row["kind"]: row for row in metrics.format_comparison(posts)}
        self.assertEqual(sorted(rows), ["carousel", "image", "reel", "unknown"])
        self.assertEqual((rows["reel"]["posts"], rows["reel"]["median_views"], rows["reel"]["median_likes"]), (2, 100, 30))
        self.assertAlmostEqual(rows["reel"]["share"], 0.4)
        self.assertIsNone(rows["image"]["median_views"])

    def test_heatmap_applies_the_offset_and_covers_every_slot(self):
        posts = metrics.enrich([post("1", published="2026-11-01T20:00:00+00:00"), post("2", published=None)], {"a": profile()})
        rows = metrics.posting_heatmap(posts, 8)
        self.assertEqual(len(rows), 168)
        filled = [row for row in rows if row["posts"]]
        self.assertEqual([(row["weekday"], row["hour"], row["posts"]) for row in filled], [("Mon", 4, 1)])
        self.assertAlmostEqual(filled[0]["median_engagement_rate"], 0.012)
        self.assertIsNone(rows[0]["median_engagement_rate"])
        self.assertEqual(metrics.hour_rows(posts, 8), [{"hour": 4, "posts": 1, "median_engagement_rate": 0.012}])

    def test_hashtag_contribution_is_per_account(self):
        posts = metrics.enrich([
            post("1", "a", likes=30, comments=0, caption="#win"), post("2", "a", likes=10, comments=0), post("3", "a", likes=20, comments=0),
            post("4", "b", likes=None, comments=None, caption="#win"), post("5", "b", likes=0, comments=0, caption="#zero"),
        ], {})
        rows = metrics.hashtag_contribution(posts)
        first = rows[0]
        self.assertEqual((first["account"], first["hashtag"], first["posts"], first["contribution_index"]), ("a", "#win", 1, 1.5))
        zero = next(row for row in rows if row["account"] == "b")
        self.assertEqual(zero["hashtag"], "#zero")
        self.assertIsNone(zero["contribution_index"])
        self.assertEqual(len(rows), 2)

    def test_topic_trends_separate_lasting_from_spikes(self):
        def tagged(post_id, tag, days_ago):
            return post(post_id, published=(NOW - timedelta(days=days_ago)).isoformat(), caption=f"#{tag}")

        posts = [tagged(f"l{i}", "steady", 3 + i * 7) for i in range(3)]
        posts += [tagged(f"s{i}", "burst", 2) for i in range(4)]
        posts += [tagged("r", "rare", 1), tagged("old", "ancient", 90), post("none", published=None, caption="#undated")]
        trends, series = metrics.topic_trends(metrics.enrich(posts, {}), NOW)
        rows = {row["hashtag"]: row for row in trends}
        self.assertEqual(sorted(rows), ["#burst", "#rare", "#steady"])
        self.assertEqual((rows["#steady"]["label"], rows["#steady"]["active_weeks"], rows["#steady"]["growth"]), ("lasting", 3, 0.0))
        self.assertEqual((rows["#burst"]["label"], rows["#burst"]["last_7d"]), ("spike", 4))
        self.assertIsNone(rows["#burst"]["growth"])
        self.assertEqual(rows["#rare"]["label"], "insufficient")
        burst = [row for row in series if row["hashtag"] == "#burst"]
        self.assertEqual([row["posts"] for row in burst], [0, 0, 0, 4])
        self.assertEqual(burst[-1]["week_start"], "2026-10-28")

    def test_benchmarks_compare_with_the_other_accounts(self):
        accounts = [
            {"username": "a", "role": "primary", "median_engagement_rate": 0.01, "posts_per_week": 2.0},
            {"username": "b", "role": "competitor", "median_engagement_rate": 0.04, "posts_per_week": 4.0},
        ]
        rows = metrics.benchmark_rows(accounts)
        self.assertEqual((rows[0]["peer_median_engagement_rate"], rows[0]["engagement_index"], rows[0]["cadence_index"]), (0.04, 0.25, 0.5))
        alone = metrics.benchmark_rows(accounts[:1])[0]
        self.assertIsNone(alone["engagement_index"])

    def test_recommendations_need_enough_posts(self):
        formats = [{"kind": "reel", "posts": 3, "median_engagement_rate": 0.05}, {"kind": "image", "posts": 3, "median_engagement_rate": 0.01}]
        hours = [{"hour": 9, "posts": 2, "median_engagement_rate": 0.03}]
        tags = [{"hashtag": "#a", "account": "x", "posts": 2, "contribution_index": 1.4}]
        peers = [{"username": "x", "role": "primary", "engagement_index": 0.5}]
        lines = metrics.recommendations(formats, hours, tags, peers, 8)
        self.assertEqual(len(lines), 4)
        self.assertIn("UTC+8", lines[1])
        sparse = metrics.recommendations([{"kind": "reel", "posts": 1, "median_engagement_rate": 0.5}], [], [], [], 0)
        self.assertEqual(len(sparse), 1)
        self.assertIn("too small", sparse[0])


class GrowthTest(unittest.TestCase):
    def test_growth_needs_a_snapshot(self):
        self.assertEqual(metrics.growth_rows({"a": profile()}, {}, NOW), [])

    def test_growth_compares_with_the_snapshot(self):
        earlier = {"a": {"taken_at": "2026-10-25T00:00:00+00:00", "followers": 800, "media_count": 40}}
        row = metrics.growth_rows({"a": profile(followers=1000, media=50)}, earlier, NOW)[0]
        self.assertEqual((row["followers_delta"], row["followers_growth"], row["days"], row["followers_per_day"], row["media_delta"]), (200, 0.25, 10, 20, 10))

    def test_growth_keeps_unknowns(self):
        earlier = {"a": {"taken_at": None, "followers": None, "media_count": None}}
        row = metrics.growth_rows({"a": profile(followers=None)}, earlier, NOW)[0]
        self.assertIsNone(row["followers_delta"])
        self.assertIsNone(row["days"])
        self.assertIsNone(row["media_delta"])

    def test_snapshot_keeps_other_accounts_and_skips_unknown_followers(self):
        state = metrics.snapshot({"a": profile(followers=5), "b": profile("b", None)}, {"old": {"followers": 1}}, NOW)
        self.assertEqual(sorted(state["accounts"]), ["a", "old"])
        self.assertEqual(state["accounts"]["a"]["followers"], 5)


def graph_media(media_id, **extra):
    return {"id": media_id, "caption": f"#tag cap {media_id}", "media_type": "IMAGE", "permalink": f"https://www.instagram.com/p/{media_id}/",
            "timestamp": "2026-11-01T00:00:00+0000", "comments_count": 3, "like_count": 7, **extra}


def discovery(items, after=None, followers=1000):
    media = {"data": items}
    if after:
        media["paging"] = {"cursors": {"after": after}}
    return {"business_discovery": {"username": "brand", "name": "Brand", "followers_count": followers, "follows_count": 5, "media_count": 90, "media": media}}


class GraphApiTest(unittest.TestCase):
    def test_account_maps_profile_and_media(self):
        urls = []

        def fetch(url):
            urls.append(url)
            return discovery([
                graph_media("r", media_type="VIDEO", media_product_type="REELS", view_count=900),
                graph_media("v", media_type="VIDEO", media_product_type="FEED"),
                graph_media("c", media_type="CAROUSEL_ALBUM", like_count=None),
            ])

        api = collect.GraphApi("T", "1784", fetch)
        found, posts = api.account("https://www.instagram.com/Brand/?hl=en", 3)
        self.assertEqual(found, {"username": "brand", "name": "Brand", "followers": 1000, "following": 5, "media_count": 90, "source": "instagram-graph-api"})
        self.assertEqual([(item["kind"], item["views"], item["likes"]) for item in posts], [("reel", 900, 7), ("video", None, 7), ("carousel", None, None)])
        decoded = urllib.parse.unquote_plus(urls[0])
        self.assertIn("/v26.0/1784?", decoded)
        self.assertIn("business_discovery.username(brand){username,name,followers_count", decoded)
        self.assertIn("media.limit(3){id,caption", decoded)
        self.assertEqual(api.calls, 1)

    def test_account_follows_cursors_up_to_the_limit(self):
        pages = iter([discovery([graph_media("a"), graph_media("b")], "CUR"), discovery([graph_media("c")], "NEXT")])
        urls = []

        def fetch(url):
            urls.append(url)
            return next(pages)

        api = collect.GraphApi("T", "1", fetch)
        _, posts = api.account("brand", 3)
        self.assertEqual([item["id"] for item in posts], ["a", "b", "c"])
        self.assertIn("media.after(CUR).limit(1)", urllib.parse.unquote_plus(urls[1]))
        self.assertEqual(api.calls, 2)

    def test_failures_keep_partial_data_and_hide_the_token(self):
        pages = iter([discovery([graph_media("a")], "CUR")])

        def fetch(url):
            try:
                return next(pages)
            except StopIteration:
                raise collect.CollectionError("HTTP 500 for SECRET") from None

        with self.assertRaises(collect.CollectionError) as caught:
            collect.GraphApi("SECRET", "1", fetch).account("brand", 5)
        self.assertEqual([item["id"] for item in caught.exception.records], ["a"])
        self.assertEqual(caught.exception.profile["username"], "brand")
        self.assertIn("Business and Creator", str(caught.exception))
        self.assertNotIn("SECRET", str(caught.exception))

    def test_empty_and_invalid_accounts(self):
        with self.assertRaisesRegex(collect.CollectionError, "no media"):
            collect.GraphApi("T", "1", lambda url: {}).account("brand", 2)
        with self.assertRaisesRegex(collect.CollectionError, "not an Instagram username"):
            collect.GraphApi("T", "1", lambda url: {}).account("bad name!", 2)


class HttpJsonTest(unittest.TestCase):
    def _http_error(self, body):
        return urllib.error.HTTPError("https://x", 400, "Bad", {}, io.BytesIO(body))

    def test_errors_become_actionable_collection_errors(self):
        cases = [
            (self._http_error(b'{"error":{"message":"expired","code":190}}'), "Refresh META_ACCESS_TOKEN"),
            (self._http_error(b'{"error":{"message":"limit","code":4}}'), "rate limit"),
            (self._http_error(b'{"error":{"message":"denied","code":10}}'), "instagram_basic"),
            (self._http_error(b"not json"), "HTTP 400: not json"),
            (urllib.error.URLError("offline"), "unreachable: offline"),
        ]
        for error, expected in cases:
            with mock.patch("urllib.request.urlopen", side_effect=error):
                with self.assertRaisesRegex(collect.CollectionError, expected):
                    collect.http_json("https://x")

    def test_success_and_invalid_json(self):
        with mock.patch("urllib.request.urlopen", return_value=io.BytesIO(b'{"a":1}')):
            self.assertEqual(collect.http_json("https://x"), {"a": 1})
        with mock.patch("urllib.request.urlopen", return_value=io.BytesIO(b"<html>")):
            with self.assertRaisesRegex(collect.CollectionError, "invalid JSON"):
                collect.http_json("https://x")


class FakePost:
    def __init__(self, code, raw=None, typename="GraphImage", likes=5, comments=2, views=None, caption="cap #tag"):
        self.shortcode, self.raw, self.typename, self.likes, self.comments = code, raw or {}, typename, likes, comments
        self.video_view_count, self.video_play_count, self.caption = views, None, caption
        self.date_utc = datetime(2026, 11, 1, 12, 0)

    def _asdict(self):
        return self.raw


def fake_profile(posts=(), private=False, post_error=None, followers=2000):
    def get_posts():
        yield from posts
        if post_error:
            raise post_error

    return types.SimpleNamespace(is_private=private, full_name="Brand", followers=followers, followees=3, mediacount=70, get_posts=get_posts)


def fake_module(found=None, error=None):
    class Loader:
        closed = False

        def __init__(self, **options):
            self.options = options
            self.context = "context"

        def close(self):
            Loader.closed = True

    class FakeProfile:
        @staticmethod
        def from_username(context, name):
            if error:
                raise error
            return found

    class RateController:
        def __init__(self, context=None):
            self.slept = []

        def sleep(self, secs):
            self.slept.append(secs)

    return types.SimpleNamespace(Instaloader=Loader, Profile=FakeProfile, RateController=RateController)


class AnonymousSourceTest(unittest.TestCase):
    def source(self, found=None, error=None, pause=lambda secs: None):
        return collect.AnonymousSource(2.0, fake_module(found, error), pause)

    def test_loader_is_anonymous_and_downloads_nothing(self):
        source = self.source()
        for key in ("download_pictures", "download_videos", "download_video_thumbnails", "download_comments", "save_metadata"):
            self.assertFalse(source.loader.options[key])
        source.close()
        self.assertTrue(type(source.loader).closed)

    def test_account_reads_profile_and_limits_posts_with_sleep(self):
        sleeps = []
        posts = [FakePost(f"p{i}") for i in range(5)]
        found, records = self.source(fake_profile(posts), pause=sleeps.append).account("@Brand", 2)
        self.assertEqual(found, {"username": "brand", "name": "Brand", "followers": 2000, "following": 3, "media_count": 70, "source": "instaloader"})
        self.assertEqual([record["id"] for record in records], ["p0", "p1"])
        self.assertEqual(sleeps, [2.0, 2.0])
        self.assertEqual(records[0]["published_at"], "2026-11-01T12:00:00+00:00")
        self.assertEqual(records[0]["owner"], "brand")

    def test_post_record_keeps_absent_counts_unknown(self):
        hidden = collect.post_record(FakePost("a", {"code": "a", "like_and_view_counts_disabled": True, "comment_count": 3}, "GraphVideo", likes=0, comments=3, views=10), "x")
        self.assertEqual((hidden["likes"], hidden["views"], hidden["comments"]), (None, None, 3))
        web = collect.post_record(FakePost("b", {"code": "b", "like_count": None, "comment_count": None, "product_type": "clips"}, "GraphVideo", likes=0, comments=0, views=40), "x")
        self.assertEqual((web["likes"], web["comments"], web["kind"], web["views"]), (None, None, "reel", 40))
        negative = collect.post_record(FakePost("c", likes=-1, comments=-1), "x")
        self.assertEqual((negative["likes"], negative["comments"]), (None, None))
        device = collect.post_record(FakePost("d", {"comments": None, "iphone_struct": {"product_type": "clips", "like_and_view_counts_disabled": True}}, "GraphVideo", views=9), "x")
        self.assertEqual((device["likes"], device["comments"], device["kind"], device["views"]), (None, None, "reel", None))
        carousel = collect.post_record(FakePost("e", typename="GraphSidecar"), "x")
        self.assertEqual(carousel["kind"], "carousel")

    def test_failures_become_collection_errors_and_keep_partial_posts(self):
        with self.assertRaisesRegex(collect.CollectionError, "never logs in"):
            self.source(error=ValueError("401 Please wait")).account("x", 2)
        with self.assertRaisesRegex(collect.CollectionError, "instaloader failed: 'gone'"):
            self.source(error=KeyError("gone")).account("x", 2)
        with self.assertRaises(collect.CollectionError) as caught:
            self.source(fake_profile([FakePost("a")], post_error=ValueError("boom"))).account("x", 5)
        self.assertEqual([record["id"] for record in caught.exception.records], ["a"])
        self.assertEqual(caught.exception.profile["followers"], 2000)
        with self.assertRaisesRegex(collect.CollectionError, "private"):
            self.source(fake_profile(private=True)).account("x", 2)
        with self.assertRaisesRegex(collect.CollectionError, "no public posts"):
            self.source(fake_profile()).account("x", 2)

    def test_rate_limit_stops_the_remaining_accounts(self):
        source = self.source(fake_profile([FakePost("a")], post_error=collect.CollectionError("Instagram rate limit: wait")))
        with self.assertRaises(collect.CollectionError) as caught:
            source.account("x", 5)
        self.assertEqual(len(caught.exception.records), 1)
        with self.assertRaisesRegex(collect.CollectionError, "skipped after rate limit"):
            source.account("y", 5)

    def test_rate_controller_fails_fast_on_long_waits(self):
        controller = self.source().loader.options["rate_controller"]()
        controller.sleep(5)
        self.assertEqual(controller.slept, [5])
        with self.assertRaisesRegex(collect.CollectionError, "rate limit"):
            controller.sleep(1800)

    def test_missing_instaloader_is_actionable(self):
        with mock.patch.dict(sys.modules, {"instaloader": None}):
            with self.assertRaisesRegex(collect.CollectionError, "instaloader==4.16"):
                collect.AnonymousSource()


class StateFileTest(unittest.TestCase):
    def test_absent_flag_and_first_run(self):
        self.assertEqual(instagram_insight.load_state(None)[:2], ({}, False))
        with tempfile.TemporaryDirectory() as folder:
            accounts, usable, gaps = instagram_insight.load_state(os.path.join(folder, "s.json"))
        self.assertEqual((accounts, usable), ({}, True))
        self.assertIn("First run", gaps[0])

    def test_round_trip(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "nested", "s.json")
            self.assertIsNone(instagram_insight.save_state(path, {"version": 1, "accounts": {"a": {"followers": 1}}}))
            self.assertEqual(instagram_insight.load_state(path), ({"a": {"followers": 1}}, True, []))
            self.assertEqual(os.listdir(os.path.dirname(path)), ["s.json"])

    def test_corrupt_state_is_reported_and_unusable(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "s.json")
            for content in ("{broken", "[]", '{"accounts": 3}', '{"accounts": {"a": 1}}'):
                with open(path, "w", encoding="utf-8") as handle:
                    handle.write(content)
                accounts, usable, gaps = instagram_insight.load_state(path)
                self.assertEqual((accounts, usable), ({}, False), content)
                self.assertIn("left as is", gaps[0])

    def test_save_failure_becomes_a_gap(self):
        with tempfile.TemporaryDirectory() as folder:
            blocker = os.path.join(folder, "file")
            with open(blocker, "w", encoding="utf-8") as handle:
                handle.write("x")
            self.assertIn("not saved", instagram_insight.save_state(os.path.join(blocker, "s.json"), {}))


class EndToEndTest(unittest.TestCase):
    def _run(self, argv, opener, env=None):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            status = instagram_insight.main(argv, opener, env or {})
        return status, stdout.getvalue(), stderr.getvalue()

    def _graph_opener(self, followers):
        def fetch(url):
            name = urllib.parse.unquote_plus(url).split("username(")[1].split(")")[0]
            if name == "personal":
                raise collect.CollectionError("HTTP 400: not a business account")
            return {"business_discovery": {
                "username": name, "name": "<b>name</b>", "followers_count": followers, "follows_count": 1, "media_count": 9,
                "media": {"data": [
                    graph_media(f"{name}-r{i}", caption="<script>x</script> #win", media_type="VIDEO", media_product_type="REELS", view_count=500, like_count=90)
                    for i in range(3)
                ] + [graph_media(f"{name}-i{i}", caption="plain", like_count=10) for i in range(3)]},
            }}

        return lambda args, env: (collect.GraphApi("TOKEN-VALUE", "1", fetch), [])

    def test_main_writes_html_and_xlsx_and_then_growth(self):
        with tempfile.TemporaryDirectory() as out:
            state = os.path.join(out, "state", "s.json")
            argv = ["--account", "@brand", "--competitor", "rival", "--competitor", "brand", "--competitor", "personal", "--limit", "6", "--utc-offset", "8", "--state", state, "--out", os.path.join(out, "one")]
            status, stdout, stderr = self._run(argv, self._graph_opener(1000))
            self.assertEqual(status, 0, stderr)
            self.assertIn("First run", stderr)
            self.assertIn("account personal: HTTP 400", stderr)
            files = sorted(os.listdir(os.path.join(out, "one")))
            self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
            self.assertTrue(files[0].startswith("instagram-insight-"))
            self.assertEqual(stdout.split(), [os.path.join(out, "one", name) for name in files])
            with open(os.path.join(out, "one", files[0]), encoding="utf-8") as handle:
                page = handle.read()
            self.assertIn("&lt;script&gt;x&lt;/script&gt;", page)
            self.assertNotIn("<script>", page)
            self.assertIn("<svg", page)
            self.assertIn("#win", page)
            self.assertIn("UTC+8", page)
            self.assertIn("API calls: 3", page)
            self.assertIn("方法与口径 Method", page)
            self.assertIn("数据缺口 Data gaps", page)
            self.assertIn("No earlier snapshot", page)
            self.assertIn("官方 Official", page)
            self.assertIn("Favor reel over image", page)
            with zipfile.ZipFile(os.path.join(out, "one", files[1])) as book:
                sheets = book.read("xl/workbook.xml").decode()
            for name in ["accounts", "posts", "topic_series", "topics", "benchmarks", "formats", "posting_heatmap", "hashtag_contribution", "growth", "run"]:
                self.assertIn(f'name="{name}"', sheets)

            status, _, stderr = self._run(["--account", "brand", "--state", state, "--out", os.path.join(out, "two")], self._graph_opener(1200))
            self.assertEqual(status, 0, stderr)
            self.assertNotIn("First run", stderr)
            self.assertIn("no peer benchmark", stderr)
            html_file = next(name for name in os.listdir(os.path.join(out, "two")) if name.endswith(".html"))
            with open(os.path.join(out, "two", html_file), encoding="utf-8") as handle:
                page = handle.read()
            self.assertIn(">200<", page)
            self.assertIn("20.00%", page)
            self.assertNotIn("No earlier snapshot", page)
            with open(state, encoding="utf-8") as handle:
                saved = json.load(handle)
            self.assertEqual(saved["accounts"]["brand"]["followers"], 1200)
            self.assertEqual(saved["accounts"]["rival"]["followers"], 1000)

    def test_main_without_state_reports_no_growth_and_writes_no_snapshot(self):
        with tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--account", "brand", "--out", out], self._graph_opener(1000))
            self.assertEqual(status, 0, stderr)
            self.assertIn("growth is not computed", stderr)
            self.assertEqual(sorted(name.rsplit(".", 1)[1] for name in os.listdir(out)), ["html", "xlsx"])

    def test_main_keeps_a_corrupt_state_file(self):
        with tempfile.TemporaryDirectory() as out:
            state = os.path.join(out, "s.json")
            with open(state, "w", encoding="utf-8") as handle:
                handle.write("{broken")
            status, _, stderr = self._run(["--account", "brand", "--state", state, "--out", out], self._graph_opener(1000))
            self.assertEqual(status, 0, stderr)
            self.assertIn("left as is", stderr)
            with open(state, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "{broken")

    def test_main_keyless_run_records_the_missing_keys(self):
        module = fake_module(fake_profile([FakePost("a", raw={"code": "a", "like_count": None, "comment_count": 2}), FakePost("b", typename="Mystery")], followers=None))

        class Source(collect.AnonymousSource):
            def __init__(self, sleep_seconds):
                super().__init__(sleep_seconds, module, lambda secs: None)

        with mock.patch.object(instagram_insight, "AnonymousSource", Source), tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--account", "x", "--limit", "80", "--out", out], instagram_insight.open_source, {"META_ACCESS_TOKEN": "T"})
            self.assertEqual(status, 0, stderr)
            self.assertIn("Missing IG_USER_ID", stderr)
            self.assertIn("--limit capped at 50", stderr)
            self.assertIn("lack follower counts", stderr)
            self.assertIn("hide or lack like counts", stderr)
            self.assertIn("unknown type", stderr)

    def test_main_keeps_partial_accounts(self):
        class Source:
            calls = None

            def account(self, name, limit):
                raise collect.CollectionError("cut off", [post("x", owner=name)], {**profile(name), "role": "primary"} if name == "kept" else None)

            def close(self):
                pass

        with tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--account", "kept", "--account", "lost", "--out", out], lambda args, env: (Source(), []))
            self.assertEqual(status, 0, stderr)
            self.assertIn("No profile", stderr)
            self.assertIn("account kept: cut off", stderr)

    def test_keyless_runs_default_to_a_low_limit(self):
        limits = []

        class Source:
            calls = None

            def account(self, name, limit):
                limits.append(limit)
                raise collect.CollectionError("offline")

            def close(self):
                pass

        with tempfile.TemporaryDirectory() as out:
            self._run(["--account", "x", "--out", out], lambda args, env: (Source(), []))
        self.assertEqual(limits, [instagram_insight.KEYLESS_DEFAULT_LIMIT])

    def test_main_reports_gaps_and_fails_without_posts(self):
        class Source:
            calls = None
            closed = False

            def account(self, name, limit):
                raise collect.CollectionError("offline")

            def close(self):
                self.closed = True

        source = Source()
        with tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--account", "x", "--account", "bad name!", "--out", out], lambda args, env: (source, ["keyless"]))
            self.assertEqual(status, 2)
            self.assertIn("account x: offline", stderr)
            self.assertIn("not an Instagram username", stderr)
            self.assertEqual(os.listdir(out), [])
        self.assertTrue(source.closed)

    def test_main_explains_a_missing_keyless_dependency(self):
        def unavailable(sleep):
            raise collect.CollectionError("instaloader is not installed")

        with mock.patch.object(instagram_insight, "AnonymousSource", unavailable), tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--account", "x", "--out", out], instagram_insight.open_source, {})
        self.assertEqual(status, 2)
        self.assertIn("Missing META_ACCESS_TOKEN and IG_USER_ID", stderr)

    def test_open_source_prefers_the_official_api(self):
        args = types.SimpleNamespace(graph_version="v26.0", sleep=3.0)
        source, gaps = instagram_insight.open_source(args, {"META_ACCESS_TOKEN": "T", "IG_USER_ID": "1"})
        self.assertIsInstance(source, collect.GraphApi)
        self.assertEqual(gaps, [])

    def test_arguments_are_validated(self):
        for argv in ([], ["--account", "x", "--limit", "0"], ["--account", "x", "--sleep", "0"], ["--account", "x", "--utc-offset", "20"]):
            with self.assertRaises(SystemExit):
                with contextlib.redirect_stderr(io.StringIO()):
                    instagram_insight.main(argv, lambda args, env: None, {})


if __name__ == "__main__":
    unittest.main()
