/** `brand` namespace dictionaries for the official wordmark. */

/** Dictionary namespace owned by this package. */
export const NS = 'brand'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  name: 'Tomato',
}

/** Keys of the `brand` dictionary. */
export type BrandKey = keyof typeof zh

/** English dictionary mirroring every Chinese key. */
export const en: Record<BrandKey, string> = {
  name: 'Tomato',
}

/** Japanese dictionary mirroring every English key. */
export const ja: Record<BrandKey, string> = { name: 'Tomato' }

/** Spanish dictionary mirroring every English key. */
export const es: Record<BrandKey, string> = { name: 'Tomato' }

/** French dictionary mirroring every English key. */
export const fr: Record<BrandKey, string> = { name: 'Tomato' }

/** German dictionary mirroring every English key. */
export const de: Record<BrandKey, string> = { name: 'Tomato' }

/** Russian dictionary mirroring every English key. */
export const ru: Record<BrandKey, string> = { name: 'Tomato' }

/** Portuguese dictionary mirroring every English key. */
export const pt: Record<BrandKey, string> = { name: 'Tomato' }

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Official brand artwork copy. */
    'brand': BrandKey
  }
}
