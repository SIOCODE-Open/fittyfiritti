import { SystemTranscriptionCard, TranscriptionCard } from '../types'
import { UnifiedCardItem } from './UnifiedCardItem'
import { Language } from './WelcomeScreen'

interface UnifiedTranscriptionStreamProps {
  transcriptionCards: TranscriptionCard[]
  systemTranscriptionCards: SystemTranscriptionCard[]
  speakerLanguage: Language
  otherPartyLanguage: Language
}

export interface UnifiedCard {
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
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
