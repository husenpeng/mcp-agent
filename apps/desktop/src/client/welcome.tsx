/** Mount the local React renderer before Electron reveals the welcome window. */
import '@tomato/client-ui-theme/src/styles/design-platform.css'
import '@tomato/client-ui-theme/src/styles/gradient-shadow-text.css'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Welcome } from './WelcomePage.tsx'
import type { WelcomeApi } from '../welcome-api.ts'

declare global {
  interface Window {
    tomatoWelcome: WelcomeApi
  }
}

const container = document.getElementById('root')
if (container === null) throw new Error('desktop welcome: missing React root')
// Published before the first paint so chrome-specific CSS applies immediately.
document.documentElement.dataset.platform = window.tomatoWelcome.platform
const root = createRoot(container)
flushSync(() => { root.render(<Welcome api={window.tomatoWelcome} />) })
window.addEventListener('pagehide', () => { root.unmount() }, { once: true })
