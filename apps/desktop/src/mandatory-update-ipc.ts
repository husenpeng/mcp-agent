/** Dependency-free IPC names shared with the sandboxed mandatory-update preload. */
export const MANDATORY_IPC = {
  status: 'tomato-desktop:mandatory-status', state: 'tomato-desktop:mandatory-state', action: 'tomato-desktop:mandatory-action',
} as const
