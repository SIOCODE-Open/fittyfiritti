import { SystemTranscriptionCard } from '../types'

interface SystemTranscriptionCardsProps {
  systemTranscriptionCards: SystemTranscriptionCard[]
  isCapturing: boolean
}

export function SystemTranscriptionCards({
  systemTranscriptionCards,
  isCapturing,
}: SystemTranscriptionCardsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              システム音声 (System Audio)
            </h2>
            <p className="text-sm text-gray-600">
              Japanese speech detected in system audio
            </p>
          </div>
          {isCapturing && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">
                Capturing
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {systemTranscriptionCards.length === 0 && !isCapturing && (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 8.464a5 5 0 000 7.072M5.636 5.636a9 9 0 000 14.142"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No System Audio Yet
              </h3>
              <p className="text-gray-600 text-sm">
                Start screen sharing with audio to capture Japanese speech from
                your system
              </p>
            </div>
          </div>
        )}

        {systemTranscriptionCards.length === 0 && isCapturing && (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Listening for Japanese speech...</p>
            </div>
          </div>
        )}

        {/* System Transcription Cards */}
        {systemTranscriptionCards.length > 0 && (
          <div className="p-6 space-y-4">
            {systemTranscriptionCards.map((card, index) => (
              <SystemTranscriptionCardItem
                key={card.id}
                card={card}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface SystemTranscriptionCardItemProps {
  card: SystemTranscriptionCard
  index: number
}

function SystemTranscriptionCardItem({
  card,
  index,
}: SystemTranscriptionCardItemProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-semibold text-purple-700">
            {index + 1}
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {formatTime(card.timestamp)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <span className="text-xs text-purple-600 font-medium">System</span>
        </div>
      </div>

      {/* Japanese Text */}
      <div className="mb-3">
        {card.isTranscribing ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500 italic">
              Transcribing Japanese audio...
            </span>
          </div>
        ) : card.text ? (
          <div>
            <div className="text-xs text-gray-500 mb-1 font-medium">
              Japanese (日本語):
            </div>
            <p className="text-gray-900 text-sm leading-relaxed font-medium">
              {card.text}
            </p>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">No speech detected</div>
        )}
      </div>

      {/* English Translation */}
      {card.text && (
        <div className="border-t border-purple-200 pt-3">
          {card.isTranslating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 italic">
                Translating to English...
              </span>
            </div>
          ) : card.textEn ? (
            <div>
              <div className="text-xs text-gray-500 mb-1 font-medium">
                English Translation:
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                {card.textEn}
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">
              Translation pending...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
