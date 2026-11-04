"""Offline tests for the Instagram selection skill: metrics, both collectors, and both report files."""

from __future__ import annotations

import contextlib
import io
import os
import sys
import tempfile
import types
import unittest
import urllib.error
import urllib.parse
import zipfile
from datetime import datetime, timezone
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))

import collect  # noqa: E402
import instagram_selection  # noqa: E402
import metrics  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)


def post(post_id, caption="", likes=10, comments=2, views=None, kind="image", published="2026-11-02T00:00:00+00:00", owner="a", target="#x", edge="top_media"):
    return {
        "id": post_id, "url": f"https://www.instagram.com/p/{post_id}/", "owner": owner, "caption": caption, "kind": kind,
        "published_at": published, "likes": likes, "comments": comments, "views": views, "target": target, "edge": edge, "source": "fixture",
    }


class MetricsTest(unittest.TestCase):
    def test_engagement_keeps_unknown_counts(self):
        self.assertEqual(metrics.engagement(post("a", likes=8, comments=2)), 10)
        self.assertEqual(metrics.engagement(post("a", likes=None, comments=2)), 2)
        self.assertIsNone(metrics.engagement(post("a", likes=None, comments=None)))

    def test_candidate_phrases_skip_noise(self):
        phrases = metrics.candidate_phrases("My new LED face mask! Link https://x.co/a #skincare @brand\nred light therapy")
        self.assertIn("led face", phrases)
        self.assertIn("led face mask", phrases)
        self.assertIn("red light therapy", phrases)
        self.assertNotIn("my new", phrases)
        self.assertFalse(any("skincare" in phrase or "brand" in phrase or "http" in phrase for phrase in phrases))
        self.assertEqual(metrics.candidate_phrases(None), set())

    def test_mention_index_dedupes_captions_and_prefers_longer_phrases(self):
        posts = [
            post("a", "led face mask works"), post("b", "LED face mask   WORKS"),
            post("c", "the led face mask glow"), post("d", "a rare gadget"),
        ]
        index = metrics.mention_index(posts, seeds=["rare gadget"])
        self.assertEqual(sorted(item["id"] for item in index["led face mask"]), ["a", "c"])
        self.assertNotIn("led face", index)
        self.assertNotIn("face mask", index)
        self.assertEqual([item["id"] for item in index["rare gadget"]], ["d"])

    def test_seed_terms_match_words_and_chinese_text(self):
        self.assertTrue(metrics.contains_term("glow", "my glow serum"))
        self.assertFalse(metrics.contains_term("glow", "glowing skin"))
        self.assertTrue(metrics.contains_term("精华液", "这款精华液很好"))

    def test_weekly_growth_and_trend(self):
        posts = [post(str(i), published=f"2026-11-0{1 + i}T00:00:00+00:00") for i in range(3)]
        posts.append(post("old", published="2026-10-25T00:00:00+00:00"))
        posts.append(post("future", published="2026-12-25T00:00:00+00:00"))
        counts = metrics.weekly_counts(posts, NOW)
        self.assertEqual(counts, [3, 1, 0, 0, 0])
        self.assertEqual(metrics.mention_growth(counts), 2.0)
        self.assertIsNone(metrics.mention_growth([1, 0, 0, 0, 0]))
        self.assertIsNone(metrics.weekly_counts([post("a", published=None)], NOW))
        self.assertEqual(metrics.parse_time("2026-11-01T00:00:00+0000"), datetime(2026, 11, 1, tzinfo=timezone.utc))
        self.assertIsNone(metrics.parse_time("yesterday"))
        self.assertGreater(metrics.trend_score(counts, 100), 0)
        self.assertIsNone(metrics.trend_score([1, 1, 1, 1, 1], 100))
        self.assertIsNone(metrics.trend_score(counts, None))

    def test_intent_ratio_only_with_comments(self):
        self.assertTrue(metrics.intent_hit("Where can I buy this?"))
        self.assertTrue(metrics.intent_hit("price please"))
        self.assertTrue(metrics.intent_hit("链接在哪"))
        self.assertFalse(metrics.intent_hit("so pretty"))
        sampled = post("a")
        metrics.score_comments(sampled, ["link?", "nice", "cute", "price?"])
        self.assertEqual((sampled["comments_sampled"], sampled["intent_hits"]), (4, 2))
        self.assertEqual(metrics.intent_ratio([sampled, post("b")]), 0.5)
        self.assertIsNone(metrics.intent_ratio([post("b")]))
        metrics.score_comments(sampled, [])
        self.assertIsNone(metrics.intent_ratio([sampled]))

    def test_product_rows_rank_and_status(self):
        posts = [post(str(i), f"led face mask, take {i}", likes=100, views=500, kind="reel", owner=f"u{i}") for i in range(3)]
        posts += [post("x", "desk lamp one"), post("y", "desk lamp two")]
        rows = metrics.product_rows(posts, NOW)
        self.assertEqual(rows[0]["phrase"], "led face mask")
        self.assertEqual(rows[0]["status"], "watch")
        self.assertEqual(rows[0]["authors"], 3)
        self.assertEqual(rows[0]["total_views"], 1500)
        self.assertEqual(rows[0]["reel_mentions"], 3)
        self.assertIsNone(rows[0]["intent_ratio"])
        lamp = next(row for row in rows if row["phrase"] == "desk lamp")
        self.assertEqual(lamp["status"], "rejected")
        self.assertIsNone(lamp["total_views"])
        self.assertEqual({row["status"] for row in rows} - {"watch", "rejected"}, set())

    def test_status_rejects_a_collapse(self):
        self.assertEqual(metrics.status(5, -0.5), "rejected")
        self.assertEqual(metrics.status(5, None), "watch")

    def test_hashtag_rows_keep_unknown_medians(self):
        rows = metrics.hashtag_rows([
            post("a", likes=None, comments=None, kind="reel"), post("b", likes=None, comments=None, kind=None, edge="recent_media"),
            post("c", target="@p", edge="profile"),
        ], {"x": 900})
        self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]["media_count"], rows[0]["top_posts"], rows[0]["recent_posts"]), (900, 1, 1))
        self.assertIsNone(rows[0]["median_likes"])
        self.assertEqual(rows[0]["video_share"], 1.0)

    def test_related_daily_brands_and_reels(self):
        posts = [post("a", "#X #Glow #glow", views=5, kind="reel"), post("b", "#glow try @acmeco and Other Brand", kind="video", likes=500), post("c", "photo", published=None)]
        self.assertEqual(metrics.related_hashtags(posts, ["#x"]), [{"hashtag": "#glow", "posts": 2}])
        daily = metrics.daily_posts(posts, NOW, days=3)
        self.assertEqual(daily, [{"day": "2026-11-02", "posts": 2}, {"day": "2026-11-03", "posts": 0}, {"day": "2026-11-04", "posts": 0}])
        brands = metrics.brand_rows(posts, ["Acme Co", "Other Brand", "Absent"])
        self.assertEqual([(row["brand"], row["mentions"]) for row in brands], [("Acme Co", 1), ("Other Brand", 1), ("Absent", 0)])
        self.assertEqual(brands[0]["mention_share"], 0.5)
        self.assertIsNone(brands[2]["median_engagement"])
        self.assertIsNone(metrics.brand_rows(posts, ["Absent"])[0]["mention_share"])
        self.assertEqual(metrics.brand_rows(posts, ["  "]), [])
        self.assertEqual([item["id"] for item in metrics.representative_reels(posts)], ["a", "b"])


def graph_media(media_id, **extra):
    return {"id": media_id, "caption": f"cap {media_id}", "media_type": "IMAGE", "permalink": f"https://www.instagram.com/p/{media_id}/",
            "timestamp": "2026-11-01T00:00:00+0000", "comments_count": 3, "like_count": 7, **extra}


def graph_fetch(calls, recent_ids=()):
    def fetch(url):
        calls.append(url)
        if "recently_searched_hashtags" in url:
            return {"data": [{"id": item} for item in recent_ids]}
        if "ig_hashtag_search" in url:
            return {"data": [{"id": "178"}]}
        if "/178/top_media" in url:
            return {"data": [graph_media("t1"), graph_media("t2", like_count=None)]}
        if "/178/recent_media" in url:
            return {"data": [graph_media("r1", media_type="VIDEO")]}
        raise AssertionError(url)
    return fetch


class GraphApiTest(unittest.TestCase):
    def test_hashtag_flow_maps_fields_and_counts_quota(self):
        calls = []
        api = collect.GraphApi("TOKEN", "1784", graph_fetch(calls, ["other"]))
        api.load_quota()
        records = api.hashtag_posts("#Skincare", 5)
        self.assertEqual([record["edge"] for record in records], ["top_media", "top_media", "recent_media"])
        self.assertEqual(records[0], {
            "id": "t1", "url": "https://www.instagram.com/p/t1/", "owner": None, "caption": "cap t1", "kind": "image",
            "published_at": "2026-11-01T00:00:00+0000", "likes": 7, "comments": 3, "views": None, "target": "#skincare",
            "edge": "top_media", "source": "instagram-graph-api",
        })
        self.assertIsNone(records[1]["likes"])
        self.assertEqual(records[2]["kind"], "video")
        self.assertIn("q=skincare", calls[1])
        self.assertIn("user_id=1784", calls[1])
        self.assertEqual(api.quota(), {"limit": 30, "used_before": 1, "queried_this_run": 1, "used_after": 2, "remaining": 28})
        self.assertEqual(api.calls, 4)

    def test_quota_exhaustion_stops_before_reading_media(self):
        calls = []
        api = collect.GraphApi("T", "1", graph_fetch(calls, [str(i) for i in range(30)]))
        api.load_quota()
        with self.assertRaisesRegex(collect.CollectionError, "rolling 7-day quota"):
            api.hashtag_posts("new", 5)
        self.assertFalse(any("top_media" in url for url in calls))
        reused = collect.GraphApi("T", "1", graph_fetch([], ["178"] + [str(i) for i in range(29)]))
        reused.load_quota()
        self.assertEqual(len(reused.hashtag_posts("old", 5)), 3)

    def test_unknown_quota_is_reported_as_unknown(self):
        def fetch(url):
            raise collect.CollectionError("HTTP 400 with T0KEN inside")

        api = collect.GraphApi("T0KEN", "1", fetch)
        api.load_quota()
        self.assertIn("[redacted]", api.quota_error)
        self.assertNotIn("T0KEN", api.quota_error)
        self.assertIsNone(api.quota()["remaining"])

    def test_edges_page_and_partial_failure_keeps_records(self):
        pages = iter([
            {"data": [{"id": "178"}]},
            {"data": [graph_media("a")], "paging": {"cursors": {"after": "CUR"}}},
            {"data": [graph_media("b")]},
        ])
        urls = []

        def fetch(url):
            urls.append(url)
            try:
                return next(pages)
            except StopIteration:
                raise collect.CollectionError("HTTP 500") from None

        api = collect.GraphApi("T", "1", fetch)
        with self.assertRaises(collect.CollectionError) as caught:
            api.hashtag_posts("x", 5)
        self.assertEqual([record["id"] for record in caught.exception.records], ["a", "b"])
        self.assertIn("recent_media", str(caught.exception))
        self.assertIn("after=CUR", urls[2])

    def test_missing_hashtag_and_empty_results(self):
        with self.assertRaisesRegex(collect.CollectionError, "no hashtag"):
            collect.GraphApi("T", "1", lambda url: {"data": []}).hashtag_posts("x", 5)
        empty = collect.GraphApi("T", "1", lambda url: {"data": [{"id": "9"}]} if "search" in url else {"data": []})
        with self.assertRaisesRegex(collect.CollectionError, "no public media"):
            empty.hashtag_posts("x", 5)
        with self.assertRaisesRegex(collect.CollectionError, "not a hashtag"):
            empty.hashtag_posts("two words", 5)

    def test_profile_posts_use_business_discovery(self):
        urls = []

        def fetch(url):
            urls.append(url)
            return {"business_discovery": {"username": "brand", "media": {"data": [
                graph_media("p1", media_type="VIDEO", media_product_type="REELS", view_count=900), graph_media("p2", media_type="CAROUSEL_ALBUM"),
            ]}}}

        records = collect.GraphApi("T", "1", fetch).profile_posts("https://www.instagram.com/Brand/", 2)
        self.assertEqual([(record["kind"], record["views"], record["owner"]) for record in records], [("reel", 900, "brand"), ("carousel", None, "brand")])
        self.assertIn("business_discovery.username(brand)", urllib.parse.unquote_plus(urls[0]))
        self.assertIn("media.limit(2)", urllib.parse.unquote_plus(urls[0]))

    def test_profile_failures(self):
        def boom(url):
            raise collect.CollectionError("HTTP 400")

        with self.assertRaisesRegex(collect.CollectionError, "Business and Creator"):
            collect.GraphApi("T", "1", boom).profile_posts("brand", 2)
        with self.assertRaisesRegex(collect.CollectionError, "no media"):
            collect.GraphApi("T", "1", lambda url: {}).profile_posts("brand", 2)
        with self.assertRaisesRegex(collect.CollectionError, "not an Instagram username"):
            collect.GraphApi("T", "1", boom).profile_posts("bad name!", 2)

    def test_comments_read_text_and_surface_refusal(self):
        api = collect.GraphApi("T", "1", lambda url: {"data": [{"text": "link?"}, {"id": "no text"}]})
        self.assertEqual(api.comments({"id": "m"}, 5), ["link?"])


class HttpJsonTest(unittest.TestCase):
    def _http_error(self, body):
        return urllib.error.HTTPError("https://x", 400, "Bad", {}, io.BytesIO(body))

    def test_errors_become_actionable_collection_errors(self):
        cases = [
            (self._http_error(b'{"error":{"message":"expired","code":190}}'), "Refresh META_ACCESS_TOKEN"),
            (self._http_error(b'{"error":{"message":"limit","code":4}}'), "rate limit"),
            (self._http_error(b'{"error":{"message":"denied","code":10}}'), "Public Content Access"),
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
    def __init__(self, code, raw=None, typename="GraphImage", likes=5, comments=2, views=None, caption="cap", comment_error=None):
        self.shortcode, self.raw, self.typename, self.likes, self.comments = code, raw or {}, typename, likes, comments
        self.video_view_count, self.video_play_count, self.caption = views, None, caption
        self.date_utc = datetime(2026, 11, 1, 12, 0)
        self.comment_error = comment_error

    def _asdict(self):
        return self.raw

    def get_comments(self):
        if self.comment_error:
            raise self.comment_error
        return [types.SimpleNamespace(text="link?")]


class Unreadable(FakePost):
    @property
    def video_view_count(self):
        raise KeyError("video_view_count")

    @video_view_count.setter
    def video_view_count(self, value):
        pass


def fake_module(hashtag=None, profile=None, hashtag_error=None, profile_error=None):
    class Loader:
        closed = False

        def __init__(self, **options):
            self.options = options
            self.context = "context"

        def close(self):
            Loader.closed = True

    class FakeHashtag:
        @staticmethod
        def from_name(context, name):
            if hashtag_error:
                raise hashtag_error
            return hashtag

    class FakeProfile:
        @staticmethod
        def from_username(context, name):
            if profile_error:
                raise profile_error
            return profile

    class RateController:
        def __init__(self, context=None):
            self.slept = []

        def sleep(self, secs):
            self.slept.append(secs)

    return types.SimpleNamespace(Instaloader=Loader, Hashtag=FakeHashtag, Profile=FakeProfile, RateController=RateController)


def fake_hashtag(top, recent, recent_error=None):
    def resumable():
        yield from recent
        if recent_error:
            raise recent_error

    return types.SimpleNamespace(mediacount=1234, get_top_posts=lambda: iter(top), get_posts_resumable=resumable)


class AnonymousSourceTest(unittest.TestCase):
    def test_loader_is_anonymous_and_downloads_nothing(self):
        source = collect.AnonymousSource(module=fake_module(), pause=lambda secs: None)
        options = source.loader.options
        for key in ("download_pictures", "download_videos", "download_video_thumbnails", "download_comments", "save_metadata"):
            self.assertFalse(options[key])
        source.close()
        self.assertTrue(type(source.loader).closed)

    def test_hashtag_iteration_respects_limit_and_sleeps(self):
        sleeps = []
        top = [FakePost(f"t{i}") for i in range(5)]
        source = collect.AnonymousSource(2.5, fake_module(hashtag=fake_hashtag(top, [FakePost("r1")])), sleeps.append)
        records = source.hashtag_posts("#Glow", 2)
        self.assertEqual([record["id"] for record in records], ["t0", "t1", "r1"])
        self.assertEqual(sleeps, [2.5, 2.5, 2.5])
        self.assertEqual(source.media_counts, {"glow": 1234})
        self.assertEqual(records[0]["published_at"], "2026-11-01T12:00:00+00:00")
        self.assertEqual(records[0]["target"], "#glow")

    def test_post_record_keeps_absent_counts_unknown(self):
        hidden = collect.post_record(FakePost("a", {"code": "a", "like_and_view_counts_disabled": True, "comment_count": 3}, "GraphVideo", likes=0, comments=3, views=10), "#x", "top_media")
        self.assertIsNone(hidden["likes"])
        self.assertIsNone(hidden["views"])
        self.assertEqual(hidden["comments"], 3)
        web = collect.post_record(FakePost("b", {"code": "b", "like_count": None, "comment_count": None, "product_type": "clips", "owner": {"username": "Me"}}, "GraphVideo", likes=0, comments=0, views=40), "#x", "top_media")
        self.assertEqual((web["likes"], web["comments"], web["kind"], web["views"], web["owner"]), (None, None, "reel", 40, "me"))
        by_id = collect.post_record(FakePost("f", {"owner": {"id": 42}}), "#x", "top_media")
        self.assertEqual(by_id["owner"], "42")
        negative = collect.post_record(FakePost("c", likes=-1, comments=-1), "#x", "top_media")
        self.assertEqual((negative["likes"], negative["comments"]), (None, None))
        iphone = collect.post_record(FakePost("d", {"comments": None, "iphone_struct": {"product_type": "clips"}}, "GraphVideo"), "#x", "top_media")
        self.assertEqual((iphone["comments"], iphone["kind"]), (None, "reel"))
        unreadable = collect.post_record(Unreadable("e", typename="GraphVideo"), "#x", "top_media")
        self.assertIsNone(unreadable["views"])

    def test_failures_become_collection_errors_and_keep_partial_posts(self):
        source = collect.AnonymousSource(module=fake_module(hashtag_error=ValueError("401 login required")), pause=lambda secs: None)
        with self.assertRaisesRegex(collect.CollectionError, "never logs in"):
            source.hashtag_posts("x", 2)
        broken = collect.AnonymousSource(module=fake_module(hashtag=fake_hashtag([FakePost("t")], [FakePost("r")], ValueError("boom"))), pause=lambda secs: None)
        with self.assertRaises(collect.CollectionError) as caught:
            broken.hashtag_posts("x", 5)
        self.assertEqual([record["id"] for record in caught.exception.records], ["t", "r"])
        self.assertIn("boom", str(caught.exception))
        empty = collect.AnonymousSource(module=fake_module(hashtag=fake_hashtag([], [])), pause=lambda secs: None)
        with self.assertRaisesRegex(collect.CollectionError, "no public posts"):
            empty.hashtag_posts("x", 5)

    def test_rate_limit_stops_the_remaining_targets(self):
        def limited():
            raise collect.CollectionError("Instagram rate limit: wait")
            yield

        hashtag = types.SimpleNamespace(mediacount=1, get_top_posts=limited, get_posts_resumable=lambda: iter([FakePost("never")]))
        source = collect.AnonymousSource(module=fake_module(hashtag=hashtag), pause=lambda secs: None)
        with self.assertRaises(collect.CollectionError) as caught:
            source.hashtag_posts("x", 5)
        self.assertEqual(caught.exception.records, [])
        with self.assertRaisesRegex(collect.CollectionError, "skipped after rate limit"):
            source.hashtag_posts("y", 5)
        with self.assertRaisesRegex(collect.CollectionError, "skipped after rate limit"):
            source.profile_posts("y", 5)

    def test_rate_controller_fails_fast_on_long_waits(self):
        source = collect.AnonymousSource(module=fake_module(), pause=lambda secs: None)
        controller = source.loader.options["rate_controller"]()
        controller.sleep(5)
        self.assertEqual(controller.slept, [5])
        with self.assertRaisesRegex(collect.CollectionError, "rate limit"):
            controller.sleep(1800)

    def test_profile_posts_and_private_profile(self):
        profile = types.SimpleNamespace(is_private=False, get_posts=lambda: iter([FakePost("p")]))
        records = collect.AnonymousSource(module=fake_module(profile=profile), pause=lambda secs: None).profile_posts("@Brand", 3)
        self.assertEqual((records[0]["owner"], records[0]["target"], records[0]["edge"]), ("brand", "@brand", "profile"))
        locked = types.SimpleNamespace(is_private=True, get_posts=lambda: iter([]))
        with self.assertRaisesRegex(collect.CollectionError, "private"):
            collect.AnonymousSource(module=fake_module(profile=locked), pause=lambda secs: None).profile_posts("x", 3)
        missing = collect.AnonymousSource(module=fake_module(profile_error=KeyError("gone")), pause=lambda secs: None)
        with self.assertRaises(collect.CollectionError):
            missing.profile_posts("x", 3)
        empty = types.SimpleNamespace(is_private=False, get_posts=lambda: iter([]))
        with self.assertRaisesRegex(collect.CollectionError, "no public posts"):
            collect.AnonymousSource(module=fake_module(profile=empty), pause=lambda secs: None).profile_posts("x", 3)

    def test_comments_refused_without_login(self):
        hashtag = fake_hashtag([FakePost("t", comment_error=ValueError("Login required to access comments")), FakePost("u")], [])
        source = collect.AnonymousSource(module=fake_module(hashtag=hashtag), pause=lambda secs: None)
        records = source.hashtag_posts("x", 5)
        with self.assertRaisesRegex(collect.CollectionError, "refused anonymous access"):
            source.comments(records[0], 5)
        self.assertEqual(source.comments(records[1], 5), ["link?"])

    def test_missing_instaloader_is_actionable(self):
        with mock.patch.dict(sys.modules, {"instaloader": None}):
            with self.assertRaisesRegex(collect.CollectionError, "instaloader==4.16"):
                collect.AnonymousSource()


class EndToEndTest(unittest.TestCase):
    def _run(self, argv, opener, env=None):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            status = instagram_selection.main(argv, opener, env or {})
        return status, stdout.getvalue(), stderr.getvalue()

    def test_main_writes_html_and_xlsx_from_the_graph_api(self):
        def fetch(url):
            if "recently_searched_hashtags" in url:
                return {"data": [{"id": "old"}]}
            if "ig_hashtag_search" in url:
                return {"data": [{"id": "178"}]}
            if "/comments" in url:
                raise collect.CollectionError("HTTP 400: not your media")
            if "recent_media" in url:
                return {"data": []}
            return {"data": [
                graph_media(f"m{i}", caption=f"<b>led face mask</b> pick {i} #Glow", timestamp="2026-11-01T00:00:00+0000")
                for i in range(4)
            ] + [graph_media("v1", caption="<script>x</script> reel", media_type="VIDEO")]}

        def opener(args, env):
            source = collect.GraphApi(env["META_ACCESS_TOKEN"], env["IG_USER_ID"], fetch)
            source.load_quota()
            return source, []

        with tempfile.TemporaryDirectory() as out:
            status, stdout, stderr = self._run(
                ["--hashtag", "#skincare", "--brand", "<Acme>", "--product", "<i>rare</i>", "--limit", "5", "--out", out],
                opener, {"META_ACCESS_TOKEN": "T", "IG_USER_ID": "1"},
            )
            self.assertEqual(status, 0, stderr)
            files = sorted(os.listdir(out))
            self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
            self.assertTrue(files[0].startswith("instagram-selection-"))
            self.assertEqual(stdout.split(), [os.path.join(out, name) for name in files])
            with open(os.path.join(out, files[0]), encoding="utf-8") as handle:
                page = handle.read()
            self.assertIn("&lt;script&gt;x&lt;/script&gt;", page)
            self.assertNotIn("<script>", page)
            self.assertIn("&lt;Acme&gt;", page)
            self.assertIn("led face mask", page)
            self.assertIn("<svg", page)
            self.assertIn("不估算销量或 GMV", page)
            self.assertIn("Hashtag quota: 2/30", page)
            self.assertIn("方法与口径 Method", page)
            self.assertIn("数据缺口 Data gaps", page)
            self.assertIn("Cross-platform validation is out of scope", page)
            self.assertIn("not your media", page)
            with zipfile.ZipFile(os.path.join(out, files[1])) as book:
                sheets = book.read("xl/workbook.xml").decode()
                strings = book.read("xl/sharedStrings.xml").decode()
            for name in ["products", "posts", "search_interest", "cost_assumptions", "hashtags", "brands", "run"]:
                self.assertIn(f'name="{name}"', sheets)
            for key in ["hashtag_quota_used_before", "hashtag_quota_used_after", "hashtag_quota_remaining", "demand heat only; no GMV"]:
                self.assertIn(key, strings)

    def test_main_keyless_run_records_the_missing_keys(self):
        refused = ValueError("Login required to access comments")
        hashtag = fake_hashtag([FakePost("t1", caption="desk lamp a", comment_error=refused), FakePost("t2", caption="desk lamp b", comment_error=refused)], [])
        module = fake_module(hashtag=hashtag)

        class Source(collect.AnonymousSource):
            def __init__(self, sleep_seconds):
                super().__init__(sleep_seconds, module, lambda secs: None)

        with mock.patch.object(instagram_selection, "AnonymousSource", Source), tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--hashtag", "x", "--limit", "80", "--out", out], instagram_selection.open_source, {"IG_USER_ID": "1"})
            self.assertEqual(status, 0, stderr)
            self.assertIn("Missing META_ACCESS_TOKEN", stderr)
            self.assertIn("--limit capped at 50", stderr)
            self.assertIn("Comments unavailable", stderr)

    def test_keyless_runs_default_to_a_low_limit(self):
        limits = []

        class Source:
            media_counts: dict = {}
            calls = None

            def hashtag_posts(self, name, limit, edges):
                limits.append(limit)
                raise collect.CollectionError("offline")

            def close(self):
                pass

        with tempfile.TemporaryDirectory() as out:
            self._run(["--hashtag", "x", "--out", out], lambda args, env: (Source(), []))
        self.assertEqual(limits, [instagram_selection.KEYLESS_DEFAULT_LIMIT])

    def test_main_reports_gaps_and_fails_without_posts(self):
        class Source:
            media_counts: dict = {}
            calls = None

            def hashtag_posts(self, name, limit, edges):
                raise collect.CollectionError("offline")

            def close(self):
                self.closed = True

        source = Source()
        with tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--hashtag", "x", "--out", out], lambda args, env: (source, ["keyless"]))
            self.assertEqual(status, 2)
            self.assertIn("hashtag “x”: offline", stderr)
            self.assertEqual(os.listdir(out), [])
        self.assertTrue(source.closed)

    def test_main_explains_a_missing_keyless_dependency(self):
        def unavailable(sleep):
            raise collect.CollectionError("instaloader is not installed")

        with mock.patch.object(instagram_selection, "AnonymousSource", unavailable), tempfile.TemporaryDirectory() as out:
            status, _, stderr = self._run(["--hashtag", "x", "--out", out], instagram_selection.open_source, {})
        self.assertEqual(status, 2)
        self.assertIn("Missing META_ACCESS_TOKEN and IG_USER_ID", stderr)
        self.assertIn("not installed", stderr)

    def test_open_source_prefers_the_official_api_and_records_unknown_quota(self):
        def refused(url):
            raise collect.CollectionError("HTTP 400")

        class Api(collect.GraphApi):
            def __init__(self, token, user_id, version):
                super().__init__(token, user_id, refused, version)

        args = types.SimpleNamespace(graph_version="v26.0", sleep=3.0)
        with mock.patch.object(instagram_selection, "GraphApi", Api):
            source, gaps = instagram_selection.open_source(args, {"META_ACCESS_TOKEN": "T", "IG_USER_ID": "1"})
        self.assertIsInstance(source, collect.GraphApi)
        self.assertIn("quota usage unknown", gaps[0])

    def test_arguments_are_validated(self):
        for argv in ([], ["--hashtag", "x", "--limit", "0"], ["--hashtag", "x", "--sleep", "0"]):
            with self.assertRaises(SystemExit):
                with contextlib.redirect_stderr(io.StringIO()):
                    instagram_selection.main(argv, lambda args, env: None, {})


if __name__ == "__main__":
    unittest.main()
