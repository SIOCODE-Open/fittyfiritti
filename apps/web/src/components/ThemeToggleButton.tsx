import { Icon } from '@iconify/react'
import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      data-testid="theme-toggle-button"
      onClick={toggleTheme}
      className="w-14 h-14 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Icon
          icon="mdi:white-balance-sunny"
          className="w-8 h-8 group-hover:scale-110 transition-transform"
        />
      ) : (
        <Icon
          icon="mdi:moon-waning-crescent"
          className="w-8 h-8 group-hover:scale-110 transition-transform"
        />
      )}
    </button>
  )
}
