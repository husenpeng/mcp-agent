/** SenseVoice language support and input failures that leave native inference untouched. */
import { validateWave } from '@tomato/experimental-speech-to-text/wave'

/** Language hints accepted by both provider metadata and native inference. */
export const languages: readonly string[] = ['auto', 'zh', 'en', 'yue', 'ja', 'ko']

/** Whisper's multilingual hint set; the model has no Cantonese hint. */
export const whisperLanguages: readonly string[] = ['auto', 'zh', 'en', 'ja', 'ko']

/**
 * Accepted language hints for one local model family.
 * @param family - registered recognizer family.
 * @returns the hints the selected model accepts.
 */
export function familyLanguages(family: 'sensevoice' | 'whisper'): readonly string[] {
  return family === 'whisper' ? whisperLanguages : languages
}

/** A request rejected before native inference; the loaded worker remains reusable. */
export class SpeechInputError extends Error {}

/**
 * Validate a recording before touching the native recognizer.
 * @param audio - untrusted WAV request bytes.
 * @param language - requested SenseVoice language hint.
 * @param maxAudioBytes - configured worker byte limit.
 * @param accepted - hints the selected family accepts; SenseVoice when omitted.
 * @returns validated audio duration in seconds; invalid inputs throw SpeechInputError.
 */
export function validateInput(audio: Uint8Array, language: string, maxAudioBytes: number,
  accepted: readonly string[] = languages): number {
  if (!accepted.includes(language)) throw new SpeechInputError('Unsupported language')
  if (audio.byteLength > maxAudioBytes) throw new SpeechInputError('Speech audio exceeds the worker byte limit')
  try { return validateWave(audio, maxAudioBytes / 32000) }
  catch (error) { throw new SpeechInputError('Invalid speech WAV', { cause: error }) }
}
