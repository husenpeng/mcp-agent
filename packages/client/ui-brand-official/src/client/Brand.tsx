import type { TranslateNS } from '@tomato/client-ui-slots'
import { BrandWordmark, TomatoMark } from '@tomato/client-ui-primitives'
import type { SidebarBrandMarkOwnerProps } from '@tomato/client-ui-sidebar/client'
import type { NS } from './locales.ts'

/**
 * Render the official mark with the presentation requested by its host surface.
 * @param props - Host-supplied mark presentation.
 * @returns the official Tomato mark.
 */
export function OfficialBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <TomatoMark size={size} />
}

/**
 * Render the official name artwork without its independently slotted mark.
 * @param props.t - locale seat carrying the brand name.
 * @returns the official name wordmark.
 */
export function OfficialBrandName({ t }: { readonly t: TranslateNS<typeof NS> }) {
  return <BrandWordmark label={t('name')} includeMark={false} />
}
