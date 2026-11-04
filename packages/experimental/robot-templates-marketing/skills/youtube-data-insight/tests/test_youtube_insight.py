"""Offline tests for the YouTube insight skill: metrics, both collectors, and both report files."""

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
import youtube_insight  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)


def video(video_id: str, channel: str, views, likes=10, comments=2, published="2026-11-03T00:00:00Z", description=""):
    return {
        "id": video_id, "title": f"title {video_id}", "channel_id": channel, "channel_title": channel,
        "published_at": published, "duration_seconds": 60, "views": views, "likes": likes, "comments": comments,
        "description": description, "url": f"https://www.youtube.com/watch?v={video_id}", "source": "fixture",
    }


class MetricsTest(unittest.TestCase):
    def test_engagement_rate(self):
        self.assertAlmostEqual(metrics.engagement_rate(video("a", "c", 100, 8, 2)), 0.1)
        self.assertIsNone(metrics.engagement_rate(video("a", "c", 0)))
        self.assertIsNone(metrics.engagement_rate(video("a", "c", 100, None, None)))
        self.assertAlmostEqual(metrics.engagement_rate(video("a", "c", 100, None, 5)), 0.05)

    def test_views_per_hour_handles_iso_and_compact_dates(self):
        self.assertAlmostEqual(metrics.views_per_hour(video("a", "c", 2400), NOW), 100.0)
        self.assertAlmostEqual(metrics.views_per_hour(video("a", "c", 2400, published="20261103"), NOW), 100.0)
        self.assertIsNone(metrics.views_per_hour(video("a", "c", 2400, published=None), NOW))
        self.assertAlmostEqual(metrics.views_per_hour(video("a", "c", 10, published="2026-11-04T00:00:00Z"), NOW), 10.0)

    def test_outlier_uses_channel_median(self):
        videos = [video("a", "c", 100), video("b", "c", 100), video("d", "c", 1000), video("e", "other", 50)]
        baselines = metrics.channel_baselines(videos)
        self.assertEqual(baselines, {"c": 100, "other": 50})
        self.assertAlmostEqual(metrics.outlier_score(videos[2], baselines), 10.0)
        self.assertIsNone(metrics.outlier_score(video("x", "unknown", 5), baselines))

    def test_baseline_window_keeps_newest(self):
        videos = [video(str(i), "c", 10 if i < 3 else 1000, published=f"2026-10-{10 + i:02d}T00:00:00Z") for i in range(6)]
        self.assertEqual(metrics.channel_baselines(videos, window=3), {"c": 1000})

    def test_affiliate_links(self):
        description = (
            "Desk: https://amzn.to/3abc. Chair (https://www.amazon.co.uk/dp/B01?tag=creator-21)\n"
            "My site https://example.com/about and https://geni.us/xyz!"
        )
        links = metrics.affiliate_links({"description": description})
        self.assertEqual([link["network"] for link in links], ["Amazon", "Amazon", "Geniuslink"])
        self.assertEqual(links[0]["url"], "https://amzn.to/3abc")
        self.assertEqual(links[1]["affiliate_tag"], "creator-21")
        self.assertEqual(metrics.affiliate_links({"description": None}), [])

    def test_network_summary_counts_videos_once(self):
        rows = metrics.enrich([
            video("a", "c", 10, description="https://amzn.to/1 https://amzn.to/2"),
            video("b", "c", 10, description="https://amzn.to/3 https://geni.us/4"),
        ], NOW)
        self.assertEqual(metrics.network_summary(rows), [["Amazon", 2, 3], ["Geniuslink", 1, 1]])


class DataApiTest(unittest.TestCase):
    def test_search_then_videos_counts_units_and_maps_fields(self):
        calls = []

        def fetch(url):
            calls.append(url)
            if "/search?" in url:
                return {"items": [{"id": {"videoId": "v1"}}, {"id": {"videoId": "v2"}}]}
            return {"items": [{
                "id": "v1",
                "snippet": {"title": "T", "channelId": "UC1", "channelTitle": "Chan", "publishedAt": "2026-11-01T00:00:00Z", "description": "d"},
                "statistics": {"viewCount": "1000", "likeCount": "50", "commentCount": "5"},
                "contentDetails": {"duration": "PT1H2M3S"},
            }]}

        api = collect.DataApi("KEY", fetch)
        records = api.videos(api.search("desk", 2, order="viewCount", region="US"))
        self.assertEqual(api.units, 101)
        self.assertIn("regionCode=US", calls[0])
        self.assertIn("order=viewCount", calls[0])
        self.assertEqual(records, [{
            "id": "v1", "title": "T", "channel_id": "UC1", "channel_title": "Chan", "published_at": "2026-11-01T00:00:00Z",
            "duration_seconds": 3723, "views": 1000, "likes": 50, "comments": 5, "description": "d",
            "url": "https://www.youtube.com/watch?v=v1", "source": "youtube-data-api",
        }])

    def test_channel_uploads_by_handle_and_missing_channel(self):
        def fetch(url):
            if "/channels?" in url:
                return {"items": [{"contentDetails": {"relatedPlaylists": {"uploads": "UU1"}}}]} if "forHandle" in url else {"items": []}
            return {"items": [{"contentDetails": {"videoId": "v9"}}]}

        api = collect.DataApi("KEY", fetch)
        self.assertEqual(api.channel_uploads("@brand", 5), ["v9"])
        with self.assertRaises(collect.CollectionError):
            api.channel_uploads("UCmissing", 5)

    def test_search_follows_pages(self):
        pages = iter([
            {"items": [{"id": {"videoId": "a"}}], "nextPageToken": "p2"},
            {"items": [{"id": {"videoId": "b"}}]},
        ])
        api = collect.DataApi("KEY", lambda url: next(pages))
        self.assertEqual(api.search("q", 10), ["a", "b"])
        self.assertEqual(api.units, 200)


class YtDlpTest(unittest.TestCase):
    def test_flat_listing_maps_entries_and_keeps_missing_counts(self):
        info = {"entries": [
            {"id": "x1", "title": "X", "channel_id": "UC2", "channel": "C", "view_count": 300, "duration": 61.0, "url": "https://www.youtube.com/watch?v=x1"},
            {"id": "x2", "title": "Y", "uploader": "U", "timestamp": 1_762_000_000, "url": "x2"},
            None,
        ]}
        records = collect.ytdlp_list("ytsearch2:q", 5, extract=lambda url: info)
        self.assertEqual([record["id"] for record in records], ["x1", "x2"])
        self.assertEqual(records[0]["views"], 300)
        self.assertIsNone(records[0]["likes"])
        self.assertEqual(records[1]["channel_title"], "U")
        self.assertTrue(records[1]["published_at"].startswith("2025-11-01"))
        self.assertEqual(records[1]["url"], "https://www.youtube.com/watch?v=x2")

    def test_failures_become_collection_errors(self):
        def boom(url):
            raise ValueError("blocked")

        with self.assertRaisesRegex(collect.CollectionError, "blocked"):
            collect.ytdlp_list("u", 1, extract=boom)
        with self.assertRaises(collect.CollectionError):
            collect.ytdlp_list("u", 1, extract=lambda url: None)
        with self.assertRaisesRegex(collect.CollectionError, "no videos"):
            collect.ytdlp_list("u", 1, extract=lambda url: {"entries": [None, {"title": "no id"}]})


class EndToEndTest(unittest.TestCase):
    def test_main_writes_html_and_xlsx_from_the_api(self):
        def fetch(url):
            if "/search?" in url:
                return {"items": [{"id": {"videoId": f"v{i}"}} for i in range(4)]}
            ids = url.split("id=")[1].split("&")[0].split("%2C")
            return {"items": [{
                "id": video_id,
                "snippet": {"title": f"<b>{video_id}</b>", "channelId": "UC1", "channelTitle": "Chan",
                            "publishedAt": "2026-11-01T00:00:00Z", "description": "buy https://amzn.to/x?tag=t-20"},
                "statistics": {"viewCount": str(100 if video_id != "v3" else 5000), "likeCount": "5", "commentCount": "1"},
                "contentDetails": {"duration": "PT5M"},
            } for video_id in ids]}

        original = collect.DataApi.__init__
        collect.DataApi.__init__ = lambda self, key, fetch_=None: original(self, key, fetch)
        try:
            with tempfile.TemporaryDirectory() as out:
                with contextlib.redirect_stdout(io.StringIO()):
                    status = youtube_insight.main(["--search", "desk", "--limit", "4", "--api-key", "K", "--out", out])
                self.assertEqual(status, 0)
                files = sorted(os.listdir(out))
                self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
                with open(os.path.join(out, files[0]), encoding="utf-8") as handle:
                    page = handle.read()
                self.assertIn("&lt;b&gt;v3&lt;/b&gt;", page)
                self.assertNotIn("<b>v3</b>", page)
                self.assertIn("Amazon", page)
                self.assertIn("API units: 101", page)
                with zipfile.ZipFile(os.path.join(out, files[1])) as book:
                    sheets = book.read("xl/workbook.xml").decode()
                for name in ["videos", "affiliate_links", "networks", "run"]:
                    self.assertIn(f'name="{name}"', sheets)
        finally:
            collect.DataApi.__init__ = original

    def test_main_reports_gaps_and_fails_without_videos(self):
        original = youtube_insight.ytdlp_list
        youtube_insight.ytdlp_list = lambda target, limit: (_ for _ in ()).throw(collect.CollectionError("offline"))
        try:
            with tempfile.TemporaryDirectory() as out:
                os.environ.pop("YOUTUBE_API_KEY", None)
                stderr = io.StringIO()
                with contextlib.redirect_stderr(stderr):
                    self.assertEqual(youtube_insight.main(["--channel", "@x", "--out", out]), 2)
                self.assertIn("channel @x: offline", stderr.getvalue())
                self.assertEqual(os.listdir(out), [])
        finally:
            youtube_insight.ytdlp_list = original


if __name__ == "__main__":
    unittest.main()
