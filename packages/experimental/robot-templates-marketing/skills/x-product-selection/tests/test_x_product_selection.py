"""Offline tests for the X product-selection skill: metrics, the three collectors, and both report files."""

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
import x_product_selection  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)


def iso(moment: datetime) -> str:
    return moment.isoformat().replace("+00:00", "Z")


def post(post_id: str, text: str, hours_ago: float = 2, likes=5, author="a", source="hacker-news-algolia", platform="hn", **extra):
    record = {
        "id": post_id, "platform": platform, "source": source, "query": "q", "author": author, "author_id": author,
        "author_followers": None, "author_following": None, "author_created_at": None,
        "created_at": iso(NOW - timedelta(hours=hours_ago)), "lang": None, "text": text, "likes": likes,
        "reposts": None, "replies": 1, "quotes": None, "impressions": None, "links": [], "url": f"https://e/{post_id}",
        "community": "Hacker News" if platform == "hn" else extra.pop("community", None),
    }
    record.update(extra)
    return record


def x_page(ids, next_token=None, created="2026-11-03T12:00:00.000Z"):
    page = {
        "data": [{
            "id": tweet_id, "text": f"Just bought the <b>Ninja Creami</b> {tweet_id}", "author_id": "u1", "created_at": created, "lang": "en",
            "public_metrics": {"like_count": 10, "retweet_count": 2, "reply_count": 1, "quote_count": 0, "impression_count": 900},
            "entities": {"urls": [{"url": "https://t.co/x", "expanded_url": "https://amzn.to/abc"}]},
        } for tweet_id in ids],
        "includes": {"users": [{"id": "u1", "username": "shopper", "created_at": "2020-01-01T00:00:00.000Z",
                                "public_metrics": {"followers_count": 500, "following_count": 200}}]},
        "meta": {},
    }
    if next_token:
        page["meta"]["next_token"] = next_token
    return page


class MetricsTest(unittest.TestCase):
    def test_engagement_keeps_unknown_as_none(self):
        self.assertEqual(metrics.engagement({"likes": 3, "reposts": None, "replies": 2, "quotes": None}), 5)
        self.assertIsNone(metrics.engagement({"likes": None, "reposts": None, "replies": None, "quotes": None}))

    def test_alias_merging_and_lexicon(self):
        posts = [
            post("1", "Just bought the Ninja Creami and love it"),
            post("2", "My Creami makes great protein ice cream", author="b"),
            post("3", "ninja creami vs Yonanas?", author="c"),
            post("4", "The Yonanas is fine", author="d"),
            post("5", "Stanley Cups everywhere", author="e"),
            post("6", "Another Stanley Cup thread", author="f"),
        ]
        products = metrics.extract_products(posts, metrics.parse_lexicon(["Yonanas=yonanas maker"]), exclude=["ice cream"])
        self.assertEqual(products["Ninja Creami"], {0, 1, 2})
        self.assertEqual(products["Yonanas"], {2, 3})
        stanley = [name for name in products if name.lower().startswith("stanley")]
        self.assertEqual(len(stanley), 1)
        self.assertEqual(products[stanley[0]], {4, 5})
        self.assertNotIn("Just", products)

    def test_parse_lexicon(self):
        self.assertEqual(metrics.parse_lexicon(["A=b|c", "A=c|d", "=x"]), {"A": ["A", "b", "c", "d"]})

    def test_classify_commerce_links(self):
        hosts = [metrics.classify_link(url)["network"] for url in [
            "https://www.amazon.co.uk/dp/1", "https://amzn.to/x", "https://brand.myshopify.com/p", "https://example.com",
        ]]
        self.assertEqual(hosts, ["Amazon", "Amazon", "Shopify", None])
        summary = metrics.domain_summary([{"links": ["https://amzn.to/1", "https://amzn.to/2"]}, {"links": ["https://etsy.com/l"]}])
        self.assertEqual(summary, [["Amazon", 1, 2, "amzn.to"], ["Etsy", 1, 1, "etsy.com"]])

    def test_demand_signals(self):
        self.assertEqual(metrics.demand_signals("Any recs for a desk? where to buy, how much"), ["request", "where_to_buy", "price"])
        self.assertEqual(metrics.demand_signals(None), [])

    def test_bucket_counts_and_trend_score(self):
        times = [NOW - timedelta(hours=h) for h in (1, 2, 3, 30, 200)]
        self.assertEqual(metrics.bucket_counts(times + [None], NOW, "day", 7), [0, 0, 0, 0, 0, 1, 3])
        z, score = metrics.trend_score([1, 1, 1, 1, 5], 99)
        self.assertAlmostEqual(z, 4.0)
        self.assertAlmostEqual(score, 4.0 * 4.605170185988092)
        self.assertEqual(metrics.trend_score([1, 2, 3], None), (1.5, None))
        self.assertEqual(metrics.trend_score([3], 10), (None, None))

    def test_clean_posts_drops_duplicates_and_bots(self):
        long_text = "This is a long identical promo text for a gadget"
        posts = [
            post("1", long_text),
            post("1", long_text),
            post("2", long_text, author="b"),
            post("3", "fresh", author_created_at=iso(NOW - timedelta(days=3)), platform="x", source="x-api-v2"),
            post("4", "spammy", author_followers=5, author_following=4000, platform="x", source="x-api-v2"),
        ]
        kept, dropped = metrics.clean_posts(posts, NOW)
        self.assertEqual([item["id"] for item in kept], ["1"])
        self.assertEqual([item["drop_reason"] for item in dropped][0], "duplicate text")
        self.assertEqual(len(dropped), 3)

    def test_rank_products_status_and_opportunity(self):
        posts = [post(str(i), "Ninja Creami", hours_ago=2, author=f"u{i}", community=f"r/{i % 2}", platform="reddit", source="reddit") for i in range(4)]
        posts += [post("old1", "I like Yonanas", hours_ago=24 * 10), post("old2", "I like Yonanas", hours_ago=24 * 17, author="b")]
        products = metrics.extract_products(posts, {})
        rows = metrics.rank_products(posts, products, NOW, "week", 5)
        self.assertEqual(rows[0]["product"], "Ninja Creami")
        self.assertEqual(rows[0]["status"], "validated")
        self.assertEqual(rows[0]["opportunity"], 80.0)
        self.assertEqual(rows[-1]["status"], "rejected")


class XApiTest(unittest.TestCase):
    def test_search_paginates_counts_reads_and_maps_fields(self):
        calls = []
        pages = iter([x_page(["1", "2"], next_token="n2"), x_page(["3"])])

        def fetch(url, headers):
            calls.append((url, headers))
            return next(pages)

        api = collect.XApi("TOKEN", fetch)
        posts = api.search_recent("creami -is:retweet", 3)
        self.assertEqual(len(posts), 3)
        self.assertEqual(calls[0][1], {"Authorization": "Bearer TOKEN"})
        self.assertIn("tweet.fields=public_metrics%2Ccreated_at%2Clang%2Cauthor_id", calls[0][0])
        self.assertIn("expansions=author_id", calls[0][0])
        self.assertIn("user.fields=public_metrics%2Ccreated_at", calls[0][0])
        self.assertIn("next_token=n2", calls[1][0])
        self.assertEqual((api.posts_read, api.users_read, api.reads), (3, 2, 5))
        self.assertAlmostEqual(api.cost_usd, 0.025)
        first = posts[0]
        self.assertEqual((first["author"], first["author_followers"], first["likes"], first["links"]), ("shopper", 500, 10, ["https://amzn.to/abc"]))
        self.assertEqual(first["url"], "https://x.com/shopper/status/1")

    def test_max_reads_stops_paging(self):
        api = collect.XApi("T", lambda url, headers: x_page(["1"], next_token="more"), max_reads=6)
        api.search_recent("q", 100)
        self.assertTrue(api.capped)
        self.assertLessEqual(api.reads, 6)

    def test_user_timeline_and_errors(self):
        def fetch(url, headers):
            if "/users/by/username/" in url:
                return {"data": {"id": "9", "username": "brand", "created_at": "2019-01-01T00:00:00Z",
                                 "public_metrics": {"followers_count": 1000, "following_count": 10, "tweet_count": 50}}}
            return x_page(["7"])

        account, posts = collect.XApi("T", fetch).user_timeline("@brand", 5)
        self.assertEqual((account["handle"], account["followers"]), ("brand", 1000))
        self.assertEqual(posts[0]["account"], "brand")
        missing = collect.XApi("T", lambda url, headers: {"errors": [{"detail": "Could not find user"}]})
        with self.assertRaisesRegex(collect.CollectionError, "Could not find user"):
            missing.user_timeline("nobody", 5)

    def test_http_failures_become_collection_errors(self):
        import urllib.error
        import urllib.request

        original = urllib.request.urlopen

        def refuse(request, timeout):
            raise urllib.error.HTTPError(request.full_url, 402, "Payment Required", {}, io.BytesIO(b'{"title":"CreditsDepleted"}'))

        urllib.request.urlopen = refuse
        try:
            with self.assertRaisesRegex(collect.CollectionError, "HTTP 402: the X developer account has no pay-per-use credit"):
                collect.http_json("https://api.x.com/2/tweets/search/recent?q=x", {})
        finally:
            urllib.request.urlopen = original


class SubstituteSourcesTest(unittest.TestCase):
    def test_hacker_news_maps_hits_and_filters_by_time(self):
        calls = []

        def fetch(url, headers):
            calls.append(url)
            return {"nbPages": 1, "hits": [
                {"objectID": 11, "title": "Show HN: Desk Lamp", "url": "https://shop.example.myshopify.com/lamp", "author": "pg",
                 "points": 40, "num_comments": 12, "created_at": "2026-11-02T00:00:00Z"},
                {"objectID": 12, "comment_text": "<p>Bought one &amp; love it https://amzn.to/q</p>", "author": "x", "created_at_i": 1762000000},
                {"title": "no id"},
            ]}

        posts = collect.hn_search("desk lamp", 10, NOW - timedelta(days=35), fetch)
        self.assertIn("numericFilters=created_at_i%3E", calls[0])
        self.assertEqual([item["id"] for item in posts], ["11", "12"])
        self.assertEqual(posts[0]["links"], ["https://shop.example.myshopify.com/lamp"])
        self.assertEqual(posts[1]["text"], "Bought one & love it https://amzn.to/q")
        self.assertEqual(posts[1]["links"], ["https://amzn.to/q"])
        self.assertIsNone(posts[1]["likes"])
        with self.assertRaises(collect.CollectionError):
            collect.hn_search("q", 5, NOW, lambda url, headers: {"message": "bad"})

    def test_reddit_maps_submissions_and_wraps_failures(self):
        fresh = SimpleNamespace(id="r1", created_utc=(NOW - timedelta(days=2)).timestamp(), title="Any recs for Ninja Creami?",
                                selftext="see https://amzn.to/z", is_self=True, url="", author=SimpleNamespace(name="ann"),
                                subreddit="BuyItForLife", score=33, num_comments=4, permalink="/r/BuyItForLife/comments/r1/x/")
        stale = SimpleNamespace(id="r0", created_utc=(NOW - timedelta(days=90)).timestamp())
        reddit = SimpleNamespace(subreddit=lambda name: SimpleNamespace(search=lambda *a, **k: [fresh, stale]))
        posts = collect.reddit_search("creami", 10, NOW - timedelta(days=35), NOW, reddit=reddit)
        self.assertEqual(len(posts), 1)
        self.assertEqual((posts[0]["author"], posts[0]["likes"], posts[0]["community"]), ("ann", 33, "r/BuyItForLife"))
        self.assertEqual(posts[0]["links"], ["https://amzn.to/z"])

        def boom(*args, **kwargs):
            raise RuntimeError("403 forbidden")

        broken = SimpleNamespace(subreddit=lambda name: SimpleNamespace(search=boom))
        with self.assertRaisesRegex(collect.CollectionError, "403 forbidden"):
            collect.reddit_search("q", 5, NOW, NOW, reddit=broken)
        with self.assertRaisesRegex(collect.CollectionError, "REDDIT_CLIENT_ID"):
            collect.reddit_search("q", 5, NOW, NOW)


class EndToEndTest(unittest.TestCase):
    def _read_outputs(self, out):
        files = sorted(os.listdir(out))
        self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
        with open(os.path.join(out, files[0]), encoding="utf-8") as handle:
            page = handle.read()
        with zipfile.ZipFile(os.path.join(out, files[1])) as book:
            sheets = book.read("xl/workbook.xml").decode()
            strings = book.read("xl/sharedStrings.xml").decode()
        return page, sheets, strings

    def test_main_with_x_token_records_cost(self):
        original = collect.XApi.__init__
        collect.XApi.__init__ = lambda self, token, fetch=None, max_reads=None: original(self, token, lambda url, headers: x_page(["1", "2", "3"]), max_reads)
        try:
            with tempfile.TemporaryDirectory() as out:
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    status = x_product_selection.main(["--keyword", "ice cream maker", "--out", out], env={"X_BEARER_TOKEN": "T"})
                self.assertEqual(status, 0)
                page, sheets, strings = self._read_outputs(out)
                self.assertIn("&lt;b&gt;Ninja Creami&lt;/b&gt;", page)
                self.assertNotIn("<b>Ninja Creami</b>", page)
                self.assertIn("$0.02", page)
                self.assertIn("2026 年二手来源", page)
                self.assertIn("Amazon", page)
                for name in ["products", "posts", "search_interest", "cost_assumptions", "domains", "dropped_posts", "run"]:
                    self.assertIn(f'name="{name}"', sheets)
                self.assertIn("x_estimated_cost_usd", strings)
                self.assertIn("0.0200", strings)
        finally:
            collect.XApi.__init__ = original

    def test_main_without_token_uses_substitutes_and_states_gap(self):
        original = x_product_selection.hn_search
        x_product_selection.hn_search = lambda keyword, limit, since: [
            post("1", "Just bought a Ninja Creami <script>x</script>", author="a"), post("2", "Ninja Creami again", author="b"),
        ]
        try:
            with tempfile.TemporaryDirectory() as out:
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    status = x_product_selection.main(["--keyword", "ice cream", "--out", out], env={})
                self.assertEqual(status, 0)
                page, _, strings = self._read_outputs(out)
                self.assertIn("X 数据未采集", page)
                self.assertIn("&lt;script&gt;", page)
                self.assertNotIn("<script>", page)
                self.assertIn("Reddit 未采集", page)
                self.assertIn("X API not called", strings)
        finally:
            x_product_selection.hn_search = original

    def test_main_fails_with_reasons_when_nothing_collected(self):
        original = x_product_selection.hn_search
        x_product_selection.hn_search = lambda keyword, limit, since: (_ for _ in ()).throw(collect.CollectionError("offline"))
        try:
            with tempfile.TemporaryDirectory() as out:
                stderr = io.StringIO()
                with contextlib.redirect_stderr(stderr):
                    self.assertEqual(x_product_selection.main(["--keyword", "lamp", "--out", out], env={}), 2)
                self.assertIn("Hacker News “lamp”: offline", stderr.getvalue())
                self.assertIn("X data was not collected", stderr.getvalue())
                self.assertEqual(os.listdir(out), [])
        finally:
            x_product_selection.hn_search = original


if __name__ == "__main__":
    unittest.main()
