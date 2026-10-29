/** One-way animation handshake for the startup splash window. */

import { contextBridge, ipcRenderer } from 'electron'
import { SPLASH_IPC, type SplashApi } from './splash-api.ts'

const api: SplashApi = {
  notifyAnimationDone: () => { ipcRenderer.send(SPLASH_IPC.animationDone) },
}
contextBridge.exposeInMainWorld('tomatoSplash', api)
