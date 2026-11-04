"""Offline tests for the creative-intelligence skill: metrics, the Ad Library collector, landing pages, and both report files."""

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
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))

import collect  # noqa: E402
import creative_intelligence  # noqa: E402
import metrics  # noqa: E402

TODAY = date(2026, 11, 4)


def raw_ad(ad_id, body="Tired of messy cables? Shop now at tidydesk.com", start="2026-09-01", stop=None, page="TidyDesk", titles=None):
    return {
        "id": ad_id, "page_id": "p1", "page_name": page, "ad_creative_bodies": [body] if body else [],
        "ad_creative_link_titles": titles if titles is not None else ["TidyDesk cable box"], "ad_delivery_start_time": start,
        "ad_delivery_stop_time": stop, "ad_snapshot_url": f"https://www.facebook.com/ads/archive/render_ad/?id={ad_id}",
        "publisher_platforms": ["facebook", "instagram"], "languages": ["en"],
    }


def ad(ad_id, **kwargs):
    return collect.ad_record(raw_ad(ad_id, **kwargs), "DE", "tidy")


class TimeTest(unittest.TestCase):
    def test_days_running_uses_stop_or_today(self):
        self.assertEqual(metrics.days_running(ad("1", start="2026-10-01"), TODAY), 34)
        self.assertEqual(metrics.days_running(ad("1", start="2026-10-01", stop="2026-10-11"), TODAY), 10)
        self.assertEqual(metrics.days_running(ad("1", start="2026-10-01T08:00:00+0000"), TODAY), 34)
        self.assertIsNone(metrics.days_running(ad("1", start=None), TODAY))

    def test_weekly_intensity_groups_by_monday(self):
        rows = metrics.weekly_intensity([ad("1", start="2026-11-04"), ad("2", start="2026-11-02"), ad("3", start="2026-10-28"), ad("4", start=None)])
        self.assertEqual(rows, [["2026-10-26", "TidyDesk", 1], ["2026-11-02", "TidyDesk", 2]])


class ClusterTest(unittest.TestCase):
    def test_normalize_and_shingles(self):
        self.assertEqual(metrics.normalize_copy("Save 20%! Visit https://x.com/a NOW."), "save 20% visit now")
        self.assertEqual(metrics.shingles("a b"), {"a b"})
        self.assertEqual(len(metrics.shingles("一二三四五")), 2)
        self.assertEqual(metrics.jaccard(set(), set()), 0.0)

    def test_near_duplicates_cluster_at_threshold(self):
        base = "the cable box that hides every cord under your desk in seconds and looks great"
        ads = [
            ad("1", body=base), ad("2", body=base + "!"), ad("3", body=base.replace("great", "amazing")),
            ad("4", body=base.replace("seconds", "minutes").replace("great", "amazing")),
            ad("5", body="completely different copy about standing desks for tall people"), ad("6", body=None, titles=[]),
        ]
        # 12 of 14 shingles shared (0.86) merges; 9 of 17 (0.53) does not.
        self.assertEqual(metrics.cluster_ads(ads), [0, 0, 0, 1, 2, 3])
        self.assertEqual(metrics.cluster_ads(ads, threshold=0.9), [0, 0, 1, 2, 3, 4])


class TaggingTest(unittest.TestCase):
    def test_first_sentence(self):
        self.assertEqual(metrics.first_sentence("\nHello there. Second one."), "Hello there.")
        self.assertEqual(metrics.first_sentence("你好。第二句"), "你好。")
        self.assertEqual(metrics.first_sentence(None), "")

    def test_hook_lexicon(self):
        cases = {
            "Why do cables always tangle?": "question",
            "Tired of messy cables": "pain_point",
            "Forget zip ties.": "contrast",
            "Loved by 50,000 customers.": "social_proof",
            "50% off today only.": "price_shock",
            "“I can't believe how tidy my desk is now.”": "ugc_testimonial",
            "Meet the cable box.": "statement",
        }
        for sentence, label in cases.items():
            self.assertEqual(metrics.classify_hook(sentence)[0], label, sentence)
        self.assertEqual(metrics.classify_hook("Tired of tangles? 50% off")[1], ["price_shock", "pain_point"])
        self.assertEqual(metrics.classify_hook(""), (None, []))

    def test_cta_format_domains(self):
        self.assertEqual(metrics.detect_cta(ad("1")), "Shop now")
        self.assertEqual(metrics.detect_cta(ad("1", body="Hello", titles=["Learn more about us"])), "Learn more")
        self.assertIsNone(metrics.detect_cta(ad("1", body="Hello", titles=[])))
        self.assertEqual(metrics.format_proxy(ad("1")), "single link ad")
        self.assertEqual(metrics.format_proxy(ad("1", titles=["a", "b"])), "multi-version (carousel or dynamic creative)")
        self.assertEqual(metrics.format_proxy(ad("1", body=None, titles=[])), "no copy returned")
        self.assertEqual(metrics.link_domains(ad("1", body="Go to www.TidyDesk.com or shop.tidydesk.co.uk")), ["tidydesk.com", "shop.tidydesk.co.uk"])

    def test_offer_signals(self):
        self.assertEqual(metrics.offer_signals("Get 20% off. Free shipping over $50. 30-day guarantee. 20% OFF"), ["20% off", "free shipping", "30-day guarantee"])


class EnrichAndBriefTest(unittest.TestCase):
    def test_clusters_ranked_by_heat_and_briefs_cite_sources(self):
        base = "the cable box that hides every cord under your desk in seconds"
        ads = [ad("1", body=base, start="2026-06-01"), ad("2", body=base, start="2026-06-10"), ad("3", body="Why buy zip ties? Learn more", start="2026-10-30")]
        rows, clusters = metrics.enrich(ads, TODAY)
        self.assertEqual([cluster["variants"] for cluster in clusters], [2, 1])
        self.assertEqual(clusters[0]["max_days"], 156)
        self.assertGreater(clusters[0]["heat"], clusters[1]["heat"])
        self.assertEqual(rows[2]["hook"], "question")
        briefs = metrics.brief_stubs(clusters)
        self.assertEqual(len(briefs), 3)
        self.assertTrue(all(brief["title"].startswith("DRAFT") for brief in briefs))
        self.assertEqual(briefs[0]["source_ads"], ["1", "2"])
        self.assertIn("whitespace", briefs[2]["title"])

    def test_distribution_and_markets(self):
        self.assertEqual(metrics.distribution(["a", None, "a"]), [("a", 2, 2 / 3), ("not detected", 1, 1 / 3)])
        rows, _ = metrics.enrich([ad("1")], TODAY)
        self.assertEqual(metrics.market_rows(rows)[0]["country"], "DE")


class AdLibraryTest(unittest.TestCase):
    def test_search_builds_query_and_follows_paging(self):
        calls = []
        pages = {
            "first": {"data": [raw_ad("1"), raw_ad("2")], "paging": {"next": "https://graph.facebook.com/v21.0/ads_archive?after=x"}},
            "second": {"data": [raw_ad("3")]},
        }

        def fetch(url):
            calls.append(url)
            return pages["second" if "after=" in url else "first"]

        library = collect.AdLibrary("TOKEN", fetch)
        ads = library.search(["DE"], 10, terms="tidy desk", since="2026-08-01")
        self.assertEqual([item["id"] for item in ads], ["1", "2", "3"])
        self.assertEqual(library.requests, 2)
        query = urllib.parse.parse_qs(urllib.parse.urlparse(calls[0]).query)
        self.assertEqual(query["ad_reached_countries"], ['["DE"]'])
        self.assertEqual(query["ad_type"], ["ALL"])
        self.assertEqual(query["search_terms"], ["tidy desk"])
        self.assertEqual(query["ad_delivery_date_min"], ["2026-08-01"])
        for field in ["ad_creative_bodies", "ad_creative_link_titles", "ad_delivery_start_time", "ad_delivery_stop_time", "ad_snapshot_url", "page_name", "publisher_platforms", "languages"]:
            self.assertIn(field, query["fields"][0])
        self.assertTrue(calls[0].startswith("https://graph.facebook.com/v21.0/ads_archive?"))

    def test_page_ids_limit_and_errors(self):
        calls = []
        library = collect.AdLibrary("T", lambda url: calls.append(url) or {"data": [raw_ad(str(i)) for i in range(5)], "paging": {"next": "n"}})
        self.assertEqual(len(library.search(["FR"], 3, page_ids=["111", "222"])), 3)
        self.assertIn("search_page_ids", calls[0])
        self.assertEqual(len(calls), 1)
        with self.assertRaisesRegex(collect.CollectionError, "Invalid token"):
            collect.AdLibrary("T", lambda url: {"error": {"message": "Invalid token"}}).search(["FR"], 3, terms="x")
        with self.assertRaises(collect.CollectionError):
            collect.AdLibrary("T", lambda url: {}).search(["FR"], 3)

    def test_merge_unites_countries(self):
        merged = collect.merge_ads([collect.ad_record(raw_ad("1"), "DE", "q"), collect.ad_record(raw_ad("1"), "FR", "q"), collect.ad_record({"id": ""}, "FR", "q")])
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["countries"], ["DE", "FR"])

    def test_ads_file_formats(self):
        with tempfile.TemporaryDirectory() as folder:
            wrapped, lines, empty = (os.path.join(folder, name) for name in ["a.json", "b.jsonl", "c.json"])
            with open(wrapped, "w", encoding="utf-8") as handle:
                json.dump({"data": [raw_ad("1")]}, handle)
            with open(lines, "w", encoding="utf-8") as handle:
                handle.write(json.dumps(raw_ad("2")) + "\n" + json.dumps(raw_ad("3")) + "\n")
            with open(empty, "w", encoding="utf-8") as handle:
                handle.write("[]")
            self.assertEqual(collect.load_ads_file(wrapped)[0]["id"], "1")
            self.assertEqual([item["id"] for item in collect.load_ads_file(lines)], ["2", "3"])
            with self.assertRaisesRegex(collect.CollectionError, "no ads"):
                collect.load_ads_file(empty)
            with self.assertRaises(collect.CollectionError):
                collect.load_ads_file(os.path.join(folder, "missing.json"))


LANDING_HTML = """<!doctype html><html><head><meta charset="utf-8"><title> TidyDesk &amp; Co </title>
<meta name="description" content="Hide every cable in seconds.">
<meta property="og:title" content="TidyDesk cable box"><meta property="og:description" content="Free shipping over $50">
<style>.x{color:red}</style><script>var price = "$999";</script></head>
<body><nav><a href="/about">About</a> <a class="btn btn-primary" href="/shop">Browse</a></nav>
<h1>The cable box <em>your desk</em> deserves</h1><h2>Loved by 50,000 customers</h2><h2>Second h2</h2>
<p>Now $29.99, was €39,00. Japan: ¥1,980 or 1980円. 20% off today.</p>
<div hidden>Hidden $5 promo</div><span aria-hidden="true">decor</span>
<button type="button">Add to cart</button><a href="/cart">Shop now</a><a role="button" href="#">Get started</a>
<form><input type="submit" value="Subscribe"></form><noscript>Enable JS</noscript><p>USD 15 shipping cap<br>next line</p>
</body></html>"""


class LandingPageTest(unittest.TestCase):
    def test_parse_landing_html_extracts_every_field(self):
        page = metrics.parse_landing_html(LANDING_HTML)
        self.assertEqual(page["title"], "TidyDesk & Co")
        self.assertEqual(page["description"], "Hide every cable in seconds.")
        self.assertEqual(page["og_title"], "TidyDesk cable box")
        self.assertEqual(page["og_description"], "Free shipping over $50")
        self.assertEqual((page["h1"], page["h2"], page["headline"]), ("The cable box your desk deserves", "Loved by 50,000 customers", "The cable box your desk deserves"))
        self.assertEqual(page["prices"], ["$29.99", "€39,00", "¥1,980", "1980円", "USD 15", "$50"])
        self.assertEqual(page["ctas"], ["Browse", "Add to cart", "Shop now", "Get started", "Subscribe"])
        self.assertIn("20% off", page["offers"])
        self.assertIn("free shipping", page["offers"])
        for hidden in ["$999", "Hidden $5", "decor", "Enable JS", ".x{"]:
            self.assertNotIn(hidden, page["text"])
        self.assertIn("next line", page["text"].splitlines())
        self.assertNotIn("About", page["ctas"])

    def test_parse_empty_and_script_only_pages(self):
        page = metrics.parse_landing_html("<html><head><title>App</title></head><body><div id=root></div><script>render()</script></body></html>")
        self.assertEqual((page["title"], page["text"], page["prices"], page["ctas"], page["h1"]), ("App", "", [], [], None))
        self.assertIsNone(metrics.parse_landing_html("")["title"])

    def test_price_strings(self):
        self.assertEqual(metrics.price_strings("R$ 49,90 and A$20, £5 or 12 zł; 2024 was great"), ["R$ 49,90", "A$20", "£5", "12 zł"])

    def test_fetch_landing_html_is_injectable_and_raises(self):
        urls = []
        self.assertEqual(collect.fetch_landing_html("tidydesk.com", lambda url: urls.append(url) or "<p>x</p>"), ("https://tidydesk.com/", "<p>x</p>"))
        self.assertEqual(urls, ["https://tidydesk.com/"])
        self.assertEqual(collect.fetch_landing_html("https://a.example/lp", lambda url: "<p/>")[0], "https://a.example/lp")
        with self.assertRaisesRegex(collect.CollectionError, "empty page"):
            collect.fetch_landing_html("x.com", lambda url: "  ")

        def boom(url):
            raise OSError("timeout")

        with self.assertRaisesRegex(collect.CollectionError, "timeout"):
            collect.fetch_landing_html("x.com", boom)

    def test_collect_landing_pages_records_gaps(self):
        rows, _ = metrics.enrich([ad("1", body="Visit tidydesk.com"), ad("2", body="See spa.example.com"), ad("3", body="Go to down.example.com")], TODAY)

        def fetch(url):
            if "down" in url:
                raise collect.CollectionError(f"{url} returned HTTP 403")
            return LANDING_HTML if "tidydesk" in url else "<html><body><script>app()</script></body></html>"

        gaps: list = []
        pages = creative_intelligence.collect_landing_pages(rows, 5, gaps, fetch)
        self.assertEqual([page["domain"] for page in pages], ["tidydesk.com", "spa.example.com"])
        self.assertEqual(pages[0]["ads_linking"], 1)
        self.assertIn("$29.99", pages[0]["prices"])
        self.assertTrue(any("no visible text" in gap for gap in gaps))
        self.assertTrue(any("HTTP 403" in gap for gap in gaps))
        none: list = []
        creative_intelligence.collect_landing_pages(metrics.enrich([ad("9", body="No domain here", titles=[])], TODAY)[0], 5, none)
        self.assertIn("No landing-page domain", none[0])


class EndToEndTest(unittest.TestCase):
    def setUp(self):
        self.token = os.environ.pop("META_ACCESS_TOKEN", None)
        self.original_init = collect.AdLibrary.__init__
        self.original_fetch = collect.http_html

    def tearDown(self):
        collect.AdLibrary.__init__ = self.original_init
        collect.http_html = self.original_fetch
        if self.token is not None:
            os.environ["META_ACCESS_TOKEN"] = self.token

    def test_main_writes_html_and_xlsx_from_the_api(self):
        body = "<script>alert(1)</script> Tired of messy cables? Shop now at tidydesk.com"

        def fetch(url):
            return {"data": [raw_ad("1", body=body, start="2026-05-01"), raw_ad("2", body=body, start="2026-05-03"), raw_ad("3", body="Loved by 10,000 customers. Learn more", start="2026-10-20", page="<b>Rival</b>")]}

        original = self.original_init
        collect.AdLibrary.__init__ = lambda self, token, fetch_=None: original(self, token, fetch)
        collect.http_html = lambda url: LANDING_HTML.replace("Browse", "<img src=x onerror=alert(2)>Browse")
        with tempfile.TemporaryDirectory() as out:
            stderr = io.StringIO()
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(stderr):
                status = creative_intelligence.main(["--search", "tidy", "--country", "de", "--country", "US", "--landing-pages", "--access-token", "T", "--out", out])
            self.assertEqual(status, 0)
            self.assertIn("US", stderr.getvalue())
            files = sorted(os.listdir(out))
            self.assertEqual([name.rsplit(".", 1)[1] for name in files], ["html", "xlsx"])
            with open(os.path.join(out, files[0]), encoding="utf-8") as handle:
                page = handle.read()
            self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", page)
            self.assertNotIn("<script>", page)
            self.assertIn("&lt;b&gt;Rival&lt;/b&gt;", page)
            self.assertIn("EU and the UK", page)
            self.assertIn("DRAFT", page)
            self.assertIn("free shipping", page)
            self.assertIn("$29.99", page)
            self.assertIn("Add to cart", page)
            self.assertIn("TidyDesk &amp; Co", page)
            self.assertNotIn("<img", page)
            self.assertIn("API requests: 2", page)
            with zipfile.ZipFile(os.path.join(out, files[1])) as book:
                sheets = book.read("xl/workbook.xml").decode()
            for name in ["ads", "creative_tags", "clusters", "landing_pages", "frames_index", "briefs", "run"]:
                self.assertIn(f'name="{name}"', sheets)

    def test_main_reports_missing_token_and_fails(self):
        with tempfile.TemporaryDirectory() as out:
            stderr = io.StringIO()
            with contextlib.redirect_stderr(stderr):
                self.assertEqual(creative_intelligence.main(["--search", "tidy", "--out", out]), 2)
            self.assertIn("META_ACCESS_TOKEN", stderr.getvalue())
            self.assertEqual(os.listdir(out), [])


if __name__ == "__main__":
    unittest.main()
