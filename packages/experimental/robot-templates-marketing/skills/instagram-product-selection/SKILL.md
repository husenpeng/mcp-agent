---
name: instagram-product-selection
description: Instagram product demand heat for marketing reports — product phrases from captions, mention growth, hashtag heat, and purchase-intent comments when available — written as an HTML report plus an xlsx workbook. Use to find products gaining attention on Instagram; it measures heat only and never estimates GMV.
---

# Instagram product selection

Collect public Instagram posts for hashtags and profiles, extract product phrases from captions, and write one HTML report and one xlsx workbook. Media is never downloaded.

**There is no GMV.** Instagram shows no sold counts, so this skill measures demand heat only. Never present a heat number as sales, and never add a sales estimate.

## 1. Read the run instruction

Extract from the user's instruction:

- **Hashtags** — category or product hashtags; each becomes one `--hashtag`. Choose the fewest that cover the category: each costs official quota.
- **Profiles** — accounts to read; each becomes one `--profile`.
- **Products** — phrases to always track; each becomes one `--product`. Required for languages written without spaces, such as Chinese.
- **Brands** — the brand and competitors; each becomes one `--brand`.
- **Limit** — posts per hashtag edge or profile; default 30 on the official path, 12 on the keyless path, which caps it at 50.

If neither a hashtag nor a profile is given, ask for one instead of guessing.

## 2. Prepare the interpreter

Use Python 3.11 or later with XlsxWriter. When the `load_workspace_dependencies` tool is available, call it and use its `python` path; otherwise check `python3 --version` and install XlsxWriter next to instaloader. Install the pinned collector once per run into a scratch directory, not into a shared environment:

```sh
<python> -m pip install --quiet --target ./.ig-deps -r <skill dir>/scripts/requirements.txt
export PYTHONPATH="$PWD/.ig-deps"
```

If installation fails (no network or index access), continue only when both `META_ACCESS_TOKEN` and `IG_USER_ID` are set; the Graph API path needs no extra package.

## 3. Choose the source

- `META_ACCESS_TOKEN` and `IG_USER_ID` both set → the script uses the Instagram Graph API Hashtag Search: `ig_hashtag_search`, then `top_media` and `recent_media`. Profiles use Business Discovery, which reads only Business and Creator accounts. Quota: 30 unique hashtags per account in a rolling 7 days. The run sheet records usage before and after the run. `recent_media` only reaches the last 24 hours, and hashtag results omit author, views, and Reels type.
- Either one missing → the script reads Hashtag and Profile posts through instaloader anonymously, with a pause between posts (`--sleep`, default 3 seconds) and no login. Instagram often refuses anonymous reads; the script stops instead of waiting out a long rate limit and keeps the posts it already has. Tell the user exactly which variable is missing and that it gives a compliant, steadier source.

Never log in, pass cookies or session files, or download media. Anonymous collection carries Terms of Use risk; the report says so.

## 4. Run

```sh
<python> <skill dir>/scripts/instagram_selection.py --hashtag "<tag>" --product "<phrase>" --brand "<brand>" --out ./instagram-selection
```

The script prints the HTML path and the xlsx path on stdout and each data gap on stderr. Exit status 2 means no source returned a post: report the stderr reasons and stop.

## 5. Interpret and reply

Open the HTML report, then reply with:

1. The two file paths.
2. Three to five findings grounded in the numbers: which phrases lead on heat and mention growth, whether several authors drive them or one, how the hashtags compare, and how brands split mentions.
3. The data gaps, verbatim, and what would close them.

Metric definitions (the report repeats them):

- Heat score = mentions × log10(10 + total engagement) × (1 + intent ratio when known). It ranks phrases inside one run only.
- Mention growth = last 7 days ÷ prior 7 days − 1, within the sample.
- Trend score = latest week's z-score against the 4 prior weeks × log(1 + total engagement).
- Purchase-intent ratio = comments asking for a link, price, or where to buy ÷ sampled comments. It is computed only when comments are available. Anonymous reads cannot get comments, and the Graph API serves comments only for the token owner's media, so expect this ratio to be empty on most runs.
- Status is `watch` or `rejected`. Nothing is `validated`, because that needs search-interest or cross-platform evidence this skill does not collect; the data gaps section suggests that check.

Margin is not computed: fill in the `cost_assumptions` sheet if the user supplies price and cost. Do not invent numbers that the files do not contain; label any estimate as an estimate.
