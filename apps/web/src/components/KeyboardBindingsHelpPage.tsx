import { Icon } from '@iconify/react'
import {
  formatShortcut,
  getCategories,
  getShortcutsByCategory,
  KEYBOARD_SHORTCUTS,
} from '../utils/keyboardShortcuts'

const CATEGORY_ICONS: Record<string, string> = {
  recording: 'mdi:record-circle',
  navigation: 'mdi:navigation',
  ui: 'mdi:palette',
  export: 'mdi:download',
}

const CATEGORY_LABELS: Record<string, string> = {
  recording: 'Recording Controls',
  navigation: 'Navigation',
  ui: 'User Interface',
  export: 'Export',
}

export function KeyboardBindingsHelpPage() {
  const categories = getCategories()

  return (
    <div
      data-testid="keyboard-bindings-help"
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300"
      role="region"
      aria-label="Keyboard shortcuts reference"
    >
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
          Keyboard Shortcuts
        </h2>
        <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
          Use these keyboard shortcuts to navigate and control FittyFiritti more
          efficiently.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map(category => {
          const shortcuts = getShortcutsByCategory(category)
          const icon = CATEGORY_ICONS[category] || 'mdi:keyboard'
          const label =
            CATEGORY_LABELS[category] ||
            category.charAt(0).toUpperCase() + category.slice(1)

          return (
            <div
              key={category}
              data-testid={`keyboard-category-${category}`}
              className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 transition-colors duration-300"
              role="group"
              aria-labelledby={`category-${category}-heading`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon
                  icon={icon}
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                <h3
                  id={`category-${category}-heading`}
                  className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300"
                >
                  {label}
                </h3>
              </div>

              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => {
                  const shortcutKey = Object.keys(KEYBOARD_SHORTCUTS).find(
                    key => KEYBOARD_SHORTCUTS[key] === shortcut
                  )
                  const formattedShortcut = formatShortcut(shortcut)

                  return (
                    <div
                      key={`${category}-${index}`}
                      data-testid={`keyboard-shortcut-${shortcutKey}`}
                      className="flex items-center justify-between py-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-300"
                      role="row"
                    >
                      <span
                        className="text-gray-700 dark:text-gray-300 transition-colors duration-300"
                        role="cell"
                      >
                        {shortcut.description}
                      </span>
                      <kbd
                        className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm font-mono text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300"
                        role="cell"
                        aria-label={`Keyboard shortcut: ${formattedShortcut}`}
                      >
                        {formattedShortcut}
                      </kbd>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Tips */}
      <div
        className="mt-8 p-6 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-300"
        role="note"
        aria-label="Keyboard shortcuts tips"
      >
        <div className="flex items-start gap-3">
          <Icon
            icon="mdi:information"
            className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 transition-colors duration-300">
              Tips for Using Keyboard Shortcuts
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200 transition-colors duration-300">
              <li>
                • Keyboard shortcuts work globally throughout the application
              </li>
              <li>
                • Some shortcuts may be disabled depending on the current screen
              </li>
              <li>
                • Press{' '}
                <kbd className="px-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">
                  Ctrl+H
                </kbd>{' '}
                anytime to return to this help page
              </li>
              <li>
                • Press{' '}
                <kbd className="px-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">
                  Esc
                </kbd>{' '}
                to close dialogs and return to the main screen
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
