import { Icon } from '@iconify/react'
import { useState } from 'react'
import { FeaturesHelpPage } from './FeaturesHelpPage'
import { SetupHelpPage } from './SetupHelpPage'

interface HelpPageProps {
  onBack: () => void
  initialTab?: 'setup' | 'features'
}

export function HelpPage({ onBack, initialTab = 'setup' }: HelpPageProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'features'>(initialTab)

  return (
    <div
      data-testid="help-page"
      className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                data-testid="help-back-button"
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Icon icon="mdi:arrow-left" className="w-6 h-6" />
                <span className="font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="FittyFiritti" className="w-10 h-10" />
              <span className="font-bold text-gray-900 text-lg">
                FittyFiritti
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-6">
            <button
              data-testid="setup-tab"
              onClick={() => setActiveTab('setup')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                activeTab === 'setup'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:cog" className="w-5 h-5" />
                <span>Chrome Setup</span>
              </div>
            </button>

            <button
              data-testid="features-tab"
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                activeTab === 'features'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:information" className="w-5 h-5" />
                <span>Features & Usage</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {activeTab === 'setup' && <SetupHelpPage />}
          {activeTab === 'features' && <FeaturesHelpPage />}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>
            Built with ❤️ using Chrome's Built-in AI API (Gemini Nano) •{' '}
            <a
              href="https://fittyfiritti.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              fittyfiritti.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
