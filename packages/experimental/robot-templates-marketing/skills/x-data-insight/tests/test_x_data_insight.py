"""Offline tests for the X data-insight skill: metrics, the three collectors, and both report files."""

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
import metrics  # noqa: E402
import x_data_insight  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)


def iso(moment: datetime) -> str:
    return moment.isoformat().replace("+00:00", "Z")


def post(post_id: str, text: str, hours_ago: float = 2, likes=5, author="a", source="hacker-news-algolia", lang=None, **extra):
    record = {
        "id": post_id, "platform": "hn", "source": source, "query": "q", "author": author, "author_id": author,
        "author_followers": None, "author_following": None, "author_created_at": None,
        "created_at": iso(NOW - timedelta(hours=hours_ago)), "lang": lang, "text": text, "likes": likes,
        "reposts": None, "replies": 1, "quotes": None, "impressions": None, "links": [], "url": f"https://e/{post_id}",
    }
    record.update(extra)
    return record


def fake_polarity(text: str) -> dict:
    lowered = text.lower()
    if "love" in lowered or "great" in lowered:
        return {"compound": 0.6}
    if "hate" in lowered or "broke" in lowered:
        return {"compound": -0.7}
    return {"compound": 0.0}


def x_page(ids, handle="brand", user_id="9", created="2026-11-03T12:00:00.000Z", likes=10):
    return {
        "data": [{
            "id": tweet_id, "text": f"I love the <i>new</i> desk lamp {tweet_id}", "author_id": user_id, "created_at": created, "lang": "en",
            "public_metrics": {"like_count": likes, "retweet_count": 2, "reply_count": 1, "quote_count": 0, "impression_count": 900},
        } for tweet_id in ids],
        "includes": {"users": [{"id": user_id, "username": handle, "created_at": "2019-01-01T00:00:00.000Z",
                                "public_metrics": {"followers_count": 1000, "following_count": 10}}]},
        "meta": {},
    }


class MetricsTest(unittest.TestCase):
    def test_account_kpis(self):
        posts = [post(str(i), "x", hours_ago=24 * i, likes=10 * (i + 1), author="brand") for i in range(4)]
        kpis = metrics.account_kpis({"handle": "brand", "followers": 1000}, posts, NOW)
        self.assertEqual(kpis["sampled_posts"], 4)
        self.assertAlmostEqual(kpis["posts_per_week"], 4 / 3 * 7, places=2)
        self.assertEqual(kpis["median_engagement"], 26)
        self.assertAlmostEqual(kpis["engagement_rate"], 0.026)
        self.assertAlmostEqual(kpis["like_rate"], 0.025)
        self.assertAlmostEqual(kpis["engagement_growth"], 16 / 36 - 1)
        empty = metrics.account_kpis({"handle": "x", "followers": None}, [], NOW)
        self.assertIsNone(empty["engagement_rate"])
        self.assertIsNone(empty["posts_per_week"])

    def test_benchmarks_compare_against_peer_median(self):
        rows = metrics.benchmarks([
            {"handle": "a", "engagement_rate": 0.02, "like_rate": None, "posts_per_week": 7, "median_engagement": 10, "engagement_growth": 0.1},
            {"handle": "b", "engagement_rate": 0.01, "like_rate": None, "posts_per_week": 14, "median_engagement": 5, "engagement_growth": -0.1},
        ])
        first = {row["metric"]: row for row in rows if row["handle"] == "a"}
        self.assertAlmostEqual(first["engagement_rate"]["vs_peer"], 2.0)
        self.assertIsNone(first["like_rate"]["vs_peer"])
        self.assertAlmostEqual(first["engagement_growth"]["vs_peer"], 0.2)

    def test_sentiment_scores_only_supported_languages(self):
        posts = metrics.score_sentiment([post("1", "love it", lang="en"), post("2", "hate it"), post("3", "meh"), post("4", "j'adore", lang="fr")], fake_polarity)
        self.assertEqual([item["sentiment"] for item in posts], ["positive", "negative", "neutral", None])
        self.assertEqual(metrics.net_sentiment(posts), {"positive": 1, "negative": 1, "neutral": 1, "scored": 3, "net": 0.0})
        self.assertIsNone(metrics.net_sentiment(metrics.score_sentiment(posts, None))["net"])
        self.assertEqual(metrics.label_sentiment(0.05), "positive")
        self.assertEqual(metrics.label_sentiment(-0.04), "neutral")

    def test_topic_clusters_by_cooccurrence(self):
        posts = [
            post("1", "battery life is short on the lamp"), post("2", "Battery life matters"), post("3", "battery life again"),
            post("4", "shipping delay from warehouse"), post("5", "shipping delay annoying"), post("6", "random words here"),
        ]
        clusters, assignment = metrics.topic_clusters(posts, exclude=["lamp"])
        labels = [cluster["label"] for cluster in clusters]
        self.assertEqual(labels, ["battery · life", "delay · shipping"])
        self.assertEqual(assignment, [1, 1, 1, 2, 2, None])
        self.assertNotIn("lamp", clusters[0]["keywords"])

    def test_classify_trend(self):
        self.assertEqual(metrics.classify_trend([0, 1, 1, 2, 4], 4), "trend")
        self.assertEqual(metrics.classify_trend([0, 0, 0, 0, 6], 6), "spike")
        self.assertEqual(metrics.classify_trend([5, 4, 1, 0, 1], 5), "fading")
        self.assertEqual(metrics.classify_trend([0, 0, 0], 0), "none")

    def test_share_of_voice(self):
        posts = [
            post("1", "@brand lamp is great", likes=10), post("2", "BrandCo vs Rival", likes=0),
            post("3", "rival desk wins", likes=None, replies=None),
        ]
        rows = metrics.share_of_voice(posts, metrics.parse_lexicon(["Brand=@brand|BrandCo", "Rival=rival desk|Rival"]))
        by_brand = {row["brand"]: row for row in rows}
        self.assertEqual((by_brand["Brand"]["mentions"], by_brand["Rival"]["mentions"]), (2, 2))
        self.assertEqual(by_brand["Brand"]["sov_mentions"], 50.0)
        self.assertEqual(by_brand["Brand"]["engagement"], 12)
        self.assertEqual(by_brand["Rival"]["engagement"], 1)
        self.assertEqual(by_brand["Brand"]["sov_engagement"], 92.3)

    def test_outliers_use_author_then_source_median(self):
        posts = [post(str(i), "x", likes=9, author="brand") for i in range(5)] + [post("big", "x", likes=99, author="brand")]
        posts += [post("s1", "y", likes=4, author="u1"), post("s2", "y", likes=None, replies=None, author="u2")]
        rows = {row["id"]: row for row in metrics.outlier_posts(posts)}
        self.assertEqual(rows["big"]["baseline_kind"], "author median")
        self.assertAlmostEqual(rows["big"]["outlier_score"], 10.0)
        self.assertTrue(rows["big"]["is_outlier"])
        self.assertEqual(rows["s1"]["baseline_kind"], "source median")
        self.assertIsNone(rows["s2"]["outlier_score"])

    def test_clean_posts_keeps_requested_accounts(self):
        young = iso(NOW - timedelta(days=2))
        posts = [post("1", "a", author="newbrand", author_created_at=young), post("2", "b", author="spam", author_created_at=young)]
        kept, dropped = metrics.clean_posts(posts, NOW, keep_accounts=["@NewBrand"])
        self.assertEqual([item["id"] for item in kept], ["1"])
        self.assertEqual(dropped[0]["drop_reason"], "account younger than 30 days")


class CollectorTest(unittest.TestCase):
    def test_x_timeline_and_search_count_reads(self):
        calls = []

        def fetch(url, headers):
            calls.append(url)
            if "/users/by/username/" in url:
                return {"data": {"id": "9", "username": "brand", "created_at": "2019-01-01T00:00:00Z",
                                 "public_metrics": {"followers_count": 1000, "following_count": 10, "tweet_count": 77}}}
            return x_page(["1", "2"])

        api = collect.XApi("T", fetch)
        account, posts = api.user_timeline("@brand", 10)
        self.assertEqual((account["post_count"], len(posts), posts[0]["account"]), (77, 2, "brand"))
        self.assertIn("exclude=retweets", calls[1])
        self.assertIn("user.fields=public_metrics%2Ccreated_at", calls[1])
        api.search_recent("desk", 10)
        self.assertIn("/2/tweets/search/recent?", calls[2])
        self.assertEqual(api.reads, 1 + 3 + 3)
        self.assertAlmostEqual(api.cost_usd, 0.035)

    def test_x_error_payload_raises(self):
        api = collect.XApi("T", lambda url, headers: {"errors": [{"title": "Unauthorized"}]})
        with self.assertRaisesRegex(collect.CollectionError, "Unauthorized"):
            api.search_recent("q", 10)

    def test_hacker_news_and_reddit(self):
        hits = {"nbPages": 1, "hits": [{"objectID": 5, "title": "Desk lamp", "author": "pg", "points": 3, "num_comments": 1, "created_at": "2026-11-01T00:00:00Z"}]}
        self.assertEqual(collect.hn_search("lamp", 5, NOW - timedelta(days=7), lambda url, headers: hits)[0]["likes"], 3)
        item = SimpleNamespace(id="r", created_utc=(NOW - timedelta(days=1)).timestamp(), title="Lamp", selftext="", is_self=False,
                               url="https://etsy.com/x", author=None, subreddit="desks", score=2, num_comments=0, permalink="/r/desks/r")
        reddit = SimpleNamespace(subreddit=lambda name: SimpleNamespace(search=lambda *a, **k: [item]))
        posts = collect.reddit_search("lamp", 5, NOW - timedelta(days=7), NOW, reddit=reddit)
        self.assertEqual((posts[0]["author"], posts[0]["links"]), (None, ["https://etsy.com/x"]))

    def test_missing_vader_becomes_collection_error(self):
        saved = {name: sys.modules.get(name) for name in ("vaderSentiment", "vaderSentiment.vaderSentiment")}
        sys.modules["vaderSentiment"] = None
        sys.modules["vaderSentiment.vaderSentiment"] = None
        try:
            with self.assertRaisesRegex(collect.CollectionError, "vaderSentiment==3.3.2"):
                x_data_insight.load_polarity()
        finally:
            for name, module in saved.items():
                if module is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = module


class EndToEndTest(unittest.TestCase):
    def setUp(self):
        self.original_polarity = x_data_insight.load_polarity
        x_data_insight.load_polarity = lambda: fake_polarity

    def tearDown(self):
        x_data_insight.load_polarity = self.original_polarity

    def _read_outputs(self, out):
        files = sorted(os.listdir(out))
        self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
        with open(os.path.join(out, files[0]), encoding="utf-8") as handle:
            page = handle.read()
        with zipfile.ZipFile(os.path.join(out, files[1])) as book:
            sheets = book.read("xl/workbook.xml").decode()
            strings = book.read("xl/sharedStrings.xml").decode()
        return page, sheets, strings

    def test_main_with_x_token_writes_kpis_sov_and_cost(self):
        def fetch(url, headers):
            if "/users/by/username/" in url:
                handle = url.split("/users/by/username/")[1].split("?")[0]
                return {"data": {"id": handle, "username": handle, "created_at": "2019-01-01T00:00:00Z",
                                 "public_metrics": {"followers_count": 1000, "following_count": 10, "tweet_count": 5}}}
            if "/tweets/search/recent" in url:
                return x_page(["s1", "s2"], handle="fan", user_id="f")
            handle = url.split("/users/")[1].split("/")[0]
            return x_page([f"{handle}{i}" for i in range(3)], handle=handle, user_id=handle, likes=50 if handle == "brand" else 5)

        original = collect.XApi.__init__
        collect.XApi.__init__ = lambda self, token, fetch_=None, max_reads=None: original(self, token, fetch, max_reads)
        try:
            with tempfile.TemporaryDirectory() as out:
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    status = x_data_insight.main([
                        "--account", "@brand", "--account", "rival", "--topic", "desk lamp",
                        "--brand", "Brand=@brand|brand", "--competitor", "Rival=rival", "--out", out,
                    ], env={"X_BEARER_TOKEN": "T"})
                self.assertEqual(status, 0)
                page, sheets, strings = self._read_outputs(out)
                self.assertIn("&lt;i&gt;new&lt;/i&gt;", page)
                self.assertNotIn("<i>new</i>", page)
                self.assertIn("@brand", page)
                self.assertIn("2026 年二手来源", page)
                self.assertIn("净情感 Net sentiment", page)
                for name in ["accounts", "posts", "topic_timeseries", "benchmarks", "share_of_voice", "dropped_posts", "run"]:
                    self.assertIn(f'name="{name}"', sheets)
                self.assertIn("x_estimated_cost_usd", strings)
                self.assertIn("0.0950", strings)
        finally:
            collect.XApi.__init__ = original

    def test_main_without_token_states_x_gap(self):
        original = x_data_insight.hn_search
        x_data_insight.hn_search = lambda term, limit, since: [
            post("1", "I love Brand lamps <script>", author="a"), post("2", "Rival lamp broke", author="b"),
        ]
        try:
            with tempfile.TemporaryDirectory() as out:
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    status = x_data_insight.main(["--account", "@brand", "--brand", "Brand", "--competitor", "Rival", "--out", out], env={})
                self.assertEqual(status, 0)
                page, _, strings = self._read_outputs(out)
                self.assertIn("X 数据未采集", page)
                self.assertIn("账号时间线未采集", page)
                self.assertIn("&lt;script&gt;", page)
                self.assertNotIn("<script>", page)
                self.assertIn("X API not called", strings)
        finally:
            x_data_insight.hn_search = original

    def test_main_fails_with_reasons_when_nothing_collected(self):
        original = x_data_insight.hn_search
        x_data_insight.hn_search = lambda term, limit, since: (_ for _ in ()).throw(collect.CollectionError("offline"))
        try:
            with tempfile.TemporaryDirectory() as out:
                stderr = io.StringIO()
                with contextlib.redirect_stderr(stderr):
                    self.assertEqual(x_data_insight.main(["--topic", "lamp", "--out", out], env={}), 2)
                self.assertIn("Hacker News “lamp”: offline", stderr.getvalue())
                self.assertIn("X data was not collected", stderr.getvalue())
                self.assertEqual(os.listdir(out), [])
        finally:
            x_data_insight.hn_search = original


if __name__ == "__main__":
    unittest.main()
