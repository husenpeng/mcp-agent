/** Account access page: verified roles and numeric quotas from the gateway session. */
import { useEffect, useState } from 'react'
import type { PropsLocale } from '@tomato/client-ui-slots'

export type AccessSectionProps = PropsLocale<'settings.accountAccess'>

interface AccessState {
  readonly status: 'loading' | 'signed-in' | 'signed-out' | 'unavailable'
  readonly roles: readonly string[]
  readonly quotas: Readonly<Record<string, number>>
}

function accessOf(value: unknown): AccessState {
  if (typeof value !== 'object' || value === null) return { status: 'unavailable', roles: [], quotas: {} }
  const body = value as { status?: unknown; user?: unknown }
  if (body.status !== 'signed-in' || typeof body.user !== 'object' || body.user === null) {
    return { status: body.status === 'signed-out' ? 'signed-out' : 'unavailable', roles: [], quotas: {} }
  }
  const user = body.user as { roles?: unknown; quotas?: unknown }
  const roles = Array.isArray(user.roles) ? user.roles.filter((role): role is string => typeof role === 'string') : []
  const quotas = typeof user.quotas === 'object' && user.quotas !== null && !Array.isArray(user.quotas)
    ? Object.fromEntries(Object.entries(user.quotas).filter((entry): entry is [string, number] => typeof entry[1] === 'number'))
    : {}
  return { status: 'signed-in', roles, quotas }
}

/**
 * Render the access section.
 * @param props - locale copy supplied by the settings slot.
 * @returns the section content.
 */
export function AccessSection({ t }: AccessSectionProps) {
  const [state, setState] = useState<AccessState>({ status: 'loading', roles: [], quotas: {} })
  useEffect(() => {
    let active = true
    void fetch('api/auth/session', { credentials: 'include', cache: 'no-store', headers: { accept: 'application/json' } })
      .then(async response => response.ok ? accessOf(await response.json()) : { status: 'unavailable' as const, roles: [], quotas: {} })
      .then((next) => { if (active) setState(next) })
      .catch(() => { if (active) setState({ status: 'unavailable', roles: [], quotas: {} }) })
    return () => { active = false }
  }, [])
  return (
    <section aria-labelledby="account-access-heading" style={{ display: 'grid', gap: 16 }}>
      <div>
        <h2 id="account-access-heading">{t('title')}</h2>
        <p>{t('description')}</p>
      </div>
      {state.status === 'loading' && <p>{t('loading')}</p>}
      {state.status === 'signed-out' && <p>{t('signedOut')}</p>}
      {state.status === 'unavailable' && <p>{t('unavailable')}</p>}
      {state.status === 'signed-in' && <>
        <div>
          <h3>{t('roles')}</h3>
          {state.roles.length === 0 ? <p>{t('none')}</p> : <ul>{state.roles.map(role => <li key={role}>{role}</li>)}</ul>}
        </div>
        <div>
          <h3>{t('quotas')}</h3>
          {Object.keys(state.quotas).length === 0 ? <p>{t('none')}</p> : <dl>
            {Object.entries(state.quotas).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </dl>}
        </div>
      </>}
    </section>
  )
}
