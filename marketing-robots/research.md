# Tomato Rbot 营销机器人调研：开源项目、免费官方 API 与行业方法论

调研日期：2026-11-03。适用范围：11 个营销机器人模板（品牌营销洞察、达人营销、素材与竞品情报，以及 TikTok / Instagram / X / YouTube 各一个选品分析、一个数据洞察）。

## 结论

1. **全部 11 个机器人都能只用宽松许可（MIT / Apache-2.0 / BSD / ISC / Unlicense）、≥1k star、近 12 个月有提交的开源项目搭建**；没有一个必须依赖付费 SaaS。
2. **三处硬缺口，只能用官方渠道或自研方法补：**
   - **TikTok Shop 销量 / GMV**：没有合格的开源采集项目。采用 FastMoss 公开的「已售数快照差分 × 价格」方法，自己写采集器。
   - **X 数据**：官方 API 自 2026-02 起已无免费档，按次付费（读 1 条约 $0.005，二手来源）。开源抓取（twscrape / twikit）必须登录账号，违反 X 服务条款，封号风险高。
   - **Google Trends**：pytrends 已于 2025-04 归档。可用官方 Trends API（alpha，需申请），或用 Wikipedia 浏览量、GDELT 报道量、TikTok Creative Center 关键词热度替代。
3. **TikTok Research API、Meta Content Library 明确排除商业用途**，不能用作数据源。
4. **采集分两档**：默认走官方 API（合规、需要密钥，只能拿授权账号或公开商业账号的数据）；公开页面采集作为补充，需要限速、不登录、不下载媒体，并在报告里标注服务条款风险。
5. **首个端到端样板选 YouTube**：yt-dlp（Unlicense）只取元数据，配合 YouTube Data API v3（每天 10,000 单位免费），数据最稳、法律风险最低。

> **核实方式**：github.com 页面在调研环境中被截断或超时，所以星标、许可证、最后提交日期读自 shields.io 的 GitHub 徽章 JSON（数据来自 GitHub）；许可证另用 raw.githubusercontent.com 上的 LICENSE 原文抽查（标「✔」的已核对原文）；部分最后提交日期用 `commits/<branch>.atom` 交叉核对。日期带「≈」的是由徽章相对时间换算的近似值。没有调用 api.github.com。**正式克隆代码前，需人工打开每个仓库页再复核一次许可证。**

## 目录

- [需要你申请的密钥](#密钥)
- [公共基础设施](#公共)
- [1 品牌营销洞察师](#r1)
- [2 素材与竞品情报分析师](#r2)
- [3 达人营销专家](#r3)
- [4 TikTok 选品分析师 / 5 TikTok 数据洞察师](#r45)
- [6 Instagram 选品分析师 / 7 Instagram 数据洞察师](#r67)
- [8 X 选品分析师 / 9 X 数据洞察师](#r89)
- [10 YouTube 选品分析师 / 11 YouTube 数据洞察师](#r1011)
- [YouTube 样板技能的改造方案](#样板)
- [统一指标定义](#指标)
- [风险与待复核](#风险)

<a id="密钥"></a>
## 需要你申请的密钥

| 凭据名（建议存入 Tomato 凭据） | 用于 | 免费额度 | 申请地址 |
|---|---|---|---|
| `youtube-data-api` | YouTube 选品、YouTube 洞察、品牌洞察、达人营销 | 每项目每天 10,000 单位；`search.list` 100 单位/次，`videos.list`、`channels.list`、`playlistItems.list`、`commentThreads.list` 各 1 单位/次 | https://console.cloud.google.com/apis/library/youtube.googleapis.com |
| `meta-graph-api` | Instagram 选品、Instagram 洞察、达人营销、素材竞品（Ad Library） | 免费；Hashtag Search 每个专业账号 7 天内 30 个不同话题；Business Discovery 约 200 次/用户/小时 | https://developers.facebook.com/apps （需 Business 或 Creator 账号并关联 FB Page；Ad Library 需身份验证） |
| `tiktok-display-api` | TikTok 洞察（授权账号模式） | 每个端点 600 次/分钟；只能读授权用户自己的数据 | https://developers.tiktok.com/ |
| `reddit-api` | 品牌洞察、X 交叉验证 | 每个 OAuth client 100 次/分钟（10 分钟平均）；**仅非商业用途免费**，商业用途需签协议 | https://www.reddit.com/prefs/apps |
| `x-api`（可选，付费） | X 选品、X 洞察 | 无免费档；按次付费 | https://developer.x.com |
| `google-trends-api`（可选） | 选品类的搜索热度验证 | alpha 白名单 | https://developers.google.com/search/apis/trends |
| `tiktok-commercial-content-api`（可选） | 素材竞品 | 需审批；以欧盟广告为主 | https://developers.tiktok.com/products/commercial-content-api |

不需要密钥的数据源：GDELT DOC 2.0、Wikimedia Pageviews、Hacker News API、YouTube 频道 RSS、TikTok Creative Center 网页、Google Ads 透明度中心 BigQuery 公共数据集（需 GCP 项目，免费层每月 1 TiB 查询，未核实）。

不可用：Instagram Basic Display API（2024-12-04 停服）、Google Custom Search JSON API（停止接受新客户，2027-01-01 停服）、NewsAPI.org 免费档（不可商用）。

<a id="公共"></a>
## 公共基础设施（多个机器人共用，全部达标）

| 仓库 | 星标 | 许可证 | 最后提交 | 用途 |
|---|---|---|---|---|
| [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) | ~87k | Apache-2.0 | ≈2026-10 | 网页转 Markdown，供模型抽取 |
| [D4Vinci/Scrapling](https://github.com/D4Vinci/Scrapling) | ~94k（读数需复核） | BSD-3 ✔ | ≈2026-11-01 | 自适应选择器、动态页抓取 |
| [apify/crawlee-python](https://github.com/apify/crawlee-python) | ~9.6k | Apache-2.0 | 2026-11-03 | 请求队列、重试、代理轮换 |
| [microsoft/playwright-python](https://github.com/microsoft/playwright-python) | ~15k | Apache-2.0 | ≈2026-11-01 | 无头浏览器、截图 |
| [adbar/trafilatura](https://github.com/adbar/trafilatura) | ~7.1k | Apache-2.0 | 2026-10-30 | 正文、日期、作者抽取 |
| [huggingface/transformers](https://github.com/huggingface/transformers) | ~168k | Apache-2.0 | 2026-11-03 | 多语言情感模型推理（模型权重许可另计） |
| [huggingface/sentence-transformers](https://github.com/huggingface/sentence-transformers) | ~19k | Apache-2.0 | ≈2026-11-02 | 向量化、去重、相似检索 |
| [MaartenGr/BERTopic](https://github.com/MaartenGr/BERTopic) | ~7.9k | MIT | 2026-08-27 | 主题聚类、主题随时间变化 |
| [MaartenGr/KeyBERT](https://github.com/MaartenGr/KeyBERT) | ~4.2k | MIT | 2026-08-25 | 关键词、商品词抽取 |
| [cjhutto/vaderSentiment](https://github.com/cjhutto/vaderSentiment) | ~5.1k | MIT | 2026-03-02 | 英文社媒情感基线 |
| [explosion/spaCy](https://github.com/explosion/spaCy) | ~34k | MIT | ≈2026-10 | 实体识别（品牌、型号） |
| [pemistahl/lingua-py](https://github.com/pemistahl/lingua-py) | ~1.8k | Apache-2.0 | 2026-03-09 | 语种识别、按市场拆分 |
| [rapidfuzz/RapidFuzz](https://github.com/rapidfuzz/RapidFuzz) | ~4.2k | MIT | ≈2026-10 | 商品名模糊归并 |
| [john-kurkowski/tldextract](https://github.com/john-kurkowski/tldextract) | ~2k | BSD-3 | ≈2026-10 | 链接域名归类 |
| [statsmodels/statsmodels](https://github.com/statsmodels/statsmodels) | ~12k | BSD-3 | 2026-11-03 | 趋势斜率、显著性检验 |
| [Nixtla/statsforecast](https://github.com/Nixtla/statsforecast) | ~5k | Apache-2.0 | ≈2026-10-30 | 短期预测 |
| [deepcharles/ruptures](https://github.com/deepcharles/ruptures) | ~2.1k | BSD-2 | ≈2026-05 | 变点（爆发起点）检测 |
| [pandas-dev/pandas](https://github.com/pandas-dev/pandas) | ~50k | BSD-3 | ≈2026-11-02 | 数据整理 |
| [jmcnamara/XlsxWriter](https://github.com/jmcnamara/XlsxWriter) | ~4k | BSD-2 | ≈2026-10-28 | xlsx 明细表 |
| [apache/echarts](https://github.com/apache/echarts) | ~68k | Apache-2.0 | ≈2026-10 | HTML 报告图表 |

报告模板不使用 pallets/jinja（徽章显示最后提交约 2025-06，超过 12 个月，可能是默认分支读数问题，待复核），改用 Python 标准库 `string.Template` 或直接拼接 HTML。

<a id="r1"></a>
## 1 品牌营销洞察师

**选用的开源项目**

| 仓库 | 星标 | 许可证 | 最后提交 | 复用内容 | 服务条款风险 |
|---|---|---|---|---|---|
| [praw-dev/praw](https://github.com/praw-dev/praw) | ~4.3k | BSD-2 | 2026-10-29 | Reddit 搜索、评论树、限流 | 中：免费额度仅限非商业 |
| [AndyTheFactory/newspaper4k](https://github.com/AndyTheFactory/newspaper4k) | ~1.2k | MIT | ≈2026-11-01 | 新闻抽取（trafilatura 的备选） | 低到中 |
| [fhamborg/news-please](https://github.com/fhamborg/news-please) | ~2.5k | Apache-2.0 | ≈2026-04 | 批量新闻爬取、Common Crawl News 回填 | 低 |
| [ranahaani/GNews](https://github.com/ranahaani/GNews) | ≈1k（刚过门槛，待复核） | MIT | ≈2026-10 | Google News RSS 按关键词、国家拉新闻 | 中 |
| [dgtlmoon/changedetection.io](https://github.com/dgtlmoon/changedetection.io) | ~35k | Apache-2.0 | 2026-11-03 | 竞品官网、定价页变更 diff | 低 |
| [googleapis/google-api-python-client](https://github.com/googleapis/google-api-python-client) | ~9k | Apache-2.0 | 2026-11-03 | YouTube Data API | 低 |

**淘汰**：GeneralMills/pytrends（2025-04 归档）、kotartemiy/pygooglenews（最后提交 2024-12）、snscrape（GPL-3.0）、searxng（AGPL-3.0）、firecrawl（AGPL-3.0）、mediacloud（AGPL-3.0）、gdeltPyR（GPL-3.0）、flairNLP/flair（最后提交 2025-06）、MediaCrawler（非商业许可）。

**免费数据源**：Reddit Data API、GDELT DOC 2.0（ArtList / TimelineVol / TimelineTone，无需 key）、YouTube Data API、Wikimedia Pageviews、Hacker News API、Google Trends API（alpha）。

**行业方法论**
- 声量份额（[Brandwatch](https://www.brandwatch.com/social-media-glossary/share-of-voice)）：SOV = 本品牌指标 ÷ 竞品集合总指标 × 100，指标分别用提及量和互动量。
- 净情感（[Talkwalker](https://developer.talkwalker.com/guides/use-histogram-api/sentiment)）：(正面 − 负面) ÷ (正面 + 负面)；另一口径分母含中性提及（[getminds](https://getminds.ai/glossary/what-is-net-sentiment-score)）。报告须写明口径。
- 网站流量对标（[Similarweb](https://www.similarweb.com/blog/research/business-benchmarking/benchmarking-website-traffic)）：访问量、停留时长、跳出率、来源构成。我们没有面板数据，用 Wikipedia 浏览量和搜索热度作代理。
- 自定义：搜索份额、提及量环比、日提及量 z-score > 2 视为峰值、定位关键词 Jaccard 重叠度。

**流程**：输入品牌、竞品、别名、市场、时间窗 → 采集（Reddit、GDELT、新闻正文、YouTube、Wikipedia 浏览量、竞品官网）→ URL 和语义去重、语种识别、实体消歧 → VADER 基线 + 多语言模型情感，抽 50 条人工校验 → BERTopic 话题、KeyBERT 联想词 → SOV、净情感、峰值归因、搜索份额 → 报告。

**报告章节**：执行摘要｜声量与 SOV｜情感与净情感趋势｜搜索与关注度趋势｜话题地图｜定位与联想词对比｜峰值事件时间线｜竞品官网变化｜方法、口径与数据缺口。

**xlsx 工作表**：mentions、daily_metrics、topics、keywords、sources_log。

<a id="r2"></a>
## 2 素材与竞品情报分析师

**选用的开源项目**

| 仓库 | 星标 | 许可证 | 最后提交 | 复用内容 | 服务条款风险 |
|---|---|---|---|---|---|
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | ~205k | Unlicense | 2026-10-29 | 公开广告视频下载 | 中到高 |
| [PyAV-Org/PyAV](https://github.com/PyAV-Org/PyAV) | ~3.3k | BSD-3 | 2026-11-03 | 抽首帧、前 3 秒关键帧、抽音轨 | 无（注意 FFmpeg 构建的 LGPL/GPL 选项） |
| [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) | ~5.3k | BSD-3 | ≈2026-11-02 | 镜头切分、剪辑节奏 | 无 |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | ~26k | MIT | ≈2026-11-02 | 口播转写，提取 hook 台词 | 无 |
| [RapidAI/RapidOCR](https://github.com/RapidAI/RapidOCR) | ~8.4k | Apache-2.0 | ≈2026-10 | 帧内字幕、贴片文字 | 无 |
| [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | ~92k | Apache-2.0 | ≈2026-09 | 多语言 OCR | 无 |
| [QwenLM/Qwen3-VL](https://github.com/QwenLM/Qwen3-VL) | ~20k | Apache-2.0（代码） | ≈2026-01 | hook 类型、格式、卖点打标（权重许可另确认） | 无 |
| [OpenBMB/MiniCPM-o](https://github.com/OpenBMB/MiniCPM-o) | ~27k | Apache-2.0（代码） | 2026-10-30 | 端侧视频理解（权重许可另确认） | 无 |
| [JohannesBuchner/imagehash](https://github.com/JohannesBuchner/imagehash) | ~3.9k | BSD-2 | ≈2026-10 | pHash 去重、聚合素材变体 | 无 |
| [projectdiscovery/wappalyzergo](https://github.com/projectdiscovery/wappalyzergo) | ~1.1k | MIT | 2026-11-01 | 落地页技术栈 | 低 |
| [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse) | ~31k | Apache-2.0 | 2026-11-03 | 落地页性能评分 | 低 |
| [mozilla/readability](https://github.com/mozilla/readability) | ~12k | Apache-2.0 | ≈2026-07 | 落地页正文 | 低 |

**淘汰**：TikTokDownloader（GPL-3.0）、gallery-dl（GPL-2.0）、ultralytics（AGPL-3.0）、ffmpeg-python（最后提交 2022-07）、decord（2022-07）、TransNetV2（2021-07）、LLaVA（2024-05）、InternVL（2025-09）、open_clip（自定义许可，待复核）、各类 Meta / TikTok 广告库小型 scraper（星标不足且违反服务条款）。

**免费数据源**
- Meta Ad Library API：免费；`ad_type=ALL` 时，欧盟和英国以外只返回政治与议题广告；投放金额和曝光区间只对政治广告提供。
- TikTok Commercial Content API：需审批，以欧盟广告为主。
- Google Ads 透明度中心 BigQuery 数据集 `bigquery-public-data.google_ads_transparency_center`：覆盖欧洲经济区广告。
- TikTok Creative Center Top Ads：没有公开 API，网页自动化违反服务条款，默认关闭。

**行业方法论**
- Hook rate = 3 秒播放 ÷ 曝光；Hold rate = 15 秒播放 ÷ 3 秒播放（[Exposure](https://www.exposure.com.au/blog/hook-rate-vs-hold-rate)）。需投放方一手数据，竞品素材只能用代理指标。
- Foreplay：素材库按 hook 类型打标、竞品新素材监控、分镜 brief（[adlibrary](https://adlibrary.com/posts/motion-vs-foreplay)）。
- Pipiads / BigSpy：投放天数、热度、国家、CTA、电商平台、first / last seen（[leadsync](https://leadsync.me/blog/bigspy-review)）。
- 代理指标（行业惯用逻辑，非厂商公式）：投放天数 = (last_seen 或今天) − first_seen；变体数 = 同一 pHash 或文案簇的广告数；投放强度 = 每周新上素材数；热度分 = 加权 z-score(投放天数, 变体数, 互动率)，权重在报告中披露。

**流程**：输入竞品、主页或域名、市场、时间窗 → 广告库采集 → 下载素材，pHash 聚簇 → 抽帧、切镜头、转写、OCR → 多模态模型按 JSON schema 打标（hook 类型、形式、人物、卖点、CTA、情绪、品牌露出时间点）→ 落地页截图、抽 offer、识别技术栈、性能评分 → 指标与洞察 → 创意 brief。

**报告章节**：执行摘要｜竞品投放概况｜长投素材画廊（首帧 + hook 文案）｜hook 与形式拆解｜卖点与 CTA｜落地页对比｜市场差异｜创意 brief 与测试建议｜方法与数据局限（含欧盟限制、服务条款声明）。

**xlsx 工作表**：ads、creative_tags、clusters、landing_pages、frames_index。

<a id="r3"></a>
## 3 达人营销专家

**选用的开源项目**

| 仓库 | 星标 | 许可证 | 最后提交 | 复用内容 | 服务条款风险 |
|---|---|---|---|---|---|
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | ~205k | Unlicense | 2026-10-29 | YouTube / TikTok 频道视频列表与统计，只取元数据 | 中 |
| [LuanRT/YouTube.js](https://github.com/LuanRT/YouTube.js) | ~5.4k | MIT ✔ | ≈2026-10-31 | 无 key 搜索频道、读频道「关于」页外链 | 中 |
| [davidteather/TikTok-Api](https://github.com/davidteather/TikTok-Api) | ~6.7k | MIT ✔ | 2026-08-24 | TikTok 用户资料、视频列表、话题搜索 | 高 |
| [instaloader/instaloader](https://github.com/instaloader/instaloader) | ~14k | MIT ✔ | ≈2026-11-01 | IG 公开主页、帖子、简介邮箱 | 高 |
| [soxoj/maigret](https://github.com/soxoj/maigret) | ~40k | MIT ✔ | ≈2026-11-02 | 同一 handle 跨平台身份归并 | 中 |
| [reacherhq/check-if-email-exists](https://github.com/reacherhq/check-if-email-exists) | ~10k | MIT ✔ | ≈2026-10-30 | SMTP / MX 校验邮箱 | 中（SMTP 探测可能被拉黑） |
| [AfterShip/email-verifier](https://github.com/AfterShip/email-verifier) | ~1.7k | MIT ✔ | ≈2026-11-02 | 语法、MX、一次性邮箱、角色邮箱识别 | 低 |
| [JoshData/python-email-validator](https://github.com/JoshData/python-email-validator) | ~1.5k | Unlicense | ≈2026-10-30 | 邮箱语法和域名校验 | 低 |
| [facebookresearch/faiss](https://github.com/facebookresearch/faiss) | ~41k | MIT | 2026-11-03 | 相似达人向量检索 | 无 |
| [openai/CLIP](https://github.com/openai/CLIP) | ~35k | MIT | ≈2026-03 | 封面视觉风格向量 | 无 |
| [yzhao062/pyod](https://github.com/yzhao062/pyod) | ~10k | BSD-2 ✔ | ≈2026-10-28 | 粉丝与互动异常（刷量）检测 | 无 |
| [scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn) | ~68k | BSD-3 | 2026-11-03 | 粉丝账号分类器 | 无 |

instagrapi（MIT，必须登录，封号风险极高）、twscrape / twikit（MIT，必须登录）只在用户明确接受风险时启用。

**淘汰**：holehe（GPL-3.0）、theHarvester（GPL-2.0）、social-analyzer（AGPL）、GHunt（AGPL）、listmonk（AGPL）、mautic（GPL）、twenty（AGPL）、n8n（Sustainable Use License）、MediaCrawler（非商业）、instagram_private_api（2019-11）、h8mail（2022-06）、botometer-python（星标不足）。

**免费数据源**：YouTube Data API；Instagram Business Discovery（可读其他专业账号的粉丝数、帖子数、近期帖子）；TikTok Display API（需达人 OAuth 授权）；Gmail API（发信与读回复）。

**行业方法论**
- Modash 互动率 = 近 2 个月帖子点赞数中位数 ÷ 粉丝数 × 100；Instagram 分档基准见 [Modash](https://www.modash.io/engagement-rate-calculator)（如 10k–50k 粉：高 > 1.27%，平均 0.49–0.65%）。
- Modash 假粉信号：无头像、关注多粉丝少、账号新、发帖少、无简介、增长异常；建议假粉 < 25%，> 50% 直接排除（[Modash](https://help.modash.io/en/articles/5649607-fake-followers-101-understanding-audience-quality)）。
- HypeAuditor 受众质量分 AQS（1–100）由 15 项指标组成，分为互动率、增长模式、优质受众占比、评论真实性四类；受众分为真实、达人、大量关注者、可疑（[HypeAuditor](https://hypeauditor.com/free-tools/instagram-audit)）。报价分档：10k 粉 $100–500，50k 粉 $500–2,500，500k 粉 $5k–25k（[HypeAuditor](https://hypeauditor.com/free-tools/instagram-pricing-calculator)）。
- NoxInfluencer：NoxScore 1–5 分，由粉丝增长、发布、频道质量、受众可信度、互动率组成；收益估算 = 本地 CPM × 平均播放。
- Navos：按商品特征匹配达人、生成多语种邀约话术并批量建联；评分公式未公开。

**流程**：输入细分领域、市场、平台、粉丝档位、种子达人 → 发现 → 跨平台身份归并 → 采集资料和近 60 天帖子 → 语种与市场识别 → 互动率（按粉丝、按播放两种口径）、发帖频率、增长率 → 按档位分位数对标 → 自研 AQS（粉丝抽样分类 + 增长异常 + 评论真实性 + 赞评比）→ 相似达人（文本向量 + 封面向量 + faiss）→ 报价估算 → 邮箱提取与校验 → 建联记录。

**合规要求**：只提取达人主动公开的商务联系方式；不抓取私人信息；外发邮件需遵守 CAN-SPAM / GDPR。

**报告章节**：推荐 Top N｜筛选条件与口径｜达人总表｜互动率分档基准｜受众质量与假粉｜相似达人簇｜报价估算｜联系方式与建联状态｜风险与数据缺口。

**xlsx 工作表**：creators、posts、audience_sample、lookalikes、contacts、outreach_log、benchmarks。

<a id="r45"></a>
## 4 TikTok 选品分析师 / 5 TikTok 数据洞察师

**选用的开源项目**

| 仓库 | 星标 | 许可证 | 最后提交 | 复用内容 | 服务条款风险 |
|---|---|---|---|---|---|
| [davidteather/TikTok-Api](https://github.com/davidteather/TikTok-Api) | ~6.7k | MIT ✔ | 2026-08-24 | 话题、关键词、账号、音乐下的视频与统计 | 高：需 Playwright + msToken，常被风控 |
| [Evil0ctal/Douyin_TikTok_Download_API](https://github.com/Evil0ctal/Douyin_TikTok_Download_API) | ~21k | Apache-2.0 ✔ | ≈2026-11-02 | 网页与 App 接口解析、视频详情、作者信息 | 中高 |
| [Johnserf-Seed/f2](https://github.com/Johnserf-Seed/f2) | ~2.7k | Apache-2.0 ✔ | ≈2026-10（待复核） | 签名逻辑、用户和视频列表 | 中高 |
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | ~205k | Unlicense | 2026-10-29 | 单条视频统计复核 | 中 |
| 公共层 crawl4ai / Scrapling / crawlee | — | — | — | **自建 TikTok Shop 商品页采集器**：价格、累计已售、评分、店铺 | 高 |

**缺口**：没有找到 ≥1k 星、宽松许可的 TikTok Shop 销量采集项目。

**淘汰**：MediaCrawler（非商业许可）、TikTokDownloader（GPL-3.0）、TikTokLive（AGPL-3.0）、drawrowfly/tiktok-scraper（无许可证且停更）、tiktok-signature（无许可证）、tiktok-business-api-sdk（星标不足，且是广告主 API）。

**免费数据源**：TikTok Creative Center（网页免费，Top Products、话题/音乐/创作者趋势、关键词 Popularity / CTR / CVR / CPA）；TikTok Display API（授权账号）；Google Trends API（alpha）。TikTok Research API 仅限学术，**不可用**。

**行业方法论**
- GMV 口径（TikTok 官方）：已付订单金额，含取消和退款；= 标价 × 件数 + 运费 − 折扣 − 税。
- FastMoss 估算（[FastMoss](https://www.fastmoss.com/blog/how-to-check-tiktok-shop-gmv/)）：直播销量 = 场次内已售数变化 × 价格；视频销量 = 达人每千次播放 GMV × 播放量；常用 28 天窗口；**看方向和占比比看绝对值更重要**。
- Kalodata / FastMoss 都拿不到官方销量，用可见已售数、评价增速、视频播放互动、价格和品类历史转化率建模（[AdMapix](https://www.admapix.com/blog/best-practices/kalodata-vs-fastmoss)）。
- Shoplus 四类榜单可用作机会标签：潜力爆量、热销、人气上升、趋势（[Shoplus](https://www.shoplus.net/tiktok-products-trends)）。
- 利润模型（[FastMoss 2026 美区](https://www.fastmoss.com/blog/tiktok-shop-seller-costs-in-the-us-2026-fees-creator-commissions-fulfillment-returns-real-profit/)）：净利 = 售价 − 商品成本 − 平台佣金 6% − 达人佣金（美妆中位 15%、女装 10%、保健 20%）− 履约 $2.86–4.28/件 − 分摊广告 − 退货准备金。
- Exolyt 趋势判定（[Exolyt](https://exolyt.com/blogs/how-to-separate-a-trend-from-whats-trending)）：区分 trending（短期峰值）、trend（持续变化）、fad（快起快落），依据跨社群扩散、持续性和跨平台佐证。

**选品流程**：输入品类、关键词、市场、价格带 → 商品池（Creative Center Top Products + Shop 搜索页）→ 每日快照，日销量 = 当日已售 − 前日已售，GMV ≈ 日销量 × 价格 → 内容热度 → 搜索热度 → **双验证**：30 天 GMV 环比 > 0 且搜索热度 4 周斜率 > 0（p < 0.1），只满足一项标「待观察」→ 竞争度（店铺数、带货达人数、CR3）→ 利润 → 机会分（权重可配置）。

**洞察流程**：输入账号、话题、音乐 → 采集（授权优先）→ 账号指标（互动率、爆款率 = 播放 > 账号中位数 × 3 的占比、发布时段）→ 话题与音乐时序（7 / 28 天增速、加速度、变点）→ 主题聚类 → 用 Creative Center 和搜索热度交叉验证 → 按 Exolyt 规则分类。

**报告章节（选品）**：结论与 Top N｜估算口径声明｜品类大盘｜双验证四象限｜单品卡片（GMV 曲线、内容热度、利润瀑布）｜竞争格局｜风险。
**报告章节（洞察）**：摘要｜账号概览与对标｜Top / Bottom 视频｜话题与音乐趋势（含变点）｜新兴趋势｜建议｜口径与局限。

**说明**：选品机器人首次运行只有一次快照，日销量差分要到第二次运行才有；报告需写明这一点。

<a id="r67"></a>
## 6 Instagram 选品分析师 / 7 Instagram 数据洞察师

**选用的开源项目**

| 仓库 | 星标 | 许可证 | 最后提交 | 复用内容 | 服务条款风险 |
|---|---|---|---|---|---|
| [instaloader/instaloader](https://github.com/instaloader/instaloader) | ~14k | MIT ✔ | ≈2026-11-01 | 主页、帖子、Reels、话题、评论 | 高：匿名限流严，登录有封号风险 |
| [subzeroid/instagrapi](https://github.com/subzeroid/instagrapi) | ~7.1k | MIT ✔ | 2026-11-03 | 私有移动端 API（话题热门、Reels、商品标签） | 很高：必须登录 |
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | ~205k | Unlicense | 2026-10-29 | 单条 Reel 元数据复核 | 中 |

**淘汰**：instagram_private_api（2019-11）、dilame/instagram-private-api（2024-03）、instagram-php-scraper（≈2025-05）、instagram-crawler（2021-04）、instascrape（星标不足）、gallery-dl（GPL-2.0）、facebook-python-business-sdk（许可证未核实，Graph API 可直接用 HTTP 调用）。

**免费数据源**：Instagram Graph API 的 Hashtag Search（每 7 天 30 个话题；recent_media 只返回 24 小时内内容）、Business Discovery、Insights（授权账号；`plays` 已于 2025-04-21 移除，改用 `views`）。Meta Content Library 仅限学术，**不可用**。

**行业方法论**
- Instagram 没有可见已售数，**无法估算 GMV**，只能衡量需求热度：商品提及量增速、Reels 播放与互动增速、评论购买意向占比（"link?"、"where to buy"、"price"）。
- 跨平台验证（Exolyt 规则）：同一商品词在 TikTok 和搜索热度上也在上升才算趋势。
- 互动率 = (赞 + 评论 + 保存 + 分享) ÷ 粉丝数；授权账号改用 reach 作分母。话题贡献度 = 带该话题帖子的平均互动 ÷ 账号平均互动。

**报告章节（选品）**：结论与推荐｜口径（无 GMV、只有热度）｜品类热度趋势｜商品词排行与双验证｜代表性 Reels｜品牌与竞品｜利润测算｜风险。
**报告章节（洞察）**：摘要｜账号健康度｜内容表现（类型、时段、Top 帖子）｜话题趋势与贡献度｜竞品对标｜建议｜口径与局限（区分官方数据和公开采集数据）。

<a id="r89"></a>
## 8 X 选品分析师 / 9 X 数据洞察师

**选用的开源项目**

| 仓库 | 星标 | 许可证 | 最后提交 | 复用内容 | 服务条款风险 |
|---|---|---|---|---|---|
| [tweepy/tweepy](https://github.com/tweepy/tweepy) | ~11k | MIT | 2026-07-02 | X API v2 官方客户端 | 低（按次付费） |
| [vladkens/twscrape](https://github.com/vladkens/twscrape) | ~2.9k | MIT ✔ | 2026-10-30 | GraphQL 搜索、用户、推文、多账号池 | **高**：必须登录，违反服务条款 |
| [d60/twikit](https://github.com/d60/twikit) | ~4.8k | MIT | 2026-03-10 | 内部 API 客户端（搜索、趋势、用户） | **高** |
| [Altimis/Scweet](https://github.com/Altimis/Scweet) | ~1.7k | MIT ✔ | 2026-10-26 | 浏览器式按关键词和时间段搜索 | **高** |
| [praw-dev/praw](https://github.com/praw-dev/praw) | ~4.3k | BSD-2 | 2026-10-29 | 用 Reddit 交叉验证 | 低 |

**淘汰**：nitter（AGPL-3.0）、snscrape（GPL-3.0，2023-06）、twint（2021-03）、twitter-api-client（2024-04）、tweety（星标不足、许可未标明）、LIAAD/yake（AGPL-3.0）。

**免费数据源**：**X 没有免费 API**。2026-02 起新开发者按次付费，读 1 条 $0.005，每月最多读 200 万条（[Postproxy](https://postproxy.dev/blog/x-api-pricing-2026)，二手来源，docs.x.com 未能核实）。Reddit Data API 可免费交叉验证（非商业）。

**默认策略**：两个 X 模板默认只走官方按次付费 API，并在报告中写明本次花费；开源抓取默认关闭，必须由用户自备账号并在运行指令中明确接受风险才启用。

**行业方法论**：Brandwatch 体系——净情感 = (正面 − 负面) ÷ 总提及 × 100，取值 −100 到 +100；声量份额、提及量、情绪分布。账号层面：发帖频率、互动率中位数、异常帖、粉丝增长（需要多次运行留下快照）。

**选品流程**：种子关键词扩展 → 搜索最近 7–30 天 → 去重并过滤 bot 账号（账号注册时长、粉丝比）→ 抽取商品实体、归并别名 → 解析链接中的电商域名 → 趋势分 → 报告。
**洞察流程**：账号或话题 → 时间线或搜索结果 → 语种识别 → 情感与主题聚类 → 账号基线与异常帖 → 竞品声量份额 → 报告。

<a id="r1011"></a>
## 10 YouTube 选品分析师 / 11 YouTube 数据洞察师

**选用的开源项目**

| 仓库 | 星标 | 许可证（须保留的版权行） | 最后提交 | 复用内容 | 服务条款风险 |
|---|---|---|---|---|---|
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | ~205k | Unlicense（公有领域，无版权行） | 2026-10-29 | 搜索、频道 tab、播放列表、单视频元数据 | 中：大批量会遇到 bot 检查 |
| [jdepoix/youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api) | ~8.6k | MIT，"Copyright (c) 2018 Jonas Depoix" | 2026-11-03 | 字幕文本，提取卖点和痛点 | 中：数据中心 IP 常被封 |
| [egbertbouman/youtube-comment-downloader](https://github.com/egbertbouman/youtube-comment-downloader) | ~1.3k | MIT，"Copyright (c) 2015 Egbert Bouman" | 2026-10-15 | 评论翻页，不耗 API 配额 | 中 |
| [googleapis/google-api-python-client](https://github.com/googleapis/google-api-python-client) | ~9k | Apache-2.0 | 2026-10 | Data API v3、Analytics API | 低 |

**淘汰**：invidious（AGPL-3.0）、NewPipeExtractor（GPL-3.0）、pytube（2023-05）、youtube-search-python（2022-06）、youtube-metadata（星标不足）、YouTube-operational-API（星标不足、许可未标明）。ytdl-org/youtube-dl 合格但不如 yt-dlp 活跃，不采用。

**免费数据源**：YouTube Data API v3（每天 10,000 单位；一次搜索 100 单位，每天约 100 次搜索；`videos.list` 每 50 个视频 1 单位）；YouTube Analytics API（只能读授权频道）；频道 RSS（无需 key）。

**行业方法论**
- vidIQ（[Alan Spicer](https://alanspicer.com/vidiq-outlier-score-vph-explained)）：Outlier Score = 单视频播放 ÷ 频道平均播放；VPH = 每小时平均播放。我们用频道最近 30 个视频的**中位数**作基线，更稳健。
- Social Blade（[Viddar](https://viddar.io/en/blog/how-accurate-are-social-blade-earnings)）：预估收益 = 日播放 ÷ 1000 × CPM $0.25–4.00，假设全部播放都有广告；我们改用按品类和地区设定的 RPM 区间。
- Playboard 人气分 = 播放 + 点赞 × 10，汇总到频道。
- TubeBuddy 关键词分综合搜索量与竞争度；我们的代理：竞争度 = 搜索前 20 名频道的订阅中位数，需求度 = 这些视频的 VPH。

**选品流程**：用「品类词 + review / unboxing / vs / best」搜索 → 补充视频元数据 → Outlier 和 VPH 筛爆款 → 解析描述中的联盟链接（amzn.to、geni.us、Amazon `tag=` 参数）→ 抓热门前 N 条评论并做意图分类 → 字幕提取优缺点 → 按商品聚合打分。
**洞察流程**：解析频道（handle → UC id）→ 列出全部上传 → 补充统计 → 基线、Outlier、趋势 → 抽样评论做情感与主题 → 竞品对比。

**报告章节（选品）**：摘要｜候选商品榜（需求分、爆款数、联盟覆盖）｜爆款测评视频｜评论需求与痛点｜联盟链接与渠道分布｜明细说明。
**报告章节（洞察）**：摘要｜频道 KPI 与预估收益｜内容结构（时长、Shorts、发布节奏）｜爆款与低谷视频｜评论主题与情感｜竞品对比｜方法与局限。

<a id="样板"></a>
## YouTube 样板技能的改造方案

**原则**：把 yt-dlp 作为锁定版本的依赖调用，**不逐行复制它的 extractor**。YouTube 前端变化频繁，yt-dlp 几乎每周都在修；复制下来的代码会很快失效，我们也就丢掉了上游的修复。我们二次开发的是营销层：采集编排、指标计算、报告生成，这部分是自己的代码，放在模板包里。

**用到的 yt-dlp 能力**（在 2026-10-29 的 master 上核实）
- 入口：`YoutubeDL(params).extract_info(url, download=False)`，参数 `extract_flat='in_playlist'`、`skip_download=True`、`playlistend`、`lazy_playlist`。
- 搜索：`ytsearchN:关键词`（`YoutubeSearchIE`）；`youtube.com/results?search_query=…&sp=…`（`YoutubeSearchURLIE`，支持按播放量或日期排序）。
- 频道列表：`/videos`、`/shorts`、`/streams` tab（`YoutubeTabIE`）。
- 单视频完整元数据：描述（含联盟链接）、点赞、发布日期、标签（`YoutubeIE`）。自 2025-11 起，完整的单视频解析需要 deno 和 yt-dlp-ejs（[issue #15012](https://github.com/yt-dlp/yt-dlp/issues/15012)）；所以完整描述优先用 Data API `videos.list` 获取。

**样板技能的流程**
1. 有 `YOUTUBE_API_KEY` 时走 Data API；没有时用 yt-dlp flat 模式降级，并在报告里写明。
2. 搜索或列出频道上传，取元数据。
3. 计算互动率、VPH、Outlier（基线：频道最近 30 个视频播放中位数）。
4. 解析描述中的联盟链接，按域名归类。
5. 输出 HTML 报告和 xlsx 明细。

**许可证处理**：yt-dlp 为 Unlicense（公有领域，无须保留版权行），仍在 `THIRD_PARTY_NOTICES.md` 中写明来源和版本；youtube-comment-downloader、youtube-transcript-api 若在第二期引入，须保留上表中的 MIT 版权行。

<a id="指标"></a>
## 统一指标定义

| 指标 | 公式 |
|---|---|
| 互动率（视频） | (点赞 + 评论) ÷ 播放 |
| 互动率（账号，Modash 口径） | 近 2 个月帖子点赞中位数 ÷ 粉丝数 |
| 播放速度 VPH | 播放 ÷ 发布至今小时数 |
| Outlier | 播放 ÷ 同频道最近 N 个视频播放中位数 |
| 预估收益 | 播放 ÷ 1000 × RPM[品类, 地区] × 变现比例 |
| 声量份额 SOV | 本品牌指标 ÷ 竞品集合总指标 × 100 |
| 净情感 | (正面 − 负面) ÷ (正面 + 负面)，或分母取总提及；报告写明口径 |
| 趋势分 | 本周提及量相对过去 4 周的 z-score × log(总互动) |
| 需求分 | 评论意图命中数（求链接、问价格、问在哪买、和竞品比较、抱怨、想要某功能）× 点赞权重 |
| 投放天数 | (last_seen 或今天) − first_seen |

<a id="风险"></a>
## 风险与待复核

**服务条款与封号**：TikTok、Instagram、X、YouTube 都禁止未经许可的自动化采集。模板的默认做法是：优先官方 API；公开采集限速、不登录、不下载媒体；需要登录的工具默认关闭，由用户自备账号、明确接受风险后才启用。

**数据口径**：TikTok Shop GMV、竞品素材热度、YouTube 收益都是估算值，报告必须标明；Meta 广告库在欧盟和英国以外只有政治广告。

**模型权重许可**：Qwen3-VL、MiniCPM-o、transformers 模型的权重许可与代码许可不同，选用前须单独确认。

**待人工复核**：Scrapling 星标读数、GNews 是否仍 ≥1k 星、codelucas/newspaper 与 pallets/jinja 的最后提交、f2 的最后提交、open_clip 与 feedparser 的许可证、X API 定价（docs.x.com 未能抓取）、YouTube 配额（官方页未能抓取，数值来自二手来源）、Google Trends API 申请结果、Navos 各数字员工的具体方法（海外站在本地区不可用）。
