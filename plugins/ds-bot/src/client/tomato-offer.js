// Whether the update card shows a Tomato row. An npm Tomato is swapped for the verified
// version itself; a packaged app installs only what its own updater found, its
// newest release, so its row waits until that release is the verified one.
const APP_OFFER = new Set(['available', 'downloading', 'verifying', 'installing', 'ready'])

const bare = value => String(value ?? '').trim().replace(/^v/i, '').split('+')[0]

export const sameVersion = (a, b) => bare(a) !== '' && bare(a) === bare(b)

export function showsTomatoRow(tomato, app) {
  if (!tomato?.verified || !tomato.current || sameVersion(tomato.verified, tomato.current)) return false
  if (tomato.kind === 'npm') return true
  return tomato.kind === 'app' && APP_OFFER.has(app?.phase) && sameVersion(app.version, tomato.verified)
}
