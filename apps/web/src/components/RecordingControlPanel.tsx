import { Icon } from '@iconify/react'

interface RecordingControlPanelProps {
  isRecording: boolean
  isSystemCapturing?: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onStartSystemCapture?: () => void
  onStopSystemCapture?: () => void
  onEndSession?: () => void
  isInitializing: boolean
  userSpeaking: boolean
  hasSystemAudio?: boolean
}

export function RecordingControlPanel({
  isRecording,
  isSystemCapturing = false,
  onStartRecording,
  onStopRecording,
  onStartSystemCapture,
  onStopSystemCapture,
  onEndSession,
  isInitializing,
  userSpeaking,
  hasSystemAudio = false,
}: RecordingControlPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Status Icons */}
          <div className="flex items-center gap-6">
            {/* Microphone Status */}
            <div className="flex items-center gap-2">
              {isRecording ? (
                <>
                  <Icon
                    icon="mdi:microphone"
                    className="w-8 h-8 text-red-500 animate-pulse"
                  />
                  <div title={userSpeaking ? 'Speaking' : 'Not speaking'}>
                    <Icon
                      icon="mdi:account-voice"
                      className={`w-7 h-7 ${userSpeaking ? 'text-blue-600' : 'text-gray-300'}`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Icon
                    icon="mdi:microphone-off"
                    className="w-8 h-8 text-gray-400"
                  />
                  <div title="Not speaking">
                    <Icon
                      icon="mdi:account-voice"
                      className="w-7 h-7 text-gray-300"
                    />
                  </div>
                </>
              )}
            </div>

            {/* System Audio Status */}
            <div className="flex items-center gap-2">
              {isSystemCapturing ? (
                <>
                  <Icon
                    icon="mdi:monitor-speaker"
                    className="w-8 h-8 text-purple-500 animate-pulse"
                  />
                  <div title={hasSystemAudio ? 'Audio detected' : 'No audio'}>
                    <Icon
                      icon="mdi:waveform"
                      className={`w-7 h-7 ${hasSystemAudio ? 'text-blue-600' : 'text-gray-300'}`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Icon
                    icon="mdi:monitor-off"
                    className="w-8 h-8 text-gray-400"
                  />
                  <div title="No audio">
                    <Icon
                      icon="mdi:waveform"
                      className="w-7 h-7 text-gray-300"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {/* Microphone Control */}
            {isRecording ? (
              <button
                onClick={onStopRecording}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Stop Mic"
                aria-label="Stop Mic"
              >
                <Icon icon="mdi:stop" className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={onStartRecording}
                disabled={isInitializing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title={isInitializing ? 'Starting...' : 'Start Mic'}
                aria-label={isInitializing ? 'Starting...' : 'Start Mic'}
              >
                {isInitializing ? (
                  <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
                ) : (
                  <Icon icon="mdi:microphone" className="w-6 h-6" />
                )}
              </button>
            )}

            {/* System Audio Control */}
            {isSystemCapturing ? (
              <button
                onClick={onStopSystemCapture}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Stop Screen"
                aria-label="Stop Screen"
              >
                <Icon icon="mdi:stop" className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={onStartSystemCapture}
                disabled={isInitializing || !onStartSystemCapture}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Share Screen"
                aria-label="Share Screen"
              >
                <Icon icon="mdi:monitor-speaker" className="w-6 h-6" />
              </button>
            )}

            {/* End Session */}
            <button
              onClick={onEndSession}
              disabled={!onEndSession}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              title="End Session"
              aria-label="End Session"
            >
              <Icon icon="mdi:close" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
