/**
 * Browser half: one global main panel plus its sidebar entry.
 *
 * A global panel (rather than a per-session view) matches the business: the
 * campaign workspace belongs to the profile, not to one conversation, and the
 * sidebar entry selects it through the layout service.
 */

import { App } from './App.jsx'
import { STYLES } from './styles.js'

/** Panel id shared by the sidebar entry and the main slot key. */
export const PANEL_ID = 'campaign-workspace'

/** Required services: the slot registry that hosts both registrations. */
export const inject = ['slots']

/**
 * Register the panel, its sidebar glyph, and its stylesheet.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx) {
  try {
    activate(ctx)
  } catch (cause) {
    console.error('[tomato-campaign] client activation failed', cause)
    throw cause
  }
}

/** Registration body, wrapped so a failure reaches the console with its cause. */
function activate(ctx) {
  // Rewrite the sheet on every activation: a hot-swapped bundle inherits the
  // element the previous one injected, and leaving it alone would run the new
  // markup under the old rules.
  if (typeof document !== 'undefined') {
    const existing = document.getElementById('tomato-campaign-styles')
    if (existing === null) {
      const style = document.createElement('style')
      style.id = 'tomato-campaign-styles'
      style.textContent = STYLES
      document.head.appendChild(style)
    } else {
      existing.textContent = STYLES
    }
  }

  // `inject` is what makes a slot owned by another entry visible to this
  // fiber; registering into it directly fails the boot audit.
  ctx.effect(
    () => ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, App)),
    'tomato-campaign: main panel',
  )
  ctx.effect(
    () => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
      name: 'sidebar.panellist',
      id: PANEL_ID,
      order: 3,
      label: () => '活动',
    }, PanelIcon)),
    'tomato-campaign: sidebar entry',
  )
}

/**
 * Sidebar glyph: a three-bar activity mark.
 * @param props - the sidebar's icon share.
 * @param props.size - requested edge in pixels.
 * @returns the icon element.
 */
export function PanelIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V8" />
    </svg>
  )
}