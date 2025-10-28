import { useEffect } from 'react'
import { KEYBOARD_SHORTCUTS, matchesShortcut } from '../utils/keyboardShortcuts'

/**
 * Hook to register a keyboard shortcut handler
 * @param shortcutKey - Key from KEYBOARD_SHORTCUTS object
 * @param handler - Function to call when shortcut is pressed
 * @param enabled - Whether the shortcut is currently enabled (default: true)
 */
export function useKeyboardShortcut(
  shortcutKey: keyof typeof KEYBOARD_SHORTCUTS,
  handler: (event: KeyboardEvent) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const shortcut = KEYBOARD_SHORTCUTS[shortcutKey]
    if (!shortcut) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault()
        handler(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcutKey, handler, enabled])
}

/**
 * Hook to register multiple keyboard shortcuts at once
 * @param shortcuts - Object mapping shortcut keys to handlers
 * @param enabled - Whether shortcuts are currently enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: Partial<
    Record<keyof typeof KEYBOARD_SHORTCUTS, (event: KeyboardEvent) => void>
  >,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const [shortcutKey, handler] of Object.entries(shortcuts)) {
        const shortcut =
          KEYBOARD_SHORTCUTS[shortcutKey as keyof typeof KEYBOARD_SHORTCUTS]
        if (shortcut && matchesShortcut(event, shortcut) && handler) {
          event.preventDefault()
          handler(event)
          break // Only handle one shortcut per keypress
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}
