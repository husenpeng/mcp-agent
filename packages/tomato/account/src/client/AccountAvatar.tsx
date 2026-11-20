/** Account avatar with a deterministic initial fallback. */

import { useEffect, useState } from 'react'
import type { AccountUser } from './account-controller.ts'
import css from './Account.module.css'

/**
 * Render one account avatar. The frame owns the square size, so an image laid out
 * by a plain flex row cannot stretch past it.
 * @param props.user - signed-in user, or null while signed out.
 * @param props.size - rendered square size in pixels.
 * @returns the image or initials.
 */
export function AccountAvatar({ user, size = 24 }: { user: AccountUser | null; size?: number }) {
  const url = user?.avatarUrl ?? null
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [url])
  const source = user?.name ?? user?.email ?? '?'
  const initial = source.trim().slice(0, 1).toUpperCase() || '?'
  return (
    <span className={css.avatarFrame} style={{ width: size, height: size }}>
      {url !== null && !failed
        ? <img className={css.avatarImage} src={url} alt="" width={size} height={size}
          referrerPolicy="no-referrer" onError={() => { setFailed(true) }} />
        : <span className={css.avatarFallback} style={{ fontSize: Math.round(size * 0.45) }} aria-hidden>{initial}</span>}
    </span>
  )
}
