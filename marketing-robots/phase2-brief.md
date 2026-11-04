# Phase 2 skill brief (shared by every skill author)

You are adding bundled Tomato skills to `packages/experimental/robot-templates-marketing` in the repository `/Users/underdog/engineering/tomatoHarness`. Work only inside `packages/experimental/robot-templates-marketing/skills/<skill-name>/` for the skills assigned to you; do not edit any other file in the repository (no package.json, README, src, tests outside your skill dirs, THIRD_PARTY_NOTICES.md). Report needed notice entries in your final message instead.

Reference implementation to copy the structure, style, and quality bar from (read every file first):

- `packages/experimental/robot-templates-marketing/skills/youtube-data-insight/SKILL.md`
- `packages/experimental/robot-templates-marketing/skills/youtube-data-insight/scripts/{collect.py,metrics.py,report.py,youtube_insight.py,requirements.txt}`
- `packages/experimental/robot-templates-marketing/skills/youtube-data-insight/tests/test_youtube_insight.py`
- Research and metric definitions: `marketing-robots/research.md` (read the section for your robots and the 统一指标定义 table)
- Template copy (mission, success criteria, acceptance) for your robots: `packages/experimental/robot-templates-marketing/src/templates.ts`

Each skill directory must contain:

1. `SKILL.md` with YAML frontmatter `name: <dir name>` and `description: <one line, English, what it does and when to use it>`. Body in English with the same section layout as the YouTube skill: read the run instruction; prepare the interpreter (Python 3.11+ with XlsxWriter; `load_workspace_dependencies` when available; `pip install --target ./.<short>-deps -r scripts/requirements.txt`); choose the source (official API when its env var key is set, otherwise the keyless open-source path, stating exactly what is missing); run; interpret and reply (file paths, 3-5 findings, data gaps verbatim). Never log in with user accounts, pass cookies, or download media. Under about 900 words.
2. `scripts/` with:
   - `collect.py` — network I/O only; every source failure raises `CollectionError` with an actionable message; fetch/extract functions injectable for tests.
   - `metrics.py` — pure functions; missing counts stay `None`, never 0.
   - `report.py` — self-contained HTML with inline CSS and an inline SVG chart, every value `html.escape`d, sections matching the research doc's report chapters, a `方法与口径 Method` section and a `数据缺口 Data gaps` section; xlsx via xlsxwriter with the sheets the research doc lists plus a `run` sheet.
   - `<entry>.py` CLI — argparse; writes `<prefix>-<UTC stamp>.html` and `.xlsx` into `--out`; prints both paths; exit 2 with stderr reasons when nothing was collected.
   - `requirements.txt` pinning exact versions, permissive licenses only, chosen from: `yt-dlp==2026.10.26` (Unlicense), `TikTokApi==7.3.3` (MIT), `instaloader==4.16` (MIT), `praw==8.0.3` (BSD-2-Clause), `trafilatura==2.3.1` (Apache-2.0), `vaderSentiment==3.3.2` (MIT). Prefer stdlib `urllib` for official HTTP APIs over SDKs. An empty file is fine when only stdlib is needed.
   - Copy shared helpers into each skill; never import across skill directories.
3. `tests/test_<name>.py` — offline unittest suite (no network) covering metrics, each collector via injected fakes, failure-to-`CollectionError`, and an end-to-end `main()` run that writes both files, asserts HTML escaping, and checks the xlsx sheet names by reading `xl/workbook.xml` from the zip. Close every file you open; redirect stdout and stderr in tests so the run prints only the unittest summary.

Verify with the bundled interpreter `/Users/underdog/.tomato/tomato-runtimes/tomato-primary-runtime/dependencies/python/bin/python3` (3.12, has XlsxWriter): `cd <skill dir> && <python> -m unittest discover -s tests` must end with `OK`, and `<python> -m py_compile` must pass on every script. Iterate until green.

Final message: for each skill, the file list, the test count and result line, the official API env var names used, and the exact third-party packages (name, version, license, copyright line for MIT/BSD) for the notices file. Be concise.
