import type { Language } from '../components/WelcomeScreen'

/**
 * Checks if translation should be applied based on speaker and other party languages.
 * Translation should only occur when the languages are different.
 */
export function shouldTranslate(
  speakerLanguage: Language,
  otherPartyLanguage: Language
): boolean {
  return speakerLanguage !== otherPartyLanguage
}
