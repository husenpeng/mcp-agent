"""Offline tests for the influencer-marketing skill: metrics, every collector, contacts, and both report files."""

from __future__ import annotations

import contextlib
import io
import os
import sys
import tempfile
import unittest
import zipfile
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))

import collect  # noqa: E402
import influencer_marketing  # noqa: E402
import metrics  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)


def post(post_id, likes=100, comments=5, views=1000, days_ago=1):
    published = None if days_ago is None else (NOW - timedelta(days=days_ago)).isoformat()
    return collect.post_record("youtube", post_id, title=f"t {post_id}", published_at=published, views=views, likes=likes, comments=comments)


def creator(handle, followers, posts, platform="youtube", bio="", discovered_by="csv", name=None):
    record = collect.creator_record(platform, handle, followers=followers, bio=bio, name=name or handle, discovered_by=discovered_by, source="fixture")
    record["posts"] = posts
    return record


class EngagementTest(unittest.TestCase):
    def test_modash_rate_uses_median_likes_and_keeps_none(self):
        posts = [post("a", likes=10), post("b", likes=30), post("c", likes=1000)]
        self.assertAlmostEqual(metrics.modash_engagement_rate(1000, posts), 3.0)
        self.assertIsNone(metrics.modash_engagement_rate(None, posts))
        self.assertIsNone(metrics.modash_engagement_rate(1000, [post("a", likes=None)]))

    def test_window_keeps_last_60_days_or_all_undated(self):
        posts = [post("new", days_ago=5), post("old", days_ago=90)]
        kept, label = metrics.window_posts(posts, NOW)
        self.assertEqual([item["id"] for item in kept], ["new"])
        self.assertEqual(label, "last 60 days")
        undated = [post("x", days_ago=None)]
        self.assertEqual(metrics.window_posts(undated, NOW), (undated, "sample (dates missing)"))

    def test_tiers_and_bands_follow_modash_table(self):
        self.assertIsNone(metrics.tier_of(None))
        self.assertIsNone(metrics.tier_of(500))
        self.assertEqual(metrics.tier_of(10_000)["tier"], "micro")
        self.assertEqual(metrics.tier_of(2_000_000)["tier"], "mega")
        micro = metrics.tier_of(30_000)
        self.assertEqual(metrics.benchmark_band(1.5, micro), "high")
        self.assertEqual(metrics.benchmark_band(1.27, micro), "above average")
        self.assertEqual(metrics.benchmark_band(0.5, micro), "average")
        self.assertEqual(metrics.benchmark_band(0.3, micro), "below average")
        self.assertEqual(metrics.benchmark_band(0.1, micro), "low")
        self.assertIsNone(metrics.benchmark_band(None, micro))

    def test_percentile_rank_is_mid_rank(self):
        self.assertEqual(metrics.percentile_rank(2, [1, 2, 3, None]), 50.0)
        self.assertEqual(metrics.percentile_rank(3, [1, 2, 3]), 5 / 6 * 100)
        self.assertIsNone(metrics.percentile_rank(None, [1]))
        self.assertIsNone(metrics.percentile_rank(1, [None]))

    def test_view_engagement_rate(self):
        self.assertAlmostEqual(metrics.view_engagement_rate([post("a", 90, 10, 1000), post("b", None, None, 1000)]), 10.0)
        self.assertIsNone(metrics.view_engagement_rate([post("a", views=None)]))


class AudienceQualityTest(unittest.TestCase):
    def test_healthy_creator_scores_high(self):
        posts = [post(str(i), likes=200, comments=10, views=5000, days_ago=i * 3) for i in range(6)]
        result = metrics.audience_quality(20_000, posts)
        self.assertEqual(result["aq_signals"], 3)
        self.assertEqual(result["like_comment_score"], 100.0)
        self.assertEqual(result["view_follower_score"], 100.0)
        self.assertEqual(result["regularity_score"], 100.0)
        self.assertEqual(result["aq_heuristic"], 100.0)

    def test_anomalies_lower_the_score(self):
        posts = [post(str(i), likes=5000, comments=1, views=50, days_ago=d) for i, d in enumerate([1, 2, 3, 58, 59])]
        result = metrics.audience_quality(100_000, posts)
        self.assertLess(result["like_comment_score"], 100)
        self.assertEqual(result["view_follower_score"], 0.0)
        self.assertLess(result["regularity_score"], 50)
        self.assertLess(result["aq_heuristic"], 50)

    def test_missing_signals_stay_none(self):
        result = metrics.audience_quality(None, [post("a", comments=None, days_ago=None, views=None)])
        self.assertEqual(result["aq_signals"], 0)
        self.assertIsNone(result["aq_heuristic"])
        self.assertIsNone(result["like_comment_ratio"])


class RateAndLookalikeTest(unittest.TestCase):
    def test_rate_is_cpm_times_median_views(self):
        self.assertEqual(metrics.rate_estimate("youtube", 10_000, {"youtube": (15, 35)}), (150, 350))
        self.assertEqual(metrics.rate_estimate("youtube", None, {"youtube": (15, 35)}), (None, None))
        self.assertEqual(metrics.parse_cpm(["x=1-2"])["x"], (1.0, 2.0))
        with self.assertRaises(ValueError):
            metrics.parse_cpm(["youtube=40-10"])

    def test_tfidf_cosine_ranks_similar_text_first(self):
        vectors = metrics.tfidf_vectors(["espresso grinder latte art", "espresso machine latte review", "mountain bike trail"])
        self.assertAlmostEqual(metrics.cosine(vectors[0], vectors[0]), 1.0)
        self.assertGreater(metrics.cosine(vectors[0], vectors[1]), metrics.cosine(vectors[0], vectors[2]))
        self.assertEqual(metrics.cosine(vectors[0], vectors[2]), 0.0)
        self.assertEqual(metrics.tokenize("咖啡拉花"), ["咖啡", "啡拉", "拉花"])

    def test_lookalikes_by_seed_and_by_neighbour(self):
        seed = creator("seed", 1000, [], bio="espresso latte art barista", discovered_by="seed")
        near = creator("near", 1000, [], bio="latte art espresso at home")
        far = creator("far", 1000, [], bio="mountain bike trail riding")
        rows = metrics.lookalikes([seed, near, far])
        self.assertEqual([row["creator"] for row in rows], ["youtube:near", "youtube:far"])
        self.assertEqual(rows[0]["similar_to"], "youtube:seed")
        neighbours = metrics.lookalikes([near, far], top=1)
        self.assertEqual([row["mode"] for row in neighbours], ["neighbour", "neighbour"])


class ContactTest(unittest.TestCase):
    def test_extracts_plain_and_obfuscated_emails(self):
        bio = "Business: Collab@Brand.co.uk. Mgmt: jane.doe+yt [at] agency [dot] com — not a@b"
        self.assertEqual(metrics.extract_emails(bio), ["collab@brand.co.uk", "jane.doe+yt@agency.com"])
        self.assertEqual(metrics.extract_emails(None), [])

    def test_syntax_reasons(self):
        self.assertIsNone(metrics.email_syntax("a.b@example.com"))
        self.assertIn("doubled dot", metrics.email_syntax("a..b@example.com"))
        self.assertIn("label", metrics.email_syntax("a@-bad.com"))
        self.assertIn("top-level", metrics.email_syntax("a@example.c0m"))
        self.assertTrue(metrics.is_role_account("business@x.com"))
        self.assertFalse(metrics.is_role_account("jane@x.com"))

    def test_mx_verdicts(self):
        self.assertEqual(metrics.mx_verdict({"Status": 0, "Answer": [{"type": 15, "data": "10 mx.example.com."}]}), ("mx_found", ["mx.example.com"]))
        self.assertEqual(metrics.mx_verdict({"Status": 0}), ("no_mx_record", []))
        self.assertEqual(metrics.mx_verdict({"Status": 3}), ("domain_not_found", []))
        self.assertEqual(metrics.mx_verdict({"Status": 2}), ("dns_error_status_2", []))

    def test_dns_mx_uses_doh_url(self):
        urls = []
        collect.dns_mx("example.com", lambda url: urls.append(url) or {"Status": 0})
        self.assertEqual(urls, ["https://dns.google/resolve?name=example.com&type=MX"])

    def test_collect_contacts_caches_domains_and_records_lookup_failures(self):
        calls = []

        def resolve(url):
            calls.append(url)
            if "down.example" in url:
                raise collect.CollectionError("dns.google DNS-over-HTTPS unreachable: offline")
            return {"Status": 0, "Answer": [{"type": 15, "data": "5 mx.good.example."}]}

        creators = [creator("a", 1, [], bio="a@good.example b@good.example"), creator("b", 1, [], platform="instagram", bio="c@down.example x..y@good.example")]
        gaps: list = []
        contacts = influencer_marketing.collect_contacts(creators, True, gaps, resolve)
        self.assertEqual(len(calls), 2)
        self.assertEqual([contact["mx_status"] for contact in contacts], ["mx_found", "mx_found", "lookup_failed", "skipped"])
        self.assertTrue(contacts[3]["syntax"].startswith("invalid"))
        self.assertEqual(contacts[2]["found_in"], "bio")
        self.assertIn("offline", gaps[0])


class YouTubeApiTest(unittest.TestCase):
    def test_channel_search_then_channels_maps_fields_and_counts_units(self):
        calls = []

        def fetch(url):
            calls.append(url)
            if "/search?" in url:
                return {"items": [{"id": {"channelId": "UC1"}}, {"id": {"kind": "youtube#video"}}]}
            if "/channels?" in url:
                return {"items": [{
                    "id": "UC1", "snippet": {"title": "Chan", "customUrl": "@chan", "description": "mail me: biz@chan.com"},
                    "statistics": {"subscriberCount": "20000", "videoCount": "40"},
                    "contentDetails": {"relatedPlaylists": {"uploads": "UU1"}},
                }]}
            if "/playlistItems?" in url:
                return {"items": [{"contentDetails": {"videoId": "v1"}}]}
            return {"items": [{"id": "v1", "snippet": {"title": "V", "publishedAt": "2026-11-01T00:00:00Z"}, "statistics": {"viewCount": "500", "likeCount": "40"}}]}

        api = collect.YouTubeApi("KEY", fetch)
        ids = api.search_channels("espresso", 5, region="US")
        self.assertEqual(ids, ["UC1"])
        self.assertIn("type=channel", calls[0])
        self.assertIn("regionCode=US", calls[0])
        [record] = api.channels(ids, 10, "search: espresso")
        self.assertEqual(api.units, 103)
        self.assertEqual((record["key"], record["followers"], record["posts_count"]), ("youtube:@chan", 20000, 40))
        self.assertEqual(record["posts"][0]["likes"], 40)
        self.assertIsNone(record["posts"][0]["comments"])

    def test_missing_handle_and_http_errors_raise(self):
        api = collect.YouTubeApi("KEY", lambda url: {"items": []})
        with self.assertRaisesRegex(collect.CollectionError, "@nobody"):
            api.channels(["@nobody"], 5, "seed")


class YtDlpTest(unittest.TestCase):
    def test_discovery_counts_channels(self):
        info = {"entries": [{"channel_id": "UCa"}, {"channel_id": "UCb"}, {"channel_id": "UCb"}, None]}
        self.assertEqual(collect.ytdlp_discover_channels("q", 5, extract=lambda url: info), ["UCb", "UCa"])
        with self.assertRaises(collect.CollectionError):
            collect.ytdlp_discover_channels("q", 5, extract=lambda url: {"entries": []})

    def test_youtube_channel_tab(self):
        urls = []

        def extract(url):
            urls.append(url)
            return {"channel_id": "UC9", "channel": "Nine", "uploader_id": "@nine", "channel_follower_count": 1200,
                    "description": "x", "entries": [{"id": "v1", "title": "T", "view_count": 50}, {"title": "no id"}]}

        record = collect.ytdlp_youtube_channel("@nine", 5, "seed", extract=extract)
        self.assertEqual(urls, ["https://www.youtube.com/@nine/videos"])
        self.assertEqual((record["followers"], len(record["posts"]), record["posts"][0]["likes"]), (1200, 1, None))

    def test_tiktok_profile_list(self):
        info = {"entries": [{"id": "7", "description": "clip", "timestamp": 1_762_000_000, "view_count": 900, "like_count": 80, "comment_count": 4, "channel": "Tok"}]}
        record = collect.ytdlp_tiktok("@tok", 5, "csv", extract=lambda url: info)
        self.assertEqual(record["key"], "tiktok:tok")
        self.assertIsNone(record["followers"])
        self.assertEqual(record["posts"][0]["likes"], 80)
        self.assertTrue(record["posts"][0]["published_at"].startswith("2025-11-01"))

    def test_failures_become_collection_errors(self):
        def boom(url):
            raise ValueError("blocked")

        with self.assertRaisesRegex(collect.CollectionError, "blocked"):
            collect.ytdlp_youtube_channel("UCx", 1, "seed", extract=boom)
        with self.assertRaises(collect.CollectionError):
            collect.ytdlp_youtube_channel("UCx", 1, "seed", extract=lambda url: None)
        with self.assertRaisesRegex(collect.CollectionError, "no TikTok videos"):
            collect.ytdlp_tiktok("t", 1, "csv", extract=lambda url: {"entries": []})


class InstagramTest(unittest.TestCase):
    def fake_profile(self, posts):
        return SimpleNamespace(
            userid=42, full_name="Gram", followers=15000, followees=300, biography="collab@gram.io",
            external_url="https://gram.io", mediacount=200, get_posts=lambda: iter(posts),
        )

    def test_profile_and_posts(self):
        item = SimpleNamespace(shortcode="abc", caption="hi", date_utc=datetime(2026, 11, 1), is_video=False, video_view_count=None, likes=150, comments=6)
        record = instagram_record = collect.instagram_profile("@gram", 5, "csv", load=lambda handle: self.fake_profile([item]))
        self.assertEqual((instagram_record["followers"], record["bio"], record["posts"][0]["views"]), (15000, "collab@gram.io", None))
        self.assertEqual(record["posts"][0]["published_at"], "2026-11-01T00:00:00+00:00")

    def test_post_paging_failure_becomes_note(self):
        def broken():
            raise RuntimeError("401 login required")

        profile = self.fake_profile([])
        profile.get_posts = broken
        record = collect.instagram_profile("gram", 5, "csv", load=lambda handle: profile)
        self.assertIn("401", record["notes"][0])

    def test_profile_failure_raises(self):
        def load(handle):
            raise RuntimeError("Profile does not exist")

        with self.assertRaisesRegex(collect.CollectionError, "anonymously"):
            collect.instagram_profile("ghost", 5, "csv", load=load)


class XApiTest(unittest.TestCase):
    def test_user_and_timeline(self):
        seen = []

        def fetch(url, headers):
            seen.append((url, headers["Authorization"]))
            if "/users/by/username/" in url:
                return {"data": {"id": "9", "name": "Ex", "description": "d", "public_metrics": {"followers_count": 5000, "tweet_count": 10}}}
            return {"data": [{"id": "t1", "text": "hello", "created_at": "2026-11-01T00:00:00Z", "public_metrics": {"like_count": 7, "reply_count": 1, "impression_count": 400}}]}

        record = collect.XApi("TOKEN", fetch).user("@ex", 5, "csv")
        self.assertEqual(seen[0][1], "Bearer TOKEN")
        self.assertIn("exclude=retweets%2Creplies", seen[1][0])
        self.assertEqual((record["followers"], record["posts"][0]["views"]), (5000, 400))
        with self.assertRaises(collect.CollectionError):
            collect.XApi("T", lambda url, headers: {"errors": ["nf"]}).user("none", 5, "csv")


class EndToEndTest(unittest.TestCase):
    def setUp(self):
        self.saved = {name: getattr(influencer_marketing, name) for name in ["ytdlp_discover_channels", "ytdlp_youtube_channel", "ytdlp_tiktok", "instagram_profile", "dns_mx"]}
        self.env = {name: os.environ.pop(name, None) for name in ["YOUTUBE_API_KEY", "X_BEARER_TOKEN"]}

    def tearDown(self):
        for name, value in self.saved.items():
            setattr(influencer_marketing, name, value)
        for name, value in self.env.items():
            if value is not None:
                os.environ[name] = value

    def test_main_writes_html_and_xlsx_keyless(self):
        recent = datetime.now(timezone.utc)

        def channel(selector, posts, discovered_by):
            followers = {"UCseed": 50_000, "UCa": 20_000, "UCb": 400_000}[selector]
            record = collect.creator_record(
                "youtube", selector, channel_id=selector, name=f"<i>{selector}</i>", followers=followers,
                bio="espresso latte reviews. business: hello@brew.example" if selector != "UCb" else "mountain bikes",
                source="yt-dlp", discovered_by=discovered_by,
            )
            record["posts"] = [
                collect.post_record("youtube", f"{selector}{i}", title="espresso grinder", published_at=(recent - timedelta(days=i * 4)).isoformat(), views=8000, likes=300, comments=12)
                for i in range(5)
            ]
            return record

        influencer_marketing.ytdlp_discover_channels = lambda niche, limit: ["UCa", "UCb"]
        influencer_marketing.ytdlp_youtube_channel = channel
        influencer_marketing.instagram_profile = lambda handle, posts, discovered_by: (_ for _ in ()).throw(collect.CollectionError("instaloader could not read Instagram @gram anonymously: 429"))
        influencer_marketing.dns_mx = lambda domain, fetch=None: {"Status": 0, "Answer": [{"type": 15, "data": "1 mx.brew.example."}]}
        with tempfile.TemporaryDirectory() as out:
            csv_path = os.path.join(out, "handles.csv")
            with open(csv_path, "w", encoding="utf-8") as handle:
                handle.write("platform,handle\ninstagram,gram\nx,someone\n")
            report_dir = os.path.join(out, "report")
            stderr = io.StringIO()
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(stderr):
                status = influencer_marketing.main(["--channel", "UCseed", "--niche", "espresso", "--creators", csv_path, "--out", report_dir])
            self.assertEqual(status, 0)
            self.assertIn("X_BEARER_TOKEN", stderr.getvalue())
            self.assertIn("429", stderr.getvalue())
            files = sorted(os.listdir(report_dir))
            self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
            with open(os.path.join(report_dir, files[0]), encoding="utf-8") as handle:
                page = handle.read()
            self.assertIn("&lt;i&gt;UCa&lt;/i&gt;", page)
            self.assertNotIn("<i>UCa</i>", page)
            self.assertIn("hello@brew.example", page)
            self.assertIn("mx_found", page)
            self.assertIn("Heuristic", page)
            self.assertIn("数据缺口 Data gaps", page)
            with zipfile.ZipFile(os.path.join(report_dir, files[1])) as book:
                sheets = book.read("xl/workbook.xml").decode()
            for name in ["creators", "posts", "audience_sample", "lookalikes", "contacts", "outreach_log", "benchmarks", "run"]:
                self.assertIn(f'name="{name}"', sheets)

    def test_main_fails_without_creators(self):
        influencer_marketing.ytdlp_youtube_channel = lambda selector, posts, discovered_by: (_ for _ in ()).throw(collect.CollectionError("offline"))
        with tempfile.TemporaryDirectory() as out:
            stderr = io.StringIO()
            with contextlib.redirect_stderr(stderr):
                self.assertEqual(influencer_marketing.main(["--channel", "@x", "--out", out]), 2)
            self.assertIn("YouTube channel @x: offline", stderr.getvalue())
            self.assertEqual(os.listdir(out), [])

    def test_csv_needs_platform_and_handle(self):
        with tempfile.TemporaryDirectory() as out:
            path = os.path.join(out, "bad.csv")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("name\nfoo\n")
            with self.assertRaisesRegex(collect.CollectionError, "platform and handle"):
                influencer_marketing.read_creators_csv(path)


if __name__ == "__main__":
    unittest.main()
