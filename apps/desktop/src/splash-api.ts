/** One-way completion report from the startup splash document to the shell. */

/** IPC channel names kept private to the desktop application bundle. */
export const SPLASH_IPC = {
  animationDone: 'tomato-desktop:splash-animation-done',
} as const

/** Operations exposed to the startup splash document through its preload bridge. */
export interface SplashApi {
  /** Report that the launch animation reached its final frame, naturally or by skip. Idempotent in the renderer. */
  notifyAnimationDone(): void
}
