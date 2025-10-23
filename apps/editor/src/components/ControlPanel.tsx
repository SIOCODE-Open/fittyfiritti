import React from 'react'

interface VADStatus {
  listening: boolean
  userSpeaking: boolean
  loading: boolean
  errored: string | false
}

interface ControlPanelProps {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  isInitializing: boolean
  vadStatus?: VADStatus
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  isInitializing,
  vadStatus,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            AI Transcription & Notes
          </h2>
          <p className="text-sm text-gray-600">
            {isRecording
              ? 'Listening for speech. The system will automatically detect when you start and stop speaking.'
              : 'Start recording to begin transcribing your speech automatically'}
          </p>
          {/* VAD Status Indicators */}
          {vadStatus && isRecording && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    vadStatus.listening
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                ></div>
                <span className="text-xs text-gray-600">
                  {vadStatus.listening ? 'Listening' : 'Not listening'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    vadStatus.userSpeaking
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                ></div>
                <span className="text-xs text-gray-600">
                  {vadStatus.userSpeaking ? 'Speaking detected' : 'No speech'}
                </span>
              </div>
              {vadStatus.errored && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-red-600">VAD Error</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              disabled={
                isInitializing || (vadStatus?.loading && vadStatus.loading)
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {isInitializing || (vadStatus?.loading && vadStatus.loading) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span>Start Recording</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              <span>Stop Recording</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
