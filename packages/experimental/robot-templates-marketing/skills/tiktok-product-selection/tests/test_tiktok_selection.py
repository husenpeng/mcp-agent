"""Offline tests for the TikTok product-selection skill: metrics, collectors, state, and both report files."""

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
import tiktok_selection  # noqa: E402

NOW = datetime(2026, 11, 4, 0, 0, tzinfo=timezone.utc)
SHEETS = ["products", "videos", "search_interest", "cost_assumptions", "snapshots", "competition", "run"]


def snap(product_id, sold, captured, price=10.0, **extra):
    return {"product_id": product_id, "title": f"title {product_id}", "price": price, "sold_count": sold, "captured_at": captured, **extra}


def write(path, text):
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


class SalesTest(unittest.TestCase):
    def test_snapshot_difference_per_day(self):
        rows = metrics.sales_intervals([snap("p", 150, "2026-11-03T00:00:00Z", 20.0), snap("p", 100, "2026-11-01T00:00:00Z")])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["sold"], 50)
        self.assertAlmostEqual(rows[0]["daily_sold"], 25.0)
        self.assertAlmostEqual(rows[0]["gmv"], 1000.0)

    def test_missing_and_decreasing_counts_stay_none(self):
        rows = metrics.sales_intervals([snap("p", None, "2026-11-01"), snap("p", 5, "2026-11-02"), snap("p", 3, "2026-11-03")])
        self.assertIsNone(rows[0]["daily_sold"])
        self.assertEqual(rows[0]["problem"], "sold count missing")
        self.assertIsNone(rows[1]["gmv"])
        self.assertIn("decreased", rows[1]["problem"])

    def test_single_snapshot_needs_a_second(self):
        summary = metrics.sales_summary([snap("p", 10, "2026-11-03")], NOW)
        self.assertTrue(summary["needs_second_snapshot"])
        self.assertIsNone(summary["latest_daily_gmv"])
        self.assertIsNone(summary["window_gmv"])

    def test_window_totals_and_growth(self):
        history = [snap("p", sold, f"2026-10-{day:02d}T00:00:00Z") for day, sold in [(1, 0), (19, 10), (20, 20), (21, 30), (22, 50), (23, 80)]]
        summary = metrics.sales_summary(history, NOW, window_days=15)
        self.assertEqual(summary["window_sold"], 70)
        self.assertAlmostEqual(summary["window_gmv"], 700.0)
        self.assertAlmostEqual(summary["latest_daily_gmv"], 300.0)
        self.assertAlmostEqual(summary["gmv_growth"], 1.5)


class TrendTest(unittest.TestCase):
    def test_t_distribution_p_value(self):
        self.assertAlmostEqual(metrics.t_two_sided_p(2.0, 10), 0.0734, places=3)
        self.assertAlmostEqual(metrics.t_two_sided_p(0.0, 5), 1.0, places=6)

    def test_slope_test(self):
        result = metrics.slope_test([(0, 1), (1, 2.1), (2, 2.9), (3, 4.2), (4, 5.0)])
        self.assertAlmostEqual(result["slope_per_week"], 7 * 1.0, places=0)
        self.assertLess(result["p_value"], 0.01)
        self.assertIsNone(metrics.slope_test([(0, 1), (1, 2)]))
        self.assertIsNone(metrics.slope_test([(1, 1), (1, 2), (1, 3)]))

    def test_keyword_trend_uses_window(self):
        series = [((NOW - timedelta(days=day)).date().isoformat(), 100 - day) for day in range(40)]
        trend = metrics.keyword_trend(series, NOW, 28)
        self.assertEqual(trend["n"], 29)
        self.assertGreater(trend["slope_per_week"], 0)

    def test_content_heat_prefers_hashtag_snapshots(self):
        heat = metrics.content_heat([{"captured_at": "2026-11-01", "views": 1000}, {"captured_at": "2026-11-03", "views": 1200}], [], NOW)
        self.assertEqual(heat["basis"], "hashtag views")
        self.assertAlmostEqual(heat["views_gain_per_day"], 100.0)
        self.assertAlmostEqual(heat["rate"], 0.1)
        self.assertTrue(heat["growing"])

    def test_content_heat_posting_volume_proxy_and_single_snapshot(self):
        videos = [{"published_at": (NOW - timedelta(days=day, hours=1)).isoformat()} for day in range(10) for _ in range(10 - day)]
        heat = metrics.content_heat([{"captured_at": "2026-11-03", "views": 5}], videos, NOW, 28)
        self.assertEqual(heat["basis"], "posting volume (proxy)")
        self.assertTrue(heat["growing"])
        single = metrics.content_heat([{"captured_at": "2026-11-03", "views": 5}], [], NOW)
        self.assertIsNone(single["growing"])
        self.assertIsNone(metrics.content_heat([], [], NOW))

    def test_dual_validation(self):
        up = {"growing": True, "basis": "hashtag views"}
        down = {"growing": False, "basis": "hashtag views"}
        rising = {"slope_per_week": 2.0, "p_value": 0.01}
        noisy = {"slope_per_week": 2.0, "p_value": 0.5}
        falling = {"slope_per_week": -1.0, "p_value": 0.01}
        self.assertEqual(metrics.validate(up, rising)[0], "validated")
        self.assertEqual(metrics.validate(up, noisy)[0], "watch")
        self.assertEqual(metrics.validate(down, falling)[0], "rejected")
        self.assertEqual(metrics.validate(None, rising)[0], "watch")
        self.assertIn("第二次快照", metrics.validate(None, None)[1][0])


class MarginTest(unittest.TestCase):
    def test_category_commission_and_net(self):
        assumptions = metrics.DEFAULT_ASSUMPTIONS
        unit = metrics.margin(50.0, "Beauty", assumptions)
        self.assertEqual(unit["commission_rate"], 0.15)
        expected = 50 - 15 - 3 - 7.5 - 3.57 - 5 - 2.5
        self.assertAlmostEqual(unit["net"], expected)
        self.assertAlmostEqual(metrics.margin(50.0, None, assumptions, cogs=5.0)["lines"][0][1], 5.0)
        self.assertEqual(metrics.commission_rate("unknown", assumptions), 0.10)
        self.assertIsNone(metrics.margin(None, "beauty", assumptions))

    def test_scores_renormalize_missing_signals(self):
        rows = [
            {"product_id": "a", "signal_gmv": 100, "signal_heat": None, "signal_trend": None, "signal_margin": 0.3},
            {"product_id": "b", "signal_gmv": 0, "signal_heat": None, "signal_trend": None, "signal_margin": 0.1},
            {"product_id": "c", "signal_gmv": None, "signal_heat": None, "signal_trend": None, "signal_margin": None},
        ]
        scores = metrics.opportunity_scores(rows, {"gmv": 0.5, "heat": 0.2, "trend": 0.1, "margin": 0.2})
        self.assertAlmostEqual(scores["a"][0], 100.0)
        self.assertAlmostEqual(scores["b"][0], 0.0)
        self.assertEqual(scores["a"][1], ["gmv", "margin"])
        self.assertIsNone(scores["c"][0])

    def test_keyword_match_and_concentration(self):
        self.assertEqual(metrics.match_keyword("Glossy Lip Oil, Cherry", ["serum", "lip oil"]), "lip oil")
        self.assertIsNone(metrics.match_keyword(None, ["lip oil"]))
        self.assertAlmostEqual(metrics.concentration([5, 3, 1, 1, None]), 0.9)
        self.assertIsNone(metrics.concentration([None]))
        self.assertEqual(metrics.hashtag_name("Lip Oil!"), "lipoil")


class CollectTest(unittest.TestCase):
    def test_snapshot_csv(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "p.csv")
            write(path, "product_id,title,price,sold_count,captured_at,category\n1,Lip oil,$12.50,1.2K,2026-11-03,beauty\n")
            rows = collect.read_snapshot_csv(path)
            self.assertEqual(rows[0]["price"], 12.5)
            self.assertEqual(rows[0]["sold_count"], 1200)
            self.assertEqual(rows[0]["category"], "beauty")
            write(path, "product_id,title,price\n1,x,2\n")
            with self.assertRaisesRegex(collect.CollectionError, "sold_count"):
                collect.read_snapshot_csv(path)
            write(path, "product_id,title,price,sold_count,captured_at\n1,x,abc,1,2026-11-03\n")
            with self.assertRaisesRegex(collect.CollectionError, "line 2"):
                collect.read_snapshot_csv(path)
        with self.assertRaises(collect.CollectionError):
            collect.read_snapshot_csv(os.path.join(HERE, "missing.csv"))

    def test_product_page_json_ld(self):
        page = (
            '<html><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Product",'
            '"name":"Lip &amp; Oil","sku":"1729","brand":{"name":"Glow"},"offers":{"@type":"Offer","price":"9.99"}}]}</script>'
            '<script>{"sold_count": "3,400"}</script></html>'
        )
        record = collect.fetch_product_page("https://shop.example/view/product/1729000000", NOW, fetch=lambda url: page)
        self.assertEqual(record["product_id"], "1729")
        self.assertEqual(record["title"], "Lip & Oil")
        self.assertEqual(record["price"], 9.99)
        self.assertEqual(record["sold_count"], 3400)
        self.assertEqual(record["shop"], "Glow")
        with self.assertRaisesRegex(collect.CollectionError, "no JSON-LD Product"):
            collect.parse_product_page("u", "<html></html>", NOW)
        with self.assertRaisesRegex(collect.CollectionError, "offers.price"):
            collect.parse_product_page("u", '<script type="application/ld+json">{"@type":"Product","offers":{}}</script>', NOW)

    def test_hashtag_via_injected_runner(self):
        raw = {
            "info": {"challengeInfo": {"challenge": {"title": "lipoil"}, "statsV2": {"viewCount": "123456", "videoCount": "40"}}},
            "videos": [{"id": "7", "desc": "d", "createTime": 1_762_000_000, "author": {"uniqueId": "maker"},
                        "stats": {"playCount": 1000, "diggCount": 50, "commentCount": 5, "shareCount": 2},
                        "challenges": [{"title": "lipoil"}]}],
        }
        result = collect.fetch_hashtag("lipoil", 5, "TOKEN", NOW, run=lambda name, limit, token: raw)
        self.assertEqual(result["snapshot"]["views"], 123456)
        self.assertEqual(result["videos"][0]["author"], "maker")
        self.assertEqual(result["videos"][0]["url"], "https://www.tiktok.com/@maker/video/7")
        self.assertIsNone(collect.video_record({"id": 1})["views"])

    def test_hashtag_failures(self):
        with self.assertRaisesRegex(collect.CollectionError, "TIKTOK_MS_TOKEN"):
            collect.fetch_hashtag("x", 5, None, NOW)

        def blocked(name, limit, token):
            raise RuntimeError("captcha")

        with self.assertRaisesRegex(collect.CollectionError, "captcha"):
            collect.fetch_hashtag("x", 5, "T", NOW, run=blocked)
        with self.assertRaisesRegex(collect.CollectionError, "no stats"):
            collect.fetch_hashtag("x", 5, "T", NOW, run=lambda *a: {"info": {}, "videos": []})

    def test_state_round_trip(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "state.json")
            state = collect.load_state(path)
            collect.merge_snapshots(state, [snap("p", 1, "2026-11-02"), snap("p", 1, "2026-11-02")], {"tag": {"captured_at": "2026-11-02", "views": 5}})
            collect.save_state(path, state)
            loaded = collect.load_state(path)
            self.assertEqual(len(loaded["products"]["p"]), 1)
            self.assertEqual(loaded["hashtags"]["tag"][0]["views"], 5)
            write(path, "{bad")
            with self.assertRaisesRegex(collect.CollectionError, "unreadable"):
                collect.load_state(path)
            write(path, json.dumps({"version": 99}))
            with self.assertRaisesRegex(collect.CollectionError, "version"):
                collect.load_state(path)


class EndToEndTest(unittest.TestCase):
    def _run(self, argv):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            status = tiktok_selection.main(argv)
        return status, stdout.getvalue(), stderr.getvalue()

    def test_two_runs_compute_deltas_and_write_both_files(self):
        original = collect.fetch_hashtag
        captures = iter([(timedelta(days=2), 10_000), (timedelta(0), 15_000)])

        def fake_hashtag(name, limit, token, now, run=None):
            age, views = next(captures)
            return {"snapshot": {"captured_at": (now - age).isoformat(timespec="seconds"), "views": views, "videos": 3},
                    "videos": [{"id": "v1", "author": "<script>x</script>", "published_at": "2026-11-01T00:00:00+00:00", "views": 100,
                                "likes": 10, "comments": 1, "shares": 0, "hashtags": [name], "url": None, "description": "", "source": "fake"}]}

        collect.fetch_hashtag = fake_hashtag
        os.environ["TIKTOK_MS_TOKEN"] = "T"
        try:
            with tempfile.TemporaryDirectory() as folder:
                out = os.path.join(folder, "out")
                csv_path = os.path.join(folder, "p.csv")
                trend_path = os.path.join(folder, "t.csv")
                state = os.path.join(folder, "state.json")
                today = datetime.now(timezone.utc)
                trend_rows = "".join(f"lip oil,{(today - timedelta(days=d)).date().isoformat()},{100 - d * 2}\n" for d in range(10))
                write(trend_path, "keyword,date,value\n" + trend_rows)
                first = (today - timedelta(days=2)).isoformat(timespec="seconds")
                write(csv_path, "product_id,title,price,sold_count,captured_at,category\n"
                                f"1,<b>Lip Oil</b> cherry,12,100,{first},beauty\n2,Serum,30,50,{first},health\n")
                argv = ["--snapshot-csv", csv_path, "--keyword", "lip oil", "--trend-csv", trend_path, "--state", state, "--out", out]
                status, stdout, stderr = self._run(argv)
                self.assertEqual(status, 0)
                self.assertIn("deltas need a second snapshot", stderr)
                html_path = stdout.split()[0]
                with open(html_path, encoding="utf-8") as handle:
                    page = handle.read()
                self.assertIn("首次快照 First snapshot", page)

                second = today.isoformat(timespec="seconds")
                write(csv_path, "product_id,title,price,sold_count,captured_at,category\n"
                                f"1,<b>Lip Oil</b> cherry,12,300,{second},beauty\n2,Serum,30,50,{second},health\n")
                for name in os.listdir(out):
                    os.remove(os.path.join(out, name))
                status, stdout, stderr = self._run(argv)
                self.assertEqual(status, 0)
                html_path, xlsx_path = stdout.split()
                with open(html_path, encoding="utf-8") as handle:
                    page = handle.read()
                self.assertNotIn("首次快照 First snapshot", page)
                self.assertIn("&lt;b&gt;Lip Oil&lt;/b&gt;", page)
                self.assertNotIn("<b>Lip Oil</b>", page)
                self.assertIn("$1,200.00", page)
                self.assertIn("已验证 validated", page)
                for section in ["估算口径声明", "品类大盘", "双验证四象限", "单品卡片", "竞争格局", "风险", "方法与口径 Method", "数据缺口 Data gaps"]:
                    self.assertIn(section, page)
                with zipfile.ZipFile(xlsx_path) as book:
                    sheets = book.read("xl/workbook.xml").decode()
                for name in SHEETS:
                    self.assertIn(f'name="{name}"', sheets)
                with open(state, encoding="utf-8") as handle:
                    self.assertEqual(len(json.load(handle)["products"]["1"]), 2)
        finally:
            collect.fetch_hashtag = original
            os.environ.pop("TIKTOK_MS_TOKEN", None)

    def test_exit_2_without_snapshots(self):
        with tempfile.TemporaryDirectory() as folder:
            out = os.path.join(folder, "out")
            status, _, stderr = self._run(["--snapshot-csv", os.path.join(folder, "missing.csv"), "--out", out])
            self.assertEqual(status, 2)
            self.assertIn("cannot read", stderr)
            self.assertFalse(os.path.exists(out))


if __name__ == "__main__":
    unittest.main()
