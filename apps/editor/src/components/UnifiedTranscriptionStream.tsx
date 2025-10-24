import { Icon } from '@iconify/react'
import { SystemTranscriptionCard, TranscriptionCard } from '../types'
import { Language } from './WelcomeScreen'

interface UnifiedTranscriptionStreamProps {
  transcriptionCards: TranscriptionCard[]
  systemTranscriptionCards: SystemTranscriptionCard[]
  isRecording: boolean
  isCapturing: boolean
  speakerLanguage: Language
  otherPartyLanguage: Language
}

interface UnifiedCard {
  id: string
  type: 'microphone' | 'system'
  timestamp: number
  originalText?: string
  translatedText?: string
  isTranscribing?: boolean
  isTranslating?: boolean
  sourceCard: TranscriptionCard | SystemTranscriptionCard
}

export function UnifiedTranscriptionStream({
  transcriptionCards,
  systemTranscriptionCards,
  isRecording,
  isCapturing,
  speakerLanguage,
  otherPartyLanguage,
}: UnifiedTranscriptionStreamProps) {
  // Combine and sort cards by timestamp (newest first)
  const unifiedCards: UnifiedCard[] = [
    ...transcriptionCards.map(
      (card): UnifiedCard => ({
        id: card.id,
        type: 'microphone',
        timestamp: card.timestamp,
        originalText: card.text,
        translatedText:
          speakerLanguage !== otherPartyLanguage ? card.textJa : undefined,
        isTranscribing: card.isTranscribing,
        isTranslating:
          card.isTranslating && speakerLanguage !== otherPartyLanguage,
        sourceCard: card,
      })
    ),
    ...systemTranscriptionCards.map(
      (card): UnifiedCard => ({
        id: card.id,
        type: 'system',
        timestamp: card.timestamp,
        originalText: card.text,
        translatedText:
          speakerLanguage !== otherPartyLanguage ? card.textEn : undefined,
        isTranscribing: card.isTranscribing,
        isTranslating:
          card.isTranslating && speakerLanguage !== otherPartyLanguage,
        sourceCard: card,
      })
    ),
  ].sort((a, b) => b.timestamp - a.timestamp) // Sort newest first (bottom-to-top flow)

  const shouldShowTranslations = speakerLanguage !== otherPartyLanguage

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Conversation Stream
            </h2>
            <p className="text-sm text-gray-600">
              {shouldShowTranslations
                ? `Translating between ${speakerLanguage} and ${otherPartyLanguage}`
                : `Single language conversation in ${speakerLanguage}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">
                  Recording
                </span>
              </div>
            )}
            {isCapturing && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600 font-medium">
                  Capturing
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {unifiedCards.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">
                <Icon icon="mdi:waveform" className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to capture conversation
              </h3>
              <p className="text-gray-600 text-sm">
                Start recording or system capture to see transcriptions appear
                here
              </p>
            </div>
          </div>
        )}

        {unifiedCards.map(card => (
          <UnifiedCardItem
            key={card.id}
            card={card}
            shouldShowTranslations={shouldShowTranslations}
            speakerLanguage={speakerLanguage}
            otherPartyLanguage={otherPartyLanguage}
          />
        ))}
      </div>
    </div>
  )
}

interface UnifiedCardItemProps {
  card: UnifiedCard
  shouldShowTranslations: boolean
  speakerLanguage: Language
  otherPartyLanguage: Language
}

function UnifiedCardItem({
  card,
  shouldShowTranslations,
  speakerLanguage,
  otherPartyLanguage,
}: UnifiedCardItemProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getLanguageLabel = (type: 'microphone' | 'system') => {
    if (type === 'microphone') {
      return speakerLanguage.charAt(0).toUpperCase() + speakerLanguage.slice(1)
    } else {
      return (
        otherPartyLanguage.charAt(0).toUpperCase() + otherPartyLanguage.slice(1)
      )
    }
  }

  const getTranslationLabel = (type: 'microphone' | 'system') => {
    if (type === 'microphone') {
      return (
        otherPartyLanguage.charAt(0).toUpperCase() + otherPartyLanguage.slice(1)
      )
    } else {
      return speakerLanguage.charAt(0).toUpperCase() + speakerLanguage.slice(1)
    }
  }

  return (
    <div
      className={`rounded-xl p-6 shadow-lg border-2 ${
        card.type === 'microphone'
          ? 'bg-green-800 text-white border-green-600'
          : 'bg-blue-600 text-white border-blue-400'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon
            icon={
              card.type === 'microphone'
                ? 'mdi:microphone'
                : 'mdi:desktop-classic'
            }
            className="w-5 h-5"
          />
          <span className="text-sm font-medium">
            {card.type === 'microphone' ? 'You' : 'System Audio'}
          </span>
        </div>
        <span className="text-xs opacity-75">{formatTime(card.timestamp)}</span>
      </div>

      {/* Transcription Content */}
      {card.isTranscribing && (
        <div className="flex items-center gap-3 mb-4">
          <Icon icon="mdi:microphone" className="w-6 h-6 animate-pulse" />
          <span className="text-sm opacity-75">Transcribing...</span>
        </div>
      )}

      {card.originalText && (
        <div className="mb-4">
          {shouldShowTranslations && (
            <div className="text-xs opacity-75 mb-2 font-medium">
              {getLanguageLabel(card.type)}:
            </div>
          )}
          <div className="text-lg leading-relaxed font-medium">
            {card.originalText}
          </div>
        </div>
      )}

      {/* Translation section - only shown when languages differ */}
      {shouldShowTranslations && (
        <>
          {card.isTranslating && (
            <div className="flex items-center gap-3 pt-4 border-t border-opacity-30 border-white">
              <Icon icon="mdi:translate" className="w-6 h-6 animate-pulse" />
              <span className="text-sm opacity-75">Translating...</span>
            </div>
          )}
          {card.translatedText && !card.isTranslating && (
            <div className="pt-4 border-t border-opacity-30 border-white">
              <div className="text-xs opacity-75 mb-2 font-medium">
                {getTranslationLabel(card.type)}:
              </div>
              <div className="text-lg leading-relaxed opacity-90">
                {card.translatedText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
