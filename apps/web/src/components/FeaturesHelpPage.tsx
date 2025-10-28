import { Icon } from '@iconify/react'

export function FeaturesHelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
          How to Use FittyFiritti
        </h2>
        <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
          Learn about features, settings, and how to get the most out of the
          application
        </p>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:translate" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
              Language Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Configure languages for accurate transcription and translation
            </p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          {/* Your Language */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4 border border-blue-200 dark:border-blue-800 transition-colors duration-300">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 transition-colors duration-300">
              <Icon
                icon="mdi:account-voice"
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
              />
              Your Language (Speaker)
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
              Select the language you will be speaking during the meeting. This
              ensures accurate transcription of your microphone input.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              <strong>Supported languages:</strong> English, Spanish, Japanese
            </p>
          </div>

          {/* Other Party Language */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-4 border border-purple-200 dark:border-purple-800 transition-colors duration-300">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 transition-colors duration-300">
              <Icon
                icon="mdi:account-multiple"
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
              />
              Other Party Language
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
              Select the language of the other party (e.g., meeting
              participants). Your transcriptions will be automatically
              translated to this language.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              <strong>Supported languages:</strong> English, Spanish, Japanese
            </p>
          </div>
        </div>
      </div>

      {/* Presentation Modes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:presentation" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
              Presentation Modes
            </h3>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Choose how the application processes and organizes content
            </p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          {/* Transcription Only */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-4 border border-gray-200 dark:border-gray-600 transition-colors duration-300">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 transition-colors duration-300">
              <Icon
                icon="mdi:text"
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
              />
              Transcription & Translation Only
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
              No automatic presentation creation. The application focuses solely
              on transcribing and translating speech in real-time.
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">
              <strong>Best for:</strong> Simple transcription needs, language
              practice, or when you don't need structured notes
            </p>
          </div>

          {/* Local Only */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4 border border-blue-200 dark:border-blue-800 transition-colors duration-300">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 transition-colors duration-300">
              <Icon
                icon="mdi:account-voice"
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
              />
              Presentation from Your Speech
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
              Only your voice (microphone) creates presentation content. The AI
              automatically detects topics and bullet points from what you say,
              organizing them into a structured presentation.
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">
              <strong>Best for:</strong> Solo presentations, lectures, or
              meetings where you're the main speaker
            </p>
          </div>

          {/* Both Speakers */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-4 border border-green-200 dark:border-green-800 transition-colors duration-300">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 transition-colors duration-300">
              <Icon
                icon="mdi:account-multiple-outline"
                className="w-5 h-5 text-green-600 dark:text-green-400"
              />
              Presentation from Both Speakers
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
              Both you and the other party (via screen share audio) contribute
              to presentation content. The AI organizes input from all
              participants into a collaborative presentation.
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">
              <strong>Best for:</strong> Collaborative meetings, interviews, or
              discussions where all voices matter
            </p>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:feature-search" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
              Key Features
            </h3>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Powerful AI-driven capabilities at your fingertips
            </p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          <div className="space-y-3">
            {/* Real-time Transcription */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 transition-colors duration-300">
              <Icon
                icon="mdi:microphone"
                className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Real-time Transcription
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Speech is transcribed instantly using Chrome's Built-in AI
                  (Gemini Nano model). Works offline once set up.
                </p>
              </div>
            </div>

            {/* System Audio Capture */}
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800 transition-colors duration-300">
              <Icon
                icon="mdi:monitor-speaker"
                className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  System Audio Capture
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Share your screen to capture and transcribe audio from video
                  calls, meetings, or any system audio source.
                </p>
              </div>
            </div>

            {/* Translation */}
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 transition-colors duration-300">
              <Icon
                icon="mdi:translate"
                className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Bidirectional Translation
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Automatically translates transcriptions between your language
                  and the other party's language in real-time.
                </p>
              </div>
            </div>

            {/* Smart Organization */}
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800 transition-colors duration-300">
              <Icon
                icon="mdi:brain"
                className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Intelligent Subject Detection
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  AI automatically detects topic changes and organizes content
                  into hierarchical subjects with bullet points.
                </p>
              </div>
            </div>

            {/* Meeting Summary */}
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 transition-colors duration-300">
              <Icon
                icon="mdi:file-document-outline"
                className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Meeting Summary
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Get an AI-generated summary at the end of your meeting,
                  highlighting key points and action items.
                </p>
              </div>
            </div>

            {/* Export */}
            <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800 transition-colors duration-300">
              <Icon
                icon="mdi:download"
                className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Export Capabilities
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Download transcriptions, translations, and presentations in
                  Markdown format for easy sharing and archival.
                </p>
              </div>
            </div>

            {/* Diagram Editing */}
            <div className="flex items-start gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded border border-cyan-200 dark:border-cyan-800 transition-colors duration-300">
              <Icon
                icon="mdi:graph-outline"
                className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Voice-Controlled Diagram Editing
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Create and edit diagrams using voice commands. Simply say
                  "let's create a diagram" to start, then describe nodes and
                  connections naturally.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  <strong>Example commands:</strong> "Add a node called
                  Database", "Connect API to Database", "Remove the Cache node",
                  "That's it for the diagram"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
            <Icon icon="mdi:play-circle" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
              Using the Application
            </h3>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Step-by-step usage guide
            </p>
          </div>
        </div>

        <div className="ml-16 space-y-4">
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors duration-300">
                1
              </span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Configure Settings
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Select your language, the other party's language, and choose a
                  presentation mode on the welcome screen.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors duration-300">
                2
              </span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Start Microphone Recording
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Click the large microphone button to start capturing your
                  voice. Allow microphone permissions if prompted.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors duration-300">
                3
              </span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  (Optional) Share Screen for System Audio
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Click the screen share button to capture audio from video
                  calls or other system audio. Make sure to enable "Share audio"
                  in the screen share dialog.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors duration-300">
                4
              </span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Speak Naturally
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Talk normally during your meeting. The application will
                  automatically detect speech, transcribe, translate, and
                  organize content.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors duration-300">
                5
              </span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  Monitor Transcriptions
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Watch the left panel for real-time transcriptions and
                  translations. The right panel (if enabled) shows the organized
                  presentation.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors duration-300">
                6
              </span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  End Session
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
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
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 transition-colors duration-300">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center transition-colors duration-300">
            <Icon icon="mdi:shield-check" className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
              Privacy & Security
            </h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">
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
