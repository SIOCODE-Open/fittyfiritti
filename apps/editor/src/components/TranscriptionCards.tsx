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
    <div className="pt-8 pb-32">
      {/* Transcription Cards - Newest First */}
      <div className="space-y-6">
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
                <div className="text-green-600 flex items-center gap-3">
                  <Icon
                    icon="mdi:translate"
                    className="w-12 h-12 animate-pulse"
                  />
                </div>
              )}
              {card.textJa && !card.isTranslating && (
                <div className="text-green-700 text-2xl pt-4 border-t border-gray-200 leading-relaxed">
                  {card.textJa}
                </div>
              )}
            </div>
          ))}

        {transcriptionCards.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Icon
                icon={isRecording ? 'mdi:microphone' : 'mdi:microphone-off'}
                className={`w-10 h-10 ${isRecording ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
