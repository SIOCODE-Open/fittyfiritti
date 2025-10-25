import { Icon } from '@iconify/react'
import { UnifiedCard } from './UnifiedTranscriptionStream'
import { Language } from './WelcomeScreen'

interface UnifiedCardItemProps {
  card: UnifiedCard
  shouldShowTranslations: boolean
  speakerLanguage: Language
  otherPartyLanguage: Language
}

export function UnifiedCardItem({
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
            <div className="flex items-center gap-3 pt-4 border-t border-opacity-30 border-white mb-2">
              <Icon icon="mdi:translate" className="w-6 h-6 animate-pulse" />
            </div>
          )}
          {card.translatedText && (
            <div className="pt-4 border-t border-opacity-30 border-white">
              <div className="text-xs opacity-75 mb-2 font-medium">
                {getTranslationLabel(card.type)}:
              </div>
              <div className="text-lg leading-relaxed opacity-90">
                {card.translatedText}
                {card.isTranslating && (
                  <span className="inline-block w-2 h-6 bg-white bg-opacity-60 ml-1 animate-pulse"></span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
