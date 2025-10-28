import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { FeaturesHelpPage } from './FeaturesHelpPage'
import { KeyboardBindingsHelpPage } from './KeyboardBindingsHelpPage'
import { SetupHelpPage } from './SetupHelpPage'

interface HelpPageProps {
  onBack: () => void
  initialTab?: 'setup' | 'features' | 'keyboard'
}

export function HelpPage({ onBack, initialTab = 'setup' }: HelpPageProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'features' | 'keyboard'>(
    initialTab
  )

  // Keyboard shortcut to close help page
  useKeyboardShortcut('CLOSE_MODAL', onBack)

  return (
    <div
      data-testid="help-page"
      className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
      role="dialog"
      aria-labelledby="help-page-heading"
      aria-modal="false"
    >
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                data-testid="help-back-button"
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="Go back to main screen - Keyboard shortcut: Esc"
              >
                <Icon
                  icon="mdi:arrow-left"
                  className="w-6 h-6"
                  aria-hidden="true"
                />
                <span className="font-medium">Back</span>
              </button>
              <div
                className="h-6 w-px bg-gray-300 dark:bg-gray-600"
                aria-hidden="true"
              ></div>
              <h1
                id="help-page-heading"
                className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300"
              >
                Help Center
              </h1>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="FittyFiritti" className="w-10 h-10" />
              <span className="font-bold text-gray-900 dark:text-gray-100 text-lg transition-colors duration-300">
                FittyFiritti
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            className="flex gap-4 mt-6"
            role="tablist"
            aria-label="Help topics"
          >
            <button
              data-testid="setup-tab"
              onClick={() => setActiveTab('setup')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                activeTab === 'setup'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              role="tab"
              aria-selected={activeTab === 'setup'}
              aria-controls="setup-panel"
              id="setup-tab-button"
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:cog" className="w-5 h-5" aria-hidden="true" />
                <span>Chrome Setup</span>
              </div>
            </button>

            <button
              data-testid="features-tab"
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                activeTab === 'features'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              role="tab"
              aria-selected={activeTab === 'features'}
              aria-controls="features-panel"
              id="features-tab-button"
            >
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:information"
                  className="w-5 h-5"
                  aria-hidden="true"
                />
                <span>Features & Usage</span>
              </div>
            </button>

            <button
              data-testid="keyboard-tab"
              onClick={() => setActiveTab('keyboard')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                activeTab === 'keyboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              role="tab"
              aria-selected={activeTab === 'keyboard'}
              aria-controls="keyboard-panel"
              id="keyboard-tab-button"
            >
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:keyboard"
                  className="w-5 h-5"
                  aria-hidden="true"
                />
                <span>Keyboard Bindings</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div
            id="setup-panel"
            role="tabpanel"
            aria-labelledby="setup-tab-button"
            hidden={activeTab !== 'setup'}
          >
            {activeTab === 'setup' && <SetupHelpPage />}
          </div>
          <div
            id="features-panel"
            role="tabpanel"
            aria-labelledby="features-tab-button"
            hidden={activeTab !== 'features'}
          >
            {activeTab === 'features' && <FeaturesHelpPage />}
          </div>
          <div
            id="keyboard-panel"
            role="tabpanel"
            aria-labelledby="keyboard-tab-button"
            hidden={activeTab !== 'keyboard'}
          >
            {activeTab === 'keyboard' && <KeyboardBindingsHelpPage />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 transition-colors duration-300"
        role="contentinfo"
      >
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
          <p>
            Built with ❤️ using Chrome's Built-in AI API (Gemini Nano) •{' '}
            <a
              href="https://fittyfiritti.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              fittyfiritti.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
