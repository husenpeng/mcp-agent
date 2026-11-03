/**
 * Tab stylesheet. The measurements follow the Plugins page's Installed and
 * Discover lists (48px artwork frame, 14/20 title, 13/18 description) so the
 * market sits inside the shell rather than beside it. Colors are the shell's
 * `--dsw-*` tokens only.
 */
export const MARKET_CSS = `
.tm-section { display: flex; flex-direction: column; gap: 16px; }
.tm-lede { margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-tertiary); }
.tm-banner { display: flex; gap: 8px; align-items: flex-start; margin: 0; padding: 10px 12px; border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-module-platform); font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
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

@media (max-width: 720px) {
  .tm-card { gap: 10px; }
  .tm-icon { width: 40px; height: 40px; }
  .tm-image { width: 30px; height: 30px; }
  .tm-description { -webkit-line-clamp: 2; }
}
`

/** Inject the stylesheet once per document. */
export function installStyles() {
  if (typeof document === 'undefined') return
  const id = 'tomato-market-styles'
  if (document.getElementById(id) !== null) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = MARKET_CSS
  document.head.appendChild(style)
}