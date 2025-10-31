import { Icon } from '@iconify/react'
import {
  SoloParticipant,
  useSoloRecording,
} from '../contexts/SoloRecordingContext'
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
  onStartSoloRecording?: (participant: SoloParticipant) => void
  onSoloSubmit?: () => void
  onSoloCancel?: () => void
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
  onStartSoloRecording,
  onSoloSubmit,
  onSoloCancel,
}: RecordingControlPanelProps) {
  const {
    isSoloMode,
    soloParticipant,
    recordingDuration,
    startSoloRecording,
    cancelSoloRecording,
    submitSoloRecording,
  } = useSoloRecording()

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle clicking on user/system indicators to enter solo mode
  const handleUserIndicatorClick = () => {
    if (!isSoloMode && isRecording) {
      startSoloRecording('user')
      if (onStartSoloRecording) {
        onStartSoloRecording('user')
      }
    }
  }

  const handleSystemIndicatorClick = () => {
    if (!isSoloMode && isSystemCapturing) {
      startSoloRecording('system')
      if (onStartSoloRecording) {
        onStartSoloRecording('system')
      }
    }
  }

  // Handle solo mode buttons
  const handleSoloCancel = () => {
    if (onSoloCancel) {
      onSoloCancel()
    } else {
      cancelSoloRecording()
    }
  }

  const handleSoloSubmit = () => {
    if (onSoloSubmit) {
      onSoloSubmit()
    } else {
      submitSoloRecording()
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    TOGGLE_MIC: () => {
      if (isSoloMode) return // Ignore keyboard shortcuts in solo mode
      if (isRecording) {
        onStopRecording()
      } else {
        onStartRecording()
      }
    },
    TOGGLE_SCREEN: () => {
      if (isSoloMode) return // Ignore keyboard shortcuts in solo mode
      if (!onStartSystemCapture || !onStopSystemCapture) return
      if (isSystemCapturing) {
        onStopSystemCapture()
      } else {
        onStartSystemCapture()
      }
    },
    END_SESSION: () => {
      if (isSoloMode) return // Ignore keyboard shortcuts in solo mode
      if (onEndSession) {
        onEndSession()
      }
    },
  })

  // Solo mode UI
  if (isSoloMode && soloParticipant) {
    return (
      <div
        data-testid="recording-control-panel-solo"
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-colors duration-300"
        role="region"
        aria-label="Solo recording controls"
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side: Participant icon + recording indicator */}
            <div
              data-testid="solo-status-container"
              className="flex items-center gap-4"
              role="status"
              aria-label={`Solo recording ${soloParticipant}`}
            >
              <Icon
                data-testid="solo-participant-icon"
                icon={
                  soloParticipant === 'user'
                    ? 'mdi:account-voice'
                    : 'mdi:waveform'
                }
                className="w-8 h-8 text-blue-600"
                aria-hidden="true"
              />
              <Icon
                data-testid="solo-recording-icon"
                icon="mdi:record-circle"
                className="w-8 h-8 text-red-500 animate-pulse"
                aria-hidden="true"
              />
              <span
                data-testid="solo-duration"
                className="text-xl font-mono font-semibold text-gray-700 dark:text-gray-200"
                aria-live="polite"
              >
                {formatDuration(recordingDuration)}
              </span>
            </div>

            {/* Right side: Cancel and Submit buttons */}
            <div
              data-testid="solo-control-buttons"
              className="flex items-center gap-4"
              role="group"
              aria-label="Solo recording actions"
            >
              <button
                data-testid="solo-cancel-button"
                onClick={handleSoloCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Cancel solo recording"
                aria-label="Cancel solo recording"
              >
                <Icon icon="mdi:close" className="w-6 h-6" aria-hidden="true" />
              </button>
              <button
                data-testid="solo-submit-button"
                onClick={handleSoloSubmit}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                title="Submit solo recording"
                aria-label="Submit solo recording"
              >
                <Icon icon="mdi:check" className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal mode UI
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
                  <button
                    data-testid="user-speaking-indicator"
                    title={
                      userSpeaking
                        ? 'Speaking - Click to enter solo mode'
                        : 'Not speaking - Click to enter solo mode'
                    }
                    onClick={handleUserIndicatorClick}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    <Icon
                      icon="mdi:account-voice"
                      className={`w-7 h-7 ${userSpeaking ? 'text-blue-600' : 'text-gray-300'} hover:scale-110 transition-transform cursor-pointer`}
                      aria-hidden="true"
                    />
                  </button>
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
                  <button
                    data-testid="system-audio-indicator"
                    title={
                      hasSystemAudio
                        ? 'Audio detected - Click to enter solo mode'
                        : 'No audio - Click to enter solo mode'
                    }
                    onClick={handleSystemIndicatorClick}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    <Icon
                      icon="mdi:waveform"
                      className={`w-7 h-7 ${hasSystemAudio ? 'text-blue-600' : 'text-gray-300'} hover:scale-110 transition-transform cursor-pointer`}
                      aria-hidden="true"
                    />
                  </button>
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
