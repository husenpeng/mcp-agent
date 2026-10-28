import type { SignInAttemptId } from '@deepseek-ai/dsh-deepseek-account/types'
/** Localized welcome copy and write-only credential actions. */

import { contextBridge, ipcRenderer } from 'electron'
import { resolveDesktopLocale } from './locale.ts'
import {
  WELCOME_IPC, type WelcomeAccountView, type WelcomeApi, type WelcomeLegalDocument, type WelcomeNotice,
  type WelcomeSaveResult,
} from './welcome-api.ts'

const prefix = '--dsh-welcome-locale='
const locale = process.argv.find(argument => argument.startsWith(prefix))?.slice(prefix.length)
if (locale === undefined) throw new Error('desktop welcome: missing window locale')
// The preload runs before the document element exists; the renderer marks
// `<html data-platform>` from this field before its first paint so
// chrome-specific CSS (traffic-light clearance) applies without a flash.
const api: WelcomeApi = {
  ...resolveDesktopLocale(locale),
  platform: process.platform,
  analytics: async (eventName, attributes) => {
    if (await api.analyticsEnabled()) await ipcRenderer.invoke(WELCOME_IPC.analytics, eventName, attributes)
  },
  analyticsEnabled: () => ipcRenderer.invoke(WELCOME_IPC.analyticsEnabled) as Promise<boolean>,
  takeNotice: () => ipcRenderer.invoke(WELCOME_IPC.takeNotice) as Promise<WelcomeNotice | undefined>,
  startSignIn: () => ipcRenderer.invoke(WELCOME_IPC.start) as Promise<WelcomeAccountView>,
  cancelSignIn: (id: SignInAttemptId) => ipcRenderer.invoke(WELCOME_IPC.cancel, id) as Promise<WelcomeAccountView>,
  copySignInLink: (id: SignInAttemptId) => ipcRenderer.invoke(WELCOME_IPC.copyLink, id) as Promise<void>,
  openLegal: (document: WelcomeLegalDocument) => ipcRenderer.invoke(WELCOME_IPC.openLegal, document) as Promise<void>,
  onAccountState: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, state: WelcomeAccountView): void =>{  listener(state) }
    ipcRenderer.on(WELCOME_IPC.state, receive)
    return () => { ipcRenderer.removeListener(WELCOME_IPC.state, receive) }
  },
  saveApiKey: (value: string) => ipcRenderer.invoke(WELCOME_IPC.saveApiKey, value) as Promise<WelcomeSaveResult>,
  skip: () => ipcRenderer.invoke(WELCOME_IPC.skip) as Promise<void>,
}
contextBridge.exposeInMainWorld('tomatoWelcome', api)
