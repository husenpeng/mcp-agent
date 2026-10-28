/** Account avatar with a deterministic initial fallback. */

import { useEffect, useState } from 'react'
import type { AccountUser } from './account-controller.ts'
import css from './Account.module.css'

/**
 * Render one account avatar.
 * @param props.user - signed-in user, or null while signed out.
 * @param props.size - rendered square size in pixels.
 * @returns the image or initials.
 */
export function AccountAvatar({ user, size = 24 }: { user: AccountUser | null; size?: number }) {
  const url = user?.avatarUrl ?? null
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [url])
  if (url !== null && !failed) {
    return <img className={css.avatarImage} src={url} alt="" width={size} height={size}
      referrerPolicy="no-referrer" onError={() => { setFailed(true) }} />
  }
  const source = user?.name ?? user?.email ?? '?'
  const initial = source.trim().slice(0, 1).toUpperCase() || '?'
  return <span className={css.avatarFallback} style={{ width: size, height: size }} aria-hidden>{initial}</span>
}
