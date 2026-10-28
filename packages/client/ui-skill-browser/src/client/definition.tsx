/**
 * Stage one of the Skills tab's registration: what the type IS.
 *
 * A page type: it recognizes no resource address and is opened by kind. The
 * guide page offers it as an entry box, so opening it replaces the guide in its
 * tab, the same way the workspace file tree opens.
 */
import type { SidebarRightTabDefinition } from '@tomato/client-ui-sidebar-right/client'
import type { TranslateNS } from '@tomato/client-locale/client'
import { IconSkillOutlineMedium } from '@tomato/client-ui-primitives'
import type {} from './locales.ts'

/** The tab kind this package owns. */
export const SKILLS_KIND = 'skills'

/** This implementation's identity in the tab system, and the key its body registers under. */
export const SKILLS_ID = '@tomato/client-ui-skill-browser'

/**
 * The Skills type's registry definition.
 * @param t - namespace-bound translate, read fresh on every label call.
 * @returns the definition to register.
 */
export function skillsDefinition(t: TranslateNS<'skillBrowser'>): SidebarRightTabDefinition {
  return {
    id: SKILLS_ID,
    kind: SKILLS_KIND,
    priority: 'builtin',
    title: () => t('type.label'),
    guide: [{
      id: 'skills',
      order: 40,
      title: () => t('type.label'),
      description: () => t('guide.description'),
      icon: IconSkillOutlineMedium,
    }],
  }
}
