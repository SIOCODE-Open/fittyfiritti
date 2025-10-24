import { Icon } from '@iconify/react'
import { TranscriptionCard } from '../types'

interface TranscriptionCardsProps {
  transcriptionCards: TranscriptionCard[]
  isRecording: boolean
}

export function TranscriptionCards({
  transcriptionCards,
  isRecording,
}: TranscriptionCardsProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {transcriptionCards
          .slice()
          .reverse()
          .map(card => (
            <div
              key={card.id}
              className="bg-white rounded-xl p-8 shadow-lg border border-gray-200"
            >
              {/* Transcription content */}
              {card.isTranscribing && (
                <div className="text-blue-600 flex items-center gap-3 mb-6">
                  <Icon
                    icon="mdi:microphone"
                    className="w-12 h-12 animate-pulse"
                  />
                </div>
              )}

              {card.text && (
                <div className="text-gray-900 mb-6 text-2xl leading-relaxed font-medium">
                  {card.text}
                </div>
              )}

              {/* Translation section */}
              {card.isTranslating && (
                <div className="text-green-600 flex items-center gap-3 mb-4">
                  <Icon
                    icon="mdi:translate"
                    className="w-6 h-6 animate-pulse"
                  />
                  <span className="text-lg">Translating...</span>
                </div>
              )}
              {card.textJa && (
                <div className="text-green-700 text-2xl pt-4 border-t border-gray-200 leading-relaxed">
                  {card.textJa}
                  {card.isTranslating && (
                    <span className="inline-block w-2 h-6 bg-green-600 ml-1 animate-pulse"></span>
                  )}
                </div>
              )}
            </div>
          ))}

        {transcriptionCards.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">
                <Icon
                  icon={isRecording ? 'mdi:microphone' : 'mdi:microphone-off'}
                  className={`w-12 h-12 ${isRecording ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
