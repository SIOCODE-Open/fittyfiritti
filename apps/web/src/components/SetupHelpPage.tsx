import { Icon } from '@iconify/react'

export function SetupHelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Chrome Setup Guide
        </h2>
        <p className="text-gray-600">
          Follow these steps to enable Chrome's Built-in AI features
        </p>
      </div>

      {/* Prerequisites */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:information" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Prerequisites
            </h3>
            <ul className="space-y-1 text-gray-700">
              <li>• Google Chrome 128 or later</li>
              <li>
                • Chrome Canary, Dev, or Beta channel (recommended for latest AI
                features)
              </li>
              <li>• Stable internet connection for initial setup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step 1: Enable Chrome Flags */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
            1
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Enable Chrome AI Flags
            </h3>
            <p className="text-gray-600 mb-4">
              Open Chrome and navigate to{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                chrome://flags
              </code>
            </p>
          </div>
        </div>

        <div className="ml-14 space-y-4">
          {/* Prompt API */}
          <div className="bg-gray-50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:robot" className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-800">
                Prompt API for Gemini Nano
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Navigate to:{' '}
              <code className="bg-white px-2 py-1 rounded text-xs">
                chrome://flags/#prompt-api-for-gemini-nano
              </code>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Set to:</span>{' '}
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                Enabled Multilingual
              </span>
            </p>
          </div>

          {/* Prompt API for Multimodal Input */}
          <div className="bg-gray-50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:robot" className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-800">
                Prompt API for Gemini Nano Multimodal Input
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Navigate to:{' '}
              <code className="bg-white px-2 py-1 rounded text-xs">
                chrome://flags/#prompt-api-for-gemini-nano-multimodal-input
              </code>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Set to:</span>{' '}
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                Enabled Multilingual
              </span>
            </p>
          </div>

          {/* Translation API */}
          <div className="bg-gray-50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:translate" className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-800">Translation API</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Navigate to:{' '}
              <code className="bg-white px-2 py-1 rounded text-xs">
                chrome://flags/#translation-api
              </code>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Set to:</span>{' '}
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                Enabled
              </span>
            </p>
          </div>

          {/* Summarization API for Gemini Nano */}
          <div className="bg-gray-50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon
                icon="mdi:format-list-bulleted"
                className="w-5 h-5 text-orange-600"
              />
              <h4 className="font-semibold text-gray-800">Summarization API for Gemini Nano</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Navigate to:{' '}
              <code className="bg-white px-2 py-1 rounded text-xs">
                chrome://flags/#summarization-api-for-gemini-nano
              </code>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Set to:</span>{' '}
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                Enabled Multilingual
              </span>
            </p>
          </div>

          {/* Optimization Guide */}
          <div className="bg-gray-50 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:tune" className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-gray-800">
                Optimization Guide On Device Model
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Navigate to:{' '}
              <code className="bg-white px-2 py-1 rounded text-xs">
                chrome://flags/#optimization-guide-on-device-model
              </code>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Set to:</span>{' '}
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                Enabled BypassPerfRequirement
              </span>
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">⚠️ Important:</span> After
              enabling all flags, click{' '}
              <span className="font-semibold">Relaunch</span> to restart Chrome
              with the new settings.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Update Components */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
            2
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Update Chrome Components
            </h3>
            <p className="text-gray-600 mb-4">
              Navigate to{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                chrome://components
              </code>
            </p>
          </div>
        </div>

        <div className="ml-14 space-y-4">
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">1.</span>
              <span>
                Find <strong>Optimization Guide On Device Model</strong> in the
                component list
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">2.</span>
              <span>
                Click <strong>Check for update</strong> to download the latest
                AI model
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">3.</span>
              <span>
                Wait for all components to update (this may take several
                minutes)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">4.</span>
              <span>
                Verify that the component shows a recent version number
              </span>
            </li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">💡 Tip:</span> The AI model
              download is typically 1-2 GB and may take several minutes
              depending on your internet connection.
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Verify */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
            3
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Verify AI Availability
            </h3>
            <p className="text-gray-600">
              Confirm that everything is working correctly
            </p>
          </div>
        </div>

        <div className="ml-14 space-y-4">
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">1.</span>
              <span>Open the FittyFiritti application in Chrome</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">2.</span>
              <span>
                If the AI is not ready, you'll see a prompt to download the AI
                model
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">3.</span>
              <span>
                Click <strong>Download AI Model</strong> and wait for completion
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">4.</span>
              <span>
                Once ready, you'll see the welcome screen with language settings
              </span>
            </li>
          </ol>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:alert" className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Troubleshooting
            </h3>
            <div className="space-y-3 text-gray-700">
              <div>
                <p className="font-semibold text-gray-800">AI Not Available:</p>
                <p className="text-sm">
                  Ensure all Chrome flags are enabled and Chrome has been
                  restarted
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Download Failed:</p>
                <p className="text-sm">
                  Check your internet connection and try again
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  Model Not Loading:
                </p>
                <p className="text-sm">
                  Clear Chrome cache and reload the application
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  Components Not Updating:
                </p>
                <p className="text-sm">
                  Close all Chrome windows and restart Chrome completely
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
