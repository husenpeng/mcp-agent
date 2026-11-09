/** Panel styles, scoped under `.tcw` so they never collide with the shell. */

export const STYLES = `
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
`