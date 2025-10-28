// Keyboard shortcuts configuration
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  description: string
  category: 'recording' | 'navigation' | 'ui' | 'export'
}

export const KEYBOARD_SHORTCUTS: Record<string, KeyboardShortcut> = {
  // Recording controls
  TOGGLE_MIC: {
    key: 'm',
    ctrlKey: true,
    description: 'Toggle microphone recording',
    category: 'recording',
  },
  TOGGLE_SCREEN: {
    key: 's',
    ctrlKey: true,
    description: 'Toggle screen sharing/system audio',
    category: 'recording',
  },
  END_SESSION: {
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    description: 'End current session',
    category: 'recording',
  },
  START_RECORDING: {
    key: 'r',
    ctrlKey: true,
    description: 'Start recording from welcome screen',
    category: 'recording',
  },

  // Navigation
  NAVIGATE_PREVIOUS: {
    key: 'ArrowLeft',
    ctrlKey: true,
    description: 'Navigate to previous subject',
    category: 'navigation',
  },
  NAVIGATE_NEXT: {
    key: 'ArrowRight',
    ctrlKey: true,
    description: 'Navigate to next subject',
    category: 'navigation',
  },
  PAUSE_PRESENTATION: {
    key: 'p',
    ctrlKey: true,
    description: 'Pause/resume presentation',
    category: 'navigation',
  },

  // UI controls
  TOGGLE_THEME: {
    key: 't',
    ctrlKey: true,
    description: 'Toggle dark/light theme',
    category: 'ui',
  },
  OPEN_HELP: {
    key: 'h',
    ctrlKey: true,
    description: 'Open help page',
    category: 'ui',
  },
  CLOSE_MODAL: {
    key: 'Escape',
    description: 'Close modal/return to previous screen',
    category: 'ui',
  },

  // Export
  EXPORT_TRANSCRIPTIONS: {
    key: 'd',
    ctrlKey: true,
    description: 'Export transcriptions',
    category: 'export',
  },
  EXPORT_PRESENTATION: {
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    description: 'Export presentation',
    category: 'export',
  },
}

// Helper function to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.metaKey) parts.push('Cmd')

  // Format key name for display
  let keyDisplay = shortcut.key
  if (shortcut.key === 'ArrowLeft') keyDisplay = '←'
  else if (shortcut.key === 'ArrowRight') keyDisplay = '→'
  else if (shortcut.key === 'ArrowUp') keyDisplay = '↑'
  else if (shortcut.key === 'ArrowDown') keyDisplay = '↓'
  else if (shortcut.key === 'Escape') keyDisplay = 'Esc'
  else keyDisplay = shortcut.key.toUpperCase()

  parts.push(keyDisplay)

  return parts.join('+')
}

// Helper function to match keyboard event against shortcut
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.ctrlKey === !!shortcut.ctrlKey &&
    !!event.shiftKey === !!shortcut.shiftKey &&
    !!event.altKey === !!shortcut.altKey &&
    !!event.metaKey === !!shortcut.metaKey
  )
}

// Get shortcuts by category
export function getShortcutsByCategory(category: string): KeyboardShortcut[] {
  return Object.values(KEYBOARD_SHORTCUTS).filter(
    shortcut => shortcut.category === category
  )
}

// Get all categories
export function getCategories(): string[] {
  const categories = new Set(
    Object.values(KEYBOARD_SHORTCUTS).map(shortcut => shortcut.category)
  )
  return Array.from(categories)
}
