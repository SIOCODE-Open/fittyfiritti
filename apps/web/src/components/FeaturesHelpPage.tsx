import { Icon } from '@iconify/react'

export function FeaturesHelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          How to Use FittyFiritti
        </h2>
        <p className="text-gray-600">
          Learn about features, settings, and how to get the most out of the
          application
        </p>
      </div>

      {/* Language Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:translate" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Language Settings
            </h3>
            <p className="text-gray-600">
              Configure languages for accurate transcription and translation
            </p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          {/* Your Language */}
          <div className="bg-blue-50 rounded p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon
                icon="mdi:account-voice"
                className="w-5 h-5 text-blue-600"
              />
              Your Language (Speaker)
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Select the language you will be speaking during the meeting. This
              ensures accurate transcription of your microphone input.
            </p>
            <p className="text-sm text-gray-600">
              <strong>Supported languages:</strong> English, Spanish, Japanese
            </p>
          </div>

          {/* Other Party Language */}
          <div className="bg-purple-50 rounded p-4 border border-purple-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon
                icon="mdi:account-multiple"
                className="w-5 h-5 text-purple-600"
              />
              Other Party Language
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Select the language of the other party (e.g., meeting
              participants). Your transcriptions will be automatically
              translated to this language.
            </p>
            <p className="text-sm text-gray-600">
              <strong>Supported languages:</strong> English, Spanish, Japanese
            </p>
          </div>
        </div>
      </div>

      {/* Presentation Modes */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:presentation" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Presentation Modes
            </h3>
            <p className="text-gray-600">
              Choose how the application processes and organizes content
            </p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          {/* Transcription Only */}
          <div className="bg-gray-50 rounded p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon icon="mdi:text" className="w-5 h-5 text-gray-600" />
              Transcription & Translation Only
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              No automatic presentation creation. The application focuses solely
              on transcribing and translating speech in real-time.
            </p>
            <p className="text-sm font-medium text-gray-600">
              <strong>Best for:</strong> Simple transcription needs, language
              practice, or when you don't need structured notes
            </p>
          </div>

          {/* Local Only */}
          <div className="bg-blue-50 rounded p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon
                icon="mdi:account-voice"
                className="w-5 h-5 text-blue-600"
              />
              Presentation from Your Speech
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Only your voice (microphone) creates presentation content. The AI
              automatically detects topics and bullet points from what you say,
              organizing them into a structured presentation.
            </p>
            <p className="text-sm font-medium text-gray-600">
              <strong>Best for:</strong> Solo presentations, lectures, or
              meetings where you're the main speaker
            </p>
          </div>

          {/* Both Speakers */}
          <div className="bg-green-50 rounded p-4 border border-green-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon
                icon="mdi:account-multiple-outline"
                className="w-5 h-5 text-green-600"
              />
              Presentation from Both Speakers
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Both you and the other party (via screen share audio) contribute
              to presentation content. The AI organizes input from all
              participants into a collaborative presentation.
            </p>
            <p className="text-sm font-medium text-gray-600">
              <strong>Best for:</strong> Collaborative meetings, interviews, or
              discussions where all voices matter
            </p>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:feature-search" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Key Features
            </h3>
            <p className="text-gray-600">
              Powerful AI-driven capabilities at your fingertips
            </p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          <div className="space-y-3">
            {/* Real-time Transcription */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
              <Icon
                icon="mdi:microphone"
                className="w-6 h-6 text-blue-600 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800">
                  Real-time Transcription
                </h4>
                <p className="text-sm text-gray-700">
                  Speech is transcribed instantly using Chrome's Built-in AI
                  (Gemini Nano model). Works offline once set up.
                </p>
              </div>
            </div>

            {/* System Audio Capture */}
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded">
              <Icon
                icon="mdi:monitor-speaker"
                className="w-6 h-6 text-purple-600 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800">
                  System Audio Capture
                </h4>
                <p className="text-sm text-gray-700">
                  Share your screen to capture and transcribe audio from video
                  calls, meetings, or any system audio source.
                </p>
              </div>
            </div>

            {/* Translation */}
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded">
              <Icon
                icon="mdi:translate"
                className="w-6 h-6 text-green-600 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800">
                  Bidirectional Translation
                </h4>
                <p className="text-sm text-gray-700">
                  Automatically translates transcriptions between your language
                  and the other party's language in real-time.
                </p>
              </div>
            </div>

            {/* Smart Organization */}
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded">
              <Icon
                icon="mdi:brain"
                className="w-6 h-6 text-orange-600 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800">
                  Intelligent Subject Detection
                </h4>
                <p className="text-sm text-gray-700">
                  AI automatically detects topic changes and organizes content
                  into hierarchical subjects with bullet points.
                </p>
              </div>
            </div>

            {/* Meeting Summary */}
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded">
              <Icon
                icon="mdi:file-document-outline"
                className="w-6 h-6 text-red-600 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800">Meeting Summary</h4>
                <p className="text-sm text-gray-700">
                  Get an AI-generated summary at the end of your meeting,
                  highlighting key points and action items.
                </p>
              </div>
            </div>

            {/* Export */}
            <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded">
              <Icon
                icon="mdi:download"
                className="w-6 h-6 text-indigo-600 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800">
                  Export Capabilities
                </h4>
                <p className="text-sm text-gray-700">
                  Download transcriptions, translations, and presentations in
                  Markdown format for easy sharing and archival.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:play-circle" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Using the Application
            </h3>
            <p className="text-gray-600">Step-by-step usage guide</p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </span>
              <div>
                <p className="font-semibold text-gray-800">
                  Configure Settings
                </p>
                <p className="text-sm text-gray-700">
                  Select your language, the other party's language, and choose a
                  presentation mode on the welcome screen.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </span>
              <div>
                <p className="font-semibold text-gray-800">
                  Start Microphone Recording
                </p>
                <p className="text-sm text-gray-700">
                  Click the large microphone button to start capturing your
                  voice. Allow microphone permissions if prompted.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </span>
              <div>
                <p className="font-semibold text-gray-800">
                  (Optional) Share Screen for System Audio
                </p>
                <p className="text-sm text-gray-700">
                  Click the screen share button to capture audio from video
                  calls or other system audio. Make sure to enable "Share audio"
                  in the screen share dialog.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                4
              </span>
              <div>
                <p className="font-semibold text-gray-800">Speak Naturally</p>
                <p className="text-sm text-gray-700">
                  Talk normally during your meeting. The application will
                  automatically detect speech, transcribe, translate, and
                  organize content.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                5
              </span>
              <div>
                <p className="font-semibold text-gray-800">
                  Monitor Transcriptions
                </p>
                <p className="text-sm text-gray-700">
                  Watch the left panel for real-time transcriptions and
                  translations. The right panel (if enabled) shows the organized
                  presentation.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                6
              </span>
              <div>
                <p className="font-semibold text-gray-800">End Session</p>
                <p className="text-sm text-gray-700">
                  Click the red "X" button to end the session. You'll see a
                  meeting summary and options to download transcriptions,
                  translations, and presentations.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:shield-check" className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Privacy & Security
            </h3>
            <div className="space-y-2 text-gray-700 text-sm">
              <p>
                ✅ <strong>100% Local Processing:</strong> All AI processing
                happens on your device
              </p>
              <p>
                ✅ <strong>No Data Transmission:</strong> Your voice and meeting
                content never leave your computer
              </p>
              <p>
                ✅ <strong>No Subscriptions:</strong> Completely free with no
                hidden costs
              </p>
              <p>
                ✅ <strong>Offline Capable:</strong> Works without an internet
                connection once set up
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
