// Generated from src/client by `npm run build` (scripts/build-client.mjs). Do not edit by hand.
window.__ModuleLoader__.load({
  id: 'tomato-campaign',
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
  PANEL_ID: () => PANEL_ID,
  PanelIcon: () => PanelIcon,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_jsx_runtime2 = require("react/jsx-runtime");

// src/client/App.jsx
var import_jsx_runtime = require("react/jsx-runtime");

// src/client/api.js
var PROXY_PATH = "/api/clientweb";
var ApiError = class extends Error {
  /**
   * @param message - text the view shows.
   * @param status - HTTP status, or the business code when the envelope carried one.
   */
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
};
var NOT_JSON = "服务返回了非 JSON 内容";
function unwrap(body) {
  if (body === null || body === void 0) return null;
  if (typeof body !== "object") return body;
  if (typeof body.code === "number") {
    if (body.code >= 4e4) throw new ApiError(body.message || `请求失败（${body.code}）`, body.code);
    return body.data ?? null;
  }
  if (body.error && typeof body.error === "object") {
    throw new ApiError(body.error.message || "请求失败", body.error.code);
  }
  return body.data ?? body;
}
function enc(value) {
  return encodeURIComponent(String(value));
}
async function request(path, options = {}) {
  const url = new URL(`${PROXY_PATH}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value === void 0 || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  const init = { method: options.method ?? "GET", headers: { accept: "application/json" }, credentials: "same-origin" };
  if (options.body !== void 0) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  let response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw new ApiError(`网络不可用：${cause.message}`, 0);
  }
  const text = await response.text();
  if (response.status === 401) throw new ApiError("会话已失效，请重新登录公司账号。", 401);
  if (text === "") {
    if (!response.ok) throw new ApiError(`请求失败（HTTP ${response.status}）`, response.status);
    return null;
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(response.ok ? NOT_JSON : `${NOT_JSON}（HTTP ${response.status}）`, response.status);
  }
  if (!response.ok) {
    const message = typeof body?.error?.message === "string" ? body.error.message : typeof body?.message === "string" ? body.message : `请求失败（HTTP ${response.status}）`;
    throw new ApiError(message, response.status);
  }
  return unwrap(body);
}
async function fetchStatus() {
  try {
    const response = await fetch(`${PROXY_PATH}/_status`, { credentials: "same-origin" });
    if (!response.ok) return { signedIn: false, configured: false };
    return await response.json();
  } catch {
    return { signedIn: false, configured: false };
  }
}
function fetchCampaigns(query) {
  return request("/v1/campaigns", { query });
}
function fetchCampaign(campaignId) {
  return request(`/v1/campaigns/${enc(campaignId)}`);
}
function fetchRoster(campaignId, query) {
  return request(`/v1/campaigns/${enc(campaignId)}/creators`, { query });
}
function fetchRoleCards(campaignId) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards`);
}
function fetchThreads(box, query) {
  const path = box === "archived" ? "/outreach/threads/archived" : "/outreach/threads";
  return request(path, { query });
}
function fetchPendingOutreach(query) {
  return request("/outreach/campaigns/pending", { query });
}
function updateCampaign(campaignId, patch) {
  return request(`/v1/campaigns/${enc(campaignId)}`, { method: "PATCH", body: patch });
}
function createCampaign(body) {
  return request("/v1/campaigns", { method: "POST", body });
}
function createRoleCard(campaignId, card) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards`, { method: "POST", body: card });
}
function startSearchTask(campaignId, cardId) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards/${enc(cardId)}/search-task`, { method: "POST", body: {} });
}
function fetchSearchReport(campaignId, cardId) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards/${enc(cardId)}/search-task/report`);
}
function importFeishuRoster(campaignId, url) {
  return request(`/v1/campaigns/${enc(campaignId)}/creators/import-feishu`, { method: "POST", body: { url } });
}
function removeCreator(campaignId, creatorKey) {
  return request(`/v1/campaigns/${enc(campaignId)}/creators/${enc(creatorKey)}`, { method: "DELETE" });
}
function replyToThread(threadId, text, subject) {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const bodyHtml = paragraphs.map((part) => `<p>${part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`).join("");
  return request(`/outreach/threads/${enc(threadId)}/reply`, {
    method: "POST",
    body: { bodyHtml, bodyText: text, subject: subject ?? null }
  });
}

// src/client/App.jsx
var import_react = require("react");
var STATUS = {
  draft: ["草稿", "muted"],
  strategy: ["策略", "info"],
  outreach: ["建联", "primary"],
  completed: ["已完成", "ok"],
  archived: ["已归档", "muted"]
};
var TIER = { head: "头部", mid: "腰部", tail: "尾部", manual: "手动" };
var PLATFORM = {
  instagram: "Instagram",
  "instagram（reels）": "IG Reels",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  twitter: "X"
};
var OUTREACH = {
  not_contacted: "未联系",
  shortlisted: "已入库",
  negotiating: "洽谈中",
  quoted: "已报价",
  signed: "已签约",
  rejected: "已拒绝"
};
var COUNTRY = {
  FR: "法国",
  GB: "英国",
  US: "美国",
  JP: "日本",
  MX: "墨西哥",
  DE: "德国",
  ES: "西班牙",
  IT: "意大利",
  BR: "巴西",
  KR: "韩国",
  SA: "沙特",
  AE: "阿联酋",
  CA: "加拿大",
  AU: "澳大利亚",
  NO: "挪威",
  SE: "瑞典",
  NL: "荷兰",
  PL: "波兰",
  IN: "印度",
  ID: "印尼",
  TH: "泰国",
  VN: "越南",
  PH: "菲律宾",
  MY: "马来西亚",
  SG: "新加坡",
  TR: "土耳其",
  RU: "俄罗斯",
  CN: "中国"
};
var PAGE_SIZE = 20;
function itemsOf(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.list)) return data.list;
  return [];
}
function totalOf(data, rows) {
  return typeof data?.total === "number" ? data.total : rows.length;
}
function when(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const sameYear = date.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear();
  const day = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  return sameYear ? day : `${date.getFullYear()} 年 ${day}`;
}
function compact(value) {
  if (value === null || value === void 0 || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  if (number >= 1e8) return `${(number / 1e8).toFixed(2)} 亿`;
  if (number >= 1e4) return `${(number / 1e4).toFixed(number >= 1e6 ? 0 : 1)} 万`;
  return String(Math.round(number));
}
function percent(value) {
  if (value === null || value === void 0 || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  const ratio = number > 1 ? number / 100 : number;
  if (ratio === 0) return "0%";
  return `${(ratio * 100).toFixed(ratio < 0.01 ? 2 : 1)}%`;
}
function money(budget) {
  if (budget === null || budget === void 0) return "未设置";
  if (typeof budget === "string") return budget;
  if (typeof budget !== "object") return "未设置";
  const { min, max, currency, tier } = budget;
  const unit = currency === "USD" ? "$" : currency === "CNY" ? "¥" : currency === "EUR" ? "€" : "";
  const bound = (value) => `${unit}${compact(value)}`;
  const hasMin = min !== null && min !== void 0;
  const hasMax = max !== null && max !== void 0;
  if (hasMin && hasMax) return `${bound(min)} – ${bound(max)}`;
  if (hasMin) return `${bound(min)} 起`;
  if (hasMax) return `≤ ${bound(max)}`;
  return tier ?? "未设置";
}
function platformName(code) {
  return PLATFORM[code] ?? String(code ?? "");
}
function countryName(code) {
  return COUNTRY[code] ? `${COUNTRY[code]} ${code}` : code;
}
function hueOf(text) {
  let hash = 0;
  const value = String(text ?? "");
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) % 360;
  return hash;
}
function StatusPill({ status }) {
  const [label, tone] = STATUS[status] ?? [status ?? "未知", "muted"];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `tcw-pill ${tone}`, children: label });
}
function Tag({ children, tone }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `tcw-tag ${tone ?? ""}`, children });
}
function Avatar({ name, src, size }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { className: "tcw-avatar", style, src, alt: "", loading: "lazy" });
  const initial = String(name ?? "?").trim().slice(0, 1).toUpperCase() || "?";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-avatar text", style: { ...style, background: `hsl(${hueOf(name)} 46% 42%)` }, children: initial });
}
function Field({ label, hint, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "tcw-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-field-label", children: label }),
    children,
    hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-field-hint", children: hint }) : null
  ] });
}
function Dialog({ title, subtitle, children, footer, onClose, wide }) {
  (0, import_react.useEffect)(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-modal", role: "dialog", "aria-modal": "true", "aria-label": title, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `tcw-modal-card ${wide ? "wide" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "tcw-modal-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: title }),
        subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: subtitle }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-x", onClick: onClose, "aria-label": "关闭", children: "×" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-modal-body", children }),
    footer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", { className: "tcw-modal-foot", children: footer }) : null
  ] }) });
}
function SignedOut({ configured }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-empty big", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: configured ? "还没有登录公司账号。" : "公司 BFF 未配置。" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "tcw-small", children: "在 Settings → Account 用飞书登录后，这里会显示活动与达人数据。" })
  ] });
}
function ListSummary({ rows, total }) {
  const counts = (0, import_react.useMemo)(() => {
    const map = { draft: 0, strategy: 0, outreach: 0, completed: 0 };
    for (const row of rows) if (map[row.status] !== void 0) map[row.status] += 1;
    return map;
  }, [rows]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-summary", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: total }),
      " 个活动 · 已加载 ",
      rows.length
    ] }),
    Object.entries(counts).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-summary-item", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: key }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: value })
    ] }, key))
  ] });
}
function CampaignList({ signedIn, configured, onOpen, onCreate, version }) {
  const [keyword, setKeyword] = (0, import_react.useState)("");
  const [query, setQuery] = (0, import_react.useState)("");
  const [status, setStatus] = (0, import_react.useState)("");
  const [platform, setPlatform] = (0, import_react.useState)("");
  const [market, setMarket] = (0, import_react.useState)("");
  const [sort, setSort] = (0, import_react.useState)("updated");
  const [data, setData] = (0, import_react.useState)(null);
  const [page, setPage] = (0, import_react.useState)(1);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const load = (0, import_react.useCallback)(async (nextPage, append) => {
    if (!signedIn) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchCampaigns({
        keyword: query || void 0,
        status: status || void 0,
        page: nextPage,
        pageSize: PAGE_SIZE
      });
      setData((previous) => append && previous ? { ...payload, items: [...itemsOf(previous), ...itemsOf(payload)] } : payload);
      setPage(nextPage);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }, [query, status, signedIn]);
  (0, import_react.useEffect)(() => {
    void load(1, false);
  }, [load, version]);
  const rows = (0, import_react.useMemo)(() => itemsOf(data), [data]);
  const filtered = (0, import_react.useMemo)(() => {
    const match = (row) => {
      if (platform && !(row.platformFocus ?? []).includes(platform)) return false;
      if (market && !(row.market ?? []).includes(market)) return false;
      return true;
    };
    const list = rows.filter(match);
    if (sort === "creators") return [...list].sort((left, right) => (right.creatorCount ?? 0) - (left.creatorCount ?? 0));
    if (sort === "name") return [...list].sort((left, right) => String(left.name ?? "").localeCompare(String(right.name ?? ""), "zh"));
    return [...list].sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  }, [rows, platform, market, sort]);
  const platforms = (0, import_react.useMemo)(() => {
    const set = /* @__PURE__ */ new Set();
    for (const row of rows) for (const code of row.platformFocus ?? []) set.add(code);
    return [...set].sort();
  }, [rows]);
  const markets = (0, import_react.useMemo)(() => {
    const set = /* @__PURE__ */ new Set();
    for (const row of rows) for (const code of row.market ?? []) set.add(code);
    return [...set].sort();
  }, [rows]);
  if (!signedIn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { configured });
  const total = totalOf(data, rows);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-inner", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "活动" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSummary, { rows, total })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn primary", onClick: onCreate, children: "新建活动" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: () => void load(1, false), disabled: loading, children: loading ? "刷新中…" : "刷新" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "tcw-input search",
          placeholder: "搜索活动名称、品牌、目标",
          value: keyword,
          onChange: (event) => setKeyword(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter") setQuery(keyword.trim());
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: () => setQuery(keyword.trim()), children: "搜索" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { className: "tcw-select", value: status, onChange: (event) => setStatus(event.target.value), "aria-label": "按状态筛选", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "全部状态" }),
        Object.entries(STATUS).map(([key, [label]]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: key, children: label }, key))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { className: "tcw-select", value: platform, onChange: (event) => setPlatform(event.target.value), "aria-label": "按平台筛选", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "全部平台" }),
        platforms.map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: code, children: platformName(code) }, code))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { className: "tcw-select", value: market, onChange: (event) => setMarket(event.target.value), "aria-label": "按市场筛选", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "全部市场" }),
        markets.map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: code, children: countryName(code) }, code))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { className: "tcw-select", value: sort, onChange: (event) => setSort(event.target.value), "aria-label": "排序", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "updated", children: "最近更新" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "creators", children: "达人最多" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "name", children: "名称" })
      ] })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-card flush", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "tcw-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "col-name", children: "活动" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "状态" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "市场" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "平台" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "col-budget", children: "预算" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "num col-creators", children: "达人" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "col-time", children: "更新于" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
        filtered.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { className: "clickable", onClick: () => onOpen(row.id), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-name", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: row.brand ?? row.name, size: 34 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-name-body", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: row.name ?? "未命名活动" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: [row.brand, row.category, row.goal].filter(Boolean).join(" · ") || "没有填写品牌与品类" })
            ] })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: row.status }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-tags", children: [
            (row.market ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-muted", children: "—" }) : null,
            (row.market ?? []).map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { children: countryName(code) }, code))
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-tags", children: [
            (row.platformFocus ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-muted", children: "—" }) : null,
            (row.platformFocus ?? []).map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { tone: "alt", children: platformName(code) }, code))
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "tcw-muted nowrap", children: money(row.budget) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { className: "num", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: row.creatorCount ?? 0 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-sub-inline", children: row.recruitTarget?.total ? `目标 ${row.recruitTarget.total}` : "未设目标" }),
            row.creatorTierStats ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-sub-inline", children: [
              "头 ",
              row.creatorTierStats.head ?? 0,
              " · 腰 ",
              row.creatorTierStats.mid ?? 0,
              " · 尾 ",
              row.creatorTierStats.tail ?? 0
            ] }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "tcw-muted col-time", children: when(row.updatedAt) })
        ] }, row.id)),
        filtered.length === 0 && !loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: 7, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: rows.length === 0 ? "还没有活动。" : "当前筛选没有命中。" }) }) }) : null,
        loading && rows.length === 0 ? [0, 1, 2].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { className: "skeleton", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: 7, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-skeleton" }) }) }, `skeleton-${index}`)) : null
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-list-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-small tcw-muted", children: [
        "已显示 ",
        filtered.length,
        " / ",
        total
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
      rows.length < total ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: () => void load(page + 1, true), disabled: loading, children: loading ? "加载中…" : "加载更多" }) : null
    ] })
  ] });
}
function RoleCard({ card, onStart, onReport, busy }) {
  const platforms = (card.platforms ?? []).map(platformName);
  const countries = (card.country ?? []).map((code) => COUNTRY[code] ?? code);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "tcw-rolecard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "r1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: card.role ?? card.name ?? "角色卡" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { children: card.tier ?? "未分层" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "tcw-small tcw-muted", children: [card.category, card.vertical, card.creatorType].filter(Boolean).join(" · ") || "没有填写品类与垂类" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "平台" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: platforms.length ? platforms.join(" / ") : "—" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "目标国家" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: countries.length ? countries.join(" / ") : "—" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "粉丝区间" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: card.follow || card.followMax ? `${compact(card.follow)} – ${compact(card.followMax)}` : "—" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "内容任务" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: card.mission ?? "—" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "受众" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: card.audienceFit ?? "—" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "商务信号" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: card.commerceSignal ?? "—" }),
      card.exclusion ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "排除项" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: card.exclusion })
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `tcw-pill ${card.taskId ? "info" : "muted"}`, children: card.taskId ? "已有推荐任务" : "未发起" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn sm", disabled: busy || !card.taskId, onClick: () => onReport(card), children: "查看报告" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn sm primary", disabled: busy, onClick: () => onStart(card), children: "发起推荐" })
    ] })
  ] });
}
function ReportDialog({ campaignId, card, onClose }) {
  const [report, setReport] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    let live = true;
    fetchSearchReport(campaignId, card.id).then((value) => {
      if (live) setReport(value);
    }).catch((cause) => {
      if (live) setError(cause);
    });
    return () => {
      live = false;
    };
  }, [campaignId, card.id]);
  const platforms = (0, import_react.useMemo)(() => Object.entries(report?.platforms ?? {}), [report]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    Dialog,
    {
      title: `推荐报告 · ${card.role ?? "角色卡"}`,
      subtitle: report?.summary ? void 0 : "读取最近一次推荐任务…",
      wide: true,
      onClose,
      footer: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: onClose, children: "关闭" }),
      children: [
        error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
        !report && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "读取中…" }) : null,
        report ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          report.summary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "tcw-report-summary", children: report.summary }) : null,
          (report.assumptions ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: "tcw-assumptions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [
              "口径与假设（",
              report.assumptions.length,
              "）"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: report.assumptions.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, index)) })
          ] }) : null,
          platforms.map(([code, bucket]) => {
            const candidates = bucket?.candidates ?? [];
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "tcw-report-platform", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
                platformName(code),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-small tcw-muted", children: [
                  "候选 ",
                  candidates.length,
                  " 人"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "tcw-table compact", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "num", children: "#" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "达人" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "num", children: "粉丝" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "num", children: "互动率" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "num", children: "预估报价" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "推荐理由" })
                ] }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
                  candidates.map((candidate) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "num", children: candidate.rank ?? "—" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-name tight", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: candidate.channel_title, src: candidate.profile?.avatarUrl, size: 26 }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-name-body", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: candidate.channel_title ?? "—" }),
                        candidate.profile?.profileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: candidate.profile.profileUrl, target: "_blank", rel: "noreferrer", children: candidate.profile.handle ? `@${candidate.profile.handle}` : "主页" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: candidate.profile?.handle ? `@${candidate.profile.handle}` : "" })
                      ] })
                    ] }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "num", children: compact(candidate.subscriber_count) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "num", children: percent(candidate.evidence?.metrics?.er) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "num", children: candidate.estimated_price ? `$${compact(candidate.estimated_price)}` : "—" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "tcw-reason", children: candidate.reason ?? "—" })
                  ] }, `${code}-${candidate.channel_id ?? candidate.rank}`)),
                  candidates.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: 6, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "这个平台没有候选。" }) }) }) : null
                ] })
              ] })
            ] }, code);
          })
        ] }) : null
      ]
    }
  );
}
function CreateCampaignDialog({ onClose, onCreated }) {
  const [form, setForm] = (0, import_react.useState)({
    name: "",
    brand: "",
    category: "",
    goal: "",
    market: "",
    platform: "instagram",
    budgetMin: "",
    budgetMax: ""
  });
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const submit = async () => {
    if (form.name.trim() === "" || form.brand.trim() === "") {
      setError(new ApiError("名称与品牌是必填项。", 0));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        ...form.category.trim() ? { category: form.category.trim() } : {},
        ...form.goal.trim() ? { goal: form.goal.trim() } : {},
        ...form.market.trim() ? { market: form.market.split(/[,，\s]+/).filter(Boolean).map((code) => code.toUpperCase()) } : {},
        ...form.platform ? { platformFocus: [form.platform] } : {},
        ...form.budgetMin.trim() || form.budgetMax.trim() ? {
          budget: {
            min: form.budgetMin.trim() === "" ? null : Number(form.budgetMin),
            max: form.budgetMax.trim() === "" ? null : Number(form.budgetMax),
            currency: "USD",
            tier: null
          }
        } : {}
      };
      onCreated(await createCampaign(body));
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    Dialog,
    {
      title: "新建活动",
      subtitle: "写进 campaign-manager；活动从草稿开始，阶段之后可在详情里改。",
      onClose,
      footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: onClose, disabled: busy, children: "取消" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn primary", onClick: () => void submit(), disabled: busy, children: busy ? "创建中…" : "创建活动" })
      ] }),
      children: [
        error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-grid2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "活动名称", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.name, onChange: set("name"), placeholder: "品牌_目标_市场_季度" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "品牌", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.brand, onChange: set("brand"), placeholder: "TCL" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "品类", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.category, onChange: set("category"), placeholder: "3C科技/电视" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "营销目标", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.goal, onChange: set("goal"), placeholder: "品牌曝光、带货转化" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "目标市场", hint: "逗号分隔的国家码", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.market, onChange: set("market"), placeholder: "FR, GB" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "主平台", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { className: "tcw-select wide", value: form.platform, onChange: set("platform"), children: ["instagram", "youtube", "tiktok", "x"].map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: code, children: platformName(code) }, code)) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "预算下限（USD）", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.budgetMin, onChange: set("budgetMin"), inputMode: "numeric", placeholder: "400000" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "预算上限（USD）", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.budgetMax, onChange: set("budgetMax"), inputMode: "numeric", placeholder: "留空表示只有下限" }) })
        ] })
      ]
    }
  );
}
function CreateCardDialog({ campaignId, onClose, onCreated }) {
  const [form, setForm] = (0, import_react.useState)({
    role: "",
    tier: "Mid-tier",
    category: "",
    country: "",
    platforms: "instagram",
    vertical: "",
    creatorType: "",
    mission: ""
  });
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const submit = async () => {
    if (form.role.trim() === "") {
      setError(new ApiError("角色定位是必填项。", 0));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const card = {
        role: form.role.trim(),
        tier: form.tier,
        ...form.category.trim() ? { category: form.category.trim() } : {},
        ...form.country.trim() ? { country: form.country.split(/[,，\s]+/).filter(Boolean).map((code) => code.toUpperCase()) } : {},
        ...form.platforms.trim() ? { platforms: form.platforms.split(/[,，\s]+/).filter(Boolean) } : {},
        ...form.vertical.trim() ? { vertical: form.vertical.trim() } : {},
        ...form.creatorType.trim() ? { creatorType: form.creatorType.trim() } : {},
        ...form.mission.trim() ? { mission: form.mission.trim() } : {}
      };
      onCreated(await createRoleCard(campaignId, card));
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    Dialog,
    {
      title: "新建角色卡",
      subtitle: "角色卡决定推荐任务怎么找人；改卡会让旧报告作废。",
      onClose,
      footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: onClose, disabled: busy, children: "取消" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn primary", onClick: () => void submit(), disabled: busy, children: busy ? "保存中…" : "创建角色卡" })
      ] }),
      children: [
        error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-grid2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "角色定位", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.role, onChange: set("role"), placeholder: "法英·家居场景种草位" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "达人层级", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { className: "tcw-select wide", value: form.tier, onChange: set("tier"), children: ["Head-tier", "Mid-tier", "Tail-tier"].map((tier) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: tier, children: tier }, tier)) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "品类", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.category, onChange: set("category"), placeholder: "3C科技/家居生活" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "垂类", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.vertical, onChange: set("vertical"), placeholder: "客厅影音、智能家居" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "目标国家", hint: "逗号分隔的国家码", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.country, onChange: set("country"), placeholder: "FR, GB" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "平台", hint: "逗号分隔", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.platforms, onChange: set("platforms"), placeholder: "instagram, youtube" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "达人类型", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.creatorType, onChange: set("creatorType"), placeholder: "生活方式型" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "内容任务", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: form.mission, onChange: set("mission"), placeholder: "用客厅场景扩大曝光" }) })
        ] })
      ]
    }
  );
}
function ImportDialog({ campaignId, onClose, onDone }) {
  const [url, setUrl] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const submit = async () => {
    if (url.trim() === "") {
      setError(new ApiError("需要飞书多维表格链接。", 0));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onDone(await importFeishuRoster(campaignId, url.trim()));
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    Dialog,
    {
      title: "从飞书导入达人",
      subtitle: "异步任务；授权过期会被拒绝，需要先在 Settings → Account 重新授权。",
      onClose,
      footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: onClose, disabled: busy, children: "取消" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn primary", onClick: () => void submit(), disabled: busy, children: busy ? "提交中…" : "开始导入" })
      ] }),
      children: [
        error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "飞书多维表格链接", hint: "粘贴完整链接，不要只给 token", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "tcw-input", value: url, onChange: (event) => setUrl(event.target.value), placeholder: "https://xxx.feishu.cn/base/..." }) })
      ]
    }
  );
}
function RosterTab({ campaignId, signedIn, onImport, version }) {
  const [keyword, setKeyword] = (0, import_react.useState)("");
  const [query, setQuery] = (0, import_react.useState)("");
  const [data, setData] = (0, import_react.useState)(null);
  const [page, setPage] = (0, import_react.useState)(1);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [selected, setSelected] = (0, import_react.useState)(null);
  const [removing, setRemoving] = (0, import_react.useState)(false);
  const load = (0, import_react.useCallback)(async (nextPage, append) => {
    if (!signedIn) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchRoster(campaignId, { keyword: query || void 0, page: nextPage, pageSize: PAGE_SIZE });
      setData((previous) => append && previous ? { ...payload, items: [...itemsOf(previous), ...itemsOf(payload)] } : payload);
      setPage(nextPage);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }, [campaignId, query, signedIn]);
  (0, import_react.useEffect)(() => {
    void load(1, false);
  }, [load, version]);
  const rows = (0, import_react.useMemo)(() => itemsOf(data), [data]);
  const total = totalOf(data, rows);
  const remove = async () => {
    if (!selected) return;
    setRemoving(true);
    setError(null);
    try {
      await removeCreator(campaignId, selected.creatorKey);
      setSelected(null);
      await load(1, false);
    } catch (cause) {
      setError(cause);
    } finally {
      setRemoving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-split", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-split-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "tcw-input search",
            placeholder: "搜索达人名或 handle",
            value: keyword,
            onChange: (event) => setKeyword(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") setQuery(keyword.trim());
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: () => setQuery(keyword.trim()), children: "搜索" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-small tcw-muted", children: [
          rows.length,
          " / ",
          total
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: onImport, children: "导入飞书达人" })
      ] }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-card flush", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "tcw-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "col-name", children: "达人" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "平台" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "国家" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "num", children: "粉丝" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "num", children: "互动率" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "层级" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "建联" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "col-time", children: "数据更新" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
          rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "tr",
            {
              className: `clickable ${selected?.creatorKey === row.creatorKey ? "on" : ""}`,
              onClick: () => setSelected(row),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-name", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: row.displayName ?? row.creatorKey, src: row.avatarUrl, size: 30 }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-name-body", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: row.displayName ?? row.creatorKey }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.handle ? `@${row.handle}` : row.creatorKey })
                  ] })
                ] }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "tcw-muted", children: platformName(String(row.platform ?? "").toLowerCase()) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "tcw-muted", children: row.country ? countryName(row.country) : "—" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "num", children: compact(row.followerCount) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "num", children: percent(row.engagementRate) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.joinTier ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { children: TIER[row.joinTier] ?? row.joinTier }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-muted", children: "—" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.outreachStage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { tone: row.outreachStage === "not_contacted" ? "" : "alt", children: OUTREACH[row.outreachStage] ?? row.outreachStage }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-muted", children: "—" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "tcw-muted col-time", children: when(row.dataUpdatedAt) })
              ]
            },
            row.creatorKey
          )),
          rows.length === 0 && !loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: 8, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "这个活动还没有达人。" }) }) }) : null
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-list-foot", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-small tcw-muted", children: [
          "已显示 ",
          rows.length,
          " / ",
          total
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
        rows.length < total ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: () => void load(page + 1, true), disabled: loading, children: loading ? "加载中…" : "加载更多" }) : null
      ] })
    ] }),
    selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { className: "tcw-drawer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: selected.displayName ?? selected.creatorKey, src: selected.avatarUrl, size: 40 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: selected.displayName ?? selected.creatorKey }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-small tcw-muted", children: selected.creatorKey })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-x", onClick: () => setSelected(null), "aria-label": "关闭", children: "×" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "平台" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: platformName(String(selected.platform ?? "").toLowerCase()) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "国家" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: selected.country ? countryName(selected.country) : "—" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "粉丝" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: compact(selected.followerCount) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "互动率" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: percent(selected.engagementRate) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "层级" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: TIER[selected.joinTier] ?? selected.joinTier ?? "—" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "建联阶段" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: OUTREACH[selected.outreachStage] ?? selected.outreachStage ?? "—" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "验证" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: selected.verifyStatus ?? "—" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "数据更新" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: when(selected.dataUpdatedAt) }),
        selected.profileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "主页" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: selected.profileUrl, target: "_blank", rel: "noreferrer", children: "打开原页面" }) })
        ] }) : null
      ] }),
      selected.recommendReason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "tcw-reason", children: selected.recommendReason }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn danger", onClick: () => void remove(), disabled: removing, children: removing ? "移除中…" : "从活动移除" }) })
    ] }) : null
  ] });
}
function OverviewTab({ campaign }) {
  const fields = [
    ["营销目标", campaign?.goal],
    ["产品", campaign?.product],
    ["目标受众", campaign?.targetAudience],
    ["卖点", campaign?.sellingPoints],
    ["达人偏好", campaign?.creatorPreference],
    ["竞品", campaign?.competitors],
    ["周期", campaign?.timeline],
    ["简介", campaign?.intro],
    ["备注", campaign?.remark]
  ].filter(([, value]) => value !== null && value !== void 0 && value !== "");
  const artifacts = campaign?.artifacts ?? [];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-grid-detail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "tcw-card pad", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "活动信息" }),
      fields.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "没有更多描述字段。" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", { className: "tcw-fields", children: fields.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: String(value) })
      ] }, label)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "tcw-card pad", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "标识与产出" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: "tcw-fields", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "活动 id" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: "tcw-mono", children: campaign?.id ?? "—" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "我的角色" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: campaign?.myRole ?? "—" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "成员" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: campaign?.memberCount ?? 0 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "文件" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: campaign?.fileCount ?? 0 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "创建" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: when(campaign?.createdAt) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "更新" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: when(campaign?.updatedAt) }),
        campaign?.archivedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "归档" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: when(campaign.archivedAt) })
        ] }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "tcw-mt", children: "产出文件" }),
      artifacts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "还没有产出。" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "tcw-artifacts", children: artifacts.map((artifact) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
        artifact.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: artifact.url, target: "_blank", rel: "noreferrer", children: artifact.title ?? artifact.type }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: artifact.title ?? artifact.type }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-small tcw-muted", children: [
          artifact.type,
          " · ",
          when(artifact.createdAt)
        ] })
      ] }, `${artifact.type}-${artifact.createdAt}`)) })
    ] })
  ] });
}
function CampaignOutreachTab({ campaignId, signedIn, onOpenInbox }) {
  const [threads, setThreads] = (0, import_react.useState)(null);
  const [pending, setPending] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    if (!signedIn) return;
    let live = true;
    Promise.all([fetchThreads("inbox", { campaignId, page: 1 }), fetchPendingOutreach({ page: 1, pageSize: 100 })]).then(([threadsPayload, pendingPayload]) => {
      if (!live) return;
      setThreads(threadsPayload);
      setPending(pendingPayload);
    }).catch((cause) => {
      if (live) setError(cause);
    });
    return () => {
      live = false;
    };
  }, [campaignId, signedIn]);
  const rows = itemsOf(threads);
  const pendingRow = itemsOf(pending).find((row) => String(row.id) === String(campaignId));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-grid-detail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "tcw-card pad", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "待触达" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-metric-line", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-metric-value", children: pendingRow?.pendingCount ?? 0 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-small tcw-muted", children: "位达人等待第一条建联邮件" })
      ] }),
      pendingRow?.timeline ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "tcw-small tcw-muted", children: [
        "周期：",
        pendingRow.timeline.start,
        " → ",
        pendingRow.timeline.end
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: onOpenInbox, children: "打开触达收件箱" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "tcw-card pad", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "这个活动的线程" }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
      rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "还没有线程。发起触达后会出现在这里和收件箱。" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "tcw-threadlist", children: rows.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: thread.creatorName ?? thread.subject ?? "线程" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tcw-small tcw-muted", children: [
          thread.status ?? "",
          " · ",
          when(thread.lastMessageAt ?? thread.updatedAt)
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: thread.snippet ?? "" })
      ] }, thread.id ?? thread.threadId)) })
    ] })
  ] });
}
function CampaignDetail({ campaignId, onBack, onNotice, onOpenInbox, version }) {
  const [campaign, setCampaign] = (0, import_react.useState)(null);
  const [cards, setCards] = (0, import_react.useState)(null);
  const [pending, setPending] = (0, import_react.useState)(null);
  const [tab, setTab] = (0, import_react.useState)("cards");
  const [error, setError] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [dialog, setDialog] = (0, import_react.useState)(null);
  const [rosterVersion, setRosterVersion] = (0, import_react.useState)(0);
  const [refresh, setRefresh] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    let live = true;
    setError(null);
    Promise.all([fetchCampaign(campaignId), fetchRoleCards(campaignId), fetchPendingOutreach({ page: 1, pageSize: 100 })]).then(([detail, roleCards2, pendingPayload]) => {
      if (!live) return;
      setCampaign(detail);
      setCards(roleCards2);
      setPending(pendingPayload);
    }).catch((cause) => {
      if (live) setError(cause);
    });
    return () => {
      live = false;
    };
  }, [campaignId, version, refresh]);
  const roleCards = (0, import_react.useMemo)(() => itemsOf(cards), [cards]);
  const pendingRow = (0, import_react.useMemo)(
    () => itemsOf(pending).find((row) => String(row.id) === String(campaignId)),
    [pending, campaignId]
  );
  const changeStatus = async (event) => {
    const next = event.target.value;
    if (next === campaign?.status) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateCampaign(campaignId, { status: next });
      setCampaign((previous) => ({ ...previous, ...updated, status: next }));
      onNotice(`状态已改为「${STATUS[next]?.[0] ?? next}」`);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  const startTask = async (card) => {
    setBusy(true);
    setError(null);
    try {
      await startSearchTask(campaignId, card.id);
      onNotice("推荐任务已发起（异步）；完成后点「查看报告」。");
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  const tierStats = campaign?.creatorTierStats;
  const creatorTotal = campaign?.creatorCount ?? (tierStats?.head ?? 0) + (tierStats?.mid ?? 0) + (tierStats?.tail ?? 0);
  const metrics = [
    ["达人", creatorTotal],
    ["招募目标", campaign?.recruitTarget?.total ?? "—"],
    ["头 / 腰 / 尾", `${campaign?.creatorTierStats?.head ?? 0} / ${campaign?.creatorTierStats?.mid ?? 0} / ${campaign?.creatorTierStats?.tail ?? 0}`],
    ["角色卡", roleCards.length],
    ["待触达", pendingRow?.pendingCount ?? 0],
    ["成员", campaign?.memberCount ?? 0]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-inner", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-detail-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn sm", onClick: onBack, children: "← 活动" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: campaign?.brand ?? campaign?.name, size: 38 }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-detail-title", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: campaign?.name ?? "活动" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-sub", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: campaign?.brand ?? "—" }),
          campaign?.category ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: campaign.category })
          ] }) : null,
          campaign?.goal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: campaign.goal })
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            "更新于 ",
            when(campaign?.updatedAt)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { className: "tcw-select", value: campaign?.status ?? "", onChange: changeStatus, disabled: busy, "aria-label": "修改阶段", children: ["draft", "strategy", "outreach", "completed"].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: key, children: STATUS[key][0] }, key)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: () => setRefresh((value) => value + 1), disabled: busy, children: "刷新" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn", onClick: () => setDialog("card"), disabled: busy, children: "新建角色卡" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn primary", onClick: () => setDialog("import"), disabled: busy, children: "导入飞书达人" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-meta", children: [
      (campaign?.market ?? []).map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { children: countryName(code) }, code)),
      (campaign?.platformFocus ?? []).map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { tone: "alt", children: platformName(code) }, code)),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tag, { children: [
        "预算 ",
        money(campaign?.budget)
      ] }),
      campaign?.timeline ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tag, { children: [
        "周期 ",
        campaign.timeline
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { children: campaign?.myRole ?? "成员" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-metrics", children: metrics.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-metric", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-metric-value", children: value }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-small tcw-muted", children: label })
    ] }, label)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-tabs-line", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: tab === "cards" ? "on" : "", onClick: () => setTab("cards"), children: [
        "角色卡（",
        roleCards.length,
        "）"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: tab === "roster" ? "on" : "", onClick: () => {
        setTab("roster");
        setRosterVersion((value) => value + 1);
      }, children: [
        "达人清单（",
        creatorTotal,
        "）"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: tab === "about" ? "on" : "", onClick: () => setTab("about"), children: "概览" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: tab === "outreach" ? "on" : "", onClick: () => setTab("outreach"), children: [
        "触达",
        pendingRow?.pendingCount ? `（${pendingRow.pendingCount}）` : ""
      ] })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
    tab === "cards" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-cards", children: [
      roleCards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RoleCard,
        {
          card,
          busy,
          onStart: (value) => void startTask(value),
          onReport: (value) => setDialog({ kind: "report", card: value })
        },
        card.id
      )),
      roleCards.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-empty big", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "还没有角色卡。" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "tcw-small", children: "角色卡描述要找什么样的人；建卡后可以一键发起推荐。" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn primary", onClick: () => setDialog("card"), children: "新建角色卡" })
      ] }) : null
    ] }) : null,
    tab === "roster" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RosterTab, { campaignId, signedIn: true, onImport: () => setDialog("import"), version: rosterVersion + refresh }) : null,
    tab === "about" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewTab, { campaign }) : null,
    tab === "outreach" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignOutreachTab, { campaignId, signedIn: true, onOpenInbox }) : null,
    dialog === "card" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      CreateCardDialog,
      {
        campaignId,
        onClose: () => setDialog(null),
        onCreated: () => {
          setDialog(null);
          onNotice("角色卡已创建。");
          setRefresh((value) => value + 1);
          setTab("cards");
        }
      }
    ) : null,
    dialog === "import" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ImportDialog,
      {
        campaignId,
        onClose: () => setDialog(null),
        onDone: () => {
          setDialog(null);
          onNotice("导入任务已提交（异步）。");
          setRosterVersion((value) => value + 1);
        }
      }
    ) : null,
    dialog?.kind === "report" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportDialog, { campaignId, card: dialog.card, onClose: () => setDialog(null) }) : null
  ] });
}
function Outreach({ signedIn, configured, onOpenCampaign, version }) {
  const [box, setBox] = (0, import_react.useState)("inbox");
  const [threads, setThreads] = (0, import_react.useState)(null);
  const [pending, setPending] = (0, import_react.useState)(null);
  const [selected, setSelected] = (0, import_react.useState)(null);
  const [text, setText] = (0, import_react.useState)("");
  const [notice, setNotice] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const [sending, setSending] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (!signedIn) return;
    let live = true;
    setError(null);
    Promise.all([fetchThreads(box, { page: 1 }), fetchPendingOutreach({ page: 1, pageSize: 100 })]).then(([threadsPayload, pendingPayload]) => {
      if (!live) return;
      setThreads(threadsPayload);
      setPending(pendingPayload);
    }).catch((cause) => {
      if (live) setError(cause);
    });
    return () => {
      live = false;
    };
  }, [box, signedIn, version]);
  const rows = (0, import_react.useMemo)(() => itemsOf(threads), [threads]);
  const pendingRows = (0, import_react.useMemo)(() => itemsOf(pending), [pending]);
  if (!signedIn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { configured });
  const send = async () => {
    if (!selected || text.trim() === "") return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      await replyToThread(selected.id ?? selected.threadId, text);
      setNotice("回复已提交。");
      setText("");
    } catch (cause) {
      setError(cause);
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-outreach", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "tcw-threads", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: `tcw-chip ${box === "inbox" ? "on" : ""}`, onClick: () => setBox("inbox"), children: "收件箱" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: `tcw-chip ${box === "archived" ? "on" : ""}`, onClick: () => setBox("archived"), children: "归档" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "list", children: [
        rows.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            className: `tcw-thread ${selected && (selected.id ?? selected.threadId) === (thread.id ?? thread.threadId) ? "on" : ""}`,
            onClick: () => {
              setSelected(thread);
              setNotice(null);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "r1", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: thread.creatorName ?? thread.subject ?? "线程" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: when(thread.lastMessageAt ?? thread.updatedAt) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "r2", children: thread.subject ?? thread.snippet ?? "—" })
            ]
          },
          thread.id ?? thread.threadId
        )),
        rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "当前箱子没有线程。" }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "head tcw-pending-head", children: "待触达活动" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "list", children: [
        pendingRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-thread", onClick: () => onOpenCampaign(row.id), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "r1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: row.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-pill info", children: row.pendingCount })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "r2", children: row.timeline ? `${row.timeline.start} → ${row.timeline.end}` : "未设周期" })
        ] }, row.id)),
        pendingRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "没有待触达的达人。" }) : null
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "tcw-thread-detail", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-thread-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: selected?.creatorName ?? selected?.subject ?? "选择一个线程" }),
        selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-pill", children: selected.status ?? "—" }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-thread-body", children: [
        error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-error", children: error.message }) : null,
        notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-notice", children: notice }) : null,
        !selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-empty", children: "从左侧选一个线程，查看摘要并回复。" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: "tcw-fields", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "线程 id" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: "tcw-mono", children: selected.id ?? selected.threadId }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "主题" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: selected.subject ?? "—" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "最近一封" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: selected.snippet ?? "—" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "更新时间" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: when(selected.lastMessageAt ?? selected.updatedAt) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-composer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "textarea",
          {
            placeholder: "用纯文本写回复；空行分段，服务会转成 HTML。",
            value: text,
            onChange: (event) => setText(event.target.value),
            disabled: !selected || sending
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-small tcw-muted", children: "以你的账号身份提交到 outreach_service。" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-spacer" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn primary", onClick: () => void send(), disabled: !selected || sending || text.trim() === "", children: sending ? "发送中…" : "发送回复" })
        ] })
      ] })
    ] })
  ] });
}
function App() {
  const [view, setView] = (0, import_react.useState)("campaigns");
  const [campaignId, setCampaignId] = (0, import_react.useState)(null);
  const [status, setStatus] = (0, import_react.useState)({ signedIn: false, configured: false });
  const [notice, setNotice] = (0, import_react.useState)(null);
  const [dialog, setDialog] = (0, import_react.useState)(false);
  const [version, setVersion] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    let live = true;
    const refresh = () => {
      fetchStatus().then((next) => {
        if (live) setStatus(next);
      }).catch(() => {
        if (live) setStatus({ signedIn: false, configured: false });
      });
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      live = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  (0, import_react.useEffect)(() => {
    if (!notice) return void 0;
    const timer = setTimeout(() => setNotice(null), 4e3);
    return () => clearTimeout(timer);
  }, [notice]);
  const openCampaign = (0, import_react.useCallback)((id) => {
    setCampaignId(String(id));
    setView("detail");
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-top", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tcw-title", children: "活动工作台" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: "tcw-tabs", "aria-label": "活动工作台分区", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: view !== "outreach" ? "on" : "", onClick: () => {
          setView("campaigns");
          setCampaignId(null);
        }, children: "活动" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: view === "outreach" ? "on" : "", onClick: () => {
          setView("outreach");
          setCampaignId(null);
        }, children: "触达" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-actions", children: [
        notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tcw-notice inline", children: notice }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `tcw-pill ${status.signedIn ? "ok" : "warn"}`, children: status.signedIn ? "飞书已登录" : "未登录" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "tcw-btn sm", onClick: () => setVersion((value) => value + 1), children: "全局刷新" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tcw-body", children: [
      view === "outreach" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        Outreach,
        {
          signedIn: status.signedIn,
          configured: status.configured,
          onOpenCampaign: openCampaign,
          version
        }
      ) : null,
      view === "campaigns" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        CampaignList,
        {
          signedIn: status.signedIn,
          configured: status.configured,
          onOpen: openCampaign,
          onCreate: () => setDialog(true),
          version
        }
      ) : null,
      view === "detail" && campaignId !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        CampaignDetail,
        {
          campaignId,
          version,
          onBack: () => {
            setCampaignId(null);
            setView("campaigns");
          },
          onNotice: setNotice,
          onOpenInbox: () => {
            setView("outreach");
            setCampaignId(null);
          }
        }
      ) : null
    ] }),
    dialog ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      CreateCampaignDialog,
      {
        onClose: () => setDialog(false),
        onCreated: (created) => {
          setDialog(false);
          setNotice(`活动已创建：${created?.name ?? ""}`);
          setVersion((value) => value + 1);
          if (created?.id) openCampaign(created.id);
        }
      }
    ) : null
  ] });
}

// src/client/styles.js
var STYLES = `
.tcw {
  --tcw-bg: var(--dsw-alias-bg-base, #fff);
  --tcw-app: var(--dsw-alias-bg-layer-2, #f9fafb);
  --tcw-variant: var(--dsw-alias-bg-layer-3, #f3f4f6);
  --tcw-line: var(--dsw-alias-border-l2, rgba(25,27,28,.1));
  --tcw-line-1: var(--dsw-alias-border-l1, rgba(25,27,28,.06));
  --tcw-text: var(--dsw-alias-label-primary, #171717);
  --tcw-text-2: var(--dsw-alias-label-secondary, #444749);
  --tcw-muted: var(--dsw-alias-label-caption, #5c5f60);
  --tcw-brand: var(--dsw-alias-button-primary-fill, #d42020);
  --tcw-brand-ink: #a81414;
  --tcw-soft: #ffe9e9;
  --tcw-ok: #0a6e25;
  --tcw-ok-soft: #e6faed;
  --tcw-warn: #b45309;
  --tcw-warn-soft: #fdf3e3;
  --tcw-info: #1e40af;
  --tcw-info-soft: #eaf3ff;
  --tcw-r-sm: 6px;
  --tcw-r-md: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--tcw-app);
  color: var(--tcw-text);
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.tcw * { box-sizing: border-box; }
.tcw ::-webkit-scrollbar { width: 10px; height: 10px; }
.tcw ::-webkit-scrollbar-thumb { background: rgba(25,27,28,.16); border-radius: 999px; border: 3px solid transparent; background-clip: content-box; }
.tcw ::-webkit-scrollbar-thumb:hover { background: rgba(25,27,28,.28); background-clip: content-box; }

/* ---------- top bar ---------- */
.tcw-top {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--tcw-line);
  background: var(--tcw-bg);
  flex: 0 0 auto;
}
.tcw-title { font-size: 14px; font-weight: 650; letter-spacing: .01em; }
.tcw-tabs { display: inline-flex; gap: 2px; padding: 2px; background: var(--tcw-variant); border-radius: 8px; }
.tcw-tabs button {
  appearance: none; border: 0; background: transparent; color: var(--tcw-text-2);
  font: inherit; font-size: 12.5px; padding: 4px 14px; border-radius: 6px; cursor: pointer;
}
.tcw-tabs button.on { background: var(--tcw-bg); color: var(--tcw-text); box-shadow: 0 1px 2px rgba(16,17,20,.08); font-weight: 600; }
.tcw-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* ---------- body ---------- */
.tcw-body { flex: 1 1 auto; min-height: 0; overflow: auto; }
.tcw-inner { padding: 18px 20px 48px; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.tcw-head { display: flex; align-items: flex-start; gap: 16px; }
.tcw-head h1, .tcw-detail-head h1 { margin: 0; font-size: 19px; font-weight: 660; letter-spacing: -.01em; }
.tcw-head > div:first-child { min-width: 0; }

/* ---------- small type ---------- */
.tcw-small { font-size: 11.5px; }
.tcw-muted { color: var(--tcw-muted); }
.tcw-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }
.tcw-spacer { flex: 1 1 auto; }
.tcw-mt { margin-top: 18px; }

/* ---------- pills and tags ---------- */
.tcw-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 8px; border-radius: 999px;
  font-size: 11px; line-height: 18px; font-weight: 550;
  background: var(--tcw-variant); color: var(--tcw-text-2); white-space: nowrap;
}
.tcw-pill.ok { background: var(--tcw-ok-soft); color: var(--tcw-ok); }
.tcw-pill.warn { background: var(--tcw-warn-soft); color: var(--tcw-warn); }
.tcw-pill.info { background: var(--tcw-info-soft); color: var(--tcw-info); }
.tcw-pill.primary { background: var(--tcw-soft); color: var(--tcw-brand-ink); }
.tcw-pill.muted { background: var(--tcw-variant); color: var(--tcw-muted); }
.tcw-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tcw-tag {
  display: inline-flex; align-items: center; padding: 0 6px; border-radius: var(--tcw-r-sm);
  background: var(--tcw-variant); color: var(--tcw-text-2); font-size: 11px; line-height: 18px; white-space: nowrap;
}
.tcw-tag.alt { background: var(--tcw-info-soft); color: var(--tcw-info); }

/* ---------- buttons ---------- */
.tcw-btn {
  appearance: none; border: 1px solid var(--tcw-line); background: var(--tcw-bg); color: var(--tcw-text);
  font: inherit; font-size: 12.5px; font-weight: 500; height: 30px; padding: 0 12px; border-radius: 8px;
  cursor: pointer; white-space: nowrap; transition: background .12s ease, border-color .12s ease, color .12s ease;
}
.tcw-btn:hover { background: var(--tcw-variant); }
.tcw-btn:disabled { opacity: .55; cursor: not-allowed; }
.tcw-btn:focus-visible { outline: 2px solid var(--tcw-brand); outline-offset: 1px; }
.tcw-btn.primary { background: var(--tcw-brand); border-color: var(--tcw-brand); color: #fff; }
.tcw-btn.primary:hover { filter: brightness(1.05); }
.tcw-btn.danger { color: var(--tcw-brand-ink); border-color: rgba(180,20,20,.28); }
.tcw-btn.danger:hover { background: var(--tcw-soft); }
.tcw-btn.sm { height: 26px; padding: 0 9px; font-size: 12px; }
.tcw-x {
  appearance: none; border: 0; background: transparent; color: var(--tcw-muted);
  font-size: 20px; line-height: 1; width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
}
.tcw-x:hover { background: var(--tcw-variant); color: var(--tcw-text); }

/* ---------- form controls ---------- */
.tcw-input, .tcw-select {
  font: inherit; font-size: 12.5px; color: var(--tcw-text);
  background: var(--tcw-bg); border: 1px solid var(--tcw-line); border-radius: 8px;
  height: 30px; padding: 0 10px; outline: none;
}
.tcw-input:focus, .tcw-select:focus { border-color: var(--tcw-brand); box-shadow: 0 0 0 3px rgba(212,32,32,.12); }
.tcw-input.search { min-width: 220px; }
.tcw-select.wide { width: 100%; }
.tcw-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tcw-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.tcw-field-label { font-size: 11.5px; color: var(--tcw-text-2); font-weight: 550; }
.tcw-field-hint { font-size: 11px; color: var(--tcw-muted); }
.tcw-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
.tcw-row { display: flex; align-items: center; gap: 10px; }

/* ---------- summary ---------- */
.tcw-summary { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 4px; color: var(--tcw-muted); font-size: 12px; }
.tcw-summary b { color: var(--tcw-text); font-size: 13px; }
.tcw-summary-item { display: inline-flex; align-items: center; gap: 6px; }
.tcw-warn { color: var(--tcw-warn); }

/* ---------- cards and tables ---------- */
.tcw-card { background: var(--tcw-bg); border: 1px solid var(--tcw-line); border-radius: var(--tcw-r-md); overflow: hidden; }
.tcw-card.pad { padding: 14px 16px; overflow: visible; }
.tcw-card h3 { margin: 0 0 10px; font-size: 13px; font-weight: 620; }
.tcw-card h3 .tcw-small { margin-left: 8px; font-weight: 400; }
.tcw-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px; }
.tcw-table th {
  position: sticky; top: 0; z-index: 1;
  text-align: left; font-weight: 550; font-size: 11.5px; color: var(--tcw-muted);
  background: var(--tcw-bg); padding: 9px 12px; border-bottom: 1px solid var(--tcw-line);
  white-space: nowrap;
}
.tcw-table td { padding: 10px 12px; border-bottom: 1px solid var(--tcw-line-1); vertical-align: middle; }
.tcw-table tr:last-child td { border-bottom: 0; }
.tcw-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.tcw-table tr.clickable { cursor: pointer; }
.tcw-table tr.clickable:hover td { background: var(--tcw-variant); }
.tcw-table tr.on td { background: var(--tcw-soft); }
.tcw-table .col-name { width: 40%; min-width: 240px; }
.tcw-table .col-budget { width: 112px; }
.tcw-table .col-creators { width: 118px; }
.tcw-table .col-time { width: 84px; white-space: nowrap; }
.tcw-table .num { white-space: nowrap; }
.tcw-table td, .tcw-table th { overflow-wrap: anywhere; }
.tcw .nowrap { white-space: nowrap; }
.tcw-table.compact td { padding: 7px 10px; }
.tcw-table.compact th { padding: 7px 10px; }
.tcw-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.tcw-name.tight { gap: 7px; }
.tcw-name-body { display: flex; flex-direction: column; min-width: 0; line-height: 1.35; }
.tcw-name-body b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tcw-name-body span, .tcw-name-body a { color: var(--tcw-muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tcw-name-body a { color: var(--tcw-info); text-decoration: none; }
.tcw-name-body a:hover { text-decoration: underline; }
.tcw-sub-inline { display: block; font-size: 11px; color: var(--tcw-muted); font-weight: 400; white-space: nowrap; }
.tcw-avatar { border-radius: 999px; flex: 0 0 auto; object-fit: cover; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; }
.tcw-avatar.text { letter-spacing: .02em; }
.tcw-reason { color: var(--tcw-muted); font-size: 11.5px; line-height: 1.55; max-width: 620px; }

/* ---------- list footer / states ---------- */
.tcw-list-foot { display: flex; align-items: center; gap: 10px; }
.tcw-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  padding: 26px 16px; color: var(--tcw-muted); text-align: center;
}
.tcw-empty.big { padding: 44px 16px; background: var(--tcw-bg); border: 1px solid var(--tcw-line); border-radius: var(--tcw-r-md); }
.tcw-empty p { margin: 0; }
.tcw-skeleton { display: block; height: 12px; border-radius: 6px; background: linear-gradient(90deg, var(--tcw-variant), #eee, var(--tcw-variant)); background-size: 200% 100%; animation: tcw-shimmer 1.2s linear infinite; }
@keyframes tcw-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.tcw-error { background: var(--tcw-soft); color: var(--tcw-brand-ink); border: 1px solid rgba(180,20,20,.18); border-radius: 8px; padding: 8px 12px; font-size: 12px; }
.tcw-notice { background: var(--tcw-ok-soft); color: var(--tcw-ok); border-radius: 8px; padding: 8px 12px; font-size: 12px; }
.tcw-notice.inline { padding: 3px 10px; background: var(--tcw-variant); color: var(--tcw-text-2); }

/* ---------- detail ---------- */
.tcw-detail-head { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.tcw-detail-title { min-width: 0; flex: 1 1 260px; }
.tcw-sub { display: flex; gap: 6px; flex-wrap: wrap; color: var(--tcw-muted); font-size: 12px; margin-top: 2px; }
.tcw-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.tcw-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: 10px; }
.tcw-metric { background: var(--tcw-bg); border: 1px solid var(--tcw-line); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; }
.tcw-metric-value { font-size: 19px; font-weight: 650; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.tcw-metric-line { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.tcw-tabs-line { display: flex; gap: 4px; border-bottom: 1px solid var(--tcw-line); }
.tcw-tabs-line button {
  appearance: none; border: 0; background: transparent; font: inherit; font-size: 12.5px; color: var(--tcw-muted);
  padding: 8px 12px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.tcw-tabs-line button:hover { color: var(--tcw-text); }
.tcw-tabs-line button.on { color: var(--tcw-text); border-bottom-color: var(--tcw-brand); font-weight: 600; }

/* ---------- role cards ---------- */
.tcw-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px; }
.tcw-rolecard {
  background: var(--tcw-bg); border: 1px solid var(--tcw-line); border-radius: var(--tcw-r-md);
  padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
}
.tcw-rolecard .r1 { display: flex; align-items: center; gap: 8px; }
.tcw-rolecard .r1 b { font-size: 13.5px; font-weight: 620; margin-right: auto; }
.tcw-rolecard p { margin: 4px 0 0; }
.tcw-rolecard dl { display: grid; grid-template-columns: 72px 1fr; gap: 4px 10px; margin: 0; font-size: 12px; }
.tcw-rolecard dt { color: var(--tcw-muted); }
.tcw-rolecard dd { margin: 0; color: var(--tcw-text-2); }
.tcw-rolecard footer { display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--tcw-line-1); padding-top: 10px; }

/* ---------- roster split and drawer ---------- */
.tcw-split { display: flex; gap: 14px; align-items: flex-start; }
.tcw-split-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.tcw-drawer {
  flex: 0 0 320px; background: var(--tcw-bg); border: 1px solid var(--tcw-line); border-radius: var(--tcw-r-md);
  padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; position: sticky; top: 0;
}
.tcw-drawer header { display: flex; align-items: center; gap: 10px; }
.tcw-drawer header > div { display: flex; flex-direction: column; min-width: 0; }
.tcw-drawer header b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tcw-drawer header .tcw-x { margin-left: auto; }
.tcw-drawer dl { display: grid; grid-template-columns: 74px 1fr; gap: 5px 10px; margin: 0; font-size: 12px; }
.tcw-drawer dt { color: var(--tcw-muted); }
.tcw-drawer dd { margin: 0; }
.tcw-drawer footer { border-top: 1px solid var(--tcw-line-1); padding-top: 10px; }

/* ---------- detail grids ---------- */
.tcw-grid-detail { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 12px; align-items: start; }
.tcw-fields { display: grid; grid-template-columns: 84px 1fr; gap: 6px 12px; margin: 0; font-size: 12.5px; }
.tcw-fields dt { color: var(--tcw-muted); }
.tcw-fields dd { margin: 0; color: var(--tcw-text-2); word-break: break-word; }
.tcw-artifacts, .tcw-threadlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.tcw-artifacts li, .tcw-threadlist li { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border: 1px solid var(--tcw-line-1); border-radius: 8px; }
.tcw-artifacts a { color: var(--tcw-info); text-decoration: none; }
.tcw-artifacts a:hover { text-decoration: underline; }
.tcw-threadlist p { margin: 0; color: var(--tcw-muted); font-size: 11.5px; }

/* ---------- modal ---------- */
.tcw-modal { position: fixed; inset: 0; z-index: 40; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(16,17,20,.34); }
.tcw-modal-card {
  width: min(560px, 100%); max-height: 86vh; display: flex; flex-direction: column;
  background: var(--tcw-bg); border-radius: 14px; box-shadow: 0 18px 60px rgba(16,17,20,.28); overflow: hidden;
}
.tcw-modal-card.wide { width: min(920px, 100%); }
.tcw-modal-head { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px 10px; border-bottom: 1px solid var(--tcw-line-1); }
.tcw-modal-head h2 { margin: 0; font-size: 15px; font-weight: 640; }
.tcw-modal-head p { margin: 4px 0 0; color: var(--tcw-muted); font-size: 12px; }
.tcw-modal-head .tcw-x { margin-left: auto; }
.tcw-modal-body { padding: 16px 18px; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
.tcw-modal-foot { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--tcw-line-1); background: var(--tcw-app); }
.tcw-report-summary { margin: 0; color: var(--tcw-text-2); font-size: 12.5px; line-height: 1.65; }
.tcw-assumptions { border: 1px solid var(--tcw-line-1); border-radius: 8px; padding: 8px 12px; }
.tcw-assumptions summary { cursor: pointer; color: var(--tcw-text-2); font-size: 12px; }
.tcw-assumptions ul { margin: 8px 0 0; padding-left: 18px; color: var(--tcw-muted); font-size: 11.5px; line-height: 1.6; }
.tcw-report-platform h3 { display: flex; align-items: baseline; gap: 8px; }

/* ---------- outreach ---------- */
.tcw-outreach { display: flex; height: 100%; min-height: 0; }
.tcw-threads { flex: 0 0 330px; border-right: 1px solid var(--tcw-line); background: var(--tcw-bg); display: flex; flex-direction: column; min-height: 0; overflow: auto; }
.tcw-threads .head { display: flex; gap: 6px; padding: 12px 14px 8px; }
.tcw-threads .head.tcw-pending-head { font-size: 11.5px; color: var(--tcw-muted); font-weight: 550; padding-top: 14px; border-top: 1px solid var(--tcw-line-1); }
.tcw-threads .list { display: flex; flex-direction: column; padding: 0 8px 10px; gap: 2px; }
.tcw-chip {
  appearance: none; border: 1px solid var(--tcw-line); background: var(--tcw-bg); color: var(--tcw-text-2);
  font: inherit; font-size: 11.5px; height: 26px; padding: 0 10px; border-radius: 999px; cursor: pointer;
}
.tcw-chip.on { background: var(--tcw-brand); border-color: var(--tcw-brand); color: #fff; }
.tcw-thread { padding: 8px 10px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; }
.tcw-thread:hover { background: var(--tcw-variant); }
.tcw-thread.on { background: var(--tcw-soft); }
.tcw-thread .r1 { display: flex; align-items: center; gap: 8px; }
.tcw-thread .r1 b { font-weight: 560; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tcw-thread .r1 span { margin-left: auto; color: var(--tcw-muted); font-size: 11px; white-space: nowrap; }
.tcw-thread .r2 { color: var(--tcw-muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tcw-thread-detail { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.tcw-thread-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--tcw-line); background: var(--tcw-bg); }
.tcw-thread-body { flex: 1 1 auto; overflow: auto; padding: 16px; }
.tcw-composer { border-top: 1px solid var(--tcw-line); background: var(--tcw-bg); padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.tcw-composer textarea {
  width: 100%; min-height: 96px; resize: vertical; font: inherit; font-size: 12.5px;
  border: 1px solid var(--tcw-line); border-radius: 8px; padding: 8px 10px; outline: none;
}
.tcw-composer textarea:focus { border-color: var(--tcw-brand); box-shadow: 0 0 0 3px rgba(212,32,32,.12); }

/* ---------- responsive ---------- */
@media (max-width: 1080px) {
  .tcw-table .col-time { display: none; }
  .tcw-drawer { flex-basis: 280px; }
}
@media (max-width: 860px) {
  .tcw-inner { padding: 14px 14px 40px; }
  .tcw-top { flex-wrap: wrap; }
  .tcw-actions { width: 100%; }
  .tcw-cards { grid-template-columns: 1fr; }
  .tcw-grid2 { grid-template-columns: 1fr; }
  .tcw-split { flex-direction: column; }
  .tcw-drawer { position: static; width: 100%; }
  .tcw-outreach { flex-direction: column; }
  .tcw-threads { flex: 0 0 auto; max-height: 42vh; border-right: 0; border-bottom: 1px solid var(--tcw-line); }
}
@media (prefers-reduced-motion: reduce) {
  .tcw-skeleton { animation: none; }
}
`;

// src/client/index.jsx
var PANEL_ID = "campaign-workspace";
var inject = ["slots"];
function apply(ctx) {
  try {
    activate(ctx);
  } catch (cause) {
    console.error("[tomato-campaign] client activation failed", cause);
    throw cause;
  }
}
function activate(ctx) {
  if (typeof document !== "undefined") {
    const existing = document.getElementById("tomato-campaign-styles");
    if (existing === null) {
      const style = document.createElement("style");
      style.id = "tomato-campaign-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    } else {
      existing.textContent = STYLES;
    }
  }
  ctx.effect(
    () => ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL_ID }, App)),
    "tomato-campaign: main panel"
  );
  ctx.effect(
    () => ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
      name: "sidebar.panellist",
      id: PANEL_ID,
      order: 3,
      label: () => "活动"
    }, PanelIcon)),
    "tomato-campaign: sidebar entry"
  );
}
function PanelIcon({ size = 18 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 19V9" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10 19V5" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M16 19v-7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M22 19V8" })
  ] });
}
return Object.defineProperty({ ...module.exports }, Symbol.toStringTag, { value: 'Module' })
  },
})
