// Generated from src/client by `npm run build` (scripts/build-client.mjs). Do not edit by hand.
window.__ModuleLoader__.load({
  id: 'tomato-market',
  factory: (require) => {
const module = { exports: {} }
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_jsx_runtime6 = require("react/jsx-runtime");

// src/client/i18n.js
var NS = "tomato-market";
var zh = {
  tab: "通用插件市场",
  lede: "浏览开源 DeepSeek Harness 插件目录，安装能在 Tomato 中运行的插件。",
  searchPlaceholder: "搜索插件、作者或关键词",
  all: "全部",
  sortLabel: "排序",
  sortStars: "按 GitHub 星标",
  sortUpdated: "按更新时间",
  sortName: "按名称",
  refresh: "刷新目录",
  plugins: "{count} 个插件",
  categories: "{count} 个分类",
  loading: "正在读取插件目录…",
  loadFailed: "读取插件目录失败",
  retry: "重试",
  empty: "没有匹配的插件",
  clear: "清除搜索",
  install: "安装",
  checking: "检查中…",
  open: "查看 {name} 的详情",
  stars: "★ {count}",
  noStars: "暂无星标",
  viewAll: "查看全部 {count} 个",
  back: "返回通用插件市场",
  more: "加载更多",
  filtered: "筛选结果",
  homepage: "主页",
  repository: "源码仓库",
  versions: "版本",
  published: "发布于 {date}",
  author: "作者 {author}",
  detailTitle: "插件说明",
  detailLoading: "正在读取插件说明…",
  detailNone: "该插件没有提供说明文档。",
  detailFailed: "读取说明失败",
  retryDetail: "重试",
  compatTomato: "兼容 Tomato",
  compatDsh: "DSH 兼容",
  compatOther: "不是插件包",
  compatUnknown: "兼容性未知",
  compatCurrent: "兼容当前 TOMATO",
  runtimeVersion: "当前 TOMATO {version}",
  dshRequirement: "需要 DeepSeek Harness {range}",
  tomatoRequirement: "需要 Tomato {range}",
  peerRequirement: "需要 {peer} {range}",
  substitutedVersion: "已改用与当前 TOMATO {runtime} 兼容的 {selected}：{requested} 在这个版本上无法运行。",
  compatNoticeTitle: "此插件来自 DeepSeek Harness，将通过兼容层安装",
  compatNoticeBody: "安装时会下载该版本，把 @deepseek-ai/* 包名、dsh 清单字段与代码导入改写为 @tomato/*，再交给 Tomato 的安装器。兼容层只做命名与清单转换，不保证插件内部 API 完全一致，个别插件仍可能加载失败。",
  adaptFailedTitle: "兼容转换失败",
  adaptFailedBody: "转换这个版本时失败：{reason}",
  incompatibleTitle: "没有与该 TOMATO 兼容的版本",
  incompatibleBody: "当前 TOMATO {runtime} 无法运行 {name} 的任何已列出发布版本，最新版本 {version} 也不满足要求。",
  installCompat: "安装兼容版",
  otherNoticeTitle: "此包不是 Tomato 插件",
  otherNoticeBody: "它没有声明 tomato.bundle，安装后不会出现在插件列表中，也不会被加载。",
  unknownNoticeTitle: "无法确认此版本的兼容性",
  unknownNoticeBody: "注册表没有返回有效的清单（{reason}）。仍可继续，Tomato 会在安装时再检查一次。",
  continueInstall: "仍然安装",
  close: "关闭",
  viewRepository: "打开源码仓库",
  codeCopy: "复制",
  codeCopied: "已复制",
  codeBlock: "代码块",
  codeWrap: "自动换行",
  codeUnwrap: "取消换行",
  footnotes: "脚注",
  fromCatalog: "目录来源：{title}",
  starNote: "星标来自 GitHub，按仓库匹配",
  installFailed: "安装检查失败：{reason}",
  noVersions: "没有可用版本",
  versionListed: "v{version}",
  sourcePackage: "npm 包",
  sourceRegistry: "注册表",
  sourceGit: "Git 仓库",
  sourceCommit: "提交",
  sourceDirectory: "包目录",
  banner: "目录内容来自社区，Tomato 只校验文件格式，不校验作者声明。安装前请核对来源。",
  marketingTab: "营销插件市场",
  marketingLede: "为海外达人营销精选的开源免费能力：{plugins} 个插件、{mcp} 个 MCP 服务器、{skills} 个 Skill。",
  marketingBanner: "条目由第三方维护，Tomato 固定了审核时的版本。MCP 服务器和插件会以你的权限在本机运行，安装前请核对来源。",
  marketingBack: "返回营销插件市场",
  marketingLoadFailed: "读取营销清单失败",
  marketingSearch: "搜索名称、平台或用途，例如 TikTok",
  kindFilter: "按类型筛选",
  kindAll: "全部类型",
  kindPlugin: "插件",
  kindMcp: "MCP",
  kindSkill: "Skill",
  accessFreeKey: "需免费 key",
  accessSelfHosted: "需自部署",
  accessLogin: "需登录",
  manualInstall: "手动安装",
  installed: "已安装",
  viewSteps: "查看步骤",
  viewDetails: "查看",
  uninstall: "卸载",
  managePlugin: "在已安装中管理",
  license: "许可证",
  updated: "最近更新",
  pinnedVersion: "固定版本",
  pinnedCommit: "固定提交",
  packageName: "软件包",
  setupTitle: "使用前准备",
  stepsTitle: "安装步骤",
  skillsTitle: "将安装的技能（{count} 个）",
  envTitle: "需要设置的环境变量",
  envHint: "把这些变量写进 `~/.tomato/.env` 后重启应用。Tomato 只把变量名写进配置，不保存 key 的值。",
  loginRiskTitle: "账号风险",
  loginRiskBody: "这个工具会用你自己的账号登录态读取平台数据，可能违反平台条款并导致账号受限或被封，平台改版后也可能失效。建议使用小号。",
  confirmMcpTitle: "安装 MCP 服务器 {name}",
  confirmSkillTitle: "安装 Skill {name}",
  confirmUninstallTitle: "卸载 {name}",
  confirmLoading: "正在检查…",
  confirmCommand: "将在本机运行的命令",
  confirmYaml: "将追加到当前 profile 的 cordis.patch.yml",
  confirmSkills: "将写入 ~/.tomato/skills 的目录",
  confirmSource: "来源：{repository}",
  confirmInstall: "确认安装",
  confirmUninstall: "确认卸载",
  uninstallMcpBody: "将从当前 profile 的 cordis.patch.yml 删除这一行配置，其他内容不变。",
  uninstallSkillBody: "将删除本市场安装的这些技能目录：{skills}。你自己写的同名技能不会被删除。",
  runnerMissing: "本机没有找到 {runner}，这个服务器暂时无法启动。{hint}",
  runnerHintUvx: "请先安装 uv：https://docs.astral.sh/uv/ ，Tomato 不会自动安装。",
  runnerHintNpx: "请先安装 Node.js：https://nodejs.org/ ，Tomato 不会自动安装。",
  skillConflict: "这些技能已经存在，而且不是本市场安装的，为避免覆盖已停止安装：{skills}。请先改名或移走它们。",
  working: "正在处理…",
  installDone: "已安装 {name}。",
  uninstallDone: "已卸载 {name}。",
  appliedHint: "已在当前 profile 生效，新会话即可使用。",
  restartHint: "重启应用后生效。",
  skillAppliedHint: "下一步对话即可使用。",
  actionFailed: "操作失败：{reason}",
  warningsTitle: "配置已写入，但有以下提示："
};
var en = {
  tab: "General plugins",
  lede: "Browse the open DeepSeek Harness plugin catalog and install plugins that run in Tomato.",
  searchPlaceholder: "Search plugins, authors, or keywords",
  all: "All",
  sortLabel: "Sort",
  sortStars: "By GitHub stars",
  sortUpdated: "By last update",
  sortName: "By name",
  refresh: "Refresh catalog",
  plugins: "{count} plugins",
  categories: "{count} categories",
  loading: "Reading the plugin catalog…",
  loadFailed: "Could not read the plugin catalog",
  retry: "Retry",
  empty: "No matching plugins",
  clear: "Clear search",
  install: "Install",
  checking: "Checking…",
  open: "Open {name}",
  stars: "★ {count}",
  noStars: "No stars yet",
  viewAll: "View all {count}",
  back: "Back to general plugins",
  more: "Show more",
  filtered: "Filtered",
  homepage: "Homepage",
  repository: "Source code",
  versions: "Versions",
  published: "Published {date}",
  author: "by {author}",
  detailTitle: "Plugin description",
  detailLoading: "Reading the plugin description…",
  detailNone: "This plugin declares no description document.",
  detailFailed: "Could not read the description",
  retryDetail: "Retry",
  compatTomato: "Tomato compatible",
  compatDsh: "DSH compatible",
  compatOther: "Not a plugin package",
  compatUnknown: "Compatibility unknown",
  compatCurrent: "Compatible with this TOMATO",
  runtimeVersion: "Running TOMATO {version}",
  dshRequirement: "Requires DeepSeek Harness {range}",
  tomatoRequirement: "Requires Tomato {range}",
  peerRequirement: "Requires {peer} {range}",
  substitutedVersion: "Installed {selected} instead: {requested} cannot run on TOMATO {runtime}.",
  compatNoticeTitle: "This DeepSeek Harness plugin installs through the compatibility layer",
  compatNoticeBody: "Installation downloads this version, rewrites @deepseek-ai package names, dsh manifest fields, and code imports to @tomato names, then hands it to Tomato's installer. The layer converts names and metadata only; an individual plugin may still fail to load if its internals changed.",
  adaptFailedTitle: "Compatibility conversion failed",
  adaptFailedBody: "Converting this version failed: {reason}",
  incompatibleTitle: "No version compatible with this TOMATO",
  incompatibleBody: "No listed release of {name} runs on TOMATO {runtime}; the newest, {version}, does not meet its requirements.",
  installCompat: "Install compatible build",
  otherNoticeTitle: "This package is not a Tomato plugin",
  otherNoticeBody: "It declares no tomato.bundle, so installation would not add a loadable plugin layer.",
  unknownNoticeTitle: "Could not confirm this version",
  unknownNoticeBody: "No registry returned a usable manifest ({reason}). You can continue; Tomato checks compatibility again when it installs.",
  continueInstall: "Install anyway",
  close: "Close",
  viewRepository: "Open source repository",
  codeCopy: "Copy",
  codeCopied: "Copied",
  codeBlock: "Code block",
  codeWrap: "Wrap lines",
  codeUnwrap: "Unwrap lines",
  footnotes: "Footnotes",
  fromCatalog: "Catalog: {title}",
  starNote: "Star counts come from GitHub, matched by repository",
  installFailed: "Compatibility check failed: {reason}",
  noVersions: "No installable version",
  versionListed: "v{version}",
  sourcePackage: "npm package",
  sourceRegistry: "Registry",
  sourceGit: "Git repository",
  sourceCommit: "Commit",
  sourceDirectory: "Package directory",
  banner: "Catalog entries are third-party content. Tomato validates the file format, not the claims. Check the source before installing.",
  marketingTab: "Marketing plugins",
  marketingLede: "Open-source, free capabilities curated for overseas creator marketing: {plugins} plugins, {mcp} MCP servers, and {skills} Skills.",
  marketingBanner: "Third parties maintain these entries; Tomato pins the versions it reviewed. MCP servers and plugins run on this machine with your permissions, so check the source before installing.",
  marketingBack: "Back to marketing plugins",
  marketingLoadFailed: "Could not read the marketing catalog",
  marketingSearch: "Search by name, platform, or task, such as TikTok",
  kindFilter: "Filter by type",
  kindAll: "All types",
  kindPlugin: "Plugin",
  kindMcp: "MCP",
  kindSkill: "Skill",
  accessFreeKey: "Free key needed",
  accessSelfHosted: "Self-hosted",
  accessLogin: "Login needed",
  manualInstall: "Manual install",
  installed: "Installed",
  viewSteps: "View steps",
  viewDetails: "View",
  uninstall: "Uninstall",
  managePlugin: "Manage in Installed",
  license: "License",
  updated: "Last update",
  pinnedVersion: "Pinned version",
  pinnedCommit: "Pinned commit",
  packageName: "Package",
  setupTitle: "Before you start",
  stepsTitle: "Install steps",
  skillsTitle: "Skills this installs ({count})",
  envTitle: "Environment variables to set",
  envHint: "Put these variables in `~/.tomato/.env`, then restart the app. Tomato writes only their names to the configuration, never the values.",
  loginRiskTitle: "Account risk",
  loginRiskBody: "This tool reads platform data with your own login session. That can break the platform's terms and get the account restricted or banned, and it can stop working when the platform changes. Use a secondary account.",
  confirmMcpTitle: "Install MCP server {name}",
  confirmSkillTitle: "Install Skill {name}",
  confirmUninstallTitle: "Uninstall {name}",
  confirmLoading: "Checking…",
  confirmCommand: "Command that runs on this machine",
  confirmYaml: "Added to this profile's cordis.patch.yml",
  confirmSkills: "Directories written to ~/.tomato/skills",
  confirmSource: "Source: {repository}",
  confirmInstall: "Install",
  confirmUninstall: "Uninstall",
  uninstallMcpBody: "This removes the entry's row from this profile's cordis.patch.yml and changes nothing else.",
  uninstallSkillBody: "This deletes the skill directories this market installed: {skills}. Skills you wrote under the same name stay.",
  runnerMissing: "{runner} was not found on this machine, so this server cannot start yet. {hint}",
  runnerHintUvx: "Install uv first: https://docs.astral.sh/uv/. Tomato does not install it for you.",
  runnerHintNpx: "Install Node.js first: https://nodejs.org/. Tomato does not install it for you.",
  skillConflict: "Installation stopped so nothing is overwritten. These skills already exist and did not come from this market: {skills}. Rename or move them first.",
  working: "Working…",
  installDone: "Installed {name}.",
  uninstallDone: "Uninstalled {name}.",
  appliedHint: "Active in this profile; new sessions can use it.",
  restartHint: "Restart the app to apply it.",
  skillAppliedHint: "Available from the next step of a conversation.",
  actionFailed: "That did not work: {reason}",
  warningsTitle: "The configuration was saved, with these notes:"
};
var DICTIONARIES = { zh, en };
function installI18n(ctx) {
  ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), "tomato-market: dictionaries");
  const t = ctx.locale.bind(NS);
  return { t, language: () => ctx.locale.getLocale().active };
}

// src/client/api.js
var ROUTE = "api/tomato-market";
async function call(endpoint, payload = {}, signal) {
  let response;
  try {
    response = await fetch(new URL(ROUTE, document.baseURI), {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint, payload }),
      signal
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error(`network: ${error?.message ?? error}`);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error?.message ?? "request failed");
  return result.data;
}
function readCatalog(refresh = false) {
  return call("catalog", { refresh });
}
function readManifest(plugin, version) {
  return call("manifest", { name: plugin.name, version: version.version });
}
function adaptVersion(plugin, version) {
  return call("adapt", { name: plugin.name, version: version.version });
}
function resolveVersion(plugin, version) {
  return call("resolve", { name: plugin.name, version: version.version });
}
function readDetail(plugin, version) {
  return call("detail", { name: plugin.name, version: version.version });
}
function readMarketingCatalog() {
  return call("marketing-catalog");
}
function previewMarketingEntry(id) {
  return call("marketing-preview", { id });
}
function installMarketingEntry(id) {
  return call("marketing-install", { id });
}
function uninstallMarketingEntry(id) {
  return call("marketing-uninstall", { id });
}
function readMarketingDetail(id) {
  return call("marketing-detail", { id });
}

// src/client/search.js
function localized(value, language) {
  if (value === void 0) return "";
  if (typeof value === "string") return value;
  return value[language] ?? value.en ?? Object.values(value)[0] ?? "";
}
function latestVersion(plugin) {
  return plugin.versions[0];
}
function starsOf(plugin, stars) {
  const direct = stars[`npm:${plugin.name}`];
  if (direct !== void 0) return direct;
  const slug = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/i.exec(plugin.repository?.url ?? "");
  if (slug === null) return void 0;
  return stars[`gh:${slug[1].toLowerCase()}/${slug[2].toLowerCase()}`];
}
function formatStars(count) {
  if (count === void 0) return "";
  if (count < 1e3) return String(count);
  if (count < 1e6) return `${(count / 1e3).toFixed(count < 1e4 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(count / 1e6).toFixed(1).replace(/\.0$/, "")}m`;
}
function formatDate(timestamp, language) {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return "";
  return new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(timestamp * 1e3));
}
var searchTexts = /* @__PURE__ */ new WeakMap();
function searchText(plugin, language) {
  let byLanguage = searchTexts.get(plugin);
  if (byLanguage === void 0) {
    byLanguage = /* @__PURE__ */ new Map();
    searchTexts.set(plugin, byLanguage);
  }
  let text = byLanguage.get(language);
  if (text === void 0) {
    text = [
      plugin.name,
      localized(plugin.title, language),
      localized(plugin.description, language),
      plugin.author ?? "",
      plugin.category ?? "",
      ...plugin.keywords ?? []
    ].join("\n").toLowerCase();
    byLanguage.set(language, text);
  }
  return text;
}
function filterPlugins(plugins, { query = "", category = null, language }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0 && category === null) return plugins;
  return plugins.filter((plugin) => {
    if (category !== null && plugin.category !== category) return false;
    if (words.length === 0) return true;
    const text = searchText(plugin, language);
    return words.every((word) => text.includes(word));
  });
}
function sortPlugins(plugins, sort, stars, language) {
  const collator = new Intl.Collator(language);
  const byName = (a, b) => collator.compare(localized(a.title, language) || a.name, localized(b.title, language) || b.name);
  const ordered = [...plugins];
  switch (sort) {
    case "stars":
      return ordered.sort((a, b) => {
        const left = starsOf(a, stars);
        const right = starsOf(b, stars);
        if (left === void 0 || right === void 0) {
          if (left !== right) return left === void 0 ? 1 : -1;
        } else if (left !== right) return right - left;
        return byName(a, b);
      });
    case "updated":
      return ordered.sort((a, b) => (latestVersion(b)?.publishTimestamp ?? 0) - (latestVersion(a)?.publishTimestamp ?? 0) || byName(a, b));
    case "name":
      return ordered.sort(byName);
    default:
      return ordered;
  }
}
function categoryCounts(plugins) {
  const counts = /* @__PURE__ */ new Map();
  for (const plugin of plugins) {
    if (plugin.category === void 0) continue;
    counts.set(plugin.category, (counts.get(plugin.category) ?? 0) + 1);
  }
  return counts;
}
function categorySections(plugins, categories, stars, language, limit, sort = "stars") {
  const counts = categoryCounts(plugins);
  const declared = categories.filter((category) => counts.has(category.id));
  const titleOf = new Map(declared.map((category) => [category.id, localized(category.title, language)]));
  const extra = [...counts.keys()].filter((id) => !titleOf.has(id));
  for (const id of extra) titleOf.set(id, id);
  return [...titleOf.keys()].map((id) => {
    const members = sortPlugins(plugins.filter((plugin) => plugin.category === id), sort, stars, language);
    return { id, title: titleOf.get(id) ?? id, count: counts.get(id) ?? 0, total: members.length, plugins: members.slice(0, limit) };
  }).sort((a, b) => b.total - a.total || new Intl.Collator(language).compare(a.title, b.title));
}
function targetsDeepSeek(version) {
  return typeof version?.dsh === "string";
}
function requirementOf(requirements) {
  const entries = Object.entries(requirements ?? {});
  if (entries.length === 0) return void 0;
  const engine = entries.find(([name]) => name === "engines.tomato");
  if (engine !== void 0) return { key: "tomatoRequirement", params: { range: engine[1] } };
  const [peer, range] = entries[0];
  return { key: "peerRequirement", params: { peer, range } };
}
function installTarget(plugin, version) {
  if (version.source.type === "git") {
    return { spec: `git+${version.source.url}.git#${version.source.commit}${version.source.path === void 0 ? "" : `&path:/${version.source.path}`}` };
  }
  return {
    spec: `${plugin.name}@${version.version}`,
    ...version.source.registry === void 0 ? {} : { registry: version.source.registry }
  };
}

// src/client/store.js
function createStore(initial) {
  let state = initial;
  const listeners = /* @__PURE__ */ new Set();
  return {
    get: () => state,
    set(next) {
      state = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
function createController(i18n) {
  const store = createStore({
    status: "idle",
    catalog: null,
    failure: null,
    language: i18n.language(),
    query: "",
    category: null,
    sort: "stars",
    limit: 60,
    selected: null,
    detail: { status: "idle" },
    compat: { status: "idle" },
    checking: null,
    notice: null,
    substitution: null
  });
  let loadToken = 0;
  let detailToken = 0;
  const set = (patch) => {
    store.set({ ...store.get(), ...patch });
  };
  const state = () => store.get();
  const load = async (refresh = false) => {
    const token = ++loadToken;
    set({ status: state().catalog === null ? "loading" : state().status, failure: null });
    try {
      const catalog = await readCatalog(refresh);
      if (token !== loadToken) return;
      set({ status: "ready", catalog, failure: null });
    } catch (error) {
      if (token !== loadToken) return;
      set({ status: "error", failure: error?.message ?? String(error) });
    }
  };
  const open = async (plugin) => {
    const token = ++detailToken;
    const version = latestVersion(plugin);
    set({
      selected: plugin,
      detail: { status: "loading" },
      compat: { status: "loading" }
    });
    if (version !== void 0) {
      readDetail(plugin, version).then(
        (detail) => {
          if (token === detailToken) set({ detail: detail.status === "found" ? { status: "found", markdown: detail.markdown } : { status: "none" } });
        },
        (error) => {
          if (token === detailToken) set({ detail: { status: "error", message: error?.message ?? String(error) } });
        }
      );
      readManifest(plugin, version).then(
        (compat) => {
          if (token === detailToken) set({ compat: { status: "ready", data: compat } });
        },
        (error) => {
          if (token === detailToken) set({ compat: { status: "error", reason: error?.message ?? String(error) } });
        }
      );
    }
  };
  const retryDetail = () => {
    const plugin = state().selected;
    if (plugin === null) return;
    void open(plugin);
  };
  const install = async (plugin, version, installFn) => {
    if (state().checking !== null) return;
    set({ checking: plugin.name, notice: null });
    const resolution = await resolveVersion(plugin, version).catch((error) => ({ status: "unknown", reason: error?.message ?? String(error) }));
    if (resolution.status === "none") {
      set({ checking: null, notice: { kind: "incompatible", plugin, version, resolution } });
      return;
    }
    const selected = resolution.status === "resolved" ? plugin.versions.find((entry) => entry.version === resolution.selected) ?? { version: resolution.selected, source: { type: "npm" } } : void 0;
    const chosen = selected ?? version;
    if (chosen.version !== version.version) {
      set({ substitution: { plugin, requested: version, selected: chosen, runtimeVersion: resolution.runtimeVersion } });
    }
    let compat;
    try {
      compat = await readManifest(plugin, chosen);
    } catch (error) {
      set({
        checking: null,
        notice: {
          kind: "unknown",
          plugin,
          version: chosen,
          reason: error?.message ?? String(error)
        }
      });
      return;
    }
    const title = localized(plugin.title, state().language) || plugin.name;
    const target = installTarget(plugin, chosen);
    if (compat.class === "tomato") {
      set({ checking: null });
      installFn({ ...target, title, version: chosen.version });
      return;
    }
    set({
      checking: null,
      notice: {
        kind: compat.class === "dsh" ? "compat" : "other",
        plugin,
        version: chosen,
        compat
      }
    });
  };
  const adaptAndInstall = async (installFn) => {
    const notice = state().notice;
    if (notice === null || notice.kind !== "compat") return;
    const { plugin, version } = notice;
    set({ checking: plugin.name, notice: null });
    try {
      const adapted = await adaptVersion(plugin, version);
      set({ checking: null });
      installFn({
        spec: adapted.spec,
        title: localized(plugin.title, state().language) || plugin.name,
        version: version.version
      });
    } catch (error) {
      set({
        checking: null,
        notice: { kind: "adapt-failed", plugin, version, reason: error?.message ?? String(error) }
      });
    }
  };
  const confirmOverride = (installFn) => {
    const notice = state().notice;
    if (notice === null || notice.kind !== "unknown") return;
    const { plugin, version } = notice;
    const title = localized(plugin.title, state().language) || plugin.name;
    set({ notice: null });
    installFn({ ...installTarget(plugin, version), title, version: version.version });
  };
  return {
    store,
    getState: state,
    ensure: () => {
      if (state().status === "idle") void load();
    },
    reload: () => {
      void load(true);
    },
    retry: () => {
      void load(false);
    },
    setLanguage: (language) => {
      if (language !== state().language) set({ language });
    },
    setQuery: (query) => {
      set({ query, limit: 60 });
    },
    setCategory: (category) => {
      set({ category, query: "", limit: 60 });
    },
    setSort: (sort) => {
      set({ sort });
    },
    showMore: () => {
      set({ limit: state().limit + 60 });
    },
    open,
    back: () => {
      detailToken += 1;
      set({ selected: null, detail: { status: "idle" }, compat: { status: "idle" } });
    },
    retryDetail,
    install,
    adaptAndInstall,
    confirmOverride,
    dismissNotice: () => {
      set({ notice: null });
    },
    dismissSubstitution: () => {
      set({ substitution: null });
    }
  };
}

// src/client/marketing-store.js
var PAGE = 60;
function createMarketingController(i18n) {
  const store = createStore({
    status: "idle",
    catalog: null,
    failure: null,
    language: i18n.language(),
    query: "",
    category: null,
    kind: "all",
    sort: "stars",
    limit: PAGE,
    selected: null,
    detail: { status: "idle" },
    dialog: null
  });
  let loadToken = 0;
  let detailToken = 0;
  let dialogToken = 0;
  const state = () => store.get();
  const set = (patch) => {
    store.set({ ...state(), ...patch });
  };
  const load = async () => {
    const token = ++loadToken;
    set({ status: state().catalog === null ? "loading" : state().status, failure: null });
    try {
      const catalog = await readMarketingCatalog();
      if (token === loadToken) set({ status: "ready", catalog });
    } catch (error) {
      if (token === loadToken) set({ status: "error", failure: error?.message ?? String(error) });
    }
  };
  const open = (entry) => {
    const token = ++detailToken;
    set({ selected: entry.id, detail: { status: "loading" } });
    readMarketingDetail(entry.id).then(
      (detail) => {
        if (token === detailToken) set({ detail: detail.status === "found" ? { status: "found", markdown: detail.markdown } : { status: "none" } });
      },
      (error) => {
        if (token === detailToken) set({ detail: { status: "error", message: error?.message ?? String(error) } });
      }
    );
  };
  const startInstall = async (entry) => {
    const token = ++dialogToken;
    set({ dialog: { mode: "install", entry, phase: "loading" } });
    try {
      const preview = await previewMarketingEntry(entry.id);
      if (token === dialogToken) set({ dialog: { mode: "install", entry, phase: "ready", preview } });
    } catch (error) {
      if (token === dialogToken) set({ dialog: { mode: "install", entry, phase: "failed", reason: error?.message ?? String(error) } });
    }
  };
  const confirm = async () => {
    const dialog = state().dialog;
    if (dialog === null || dialog.phase !== "ready") return;
    const token = ++dialogToken;
    set({ dialog: { ...dialog, phase: "working" } });
    try {
      const result = dialog.mode === "install" ? await installMarketingEntry(dialog.entry.id) : await uninstallMarketingEntry(dialog.entry.id);
      await load();
      if (token === dialogToken) set({ dialog: { ...dialog, phase: "done", result } });
    } catch (error) {
      await load();
      if (token === dialogToken) set({ dialog: { ...dialog, phase: "failed", reason: error?.message ?? String(error) } });
    }
  };
  return {
    store,
    ensure: () => {
      if (state().status === "idle") void load();
    },
    reload: () => {
      void load();
    },
    setLanguage: (language) => {
      if (language !== state().language) set({ language });
    },
    setQuery: (query) => {
      set({ query, limit: PAGE });
    },
    setCategory: (category) => {
      set({ category, limit: PAGE });
    },
    setKind: (kind) => {
      set({ kind, limit: PAGE });
    },
    setSort: (sort) => {
      set({ sort });
    },
    showMore: () => {
      set({ limit: state().limit + PAGE });
    },
    open,
    retryDetail: () => {
      const entry = state().catalog?.entries.find((candidate) => candidate.id === state().selected);
      if (entry !== void 0) open(entry);
    },
    back: () => {
      detailToken += 1;
      set({ selected: null, detail: { status: "idle" } });
    },
    startInstall,
    startUninstall: (entry) => {
      dialogToken += 1;
      set({ dialog: { mode: "uninstall", entry, phase: "ready" } });
    },
    confirm,
    closeDialog: () => {
      dialogToken += 1;
      set({ dialog: null });
    }
  };
}

// src/client/market.jsx
var import_jsx_runtime4 = require("react/jsx-runtime");

// src/client/styles.js
var MARKET_CSS = `
.tm-section { display: flex; flex-direction: column; gap: 16px; }
.tm-lede { margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-tertiary); }
.tm-banner { display: flex; gap: 8px; align-items: flex-start; margin: 0; padding: 10px 12px; border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-module-platform); font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.tm-substitution { display: flex; gap: 8px; align-items: baseline; margin: 0; padding: 10px 12px; border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-module-platform); font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.tm-substitutionText { flex: 1; min-width: 0; }
.tm-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tm-search { flex: 1; min-width: 160px; }
.tm-source { color: var(--dsw-alias-state-business-primary); text-decoration: none; }
.tm-source:hover { text-decoration: underline; }
.tm-count { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }
.tm-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.tm-group { display: flex; flex-direction: column; gap: 6px; }
.tm-groupHead { display: flex; align-items: baseline; gap: 8px; }
.tm-groupTitle { margin: 0; font-size: 13px; line-height: 20px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.tm-groupCount { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.tm-groupMore { margin-left: auto; padding: 0; border: 0; background: transparent; color: var(--dsw-alias-state-business-primary); font: inherit; font-size: 12px; cursor: pointer; }
.tm-groupMore:hover { text-decoration: underline; }
.tm-cards { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
.tm-card { position: relative; display: flex; align-items: center; gap: 14px; margin: 0 -8px; padding: 8px; border-radius: var(--dsw-radius-xl); }
@media (hover: hover) { .tm-card:hover { background: var(--dsw-alias-interactive-bg-hover); } }
.tm-icon { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 48px; height: 48px; border: .5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-lg); color: var(--dsw-alias-label-secondary); overflow: hidden; }
.tm-image { width: 36px; height: 36px; object-fit: contain; }
.tm-main { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.tm-titleRow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
.tm-cardOpen { max-width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-size: 14px; line-height: 20px; font-weight: 500; text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tm-cardOpen::after { content: ''; position: absolute; inset: 0; border-radius: var(--dsw-radius-xl); }
.tm-cardOpen:focus-visible { outline: none; }
.tm-cardOpen:focus-visible::after { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }
.tm-description { display: -webkit-box; overflow: hidden; font-size: 13px; line-height: 18px; color: var(--dsw-alias-label-tertiary); -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.tm-meta { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.tm-stars { font-variant-numeric: tabular-nums; }
.tm-end { position: relative; z-index: 1; display: inline-flex; flex: none; align-items: center; gap: 8px; }
.tm-status { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; padding: 16px 0; }
.tm-error { display: inline-flex; align-items: center; gap: 6px; margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-state-error-primary); }
.tm-skeletons { display: flex; flex-direction: column; gap: 2px; }
.tm-skeleton { display: flex; align-items: center; gap: 14px; padding: 8px; margin: 0 -8px; }
.tm-skeletonIcon { width: 48px; height: 48px; border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-module-platform); animation: tm-pulse 1.6s ease-in-out infinite; }
.tm-skeletonLines { display: flex; flex: 1; flex-direction: column; gap: 6px; }
.tm-skeletonLine { height: 12px; border-radius: var(--dsw-radius-sm); background: var(--dsw-alias-bg-module-platform); animation: tm-pulse 1.6s ease-in-out infinite; }
.tm-skeletonLine:nth-child(2) { width: 60%; }
@keyframes tm-pulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .tm-skeletonIcon, .tm-skeletonLine { animation: none; } }
.tm-more { display: flex; justify-content: center; padding: 8px 0; }
.tm-detail { display: flex; flex-direction: column; gap: 16px; }
.tm-back { display: inline-flex; align-self: flex-start; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13px; cursor: pointer; }
.tm-back:hover { color: var(--dsw-alias-label-primary); }
.tm-head { display: flex; align-items: flex-start; gap: 14px; }
.tm-headIcon { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 56px; height: 56px; border: .5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-lg); }
.tm-headMain { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.tm-headTitle { margin: 0; font-size: 18px; line-height: 26px; font-weight: 600; overflow-wrap: anywhere; }
.tm-headMeta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.tm-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tm-descriptionFull { margin: 0; font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; }
.tm-sectionTitle { margin: 0; font-size: 13px; line-height: 20px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.tm-facts { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0; font-size: 13px; line-height: 20px; }
.tm-facts dt { color: var(--dsw-alias-label-tertiary); }
.tm-facts dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.tm-facts a { color: var(--dsw-alias-state-business-primary); text-decoration: none; }
.tm-facts a:hover { text-decoration: underline; }
.tm-versions { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
.tm-version { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
.tm-versionMain { display: flex; flex: 1; flex-direction: column; gap: 1px; min-width: 0; }
.tm-versionName { font-size: 13px; line-height: 20px; font-weight: 500; font-variant-numeric: tabular-nums; }
.tm-notice { display: flex; flex-direction: column; gap: 10px; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.tm-notice p { margin: 0; }
.tm-noticeRange { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.tm-linkButton { align-self: flex-start; }
.tm-filters { display: flex; flex-direction: column; gap: 10px; }
.tm-tags { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tm-callout { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 10px 12px; border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-module-platform); font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.tm-calloutTitle { font-weight: 600; }
.tm-code { margin: 0; padding: 10px 12px; border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-module-platform); font-family: var(--ds-font-family-code); font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
.tm-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.tm-markdown { font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); min-width: 0; }

@media (max-width: 720px) {
  .tm-card { gap: 10px; }
  .tm-icon { width: 40px; height: 40px; }
  .tm-image { width: 30px; height: 30px; }
  .tm-description { -webkit-line-clamp: 2; }
}
`;
function installStyles() {
  if (typeof document === "undefined") return;
  const id = "tomato-market-styles";
  if (document.getElementById(id) !== null) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = MARKET_CSS;
  document.head.appendChild(style);
}

// src/client/widgets.jsx
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_client_ui_primitives = require("@tomato/client-ui-primitives");
function MarketIcon({ src, size = 36 }) {
  const [failed, setFailed] = (0, import_react.useState)();
  return src === void 0 || src === failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_client_ui_primitives.PluginArtworkDefault, { size }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { className: "tm-image", src, width: size, height: size, alt: "", loading: "lazy", referrerPolicy: "no-referrer", onError: () => {
    setFailed(src);
  } });
}
function Stars({ plugin, stars, t }) {
  const count = starsOf(plugin, stars);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_client_ui_primitives.Tag, { tone: "quiet", className: "tm-stars", children: count === void 0 ? t("noStars") : t("stars", { count: formatStars(count) }) });
}
function metaLine(plugin, language, t) {
  const version = latestVersion(plugin);
  if (version === void 0) return t("noVersions");
  const date = formatDate(version.publishTimestamp, language);
  return [t("versionListed", { version: version.version }), date === "" ? "" : t("published", { date }), plugin.author === void 0 ? "" : t("author", { author: plugin.author })].filter((part) => part !== "").join(" · ");
}
function MarketCard({ plugin, t, language, stars, checking, onOpen, onInstall }) {
  const title = localized(plugin.title, language) || plugin.name;
  const version = latestVersion(plugin);
  const description = localized(plugin.description, language);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: "tm-card", "data-market-plugin": plugin.name, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tm-icon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketIcon, { src: plugin.icon }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tm-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tm-titleRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "tm-cardOpen", "aria-label": t("open", { name: title }), onClick: onOpen, children: title }),
        targetsDeepSeek(version) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_client_ui_primitives.Tag, { tone: "warning", children: t("compatDsh") }) : null
      ] }),
      description === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tm-description", children: description }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tm-meta", children: metaLine(plugin, language, t) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tm-end", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stars, { plugin, stars, t }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_client_ui_primitives.Button, { variant: "outline", size: "sm", disabled: checking, onClick: () => {
        onInstall(plugin);
      }, children: checking ? t("checking") : t("install") })
    ] })
  ] });
}
function MarketSkeletons({ label }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tm-skeletons", role: "status", "aria-label": label, children: [0, 1, 2, 3].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tm-skeleton", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tm-skeletonIcon" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tm-skeletonLines", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tm-skeletonLine" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tm-skeletonLine" })
    ] })
  ] }, row)) });
}

// src/client/detail.jsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var import_client_ui_primitives2 = require("@tomato/client-ui-primitives");
function sourceFacts(plugin, version, t) {
  const facts = [];
  if (version.source.type === "git") {
    facts.push({ label: t("sourceGit"), value: version.source.url });
    facts.push({ label: t("sourceCommit"), value: version.source.commit });
    if (version.source.path !== void 0) facts.push({ label: t("sourceDirectory"), value: version.source.path });
  } else {
    facts.push({ label: t("sourcePackage"), value: `${plugin.name}@${version.version}` });
    if (version.source.registry !== void 0) facts.push({ label: t("sourceRegistry"), value: version.source.registry });
  }
  return facts;
}
function compatKey(compat) {
  if (compat.status !== "ready") return "compatUnknown";
  switch (compat.data?.class) {
    case "tomato":
      return "compatTomato";
    case "dsh":
      return "compatDsh";
    case "other":
      return "compatOther";
    default:
      return "compatUnknown";
  }
}
function compatTone(compat) {
  if (compat.status !== "ready") return "quiet";
  switch (compat.data?.class) {
    case "tomato":
      return "success";
    case "dsh":
      return "info";
    case "other":
      return "neutral";
    default:
      return "quiet";
  }
}
function VersionRow({ plugin, version, state, controller, install, t }) {
  const reg = installTarget(plugin, version);
  const date = formatDate(version.publishTimestamp, state.language);
  const requirement = version.dsh !== void 0 ? t("dshRequirement", { range: version.dsh }) : version.tomato !== void 0 ? t("tomatoRequirement", { range: version.tomato }) : "";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "tm-version", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tm-versionMain", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "tm-versionName", children: version.version }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "tm-meta", children: [date, requirement, reg.spec].filter((part) => part !== "").join(" · ") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_client_ui_primitives2.Button,
      {
        variant: "ghost",
        size: "sm",
        disabled: state.checking !== null,
        onClick: () => {
          void controller.install(plugin, version, install);
        },
        children: t("install")
      }
    )
  ] });
}
function PluginPage({ plugin, state, controller, install, t }) {
  const language = state.language;
  const title = localized(plugin.title, language) || plugin.name;
  const version = latestVersion(plugin);
  const stars = starsOf(plugin, state.catalog?.stars ?? {});
  const description = localized(plugin.description, language);
  const verdict = state.compat.status === "ready" ? state.compat.data?.compatibility : void 0;
  const runtimeVersion = state.compat.status === "ready" ? state.compat.data?.runtimeVersion : void 0;
  const requirement = verdict?.status === "incompatible" ? requirementOf(verdict.requirements) : void 0;
  const facts = version === void 0 ? [] : sourceFacts(plugin, version, t);
  const labels = (0, import_client_ui_primitives2.useDetailDocumentLabels)({
    title: t("detailTitle"),
    loading: t("detailLoading"),
    retry: t("retryDetail"),
    copy: t("codeCopy"),
    copied: t("codeCopied"),
    codeBlock: t("codeBlock"),
    wrap: t("codeWrap"),
    unwrap: t("codeUnwrap"),
    footnotes: t("footnotes")
  });
  const documentState = state.detail.status === "found" ? { status: "found", markdown: state.detail.markdown } : state.detail.status === "none" ? { status: "none" } : state.detail.status === "error" ? { status: "error", message: `${t("detailFailed")}：${state.detail.message}` } : { status: "loading" };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tm-detail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "tm-back", onClick: controller.back, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.IconChevronLeftOutlineRegular, { size: 14, "aria-hidden": "true" }),
      t("back")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tm-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "tm-headIcon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MarketIcon, { src: plugin.icon, size: 40 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tm-headMain", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "tm-headTitle", children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tm-headMeta", children: [
          plugin.category === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.Tag, { tone: "info", children: localized(state.catalog?.categories?.find((entry) => entry.id === plugin.category)?.title, language) || plugin.category }),
          targetsDeepSeek(version) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.Tag, { tone: "warning", children: t("compatDsh") }) : null,
          verdict?.status === "compatible" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.Tag, { tone: "success", children: t("compatCurrent") }) : null,
          requirement === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.Tag, { tone: "warning", children: t(requirement.key, requirement.params) }),
          runtimeVersion === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("runtimeVersion", { version: runtimeVersion }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.Tooltip, { label: t("starNote"), side: "bottom", portal: true, delayMs: 400, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "tm-stars", children: stars === void 0 ? t("noStars") : t("stars", { count: formatStars(stars) }) }) }),
          plugin.author === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("author", { author: plugin.author }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tm-end", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.Tag, { tone: compatTone(state.compat), children: t(compatKey(state.compat)) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_client_ui_primitives2.Button,
          {
            variant: "outline",
            size: "sm",
            disabled: state.checking !== null || version === void 0,
            onClick: () => {
              if (version !== void 0) void controller.install(plugin, version, install);
            },
            children: state.checking === plugin.name ? t("checking") : t("install")
          }
        )
      ] })
    ] }),
    description === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "tm-descriptionFull", children: description }),
    facts.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("dl", { className: "tm-facts", children: [
      facts.map((fact) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: fact.label, value: fact.value }, fact.label)),
      plugin.homepage === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("homepage"), link: plugin.homepage }),
      plugin.repository === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("repository"), link: plugin.repository.url, directory: plugin.repository.directory })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "tm-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "tm-sectionTitle", children: t("versions") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "tm-versions", children: plugin.versions.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(VersionRow, { plugin, version: entry, state, controller, install, t }, entry.version)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "tm-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "tm-sectionTitle", children: t("detailTitle") }),
      state.detail.status === "none" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "tm-lede", children: t("detailNone") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_client_ui_primitives2.DetailDocument, { state: documentState, labels, onRetry: controller.retryDetail })
    ] })
  ] });
}
function Row({ label, value, link, directory }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("dd", { children: [
      link === void 0 ? value : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("a", { href: link, target: "_blank", rel: "noreferrer noopener", children: value ?? link }),
      directory === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "tm-meta", children: [
        " · ",
        directory
      ] })
    ] })
  ] });
}

// src/client/notice.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var import_client_ui_primitives3 = require("@tomato/client-ui-primitives");
var TITLES = {
  compat: "compatNoticeTitle",
  "adapt-failed": "adaptFailedTitle",
  other: "otherNoticeTitle",
  incompatible: "incompatibleTitle"
};
function InstallNotice({ notice, t, onClose, onContinue, onAdapt }) {
  const { kind, plugin, compat, resolution } = notice;
  const title = t(TITLES[kind] ?? "unknownNoticeTitle");
  const body = kind === "compat" ? t("compatNoticeBody") : kind === "adapt-failed" ? t("adaptFailedBody", { reason: notice.reason ?? "" }) : kind === "other" ? t("otherNoticeBody") : kind === "incompatible" ? t("incompatibleBody", { runtime: resolution?.runtimeVersion ?? "", name: plugin.name, version: notice.version?.version ?? "" }) : t("unknownNoticeBody", { reason: notice.reason ?? "" });
  const requirement = kind === "incompatible" ? requirementOf(resolution?.rejected?.[0]?.requirements) ?? void 0 : kind === "compat" && typeof compat?.dshRange === "string" ? { key: "dshRequirement", params: { range: compat.dshRange } } : void 0;
  const repository = plugin.repository?.url;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_client_ui_primitives3.Modal,
    {
      open: true,
      onClose,
      title,
      closeLabel: t("close"),
      footer: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        kind === "unknown" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_client_ui_primitives3.Button, { variant: "primary", size: "sm", onClick: onContinue, children: t("continueInstall") }) : null,
        kind === "compat" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_client_ui_primitives3.Button, { variant: "primary", size: "sm", onClick: onAdapt, children: t("installCompat") }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_client_ui_primitives3.Button, { variant: "ghost", size: "sm", onClick: onClose, children: t("close") })
      ] }),
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-notice", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: body }),
        requirement === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-noticeRange", children: t(requirement.key, requirement.params) }),
        repository === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { className: "tm-linkButton", href: repository, target: "_blank", rel: "noreferrer noopener", children: t("viewRepository") })
      ] })
    }
  );
}

// src/client/market.jsx
var import_react2 = require("react");
var import_client_ui_primitives4 = require("@tomato/client-ui-primitives");
var SORTS = ["stars", "updated", "name"];
function sortLabel(state, t) {
  switch (state.sort) {
    case "updated":
      return t("sortUpdated");
    case "name":
      return t("sortName");
    default:
      return t("sortStars");
  }
}
function Browse({ state, controller, install, t }) {
  const [sortMenu, setSortMenu] = (0, import_react2.useState)(false);
  const catalog = state.catalog;
  const language = state.language;
  const counts = (0, import_react2.useMemo)(() => catalog === null ? /* @__PURE__ */ new Map() : categoryCounts(catalog.plugins), [catalog]);
  const pills = (0, import_react2.useMemo)(() => {
    if (catalog === null) return [];
    return catalog.categories.filter((category) => counts.has(category.id)).map((category) => ({ id: category.id, title: localized(category.title, language), count: counts.get(category.id) ?? 0 })).sort((a, b) => b.count - a.count);
  }, [catalog, counts, language]);
  const matched = (0, import_react2.useMemo)(() => catalog === null ? [] : filterPlugins(catalog.plugins, {
    query: state.query,
    category: state.category,
    language
  }), [catalog, state.query, state.category, language]);
  const ordered = (0, import_react2.useMemo)(
    () => catalog === null ? [] : sortPlugins(matched, state.sort, catalog.stars ?? {}, language),
    [catalog, matched, state.sort, language]
  );
  const grouped = state.query.trim() === "" && state.category === null;
  const sections = (0, import_react2.useMemo)(
    () => catalog === null || !grouped ? [] : categorySections(catalog.plugins, catalog.categories, catalog.stars ?? {}, language, 6, state.sort),
    [catalog, grouped, language, state.sort]
  );
  const shown = grouped ? ordered : ordered.slice(0, state.limit);
  const installVersion = (plugin) => {
    const version = latestVersion(plugin);
    if (version !== void 0) void controller.install(plugin, version, install);
  };
  const total = catalog?.plugins.length ?? 0;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tm-section", children: [
    catalog === null ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "tm-lede", children: [
        t("fromCatalog", { title: localized(catalog.title, language) }),
        " · ",
        t("plugins", { count: String(total) }),
        " · ",
        t("categories", { count: String(pills.length) }),
        " · ",
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("a", { className: "tm-source", href: "https://awesome-dsh-plugin.com", target: "_blank", rel: "noreferrer noopener", children: "awesome-dsh-plugin.com" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "tm-banner", children: t("banner") })
    ] }),
    state.status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MarketSkeletons, { label: t("loading") }) : null,
    state.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tm-status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "tm-error", role: "alert", children: [
        t("loadFailed"),
        "：",
        state.failure
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.Button, { variant: "outline", size: "sm", onClick: controller.retry, children: t("retry") })
    ] }) : null,
    catalog !== null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tm-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_client_ui_primitives4.Input,
          {
            className: "tm-search",
            type: "search",
            value: state.query,
            placeholder: t("searchPlaceholder"),
            "aria-label": t("searchPlaceholder"),
            icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.IconSearchOutlineRegular, { size: 16 }),
            onChange: (event) => {
              controller.setQuery(event.target.value);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_client_ui_primitives4.Menu,
          {
            open: sortMenu,
            onClose: () => {
              setSortMenu(false);
            },
            portal: true,
            autoFocus: true,
            align: "end",
            selectedId: state.sort,
            items: SORTS.map((sort) => ({ id: sort, label: t(sort === "updated" ? "sortUpdated" : sort === "name" ? "sortName" : "sortStars") })),
            onSelect: (id) => {
              setSortMenu(false);
              controller.setSort(id);
            },
            anchor: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              import_client_ui_primitives4.Button,
              {
                variant: "ghost",
                size: "sm",
                "aria-haspopup": "menu",
                "aria-expanded": sortMenu,
                onClick: () => {
                  setSortMenu((value) => !value);
                },
                children: [
                  t("sortLabel"),
                  "：",
                  sortLabel(state, t),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.IconChevronDownOutlineRegular, { size: 12, "aria-hidden": "true" })
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.Tooltip, { label: t("refresh"), side: "bottom", portal: true, delayMs: 500, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.Button, { variant: "ghost", size: "sm", "aria-label": t("refresh"), onClick: controller.reload, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.IconRefreshOutlineRegular, { size: 14, "aria-hidden": "true" }) }) }),
        matched.length !== 0 && state.query.trim() !== "" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.Button, { variant: "ghost", size: "sm", onClick: () => {
          controller.setQuery("");
        }, children: t("clear") }) : null,
        state.query.trim() === "" && state.category === null ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "tm-count", children: [
          t("filtered"),
          " · ",
          t("plugins", { count: String(matched.length) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tm-pills", role: "group", "aria-label": t("categories", { count: String(pills.length) }), children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_client_ui_primitives4.Pill, { active: state.category === null, onClick: () => {
          controller.setCategory(null);
        }, children: [
          t("all"),
          " ",
          total
        ] }),
        pills.map((pill) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_client_ui_primitives4.Pill, { active: state.category === pill.id, onClick: () => {
          controller.setCategory(state.category === pill.id ? null : pill.id);
        }, children: [
          pill.title,
          " ",
          pill.count
        ] }, pill.id))
      ] }),
      matched.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "tm-lede", children: t("empty") }) : grouped ? sections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "tm-group", "aria-label": section.title, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tm-groupHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: "tm-groupTitle", children: section.title }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tm-groupCount", children: t("plugins", { count: String(section.total) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "tm-groupMore", onClick: () => {
            controller.setCategory(section.id);
          }, children: t("viewAll", { count: String(section.total) }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { className: "tm-cards", children: section.plugins.map((plugin) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          MarketCard,
          {
            plugin,
            t,
            language,
            stars: catalog.stars ?? {},
            checking: state.checking === plugin.name,
            onOpen: () => {
              void controller.open(plugin);
            },
            onInstall: installVersion
          },
          plugin.name
        )) })
      ] }, section.id)) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { className: "tm-cards", children: shown.map((plugin) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          MarketCard,
          {
            plugin,
            t,
            language,
            stars: catalog.stars ?? {},
            checking: state.checking === plugin.name,
            onOpen: () => {
              void controller.open(plugin);
            },
            onInstall: installVersion
          },
          plugin.name
        )) }),
        shown.length < ordered.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "tm-more", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_client_ui_primitives4.Button, { variant: "outline", size: "sm", onClick: controller.showMore, children: t("more") }) }) : null
      ] })
    ] }) : null
  ] });
}
function MarketTab({ controller, t, install }) {
  const state = (0, import_react2.useSyncExternalStore)(controller.store.subscribe, controller.store.get, controller.store.get);
  (0, import_react2.useEffect)(() => {
    installStyles();
  }, []);
  (0, import_react2.useEffect)(() => {
    controller.ensure();
  }, [controller]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    state.selected === null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Browse, { state, controller, install, t }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      PluginPage,
      {
        plugin: state.selected,
        state,
        controller,
        install,
        t
      }
    ),
    state.substitution === null ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "tm-substitution", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tm-substitutionText", children: t("substitutedVersion", {
        requested: state.substitution.requested.version,
        selected: state.substitution.selected.version,
        runtime: state.substitution.runtimeVersion ?? ""
      }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "tm-groupMore", onClick: controller.dismissSubstitution, children: t("close") })
    ] }),
    state.notice === null ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      InstallNotice,
      {
        notice: state.notice,
        t,
        onClose: controller.dismissNotice,
        onContinue: () => {
          controller.confirmOverride(install);
        },
        onAdapt: () => {
          void controller.adaptAndInstall(install);
        }
      }
    )
  ] });
}

// src/client/marketing.jsx
var import_jsx_runtime5 = require("react/jsx-runtime");

// src/client/marketing-search.js
function entryText(entry, categoryTitles, language) {
  return [
    entry.id,
    localized(entry.title, "en"),
    localized(entry.title, language),
    localized(entry.description, "en"),
    localized(entry.description, language),
    entry.repository,
    entry.install.package ?? entry.install.name ?? "",
    ...entry.categories.map((id) => categoryTitles.get(id) ?? id),
    ...(entry.install.skills ?? []).map((skill) => skill.name)
  ].join("\n").toLowerCase();
}
function filterEntries(entries, { query = "", category = null, kind = "all", categories, language }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const titles = new Map(categories.map((entry) => [entry.id, localized(entry.title, language)]));
  return entries.filter((entry) => {
    if (kind !== "all" && entry.kind !== kind) return false;
    if (category !== null && !entry.categories.includes(category)) return false;
    if (words.length === 0) return true;
    const text = entryText(entry, titles, language);
    return words.every((word) => text.includes(word));
  });
}
function sortEntries(entries, sort, language) {
  const collator = new Intl.Collator(language);
  const byName = (a, b) => collator.compare(localized(a.title, language), localized(b.title, language));
  const ordered = [...entries];
  switch (sort) {
    case "updated":
      return ordered.sort((a, b) => b.pushedAt.localeCompare(a.pushedAt) || byName(a, b));
    case "name":
      return ordered.sort(byName);
    default:
      return ordered.sort((a, b) => b.stars - a.stars || byName(a, b));
  }
}
function entryCounts(entries) {
  const counts = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    for (const id of entry.categories) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
function oneClick(entry) {
  return entry.install.type !== "manual";
}
function pluginTarget(entry) {
  const version = { version: entry.install.version, source: { type: "npm" } };
  return {
    plugin: { name: entry.install.name, title: entry.title, repository: { url: entry.repository }, versions: [version] },
    version
  };
}
function accessTag(access) {
  switch (access) {
    case "free-key":
      return { key: "accessFreeKey", tone: "info" };
    case "self-hosted":
      return { key: "accessSelfHosted", tone: "neutral" };
    case "login":
      return { key: "accessLogin", tone: "warning" };
    default:
      return void 0;
  }
}
function kindKey(kind) {
  switch (kind) {
    case "plugin":
      return "kindPlugin";
    case "mcp":
      return "kindMcp";
    default:
      return "kindSkill";
  }
}

// src/client/marketing.jsx
var import_react3 = require("react");
var import_client_ui_primitives5 = require("@tomato/client-ui-primitives");
var SORTS2 = ["stars", "updated", "name"];
var KINDS = ["all", "plugin", "mcp", "skill"];
function sortKey(sort) {
  switch (sort) {
    case "updated":
      return "sortUpdated";
    case "name":
      return "sortName";
    default:
      return "sortStars";
  }
}
function repositoryLabel(url) {
  return url.replace(/^https?:\/\/github\.com\//, "");
}
function beginInstall(controller, entry, install) {
  if (entry.install.type === "plugin") {
    const { plugin, version } = pluginTarget(entry);
    void controller.plugins.install(plugin, version, install);
  } else {
    void controller.startInstall(entry);
  }
}
function useMarkdownLabels(t) {
  return (0, import_client_ui_primitives5.useDetailDocumentLabels)({
    title: t("detailTitle"),
    loading: t("detailLoading"),
    retry: t("retryDetail"),
    copy: t("codeCopy"),
    copied: t("codeCopied"),
    codeBlock: t("codeBlock"),
    wrap: t("codeWrap"),
    unwrap: t("codeUnwrap"),
    footnotes: t("footnotes")
  });
}
function EntryTags({ entry, installed, t }) {
  const access = accessTag(entry.access);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "tm-tags", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Tag, { tone: "outline", children: t(kindKey(entry.kind)) }),
    access === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Tag, { tone: access.tone, children: t(access.key) }),
    oneClick(entry) ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Tag, { tone: "neutral", children: t("manualInstall") }),
    installed ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Tag, { tone: "success", children: t("installed") }) : null
  ] });
}
function EntryCard({ entry, installed, checking, language, t, onOpen, onInstall }) {
  const title = localized(entry.title, language);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { className: "tm-card", "data-marketing-entry": entry.id, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tm-icon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(MarketIcon, {}) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-titleRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "tm-cardOpen", "aria-label": t("open", { name: title }), onClick: onOpen, children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EntryTags, { entry, installed, t })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tm-description", children: localized(entry.description, language) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tm-meta", children: [entry.license, entry.pushedAt, repositoryLabel(entry.repository)].join(" · ") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-end", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Tag, { tone: "quiet", className: "tm-stars", children: t("stars", { count: formatStars(entry.stars) }) }),
      installed || !oneClick(entry) ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "outline", size: "sm", onClick: onOpen, children: t(installed ? "viewDetails" : "viewSteps") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "outline", size: "sm", disabled: checking, onClick: onInstall, children: t(checking ? "checking" : "install") })
    ] })
  ] });
}
function Browse2({ state, pluginCheck, controller, install, t }) {
  const [sortMenu, setSortMenu] = (0, import_react3.useState)(false);
  const { catalog, language } = state;
  const entries = catalog?.entries ?? [];
  const categories = catalog?.categories ?? [];
  const installed = (0, import_react3.useMemo)(() => new Set(catalog?.installed ?? []), [catalog]);
  const typed = (0, import_react3.useMemo)(() => filterEntries(entries, { kind: state.kind, categories, language }), [entries, state.kind, categories, language]);
  const counts = (0, import_react3.useMemo)(() => entryCounts(typed), [typed]);
  const matched = (0, import_react3.useMemo)(() => filterEntries(entries, {
    query: state.query,
    category: state.category,
    kind: state.kind,
    categories,
    language
  }), [entries, state.query, state.category, state.kind, categories, language]);
  const ordered = (0, import_react3.useMemo)(() => sortEntries(matched, state.sort, language), [matched, state.sort, language]);
  const shown = ordered.slice(0, state.limit);
  const totals = (0, import_react3.useMemo)(() => {
    const count = (kind) => entries.filter((entry) => entry.kind === kind).length;
    return { plugins: String(count("plugin")), mcp: String(count("mcp")), skills: String(count("skill")) };
  }, [entries]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-section", children: [
    catalog === null ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-lede", children: t("marketingLede", totals) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-banner", children: t("marketingBanner") })
    ] }),
    state.status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(MarketSkeletons, { label: t("loading") }) : null,
    state.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "tm-error", role: "alert", children: [
        t("marketingLoadFailed"),
        "：",
        state.failure
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "outline", size: "sm", onClick: controller.reload, children: t("retry") })
    ] }) : null,
    catalog === null ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          import_client_ui_primitives5.Input,
          {
            className: "tm-search",
            type: "search",
            value: state.query,
            placeholder: t("marketingSearch"),
            "aria-label": t("marketingSearch"),
            icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.IconSearchOutlineRegular, { size: 16 }),
            onChange: (event) => {
              controller.setQuery(event.target.value);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          import_client_ui_primitives5.Menu,
          {
            open: sortMenu,
            onClose: () => {
              setSortMenu(false);
            },
            portal: true,
            autoFocus: true,
            align: "end",
            selectedId: state.sort,
            items: SORTS2.map((sort) => ({ id: sort, label: t(sortKey(sort)) })),
            onSelect: (id) => {
              setSortMenu(false);
              controller.setSort(id);
            },
            anchor: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
              import_client_ui_primitives5.Button,
              {
                variant: "ghost",
                size: "sm",
                "aria-haspopup": "menu",
                "aria-expanded": sortMenu,
                onClick: () => {
                  setSortMenu((value) => !value);
                },
                children: [
                  t("sortLabel"),
                  "：",
                  t(sortKey(state.sort)),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.IconChevronDownOutlineRegular, { size: 12, "aria-hidden": "true" })
                ]
              }
            )
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          import_client_ui_primitives5.SegmentedControl,
          {
            id: "tomato-market-kind",
            label: t("kindFilter"),
            value: state.kind,
            options: KINDS.map((kind) => ({ value: kind, label: t(kind === "all" ? "kindAll" : kindKey(kind)) })),
            onChange: controller.setKind
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-pills", role: "group", "aria-label": t("categories", { count: String(categories.length) }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_client_ui_primitives5.Pill, { active: state.category === null, onClick: () => {
            controller.setCategory(null);
          }, children: [
            t("all"),
            " ",
            typed.length
          ] }),
          categories.filter((category) => counts.has(category.id)).map((category) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            import_client_ui_primitives5.Pill,
            {
              active: state.category === category.id,
              onClick: () => {
                controller.setCategory(state.category === category.id ? null : category.id);
              },
              children: [
                localized(category.title, language),
                " ",
                counts.get(category.id)
              ]
            },
            category.id
          ))
        ] })
      ] }),
      matched.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-lede", children: t("empty") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "tm-cards", children: shown.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          EntryCard,
          {
            entry,
            installed: installed.has(entry.id),
            language,
            t,
            checking: entry.install.type === "plugin" && pluginCheck === entry.install.name,
            onOpen: () => {
              controller.open(entry);
            },
            onInstall: () => {
              beginInstall(controller, entry, install);
            }
          },
          entry.id
        )) }),
        shown.length < ordered.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "tm-more", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "outline", size: "sm", onClick: controller.showMore, children: t("more") }) }) : null
      ] })
    ] })
  ] });
}
function CatalogMarkdown({ text, labels }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "tm-markdown", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.MarkdownText, { text, labels: labels.markdown, omitHtml: true }) });
}
function Fact({ label, value, link }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: link === void 0 ? value : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: link, target: "_blank", rel: "noreferrer noopener", children: value }) })
  ] });
}
function EntryPage({ entry, state, pluginCheck, controller, install, openPackage, t }) {
  const { language } = state;
  const installed = state.catalog.installed.includes(entry.id);
  const { install: target } = entry;
  const labels = useMarkdownLabels(t);
  const documentState = state.detail.status === "found" ? { status: "found", markdown: state.detail.markdown } : state.detail.status === "none" ? { status: "none" } : state.detail.status === "error" ? { status: "error", message: `${t("detailFailed")}：${state.detail.message}` } : { status: "loading" };
  const action = () => {
    if (target.type === "manual") return null;
    if (!installed) return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "outline", size: "sm", disabled: pluginCheck === target.name, onClick: () => {
      beginInstall(controller, entry, install);
    }, children: pluginCheck === target.name ? t("checking") : t("install") });
    return target.type === "plugin" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "outline", size: "sm", onClick: () => {
      openPackage(target.name);
    }, children: t("managePlugin") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "outline", size: "sm", onClick: () => {
      controller.startUninstall(entry);
    }, children: t("uninstall") });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-detail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "tm-back", onClick: controller.back, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.IconChevronLeftOutlineRegular, { size: 14, "aria-hidden": "true" }),
      t("marketingBack")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tm-headIcon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(MarketIcon, { size: 40 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-headMain", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: "tm-headTitle", children: localized(entry.title, language) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-headMeta", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EntryTags, { entry, installed, t }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tm-stars", children: t("stars", { count: formatStars(entry.stars) }) }),
          entry.categories.map((id) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: localized(state.catalog.categories.find((category) => category.id === id)?.title, language) }, id))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "tm-end", children: action() })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-descriptionFull", children: localized(entry.description, language) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("dl", { className: "tm-facts", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Fact, { label: t("repository"), value: repositoryLabel(entry.repository), link: entry.repository }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Fact, { label: t("license"), value: entry.license }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Fact, { label: t("updated"), value: entry.pushedAt }),
      target.type === "mcp" || target.type === "plugin" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Fact, { label: t("packageName"), value: target.package ?? target.name }) : null,
      target.type === "mcp" || target.type === "plugin" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Fact, { label: t("pinnedVersion"), value: target.version }) : null,
      target.type === "skill" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Fact, { label: t("pinnedCommit"), value: target.commit.slice(0, 12) }) : null
    ] }),
    entry.access === "login" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(LoginRisk, { t }) : null,
    entry.setup === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "tm-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "tm-sectionTitle", children: t("setupTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CatalogMarkdown, { text: localized(entry.setup, language), labels })
    ] }),
    entry.env === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EnvList, { names: entry.env, labels, t }),
    target.type !== "manual" ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "tm-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "tm-sectionTitle", children: t("stepsTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CatalogMarkdown, { text: localized(target.steps, language), labels })
    ] }),
    target.type !== "skill" ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "tm-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "tm-sectionTitle", children: t("skillsTitle", { count: String(target.skills.length) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "tm-chips", children: target.skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Tag, { tone: "outline", children: skill.name }) }, skill.name)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "tm-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "tm-sectionTitle", children: t("detailTitle") }),
      state.detail.status === "none" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-lede", children: t("detailNone") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.DetailDocument, { state: documentState, labels, onRetry: controller.retryDetail })
    ] })
  ] });
}
function LoginRisk({ t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "tm-callout", role: "note", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tm-calloutTitle", children: t("loginRiskTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t("loginRiskBody") })
  ] });
}
function EnvList({ names, labels, t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "tm-group", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "tm-sectionTitle", children: t("envTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "tm-chips", children: names.map((name) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Tag, { tone: "outline", children: name }) }, name)) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CatalogMarkdown, { text: t("envHint"), labels })
  ] });
}
function dialogTitle(dialog, title, t) {
  if (dialog.mode === "uninstall") return t("confirmUninstallTitle", { name: title });
  return t(dialog.entry.kind === "mcp" ? "confirmMcpTitle" : "confirmSkillTitle", { name: title });
}
function InstallPreview({ dialog, language, labels, t }) {
  const { entry, preview } = dialog;
  const conflicts = preview.conflicts ?? [];
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t("confirmSource", { repository: repositoryLabel(entry.repository) }) }),
    entry.access === "login" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(LoginRisk, { t }) : null,
    preview.kind === "mcp" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t("confirmCommand") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: "tm-code", children: preview.command }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t("confirmYaml") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: "tm-code", children: preview.yaml })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t("confirmSkills") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: "tm-code", children: preview.skills.join("\n") })
    ] }),
    preview.runnerMissing === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-callout", role: "alert", children: t("runnerMissing", { runner: preview.runnerMissing, hint: t(preview.runnerMissing === "uvx" ? "runnerHintUvx" : "runnerHintNpx") }) }),
    conflicts.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-callout", role: "alert", children: t("skillConflict", { skills: conflicts.join(", ") }) }),
    entry.setup === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tm-sectionTitle", children: t("setupTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CatalogMarkdown, { text: localized(entry.setup, language), labels })
    ] }),
    entry.env === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EnvList, { names: entry.env, labels, t })
  ] });
}
function ActionResult({ dialog, title, t }) {
  const { mode, entry, result } = dialog;
  const warnings = result.warnings ?? [];
  const hint = entry.kind === "skill" ? "skillAppliedHint" : result.application === "applied" ? "appliedHint" : "restartHint";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "status", children: t(mode === "install" ? "installDone" : "uninstallDone", { name: title }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t(hint) }),
    warnings.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t("warningsTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: "tm-code", children: warnings.join("\n") })
    ] })
  ] });
}
function ActionDialog({ dialog, language, controller, t }) {
  const labels = useMarkdownLabels(t);
  const { entry, phase, mode } = dialog;
  const title = localized(entry.title, language);
  const blocked = mode === "install" && (dialog.preview?.conflicts ?? []).length > 0;
  const skillNames = entry.install.skills?.map((skill) => skill.name).join(", ") ?? "";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    import_client_ui_primitives5.Modal,
    {
      open: true,
      onClose: controller.closeDialog,
      title: dialogTitle(dialog, title, t),
      closeLabel: t("close"),
      footer: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        phase === "ready" && !blocked ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "primary", size: "sm", onClick: () => {
          void controller.confirm();
        }, children: t(mode === "install" ? "confirmInstall" : "confirmUninstall") }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_client_ui_primitives5.Button, { variant: "ghost", size: "sm", onClick: controller.closeDialog, children: t("close") })
      ] }),
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "tm-notice", children: [
        phase === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "status", children: t("confirmLoading") }) : null,
        phase === "working" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "status", children: t("working") }) : null,
        phase === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "tm-error", role: "alert", children: t("actionFailed", { reason: dialog.reason }) }) : null,
        phase === "ready" && mode === "install" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(InstallPreview, { dialog, language, labels, t }) : null,
        phase === "ready" && mode === "uninstall" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: entry.kind === "mcp" ? t("uninstallMcpBody") : t("uninstallSkillBody", { skills: skillNames }) }) : null,
        phase === "done" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ActionResult, { dialog, title, t }) : null
      ] })
    }
  );
}
function MarketingTab({ controller, t, install, openPackage }) {
  const state = (0, import_react3.useSyncExternalStore)(controller.store.subscribe, controller.store.get, controller.store.get);
  const pluginState = (0, import_react3.useSyncExternalStore)(controller.plugins.store.subscribe, controller.plugins.store.get, controller.plugins.store.get);
  (0, import_react3.useEffect)(() => {
    installStyles();
  }, []);
  (0, import_react3.useEffect)(() => {
    controller.ensure();
  }, [controller]);
  const entry = state.selected === null ? void 0 : state.catalog?.entries.find((candidate) => candidate.id === state.selected);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    entry === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Browse2, { state, pluginCheck: pluginState.checking, controller, install, t }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EntryPage, { entry, state, pluginCheck: pluginState.checking, controller, install, openPackage, t }),
    state.dialog === null ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ActionDialog, { dialog: state.dialog, language: state.language, controller, t }),
    pluginState.notice === null ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      InstallNotice,
      {
        notice: pluginState.notice,
        t,
        onClose: controller.plugins.dismissNotice,
        onContinue: () => {
          controller.plugins.confirmOverride(install);
        },
        onAdapt: () => {
          void controller.plugins.adaptAndInstall(install);
        }
      }
    )
  ] });
}

// src/client/index.jsx
var inject = ["slots", "locale", "remote"];
function apply(ctx) {
  const { t, language } = installI18n(ctx);
  const general = createController({ t, language });
  const marketing = { ...createMarketingController({ language }), plugins: createController({ t, language }) };
  ctx.effect(() => ctx.locale.subscribe(() => {
    general.setLanguage(language());
    marketing.setLanguage(language());
    marketing.plugins.setLanguage(language());
  }), "tomato-market: active language");
  ctx.effect(() => ctx.remote.$on("plugin-manager/changed", () => {
    marketing.reload();
  }), "tomato-market: installed plugins");
  const General = (props) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MarketTab, { ...props, controller: general, t });
  const Marketing = (props) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MarketingTab, { ...props, controller: marketing, t });
  ctx.effect(() => ctx.slots.inject("plugins.tab", function* () {
    yield ctx.slots.register({ name: "plugins.tab", id: "marketing", order: -2, label: () => t("marketingTab"), locale: NS }, Marketing);
    yield ctx.slots.register({ name: "plugins.tab", id: "market", order: -1, label: () => t("tab"), locale: NS }, General);
  }), "tomato-market: market tabs");
}
return Object.defineProperty({ ...module.exports }, Symbol.toStringTag, { value: 'Module' })
  },
})
