import { Icon } from '@iconify/react'
import { useTheme } from '../contexts/ThemeContext'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()

  // Add keyboard shortcut for theme toggle
  useKeyboardShortcut('TOGGLE_THEME', toggleTheme)

  return (
    <button
      data-testid="theme-toggle-button"
      onClick={toggleTheme}
      className="w-14 h-14 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={
        theme === 'dark'
          ? 'Switch to light mode - Keyboard shortcut: Ctrl+T'
          : 'Switch to dark mode - Keyboard shortcut: Ctrl+T'
      }
      aria-pressed={theme === 'dark'}
    >
      {theme === 'dark' ? (
        <Icon
          icon="mdi:white-balance-sunny"
          className="w-8 h-8 group-hover:scale-110 transition-transform"
          aria-hidden="true"
        />
      ) : (
        <Icon
          icon="mdi:moon-waning-crescent"
          className="w-8 h-8 group-hover:scale-110 transition-transform"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
