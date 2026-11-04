---
name: youtube-product-selection
description: YouTube product selection for marketing — searches category review, unboxing, vs, and best videos, finds breakout reviews by outlier score and views per hour, parses affiliate links by network, classifies top-comment purchase intent, and ranks product clusters by demand score in an HTML report plus an xlsx workbook. Use when choosing products to sell or promote from YouTube review demand.
---

# YouTube product selection

Search review content for a category, find breakout review videos, read their top comments for purchase intent, group videos into product clusters, and write one HTML report and one xlsx workbook. Media is never downloaded.

## 1. Read the run instruction

Extract from the user's instruction:

- **Categories** — product categories such as `standing desk`; each becomes one `--category`, which searches `<category> review`, `<category> unboxing`, `<category> vs`, and `best <category>`.
- **Extra searches** — named products or comparisons; each becomes one `--search`.
- **Market** — ISO country code for API searches (`--region`).
- **Cost assumptions** — unit cost, price band, commission, shipping; each becomes `--assumption "name=value unit"`.
- **Depth** — videos per search (`--limit`, default 30), videos whose comments are read (`--comment-videos`, default 10), comments per video (`--comments`, default 50).

If no category or search is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use a Python 3.11 or later that has XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path; otherwise check `python3 --version` and install XlsxWriter next to yt-dlp. Install the pinned collector once per run into a scratch directory:

```sh
<python> -m pip install --quiet --target ./.ytps-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.ytps-deps"
```

If installation fails, continue only when `YOUTUBE_API_KEY` is set; the Data API path needs no extra package.

## 3. Choose the source

- `YOUTUBE_API_KEY` set → YouTube Data API v3: `search.list` (100 units), `videos.list`, `channels.list`, `playlistItems.list`, and `commentThreads.list` (1 unit each). One category costs about 400 units for searches plus about 50 for baselines and comments; the free quota is 10,000 units per day, so keep categories × searches under 80 per run.
- Not set → yt-dlp: flat search listings, channel tabs for baselines, and `getcomments=True` with the `max_comments` extractor argument for the top comments. Likes, comment counts, and full descriptions (affiliate links) are often missing, and comment extraction may fail when yt-dlp needs deno and yt-dlp-ejs. Tell the user that adding a `YOUTUBE_API_KEY` gives complete counts and reliable comments.

Never log in, pass cookies, or download media.

## 4. Run

```sh
<python> <skill dir>/scripts/youtube_product_selection.py --category "<category>" --region US \
  --assumption "unit cost=12 USD" --assumption "selling price=39 USD" --out ./youtube-product-selection
```

The script prints the HTML path and the xlsx path on stdout and each data gap on stderr. Exit status 2 means no search returned a video: report the stderr reasons and stop.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: the top product clusters with their status and what drives their score, which breakout reviews show demand and why they might have broken out, the dominant comment intents and pain points (quote short comments), and which affiliate networks dominate.
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Engagement rate = (likes + comments) ÷ views; VPH = views ÷ hours since publication.
- Outlier = views ÷ median views of the same channel's latest 30 videos; ≥ 3 is a breakout.
- Comment intents (求链接 link request, 问价格 price, 问在哪买 where to buy, 竞品比较 comparison, 抱怨 complaint, 想要功能 feature request) come from a transparent EN + ZH keyword lexicon in `metrics.py`; one comment may match several.
- Demand score = Σ intent hits × (1 + log10(1 + comment likes)).
- Product cluster = normalized 1–3-word phrase from titles (stop words, years, brackets, and category words removed; "A vs B" splits into two); a heuristic, so merge obvious aliases by hand.
- Opportunity score = 100 × (0.5 × demand percentile + 0.3 × median VPH percentile + 0.2 × affiliate coverage percentile) across this run's clusters.
- Status: validated when content heat (a breakout or median VPH ≥ sample median) and purchase intent both hold; watch when one holds; rejected otherwise. The search-interest sheet is a YouTube supply proxy, not search volume; say so.

Do not invent numbers that the files do not contain; label any estimate as an estimate, and do not estimate margin without cost assumptions.
