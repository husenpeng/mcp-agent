"""Offline tests for the brand-insight skill: metrics, every collector, and both report files."""

from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
import urllib.parse
import zipfile
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))

import brand_insight  # noqa: E402
import collect  # noqa: E402
import metrics  # noqa: E402

START = datetime(2026, 10, 1, tzinfo=timezone.utc)
END = datetime(2026, 10, 11, tzinfo=timezone.utc)


def mention(brand, day, engagement=None, sentiment=None, title="t", source="hackernews", url=None):
    return {"brand": brand, "source": source, "id": url or f"{brand}{day}{title}", "url": url or f"https://x/{brand}/{day}/{title}",
            "title": title, "text": title, "published_at": f"{day}T10:00:00Z", "engagement": engagement, "sentiment": sentiment}


class ShareOfVoiceTest(unittest.TestCase):
    def test_sov_keeps_missing_values(self):
        self.assertEqual(metrics.sov({"a": 30, "b": 10, "c": None}), {"a": 75.0, "b": 25.0, "c": None})
        self.assertEqual(metrics.sov({"a": 0, "b": None}), {"a": None, "b": None})

    def test_brand_summary_by_mentions_and_engagement(self):
        mentions = [mention("a", "2026-10-01", 10), mention("a", "2026-10-02", None, source="gdelt"), mention("b", "2026-10-01", 30)]
        rows = {row["brand"]: row for row in metrics.brand_summary(mentions, ["a", "b", "c"], {"a": {"pageviews": {"2026-10-01": 300}}, "b": {"pageviews": {"2026-10-01": 100}}})}
        self.assertAlmostEqual(rows["a"]["sov_mentions"], 200 / 3)
        self.assertAlmostEqual(rows["a"]["sov_engagement"], 25.0)
        self.assertIsNone(rows["c"]["engagement"])
        self.assertIsNone(rows["c"]["sov_engagement"])
        self.assertEqual(rows["c"]["sov_mentions"], 0.0)
        self.assertAlmostEqual(rows["a"]["attention_share"], 75.0)
        self.assertIsNone(rows["c"]["pageviews"])
        self.assertEqual(rows["a"]["sources"], "gdelt, hackernews")


class SentimentTest(unittest.TestCase):
    def test_labels_and_both_net_formulas(self):
        self.assertEqual([metrics.label(value) for value in (0.05, -0.05, 0.0, None)], ["positive", "negative", "neutral", None])
        rows = metrics.score_sentiment([{"text": "good"}, {"text": "bad"}, {"text": "good"}, {"text": "meh"}],
                                       lambda text: {"good": 0.6, "bad": -0.7}.get(text, 0.0))
        result = metrics.net_sentiment(rows)
        self.assertEqual((result["positive"], result["negative"], result["neutral"]), (2, 1, 1))
        self.assertAlmostEqual(result["net_polar"], 100 / 3)
        self.assertAlmostEqual(result["net_total"], 25.0)

    def test_without_scorer_everything_is_none(self):
        rows = metrics.score_sentiment([{"text": "x"}], None)
        self.assertIsNone(rows[0]["compound"])
        result = metrics.net_sentiment(rows)
        self.assertIsNone(result["net_polar"])
        self.assertIsNone(result["net_total"])


class SpikeTest(unittest.TestCase):
    def test_zscore_and_spike_threshold(self):
        series = {f"d{i}": 1 for i in range(9)} | {"d9": 20}
        found = metrics.spikes(series)
        self.assertEqual([day for day, _, _ in found], ["d9"])
        self.assertAlmostEqual(found[0][2], 3.0)
        self.assertEqual(metrics.spikes({"a": 1, "b": 1, "c": 1}), [])
        self.assertEqual(metrics.zscores({"a": 1, "b": 5}), {"a": None, "b": None})

    def test_spike_table_names_drivers(self):
        days = metrics.days_between(START.date(), (END - timedelta(days=1)).date())
        mentions = [mention("a", day, 1) for day in days] + [mention("a", "2026-10-05", engagement, title=f"launch {engagement}") for engagement in (5, 50, 9, 7) * 3]
        rows = metrics.spike_table(mentions, ["a"], days, {"a": {"pageviews": {day: 100 for day in days} | {"2026-10-06": 5000}}})
        self.assertEqual([(row["date"], row["series"]) for row in rows], [("2026-10-05", "mentions"), ("2026-10-06", "pageviews")])
        self.assertEqual([driver["title"] for driver in rows[0]["drivers"]], ["launch 50", "launch 50", "launch 50"])
        self.assertEqual(rows[1]["drivers"], [{"title": "t", "url": "https://x/a/2026-10-06/t", "source": "hackernews"}])

    def test_daily_counts_fill_window(self):
        days = metrics.days_between(START.date(), START.date() + timedelta(days=2))
        self.assertEqual(metrics.daily_counts([mention("a", "2026-10-02"), mention("b", "2026-10-02"), mention("a", "2026-12-01")], "a", days),
                         {"2026-10-01": 0, "2026-10-02": 1, "2026-10-03": 0})


class TextTest(unittest.TestCase):
    def test_keywords_topics_overlap_and_dedupe(self):
        mentions = [
            {"brand": "Acme", "text": "Acme battery life is great", "title": "a1", "url": "u1"},
            {"brand": "Acme", "text": "battery life again from acme", "title": "a2", "url": "u2"},
            {"brand": "Bolt", "text": "Bolt battery price", "title": "b1", "url": "u3"},
        ]
        keywords = metrics.keyword_table(mentions, ["Acme", "Bolt"], ["Acme", "Bolt"])
        acme = [row for row in keywords if row["brand"] == "Acme"]
        self.assertEqual((acme[0]["keyword"], acme[0]["count"]), ("battery", 2))
        self.assertNotIn("acme", {row["keyword"] for row in keywords})
        topics = metrics.topic_table(mentions, ["Acme", "Bolt"], ["Acme", "Bolt"])
        self.assertEqual([(row["brand"], row["topic"], row["mentions"]) for row in topics], [("Acme", "battery life", 2)])
        overlap = metrics.keyword_overlap(keywords, ["Acme", "Bolt"])
        self.assertAlmostEqual(overlap[0][2], 1 / 4)  # {battery, life, great} vs {battery, price}
        self.assertIsNone(metrics.jaccard(set(), set()))
        self.assertEqual(len(metrics.dedupe(mentions + [dict(mentions[0])])), 3)


def _url_params(url):
    return {key: values[0] for key, values in urllib.parse.parse_qs(urllib.parse.urlparse(url).query).items()}


class GdeltTest(unittest.TestCase):
    def test_artlist_timeline_and_spacing(self):
        sleeps, urls = [], []

        def fetch(url):
            urls.append(url)
            if "ArtList" in url:
                return json.dumps({"articles": [{"url": "https://n/1", "title": "Acme recalls", "seendate": "20261003T121500Z", "domain": "n", "language": "English"}]})
            return json.dumps({"timeline": [{"data": [{"date": "20261003T000000Z", "value": 0.2}, {"date": "20261003T120000Z", "value": 0.4}]}]})

        gdelt = collect.Gdelt(fetch, sleep=sleeps.append)
        query = collect.gdelt_query(["Acme", "Acme Corp"], "sourcelang:english")
        self.assertEqual(query, '(Acme OR "Acme Corp") sourcelang:english')
        found = gdelt.articles("Acme", query, START, END, 500)
        self.assertEqual(found[0]["published_at"], "2026-10-03T12:15:00Z")
        self.assertIsNone(found[0]["engagement"])
        self.assertEqual(_url_params(urls[0])["maxrecords"], "250")
        self.assertEqual(_url_params(urls[0])["startdatetime"], "20261001000000")
        self.assertAlmostEqual(gdelt.timeline(query, START, END)["2026-10-03"], 0.3)
        self.assertEqual(sleeps, [5.0])

    def test_text_reply_becomes_collection_error(self):
        gdelt = collect.Gdelt(lambda url: "Please limit requests to one every 5 seconds", sleep=lambda seconds: None)
        with self.assertRaisesRegex(collect.CollectionError, "one every 5 seconds"):
            gdelt.articles("a", "a", START, END)
        self.assertEqual(collect.Gdelt(lambda url: "", sleep=lambda s: None).articles("a", "a", START, END), [])

    def test_rate_limit_retries_then_gives_up(self):
        replies = iter([collect.CollectionError("api.gdeltproject.org returned HTTP 429: slow down"), json.dumps({"articles": []})])
        sleeps = []

        def fetch(url):
            reply = next(replies)
            if isinstance(reply, Exception):
                raise reply
            return reply

        self.assertEqual(collect.Gdelt(fetch, sleep=sleeps.append).articles("a", "a", START, END), [])
        self.assertEqual(sleeps, [15.0])

        def always_limited(url):
            raise collect.CollectionError("api.gdeltproject.org returned HTTP 429: slow down")

        with self.assertRaisesRegex(collect.CollectionError, "429"):
            collect.Gdelt(always_limited, sleep=lambda s: None).timeline("a", START, END)


class PageviewsTest(unittest.TestCase):
    def test_daily_views_and_missing_article(self):
        urls = []

        def fetch(url):
            urls.append(url)
            return json.dumps({"items": [{"timestamp": "2026100100", "views": 12}, {"timestamp": "2026100200", "views": 30}]})

        self.assertEqual(collect.pageviews("Acme Corp", START, END, fetch=fetch), {"2026-10-01": 12, "2026-10-02": 30})
        self.assertIn("/en.wikipedia/all-access/user/Acme_Corp/daily/2026100100/2026101100", urls[0])

        def missing(url):
            raise collect.CollectionError("wikimedia.org returned HTTP 404: not found")

        with self.assertRaisesRegex(collect.CollectionError, "--wiki-article"):
            collect.pageviews("Nope", START, END, fetch=missing)


class HackerNewsTest(unittest.TestCase):
    def test_hits_pages_and_engagement(self):
        pages = iter([
            json.dumps({"hits": [{"objectID": "1", "title": "Acme <b>launch</b>", "points": 10, "num_comments": 4, "created_at": "2026-10-02T00:00:00Z", "author": "x"}], "nbPages": 2}),
            json.dumps({"hits": [{"objectID": "2", "story_title": "Acme", "comment_text": "<p>love &amp; hate</p>", "created_at": "2026-10-03T00:00:00Z"}], "nbPages": 2}),
        ])
        found = collect.hacker_news("Acme", "Acme", START, 10, fetch=lambda url: next(pages))
        self.assertEqual([row["engagement"] for row in found], [14, None])
        self.assertIn("love & hate", found[1]["text"])
        self.assertEqual(found[0]["url"], "https://news.ycombinator.com/item?id=1")


class RedditTest(unittest.TestCase):
    def test_search_filters_window_and_wraps_errors(self):
        posts = [
            SimpleNamespace(id="p1", permalink="/r/x/p1", title="Acme rocks", selftext="body", created_utc=START.timestamp() + 3600, score=40, num_comments=5, subreddit="x"),
            SimpleNamespace(id="p0", permalink="/r/x/p0", title="old", selftext="", created_utc=START.timestamp() - 3600, score=1, num_comments=0, subreddit="x"),
        ]
        calls = []
        reddit = SimpleNamespace(subreddit=lambda name: SimpleNamespace(search=lambda query, **kw: calls.append((name, query, kw)) or posts))
        found = collect.reddit_search("Acme", '"Acme"', START, 30, 50, reddit)
        self.assertEqual([(row["id"], row["engagement"]) for row in found], [("reddit:p1", 45)])
        self.assertEqual(calls[0][2], {"sort": "new", "time_filter": "month", "limit": 50})

        def boom(**kw):
            raise RuntimeError("401 Unauthorized")

        broken = SimpleNamespace(subreddit=lambda name: SimpleNamespace(search=lambda query, **kw: boom()))
        with self.assertRaisesRegex(collect.CollectionError, "401"):
            collect.reddit_search("Acme", "q", START, 30, 5, broken)


class YouTubeTest(unittest.TestCase):
    def test_search_counts_units_and_engagement(self):
        def fetch(url):
            if "/search?" in url:
                return json.dumps({"pageInfo": {"totalResults": 812}, "items": [{"id": {"videoId": "v1"}, "snippet": {"title": "Acme &amp; me", "channelTitle": "C", "publishedAt": "2026-10-04T00:00:00Z"}}]})
            return json.dumps({"items": [{"id": "v1", "statistics": {"viewCount": "900", "likeCount": "30"}}]})

        youtube = collect.YouTubeSearch("K", fetch)
        found, total = youtube.search("Acme", '"Acme"', START, 50, "US")
        self.assertEqual((total, youtube.units), (812, 101))
        self.assertEqual((found[0]["title"], found[0]["engagement"], found[0]["views"]), ("Acme & me", 30, 900))


def fake_factories(fail_all: bool = False):
    def offline(*args, **kwargs):
        raise collect.CollectionError("offline")

    class FakeGdelt:
        def articles(self, brand, query, start, end, limit):
            if fail_all:
                offline()
            day = (end - timedelta(days=3)).strftime("%Y-%m-%d")
            return [{"brand": brand, "source": "gdelt", "id": f"g-{brand}-{i}", "url": f"https://news/{brand}/{i}",
                     "title": f"<script>{brand}</script> recall news" if brand == "Acme" else f"{brand} growth story",
                     "text": f"{brand} recall battery fire" if brand == "Acme" else f"{brand} growth great", "published_at": f"{day}T08:00:00Z",
                     "engagement": None, "author": "news", "language": "English"} for i in range(8 if brand == "Acme" else 2)]

        def timeline(self, query, start, end):
            if fail_all:
                offline()
            return {(start + timedelta(days=i)).strftime("%Y-%m-%d"): 0.1 for i in range(10)}

    def pageviews(article, start, end, project):
        if fail_all or article == "Missing":
            offline()
        return {(start + timedelta(days=i)).strftime("%Y-%m-%d"): 100 for i in range(10)}

    def hacker_news(brand, term, start, limit):
        if fail_all:
            offline()
        return [{"brand": brand, "source": "hackernews", "id": f"hn-{brand}", "url": f"https://hn/{brand}", "title": f"{brand} on HN",
                 "text": f"{brand} battery life", "published_at": (start + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z"),
                 "engagement": 12 if brand == "Acme" else 4, "author": "u", "language": None}]

    class FakeYouTube:
        units = 0

        def __init__(self, key):
            self.key = key

        def search(self, brand, query, start, limit, region):
            self.units += 100
            return [], 42

    return {"gdelt": FakeGdelt, "pageviews": pageviews, "hacker_news": hacker_news, "reddit": offline, "youtube": FakeYouTube}


class EndToEndTest(unittest.TestCase):
    def setUp(self):
        self.saved = {key: os.environ.pop(key, None) for key in ("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "YOUTUBE_API_KEY")}
        self.original_scorer = brand_insight.vader_scorer

    def tearDown(self):
        brand_insight.vader_scorer = self.original_scorer
        for key, value in self.saved.items():
            if value is not None:
                os.environ[key] = value

    def test_main_writes_html_and_xlsx(self):
        brand_insight.vader_scorer = lambda: ((lambda text: -0.6 if "recall" in text else 0.5), "fake VADER")
        with tempfile.TemporaryDirectory() as out:
            stderr = io.StringIO()
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(stderr):
                status = brand_insight.main(["--brand", "Acme", "--competitor", "Bolt", "--days", "10",
                                             "--wiki-article", "Bolt=Missing", "--out", out], fake_factories())
            self.assertEqual(status, 0)
            self.assertIn("Wikimedia Pageviews Bolt “Missing”: offline", stderr.getvalue())
            self.assertIn("non-commercial", stderr.getvalue())
            files = sorted(os.listdir(out))
            self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
            with open(os.path.join(out, files[0]), encoding="utf-8") as handle:
                page = handle.read()
            self.assertIn("&lt;script&gt;Acme&lt;/script&gt;", page)
            self.assertNotIn("<script>", page)
            for section in ["声量与 SOV", "情感与净情感趋势", "搜索与关注度趋势", "话题地图", "定位与联想词对比", "峰值事件时间线", "方法与口径 Method", "数据缺口 Data gaps"]:
                self.assertIn(section, page)
            self.assertIn("(正面 − 负面) ÷ (正面 + 负面) × 100", page)
            self.assertIn("<svg", page)
            # Acme: 9 of 12 mentions, 12 of 16 engagement, net sentiment (1 − 8) ÷ 9 × 100.
            self.assertIn('<td>Acme</td><td class="n">9</td><td class="n">75.0%</td><td class="n">12</td><td class="n">75.0%</td>', page)
            self.assertIn('<td class="n">-77.8</td>', page)
            self.assertNotIn('cy="420', page)
            with zipfile.ZipFile(os.path.join(out, files[1])) as book:
                sheets = book.read("xl/workbook.xml").decode()
            for name in ["mentions", "daily_metrics", "topics", "keywords", "sources_log", "run"]:
                self.assertIn(f'name="{name}"', sheets)

    def test_main_fails_without_any_data(self):
        with tempfile.TemporaryDirectory() as out:
            stderr = io.StringIO()
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(stderr):
                self.assertEqual(brand_insight.main(["--brand", "Acme", "--out", out], fake_factories(fail_all=True)), 2)
            self.assertIn("GDELT ArtList Acme", stderr.getvalue())
            self.assertIn("YOUTUBE_API_KEY", stderr.getvalue())
            self.assertEqual(os.listdir(out), [])

    def test_optional_sources_run_with_credentials(self):
        os.environ.update({"REDDIT_CLIENT_ID": "id", "REDDIT_CLIENT_SECRET": "secret", "YOUTUBE_API_KEY": "key"})
        brand_insight.vader_scorer = lambda: (None, None)
        with tempfile.TemporaryDirectory() as out:
            stderr = io.StringIO()
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(stderr):
                self.assertEqual(brand_insight.main(["--brand", "Acme", "--days", "10", "--out", out], fake_factories()), 0)
            self.assertIn("Reddit all “client”: offline", stderr.getvalue())
            self.assertIn("vaderSentiment is not installed", stderr.getvalue())
            self.assertNotIn("No YOUTUBE_API_KEY", stderr.getvalue())
            with open(os.path.join(out, sorted(os.listdir(out))[0]), encoding="utf-8") as handle:
                page = handle.read()
            self.assertIn("YouTube API units: 100", page)


if __name__ == "__main__":
    unittest.main()
