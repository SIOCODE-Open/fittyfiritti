import { Icon } from '@iconify/react'

interface WelcomeScreenProps {
  onStartRecording: () => void
  isInitializing: boolean
}

export function WelcomeScreen({
  onStartRecording,
  isInitializing,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">DiAI</h1>
        <p className="text-xl text-gray-600">
          Real-time AI Transcription & Note-Taking
        </p>
      </div>

      <button
        onClick={onStartRecording}
        disabled={isInitializing}
        className="w-32 h-32 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center group"
      >
        {isInitializing ? (
          <Icon icon="mdi:loading" className="w-12 h-12 animate-spin" />
        ) : (
          <Icon
            icon="mdi:microphone"
            className="w-16 h-16 group-hover:scale-110 transition-transform"
          />
        )}
      </button>
    </div>
  )
}
