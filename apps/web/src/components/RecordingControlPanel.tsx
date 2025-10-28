import { Icon } from '@iconify/react'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcut'

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
  // Keyboard shortcuts
  useKeyboardShortcuts({
    TOGGLE_MIC: () => {
      if (isRecording) {
        onStopRecording()
      } else {
        onStartRecording()
      }
    },
    TOGGLE_SCREEN: () => {
      if (!onStartSystemCapture || !onStopSystemCapture) return
      if (isSystemCapturing) {
        onStopSystemCapture()
      } else {
        onStartSystemCapture()
      }
    },
    END_SESSION: () => {
      if (onEndSession) {
        onEndSession()
      }
    },
  })

  return (
    <div
      data-testid="recording-control-panel"
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-colors duration-300"
      role="region"
      aria-label="Recording controls"
    >
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Status Icons */}
          <div
            data-testid="status-icons-container"
            className="flex items-center gap-6"
            role="status"
            aria-label="Recording status indicators"
          >
            {/* Microphone Status */}
            <div
              data-testid="microphone-status"
              className="flex items-center gap-2"
              role="status"
              aria-label={
                isRecording
                  ? userSpeaking
                    ? 'Microphone active, currently speaking'
                    : 'Microphone active, not speaking'
                  : 'Microphone inactive'
              }
            >
              {isRecording ? (
                <>
                  <Icon
                    data-testid="microphone-icon-recording"
                    icon="mdi:microphone"
                    className="w-8 h-8 text-red-500 animate-pulse"
                    aria-hidden="true"
                  />
                  <div
                    data-testid="user-speaking-indicator"
                    title={userSpeaking ? 'Speaking' : 'Not speaking'}
                  >
                    <Icon
                      icon="mdi:account-voice"
                      className={`w-7 h-7 ${userSpeaking ? 'text-blue-600' : 'text-gray-300'}`}
                      aria-hidden="true"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Icon
                    data-testid="microphone-icon-off"
                    icon="mdi:microphone-off"
                    className="w-8 h-8 text-gray-400"
                    aria-hidden="true"
                  />
                  <div
                    data-testid="user-not-speaking-indicator"
                    title="Not speaking"
                  >
                    <Icon
                      icon="mdi:account-voice"
                      className="w-7 h-7 text-gray-300"
                      aria-hidden="true"
                    />
                  </div>
                </>
              )}
            </div>

            {/* System Audio Status */}
            <div
              data-testid="system-audio-status"
              className="flex items-center gap-2"
              role="status"
              aria-label={
                isSystemCapturing
                  ? hasSystemAudio
                    ? 'System audio active, audio detected'
                    : 'System audio active, no audio'
                  : 'System audio inactive'
              }
            >
              {isSystemCapturing ? (
                <>
                  <Icon
                    data-testid="system-audio-icon-capturing"
                    icon="mdi:monitor-speaker"
                    className="w-8 h-8 text-purple-500 animate-pulse"
                    aria-hidden="true"
                  />
                  <div
                    data-testid="system-audio-indicator"
                    title={hasSystemAudio ? 'Audio detected' : 'No audio'}
                  >
                    <Icon
                      icon="mdi:waveform"
                      className={`w-7 h-7 ${hasSystemAudio ? 'text-blue-600' : 'text-gray-300'}`}
                      aria-hidden="true"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Icon
                    data-testid="system-audio-icon-off"
                    icon="mdi:monitor-off"
                    className="w-8 h-8 text-gray-400"
                    aria-hidden="true"
                  />
                  <div data-testid="system-audio-no-indicator" title="No audio">
                    <Icon
                      icon="mdi:waveform"
                      className="w-7 h-7 text-gray-300"
                      aria-hidden="true"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div
            data-testid="control-buttons-container"
            className="flex items-center gap-4"
            role="group"
            aria-label="Recording control buttons"
          >
            {/* Microphone Control */}
            {isRecording ? (
              <button
                data-testid="stop-mic-button"
                onClick={onStopRecording}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Stop Mic"
                aria-label="Stop microphone - Keyboard shortcut: Ctrl+M"
              >
                <Icon icon="mdi:stop" className="w-6 h-6" aria-hidden="true" />
              </button>
            ) : (
              <button
                data-testid="start-mic-button"
                onClick={onStartRecording}
                disabled={isInitializing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title={isInitializing ? 'Starting...' : 'Start Mic'}
                aria-label={
                  isInitializing
                    ? 'Starting microphone, please wait'
                    : 'Start microphone - Keyboard shortcut: Ctrl+M'
                }
                aria-busy={isInitializing}
              >
                {isInitializing ? (
                  <Icon
                    data-testid="start-mic-loading-icon"
                    icon="mdi:loading"
                    className="w-6 h-6 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Icon
                    data-testid="start-mic-icon"
                    icon="mdi:microphone"
                    className="w-6 h-6"
                    aria-hidden="true"
                  />
                )}
              </button>
            )}

            {/* System Audio Control */}
            {isSystemCapturing ? (
              <button
                data-testid="stop-screen-button"
                onClick={onStopSystemCapture}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Stop Screen"
                aria-label="Stop screen sharing - Keyboard shortcut: Ctrl+S"
              >
                <Icon icon="mdi:stop" className="w-6 h-6" aria-hidden="true" />
              </button>
            ) : (
              <button
                data-testid="start-screen-button"
                onClick={onStartSystemCapture}
                disabled={isInitializing || !onStartSystemCapture}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Share Screen"
                aria-label="Start screen sharing - Keyboard shortcut: Ctrl+S"
                aria-disabled={!onStartSystemCapture}
              >
                <Icon
                  icon="mdi:monitor-speaker"
                  className="w-6 h-6"
                  aria-hidden="true"
                />
              </button>
            )}

            {/* End Session */}
            <button
              data-testid="end-session-button"
              onClick={onEndSession}
              disabled={!onEndSession}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              title="End Session"
              aria-label="End session and view summary - Keyboard shortcut: Ctrl+Shift+E"
              aria-disabled={!onEndSession}
            >
              <Icon icon="mdi:close" className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
