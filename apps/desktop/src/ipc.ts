/** Typed preload operations exposed only by the Electron shell. */

import type { DesktopKeyboardApi, DesktopShortcutsApi } from '@tomato/client-shortcuts/protocol'
import type { IpcMainInvokeEvent } from 'electron'
import type { DesktopBrowserBridge } from '@tomato/client-ui-sidebar-browser/types'
import type { DesktopFileDrag } from '@tomato/util-file-drag'

/** IPC channel names kept private to the desktop application bundle. */
export const DESKTOP_IPC = {
  shortcutsInput: 'tomato-desktop:shortcuts-input',
  shortcutsCloseWindow: 'tomato-desktop:shortcuts-close-window',
  shortcutsGet: 'tomato-desktop:shortcuts-get',
  shortcutsEdit: 'tomato-desktop:shortcuts-edit',
  shortcutsChanged: 'tomato-desktop:shortcuts-changed',
  shortcutsRecording: 'tomato-desktop:shortcuts-recording',
  boot: 'tomato-desktop:boot',
  enterWorkspace: 'tomato-desktop:enter-workspace',
  onboardingActive: 'tomato-desktop:onboarding-active',
  onboardingApiKey: 'tomato-desktop:onboarding-api-key',
  accountOpenSignIn: 'tomato-desktop:account-open-sign-in',
  accountSignOut: 'tomato-desktop:account-sign-out',
  accountChanged: 'tomato-desktop:account-changed',
  bootFailed: 'tomato-desktop:boot-failed',
  browserAcquire: 'tomato-desktop:browser-acquire',
  browserRelease: 'tomato-desktop:browser-release',
  browserOpenRequested: 'tomato-desktop:browser-open-requested',
  directoryPick: 'tomato-desktop:directory-pick',
  fileDragPrepare: 'tomato-desktop:file-drag-prepare',
  fileDragCancel: 'tomato-desktop:file-drag-cancel',
  fileDragStart: 'tomato-desktop:file-drag-start',
  fileDragRelease: 'tomato-desktop:file-drag-release',
  deviceInfo: 'tomato-desktop:device-info',
  localeBootstrap: 'tomato-desktop:locale-bootstrap',
  localeChanged: 'tomato-desktop:locale-changed',
  updatesStatus: 'tomato-desktop:updates-status',
  updatesOpen: 'tomato-desktop:updates-open',
  updatesPresentation: 'tomato-desktop:updates-presentation',
  nativeThemeSet: 'tomato-desktop:native-theme-set',
  windowFullscreen: 'tomato-desktop:window-fullscreen',
  windowsAppearance: 'tomato-desktop:windows-appearance',
  windowsMenu: 'tomato-desktop:windows-menu',
} as const

/** Desktop release update state rendered by desktop-owned UI. */
export type DesktopUpdatePreparationFailureKind = 'stop-failed' | 'tasks-changed' | 'tasks-unavailable' | 'fullscreen-timeout'

export interface DesktopUpdateState {
  readonly phase: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'installing' | 'ready' | 'error'
  readonly version?: string
  readonly message?: string
  /** Main-owned diagnostics without subprocess output or credentials; hidden until expanded. */
  readonly technicalDetails?: string
  readonly percent?: number
  readonly failedOperation?: 'check' | 'download' | 'install'
  /** Main-owned preparation cause; UI wording is selected by the active locale. */
  readonly preparationFailure?: DesktopUpdatePreparationFailureKind
}

/** Classified failure copy selected by the Web locale without exposing raw updater diagnostics. */
export type DesktopUpdateFailureKind =
  | 'check'
  | 'check-network'
  | 'download'
  | 'download-network'
  | 'install'
  | 'install-network'
  | 'stop-failed'
  | 'tasks-changed'
  | 'tasks-unavailable'
  | 'fullscreen-timeout'

/** Semantic status content; actions open main-process confirmation dialogs only. */
export interface DesktopUpdatePresentation {
  readonly phase: DesktopUpdateState['phase']
  readonly version?: string
  readonly percent?: number
  readonly failure?: DesktopUpdateFailureKind
}

/** Native account entry points; the session id itself never crosses this bridge. */
export interface DesktopAccountApi {
  /** Open the consent-gated welcome entry for sign-in. */
  openSignIn(): Promise<void>
  /** Drop the stored session without leaving the workspace. */
  signOut(): Promise<void>
  /** @param listener - account-change recipient. @returns subscription disposer. */
  subscribe(listener: () => void): () => void
}

/** Product documents cannot supply update versions, package URLs, or installation authorization. */
export interface TomatoDesktopProductApi {
  readonly protocolVersion: 1
  /** Whether this shell is the unpackaged development launcher. */
  readonly development: boolean
  readonly account: DesktopAccountApi
  readonly browser: DesktopBrowserBridge
  readonly fileDrag: DesktopFileDrag
  readonly keyboard: DesktopKeyboardApi
  readonly shortcuts: DesktopShortcutsApi
  /**
   * Local machine description for the feedback questionnaire.
   * @returns `name=value` fields separated by `; `, with no hostname, user name, or serial number.
   */
  deviceInfo(): Promise<string>
  readonly updates: {
    status(): Promise<DesktopUpdatePresentation>
    open(): Promise<void>
    subscribe(listener: (state: DesktopUpdatePresentation) => void): () => void
  }
}

/** Scheme of Desktop-owned application documents. */
export const SCHEME = 'tomato-app'

/**
 * Reject IPC outside the allowed Desktop document origins.
 * @param event - IPC caller whose frame URL supplies the origin.
 * @param hostnames - Desktop document hosts allowed for this operation.
 */
export function assertDesktopSender(event: IpcMainInvokeEvent, hostnames: readonly string[]): void {
  const senderFrame = event.senderFrame
  if (senderFrame === null) throw new Error('tomato desktop: rejected IPC without a sender frame')
  const url = new URL(senderFrame.url)
  if (url.protocol !== `${SCHEME}:` || !hostnames.includes(url.hostname)) {
    throw new Error('tomato desktop: rejected IPC from an unowned renderer')
  }
}
