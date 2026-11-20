/**
 * The work-team settings page, browser half: the defaults every robot the
 * `work_team_create` tool creates over the Host's `tool-work-team` entry, and
 * the model route of every published robot over the client robot registry.
 * The page registers into the Plugins page's `plugins.item` slot while the
 * Host serves the `tool-work-team` entry.
 */

// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@tomato/client-locale/client'
// Type-only: the ctx.configForms Context merge. Cross-plugin collaboration
// goes through the service, never a value import (client bundle purity gate).
import type {} from '@tomato/client-ui-settings/client'
// Type-only: the Plugins page's SlotMap merge (the 'plugins.item' entry).
import type {} from '@tomato/client-ui-plugin-manager/client'
import type {} from '@tomato/client-ui-renderer/client'
// Type-only: the ctx.robotRuns Context merge and the registry snapshot types.
import type {} from '@tomato/api-robot-controller/client'
import type { Context as ClientContext } from '@tomato/cordis'
import { WorkTeamSettingsCard } from './WorkTeamSettingsCard.tsx'
import { WorkTeamDefaultsCardController, workTeamCardFace } from './work-team-card-controller.ts'
import { en, ja, es, fr, de, ru, pt, zh, type WorkTeamSettingsLocaleKey } from './locales.ts'

export type { WorkTeamSettingsCardProps } from './WorkTeamSettingsCard.tsx'
export type {
  WorkTeamDefaultsCardFace, WorkTeamDefaultsCardState, WorkTeamDefaultsSettings, WorkTeamSettingsCardFace,
} from './work-team-card-controller.ts'
export type { WorkTeamSettingsLocaleKey } from './locales.ts'

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Work-team settings page copy. */
    'settings.work-team': WorkTeamSettingsLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.work-team'

/**
 * Host Loader entry whose Config fields the team-defaults section edits.
 * Spelled here rather than imported: a client package must not depend on a
 * Host package.
 */
export const WORK_TEAM_ENTRY = 'tool-work-team'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms', 'robotRuns']

/**
 * Mount the work-team settings page while the Host serves its entry.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-settings-work-team: dictionaries')
  const defaults = new WorkTeamDefaultsCardController(ctx.configForms.get(WORK_TEAM_ENTRY))
  ctx.effect(() => () => { defaults.dispose() }, 'ui-settings-work-team: defaults form subscription')
  const face = workTeamCardFace(defaults.inject(), ctx.robotRuns)
  ctx.effect(() => ctx.configForms.whileServed([WORK_TEAM_ENTRY], () => ctx.slots.inject('plugins.item', () => ctx.slots.register({
    name: 'plugins.item',
    id: 'work-team',
    order: 12,
    label: () => t('title'),
    locale: NS,
    inject: () => face,
  }, WorkTeamSettingsCard))), 'ui-settings-work-team: page')
}
