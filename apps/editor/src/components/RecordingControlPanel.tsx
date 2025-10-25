import { Icon } from '@iconify/react'

interface RecordingControlPanelProps {
  isRecording: boolean
  isSystemCapturing?: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onStartSystemCapture?: () => void
  onStopSystemCapture?: () => void
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
                  <Icon
                    icon="mdi:account-voice"
                    className={`w-6 h-6 ${userSpeaking ? 'text-green-500' : 'text-gray-400'}`}
                  />
                </>
              ) : (
                <Icon
                  icon="mdi:microphone-off"
                  className="w-8 h-8 text-gray-400"
                />
              )}
              <span className="text-sm text-gray-600 font-medium">
                {isRecording ? 'Recording' : 'Microphone'}
              </span>
            </div>

            {/* System Audio Status */}
            <div className="flex items-center gap-2">
              {isSystemCapturing ? (
                <>
                  <Icon
                    icon="mdi:monitor-speaker"
                    className="w-8 h-8 text-purple-500 animate-pulse"
                  />
                  <Icon
                    icon="mdi:waveform"
                    className={`w-6 h-6 ${hasSystemAudio ? 'text-green-500' : 'text-gray-400'}`}
                  />
                </>
              ) : (
                <Icon
                  icon="mdi:monitor-off"
                  className="w-8 h-8 text-gray-400"
                />
              )}
              <span className="text-sm text-gray-600 font-medium">
                {isSystemCapturing ? 'Screen Audio' : 'System Audio'}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {/* Microphone Control */}
            {isRecording ? (
              <button
                onClick={onStopRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Icon icon="mdi:stop" className="w-5 h-5" />
                <span className="text-sm font-medium">Stop Mic</span>
              </button>
            ) : (
              <button
                onClick={onStartRecording}
                disabled={isInitializing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {isInitializing ? (
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon icon="mdi:microphone" className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {isInitializing ? 'Starting...' : 'Start Mic'}
                </span>
              </button>
            )}

            {/* System Audio Control */}
            {isSystemCapturing ? (
              <button
                onClick={onStopSystemCapture}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Icon icon="mdi:stop" className="w-5 h-5" />
                <span className="text-sm font-medium">Stop Screen</span>
              </button>
            ) : (
              <button
                onClick={onStartSystemCapture}
                disabled={isInitializing || !onStartSystemCapture}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Icon icon="mdi:monitor-speaker" className="w-5 h-5" />
                <span className="text-sm font-medium">Share Screen</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
