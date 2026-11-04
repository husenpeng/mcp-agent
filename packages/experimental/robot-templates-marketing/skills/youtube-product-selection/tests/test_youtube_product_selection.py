"""Offline tests for the YouTube product-selection skill: metrics, both collectors, and both report files."""

from __future__ import annotations

import contextlib
import io
import os
import sys
import tempfile
import unittest
import zipfile
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))

import collect  # noqa: E402
import metrics  # noqa: E402
import youtube_product_selection as cli  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)


def video(video_id, channel, views, title="t", likes=10, comments=2, published="2026-11-03T00:00:00Z", description=""):
    return {
        "id": video_id, "title": title, "channel_id": channel, "channel_title": channel, "published_at": published,
        "duration_seconds": 60, "views": views, "likes": likes, "comments": comments, "description": description,
        "url": f"https://www.youtube.com/watch?v={video_id}", "source": "fixture",
    }


class IntentTest(unittest.TestCase):
    def test_english_and_chinese_intents(self):
        self.assertEqual(metrics.classify_intents("Where can I buy this? Link please"), ["link_request", "where_to_buy"])
        self.assertEqual(metrics.classify_intents("How much is it? $199 seems a lot"), ["price"])
        self.assertEqual(metrics.classify_intents("Is it better than the XM5?"), ["comparison"])
        self.assertEqual(metrics.classify_intents("Mine broke after a week, want a refund"), ["complaint"])
        self.assertEqual(metrics.classify_intents("I wish it came in white"), ["feature_request"])
        self.assertEqual(metrics.classify_intents("求链接！多少钱？哪里买"), ["link_request", "price", "where_to_buy"])
        self.assertEqual(metrics.classify_intents("和索尼对比哪个好？希望有白色"), ["comparison", "feature_request"])
        self.assertEqual(metrics.classify_intents("great video"), [])
        self.assertEqual(metrics.classify_intents(None), [])

    def test_lexicon_covers_research_categories(self):
        self.assertEqual(list(metrics.INTENT_LABELS.values()), ["求链接", "问价格", "问在哪买", "竞品比较", "抱怨", "想要功能"])

    def test_demand_uses_like_weight(self):
        self.assertEqual(metrics.like_weight(None), 1.0)
        self.assertEqual(metrics.like_weight(0), 1.0)
        self.assertAlmostEqual(metrics.like_weight(99), 3.0)
        rows = metrics.classify_comments([{"video_id": "a", "text": "link? price?", "likes": 9}])
        self.assertAlmostEqual(rows[0]["demand"], 4.0)


class PhraseTest(unittest.TestCase):
    def test_tokens_drop_noise_and_keep_models(self):
        self.assertEqual(metrics.tokens("Sony WH-1000XM6 Review: Best Headphones 2026?", ["headphones"]), [["sony", "wh-1000xm6"]])
        self.assertEqual(metrics.tokens("【开箱】索尼 WH-1000XM6 测评"), [["索尼", "wh-1000xm6"]])
        self.assertEqual(metrics.tokens("Best headphones under $300", ["headphones"]), [])

    def test_product_phrases_split_vs_and_prefer_shared_ngrams(self):
        videos = [
            {"id": "1", "title": "Sony WH-1000XM6 Review"},
            {"id": "2", "title": "Sony WH-1000XM6 vs Bose QuietComfort Ultra"},
            {"id": "3", "title": "Bose QuietComfort Ultra - 6 months later"},
            {"id": "4", "title": "AirPods Pro 3 unboxing!"},
        ]
        self.assertEqual(metrics.product_phrases(videos, ["noise cancelling headphones"]), {
            "1": ["sony wh-1000xm6"], "2": ["sony wh-1000xm6", "bose quietcomfort ultra"],
            "3": ["bose quietcomfort ultra"], "4": ["airpods pro 3"],
        })


class VideoMetricsTest(unittest.TestCase):
    def test_engagement_vph_and_missing_counts(self):
        self.assertAlmostEqual(metrics.engagement_rate(video("a", "c", 100, likes=8, comments=2)), 0.1)
        self.assertIsNone(metrics.engagement_rate(video("a", "c", 100, likes=None, comments=None)))
        self.assertAlmostEqual(metrics.views_per_hour(video("a", "c", 2400, published="20261103"), NOW), 100.0)
        self.assertIsNone(metrics.views_per_hour(video("a", "c", None), NOW))

    def test_outlier_with_baseline_videos(self):
        baseline = [video(f"b{i}", "c", 100, published=f"2026-10-{10 + i:02d}T00:00:00Z") for i in range(5)]
        rows = metrics.enrich([video("x", "c", 1000), video("y", "d", 50)], NOW, baseline)
        self.assertAlmostEqual(rows[0]["outlier_score"], 1000 / 100)
        self.assertAlmostEqual(rows[1]["outlier_score"], 1.0)
        self.assertIsNone(metrics.outlier_score(video("z", "c", None), {"c": 100}))

    def test_affiliate_links_by_network(self):
        rows = metrics.enrich([
            video("a", "c", 10, description="https://amzn.to/1 and https://www.amazon.de/dp/X?tag=me-21."),
            video("b", "c", 10, description="https://geni.us/2 https://example.com"),
        ], NOW)
        self.assertEqual(rows[0]["affiliate_links"][1]["affiliate_tag"], "me-21")
        self.assertEqual(metrics.network_summary(rows), [["Amazon", 1, 2], ["Geniuslink", 1, 1]])


class ClusterTest(unittest.TestCase):
    def test_clusters_score_and_status(self):
        rows = metrics.enrich([
            video("1", "c1", 5000, title="Alpha Desk Pro review", description="https://amzn.to/a"),
            video("2", "c2", 100, title="Alpha Desk Pro vs Beta Desk", published="2025-11-03T00:00:00Z"),
            video("3", "c3", 10, title="Beta Desk unboxing", published="2025-11-03T00:00:00Z"),
            video("4", "c4", 10, title="Gamma Lamp review", published="2025-11-03T00:00:00Z"),
            video("5", "c5", 2000, title="Omega Chair review"),
        ], NOW, [video(f"b{i}", "c1", 100) for i in range(3)])
        comments = metrics.classify_comments([
            {"video_id": "1", "text": "link please", "likes": 9},
            {"video_id": "3", "text": "price?", "likes": None},
            {"video_id": "4", "text": "nice", "likes": 3},
        ])
        phrases = metrics.product_phrases(rows, ["desk"])
        clusters = {row["product"]: row for row in metrics.product_clusters(rows, comments, phrases)}
        self.assertEqual(set(clusters), {"alpha pro", "beta", "gamma lamp", "omega chair"})
        alpha = clusters["alpha pro"]
        self.assertEqual((alpha["videos"], alpha["breakouts"], alpha["status"]), (2, 1, "validated"))
        self.assertAlmostEqual(alpha["affiliate_coverage"], 0.5)
        self.assertEqual(clusters["beta"]["status"], "watch")
        self.assertEqual(clusters["gamma lamp"]["status"], "rejected")
        self.assertEqual(clusters["omega chair"]["status"], "watch")
        self.assertIsNone(clusters["omega chair"]["demand_score"])
        self.assertEqual(clusters["gamma lamp"]["demand_score"], 0)
        first = metrics.product_clusters(rows, comments, phrases)[0]
        self.assertEqual(first["product"], "alpha pro")
        self.assertEqual(first["opportunity_score"], 100.0)

    def test_missing_comments_keep_demand_none(self):
        rows = metrics.enrich([video("1", "c", 10, title="Delta Fan review")], NOW)
        clusters = metrics.product_clusters(rows, [], metrics.product_phrases(rows))
        self.assertIsNone(clusters[0]["demand_score"])

    def test_percentile_ranks(self):
        self.assertEqual(metrics.percentile_ranks([None, 1, 3, 2]), [0.0, 0.0, 1.0, 0.5])
        self.assertEqual(metrics.percentile_ranks([5]), [1.0])


class DataApiTest(unittest.TestCase):
    def test_search_videos_comments_and_units(self):
        calls = []

        def fetch(url):
            calls.append(url)
            if "/search?" in url:
                return {"items": [{"id": {"videoId": "v1"}}]}
            if "/commentThreads?" in url:
                return {"items": [{"id": "c1", "snippet": {"topLevelComment": {"snippet": {
                    "textOriginal": "link?", "likeCount": 4, "publishedAt": "2026-11-02T00:00:00Z"}}}}]}
            return {"items": [{
                "id": "v1",
                "snippet": {"title": "T", "channelId": "UC1", "channelTitle": "C", "publishedAt": "2026-11-01T00:00:00Z", "description": "d"},
                "statistics": {"viewCount": "1000", "likeCount": "50"},
                "contentDetails": {"duration": "PT2M"},
            }]}

        api = collect.DataApi("KEY", fetch)
        records = api.videos(api.search("desk review", 5, region="US"))
        found = api.comments("v1", 20)
        self.assertEqual(api.units, 102)
        self.assertIn("regionCode=US", calls[0])
        self.assertIn("order=relevance", calls[2])
        self.assertIsNone(records[0]["comments"])
        self.assertEqual(records[0]["duration_seconds"], 120)
        self.assertEqual(found, [{"video_id": "v1", "id": "c1", "text": "link?", "likes": 4,
                                  "published_at": "2026-11-02T00:00:00Z", "source": "youtube-data-api"}])

    def test_channel_uploads_and_missing_channel(self):
        def fetch(url):
            if "/channels?" in url:
                return {"items": [{"contentDetails": {"relatedPlaylists": {"uploads": "UU1"}}}]} if "UC1" in url else {"items": []}
            return {"items": [{"contentDetails": {"videoId": "u1"}}]}

        api = collect.DataApi("KEY", fetch)
        self.assertEqual(api.channel_uploads("UC1", 30), ["u1"])
        with self.assertRaises(collect.CollectionError):
            api.channel_uploads("UC2", 30)

    def test_comment_pages(self):
        pages = iter([
            {"items": [{"id": "a", "snippet": {"topLevelComment": {"snippet": {"textDisplay": "x"}}}}], "nextPageToken": "p"},
            {"items": [{"id": "b", "snippet": {"topLevelComment": {"snippet": {"textDisplay": "y"}}}}]},
        ])
        api = collect.DataApi("KEY", lambda url: next(pages))
        self.assertEqual([comment["id"] for comment in api.comments("v", 150)], ["a", "b"])
        self.assertEqual(api.units, 2)


class YtDlpTest(unittest.TestCase):
    def test_list_and_comments(self):
        info = {"entries": [{"id": "x1", "title": "X", "channel_id": "UC2", "view_count": 300, "url": "x1"}, None]}
        records = collect.ytdlp_list("u", 5, extract=lambda url: info)
        self.assertEqual(records[0]["url"], "https://www.youtube.com/watch?v=x1")
        self.assertIsNone(records[0]["likes"])
        comment_info = {"comments": [
            {"id": "c1", "text": "where to buy", "like_count": 3, "timestamp": 1_762_000_000, "parent": "root"},
            {"id": "c2", "text": "reply", "parent": "c1"},
            {"id": "c3", "text": "no likes"},
        ]}
        found = collect.ytdlp_comments("x1", 10, extract=lambda url: comment_info)
        self.assertEqual([comment["id"] for comment in found], ["c1", "c3"])
        self.assertIsNone(found[1]["likes"])

    def test_failures_become_collection_errors(self):
        def boom(url):
            raise ValueError("bot check")

        with self.assertRaisesRegex(collect.CollectionError, "bot check"):
            collect.ytdlp_list("u", 1, extract=boom)
        with self.assertRaisesRegex(collect.CollectionError, "no videos"):
            collect.ytdlp_list("u", 1, extract=lambda url: {"entries": []})
        with self.assertRaisesRegex(collect.CollectionError, "bot check"):
            collect.ytdlp_comments("v", 1, extract=boom)
        with self.assertRaisesRegex(collect.CollectionError, "YOUTUBE_API_KEY"):
            collect.ytdlp_comments("v", 1, extract=lambda url: {"id": "v"})


class CliHelpersTest(unittest.TestCase):
    def test_expand_queries_and_assumptions(self):
        self.assertEqual(cli.expand_queries(["desk"], ["desk vs", "x"]), ["desk review", "desk unboxing", "desk vs", "best desk", "x"])
        self.assertEqual(cli.parse_assumptions(["unit cost=12.5 USD"]), [{"assumption": "unit cost", "value": 12.5, "unit": "USD", "source": "run instruction"}])
        self.assertTrue(all(row["value"] is None for row in cli.parse_assumptions([])))
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            cli.parse_assumptions(["unit cost=cheap"])


class EndToEndTest(unittest.TestCase):
    def test_main_writes_html_and_xlsx_from_the_api(self):
        def fetch(url):
            if "/search?" in url:
                return {"items": [{"id": {"videoId": f"v{i}"}} for i in range(4)]}
            if "/channels?" in url:
                return {"items": [{"contentDetails": {"relatedPlaylists": {"uploads": "UU1"}}}]}
            if "/playlistItems?" in url:
                return {"items": [{"contentDetails": {"videoId": f"v{i}"}} for i in range(4)]}
            if "/commentThreads?" in url:
                return {"items": [{"id": "c", "snippet": {"topLevelComment": {"snippet": {"textOriginal": "<i>link</i> please", "likeCount": 2}}}}]}
            ids = url.split("id=")[1].split("&")[0].split("%2C")
            return {"items": [{
                "id": video_id,
                "snippet": {"title": f"<b>Zeta</b> Desk {video_id} review", "channelId": "UC1", "channelTitle": "Chan",
                            "publishedAt": "2026-11-01T00:00:00Z", "description": "buy https://amzn.to/x?tag=t-20"},
                "statistics": {"viewCount": str(5000 if video_id == "v3" else 100), "likeCount": "5", "commentCount": "1"},
                "contentDetails": {"duration": "PT5M"},
            } for video_id in ids]}

        original = collect.DataApi.__init__
        collect.DataApi.__init__ = lambda self, key, fetch_=None: original(self, key, fetch)
        try:
            with tempfile.TemporaryDirectory() as out:
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    status = cli.main(["--category", "desk", "--limit", "4", "--api-key", "K", "--comments", "5",
                                       "--assumption", "unit cost=40 USD", "--out", out])
                self.assertEqual(status, 0)
                files = sorted(os.listdir(out))
                self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
                with open(os.path.join(out, files[0]), encoding="utf-8") as handle:
                    page = handle.read()
                self.assertIn("&lt;i&gt;link&lt;/i&gt;", page)
                self.assertNotIn("<i>link</i>", page)
                self.assertIn("&lt;b&gt;Zeta&lt;/b&gt;", page)
                self.assertIn("zeta", page)
                self.assertIn("Amazon", page)
                self.assertIn("方法与口径 Method", page)
                self.assertIn("数据缺口 Data gaps", page)
                self.assertIn("<svg", page)
                with zipfile.ZipFile(os.path.join(out, files[1])) as book:
                    sheets = book.read("xl/workbook.xml").decode()
                for name in ["products", "videos", "comments", "affiliate_links", "search_interest", "cost_assumptions", "run"]:
                    self.assertIn(f'name="{name}"', sheets)
        finally:
            collect.DataApi.__init__ = original

    def test_main_reports_gaps_and_fails_without_videos(self):
        original = cli.ytdlp_list
        cli.ytdlp_list = lambda target, limit: (_ for _ in ()).throw(collect.CollectionError("offline"))
        saved = os.environ.pop("YOUTUBE_API_KEY", None)
        try:
            with tempfile.TemporaryDirectory() as out:
                stderr = io.StringIO()
                with contextlib.redirect_stderr(stderr), contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(cli.main(["--search", "desk review", "--out", out]), 2)
                self.assertIn("search “desk review”: offline", stderr.getvalue())
                self.assertIn("YOUTUBE_API_KEY", stderr.getvalue())
                self.assertEqual(os.listdir(out), [])
        finally:
            cli.ytdlp_list = original
            if saved is not None:
                os.environ["YOUTUBE_API_KEY"] = saved


if __name__ == "__main__":
    unittest.main()
