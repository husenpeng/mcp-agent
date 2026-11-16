/**
 * Native prompt shown before the phone tunnel starts.
 *
 * The keep-awake checkbox defaults to checked: a Mac that idle-sleeps drops the
 * paired phone's connection, and the dialog is the only place the choice is made.
 */
import type { MessageBoxOptions } from 'electron'
import type { DesktopMessages } from './locale.ts'

/**
 * Build the start-tunnel prompt.
 * @param messages - selected Desktop dictionary.
 * @returns options for `dialog.showMessageBox`.
 */
export function tunnelStartPrompt(messages: DesktopMessages): MessageBoxOptions {
  return {
    type: 'question',
    title: messages.tunnelStartTitle,
    message: messages.tunnelStartMessage,
    detail: messages.tunnelStartDetail,
    checkboxLabel: messages.tunnelStartCheckbox,
    checkboxChecked: true,
    buttons: [messages.tunnelStartConfirm, messages.cancel],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  }
}

/**
 * Read the prompt outcome.
 * @param result - value returned by `dialog.showMessageBox`.
 * @returns the chosen keep-awake state, or undefined when the user cancelled.
 */
export function tunnelStartChoice(result: { readonly response: number; readonly checkboxChecked: boolean }): boolean | undefined {
  return result.response === 0 ? result.checkboxChecked : undefined
}
