import { Icon } from '@iconify/react'
import { useRef } from 'react'
import { SystemTranscriptionCard, TranscriptionCard } from '../types'
import { TranscriptionCard as TranscriptionCardComponent } from './TranscriptionCard'
import { Language } from './WelcomeScreen'

interface TranscriptionStreamProps {
  transcriptionCards: TranscriptionCard[]
  systemTranscriptionCards: SystemTranscriptionCard[]
  speakerLanguage: Language
  otherPartyLanguage: Language
  onTranscriptionComplete?: (
    cardId: string,
    text: string,
    timestamp: number
  ) => void
  onTranslationComplete?: (cardId: string, translatedText: string) => void
}

export interface TranscriptionCardData {
  id: string
  type: 'microphone' | 'system'
  timestamp: number
  audioSegment: Blob
  sourceCard: TranscriptionCard | SystemTranscriptionCard
}

interface CardData {
  cardId: string
  timestamp: number
  original: string
  translated: string
}

export function TranscriptionStream({
  transcriptionCards,
  systemTranscriptionCards,
  speakerLanguage,
  otherPartyLanguage,
  onTranscriptionComplete,
  onTranslationComplete,
}: TranscriptionStreamProps) {
  // Store transcription and translation data in order for export
  const cardDataRef = useRef<CardData[]>([])

  // Combine and sort cards by timestamp (newest first)
  const unifiedCards: TranscriptionCardData[] = [
    ...transcriptionCards.map(
      (card): TranscriptionCardData => ({
        id: card.id,
        type: 'microphone',
        timestamp: card.timestamp,
        audioSegment: card.audioSegment,
        sourceCard: card,
      })
    ),
    ...systemTranscriptionCards.map(
      (card): TranscriptionCardData => ({
        id: card.id,
        type: 'system',
        timestamp: card.timestamp,
        audioSegment: card.audioSegment,
        sourceCard: card,
      })
    ),
  ].sort((a, b) => b.timestamp - a.timestamp) // Sort newest first (bottom-to-top flow)

  const shouldShowTranslations = speakerLanguage !== otherPartyLanguage

  // Track transcription completions
  const handleTranscriptionCompleteWrapper = (
    cardId: string,
    text: string,
    timestamp: number
  ) => {
    const existingIndex = cardDataRef.current.findIndex(
      d => d.cardId === cardId
    )
    if (existingIndex >= 0) {
      const existing = cardDataRef.current[existingIndex]
      if (existing) {
        existing.original = text
      }
    } else {
      cardDataRef.current.push({
        cardId,
        timestamp,
        original: text,
        translated: '',
      })
    }
    onTranscriptionComplete?.(cardId, text, timestamp)
  }

  // Track translation completions
  const handleTranslationCompleteWrapper = (
    cardId: string,
    translatedText: string
  ) => {
    const existingIndex = cardDataRef.current.findIndex(
      d => d.cardId === cardId
    )
    if (existingIndex >= 0) {
      const existing = cardDataRef.current[existingIndex]
      if (existing) {
        existing.translated = translatedText
      }
    } else {
      // This shouldn't happen, but handle it just in case
      cardDataRef.current.push({
        cardId,
        timestamp: Date.now(),
        original: '',
        translated: translatedText,
      })
    }
    onTranslationComplete?.(cardId, translatedText)
  }

  // Export transcriptions as text file
  const handleExport = () => {
    // Sort by timestamp (oldest first for export)
    const sortedData = [...cardDataRef.current].sort(
      (a, b) => a.timestamp - b.timestamp
    )

    const content = sortedData
      .map(data => {
        if (!data.original) return null

        const lines = [data.original]
        if (shouldShowTranslations && data.translated) {
          lines.push(`  ${data.translated}`)
        }
        return lines.join('\n')
      })
      .filter(Boolean)
      .join('\n\n---\n\n')

    if (!content) {
      alert('No transcriptions to export yet!')
      return
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transcriptions-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Export Button */}
      <div className="flex justify-end p-2 border-b border-gray-200">
        <button
          onClick={handleExport}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Export transcriptions"
          aria-label="Export transcriptions"
        >
          <Icon icon="mdi:download" className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {unifiedCards.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <Icon
                icon="mdi:microphone-outline"
                className="w-16 h-16 text-gray-400 mx-auto"
              />
            </div>
          </div>
        ) : (
          unifiedCards.map(card => (
            <TranscriptionCardComponent
              key={card.id}
              card={card}
              shouldShowTranslations={shouldShowTranslations}
              onTranscriptionComplete={handleTranscriptionCompleteWrapper}
              onTranslationComplete={handleTranslationCompleteWrapper}
            />
          ))
        )}
      </div>
    </div>
  )
}
