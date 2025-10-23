import { Icon } from '@iconify/react'

interface RecordingControlPanelProps {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  isInitializing: boolean
  userSpeaking: boolean
}

export function RecordingControlPanel({
  isRecording,
  onStartRecording,
  onStopRecording,
  isInitializing,
  userSpeaking,
}: RecordingControlPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          </div>

          {isRecording ? (
            <button
              onClick={onStopRecording}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors shadow-lg hover:shadow-xl"
            >
              <Icon icon="mdi:stop" className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={onStartRecording}
              disabled={isInitializing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-4 rounded-full transition-colors shadow-lg hover:shadow-xl"
            >
              {isInitializing ? (
                <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
              ) : (
                <Icon icon="mdi:play" className="w-6 h-6" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
