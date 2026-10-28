/**
 * Browser half: register `skills` as a right-Sidebar page type.
 *
 * The type reaches the Sidebar through its public two-stage path — the
 * definition into `ctx.sidebarRightTabs`, the body and chip title into the
 * keyed seats under the same id. All reads and writes go through the injected
 * face, which calls the Session-addressed `skills` Remote; the body itself only
 * draws store state and hands gestures back.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { SKILLS_ID, skillsDefinition } from './definition.tsx'
import { createSkillBrowserStore } from './store.ts'
import { skillBrowserFace } from './face.ts'
import { SkillsBody, SkillsTitle } from './SkillsBody.tsx'
import { en, ja, es, fr, de, ru, pt, zh, NS } from './locales.ts'

export type { SkillBrowserKey } from './locales.ts'
export type {
  SkillBrowserInjected, SkillBrowserRemote, SkillDraft,
} from './face.ts'
export type { SkillBrowserState, SkillBrowserTabState, SkillDetailState, SkillListState } from './store.ts'
export type { SkillDetailProps } from './SkillDetail.tsx'
export type { SkillsBodyProps } from './SkillsBody.tsx'

/**
 * Required browser services: the tab registry and keyed seats, the Remote
 * namespace, and copy. The Session arrives as a standard slot prop.
 */
export const inject = ['slots', 'locale', 'sidebarRightTabs', 'remote', 'remote.skills']

/**
 * Client plugin body: register the type, its dictionaries, its body, and its
 * chip title, and drop memoized catalogs when the Host composition changes.
 * @param ctx - client root context carrying the registries, the Remote face, and copy.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-skill-browser: dictionaries')
  ctx.effect(() => ctx.sidebarRightTabs.register(skillsDefinition(t)), 'ui-skill-browser: skills type')

  const store = createSkillBrowserStore()
  const face = skillBrowserFace(ctx.remote)
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
    {
      name: 'sidebar.right.pane.tab', key: SKILLS_ID, locale: NS, store, inject: face,
    },
    SkillsBody,
  )), 'ui-skill-browser: skills tab body')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register(
    { name: 'sidebar.right.pane.tab.title', key: SKILLS_ID },
    SkillsTitle,
  )), 'ui-skill-browser: skills tab title')
}
