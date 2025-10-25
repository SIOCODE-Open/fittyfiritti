import { Icon } from '@iconify/react'
import { useEffect, useRef, useState } from 'react'
import { useSystemTranscription } from '../contexts/SystemTranscriptionContext'
import { useTranscription } from '../contexts/TranscriptionContext'
import { useTranslation } from '../contexts/TranslationContext'
import { UnifiedCard } from './UnifiedTranscriptionStream'
import { Language } from './WelcomeScreen'

interface UnifiedCardItemProps {
  card: UnifiedCard
  shouldShowTranslations: boolean
  speakerLanguage: Language
  otherPartyLanguage: Language
  onTranscriptionComplete?: (
    cardId: string,
    text: string,
    timestamp: number
  ) => void
  onTranslationComplete?: (cardId: string, translatedText: string) => void
}

export function UnifiedCardItem({
  card,
  shouldShowTranslations,
  speakerLanguage,
  otherPartyLanguage,
  onTranscriptionComplete,
  onTranslationComplete,
}: UnifiedCardItemProps) {
  const [originalText, setOriginalText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [transcriptionComplete, setTranscriptionComplete] = useState(false)

  const isTranscribingRef = useRef(false)
  const isTranslatingRef = useRef(false)

  const transcriptionService = useTranscription()
  const { speakerToOtherPartyService, otherPartyToSpeakerService } =
    useTranslation()
  const systemTranscriptionService = useSystemTranscription()

  // Transcription effect
  useEffect(() => {
    if (isTranscribingRef.current) {
      console.log('⚠️ Transcription already in progress for card:', card.id)
      return
    }

    async function runTranscription() {
      console.log('🎬 Starting transcription for card:', card.id)
      isTranscribingRef.current = true
      setIsTranscribing(true)

      const service =
        card.type === 'microphone'
          ? transcriptionService
          : systemTranscriptionService

      try {
        console.log('📝 Using streaming transcription for card:', card.id)
        const stream = await service.transcribeStreaming(card.audioSegment)
        const reader = stream.getReader()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('✅ Stream completed')
            break
          }

          console.log('📝 Received chunk:', value)
          accumulated += value
          setOriginalText(accumulated)
        }

        setIsTranscribing(false)
        setTranscriptionComplete(true)
        isTranscribingRef.current = false
        console.log('✅ Transcription complete:', accumulated)

        if (onTranscriptionComplete && accumulated.trim()) {
          onTranscriptionComplete(card.id, accumulated, card.timestamp)
        }
      } catch (error) {
        console.error('❌ Transcription failed for card:', card.id, error)
        setIsTranscribing(false)
        isTranscribingRef.current = false
      }
    }

    runTranscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Translation effect - only runs when transcription is complete
  useEffect(() => {
    if (
      !transcriptionComplete ||
      !shouldShowTranslations ||
      !originalText.trim()
    ) {
      return
    }

    if (isTranslatingRef.current) {
      console.log('⚠️ Translation already in progress for card:', card.id)
      return
    }

    async function runTranslation() {
      console.log('🌐 Starting translation for card:', card.id)
      isTranslatingRef.current = true
      setIsTranslating(true)

      try {
        // Select the correct pre-initialized translation service based on card type
        const translationService =
          card.type === 'microphone'
            ? speakerToOtherPartyService // Microphone: speaker language -> other party language
            : otherPartyToSpeakerService // System audio: other party language -> speaker language

        const direction =
          card.type === 'microphone'
            ? `${speakerLanguage} -> ${otherPartyLanguage}`
            : `${otherPartyLanguage} -> ${speakerLanguage}`

        console.log(
          `📝 Using pre-initialized translation service (${direction})`
        )

        // Use streaming translation (no need to re-initialize)
        const stream =
          await translationService.translateToTargetLanguageStreaming(
            originalText
          )
        const reader = stream.getReader()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          accumulated += value
          setTranslatedText(accumulated)
        }

        setIsTranslating(false)
        isTranslatingRef.current = false
        if (onTranslationComplete) {
          onTranslationComplete(card.id, accumulated)
        }
      } catch (error) {
        console.error('❌ Translation failed for card:', card.id, error)
        setIsTranslating(false)
        isTranslatingRef.current = false
      }
    }

    runTranslation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptionComplete])

  return (
    <div
      className={`rounded-xl p-6 shadow-lg border-2 ${
        card.type === 'microphone'
          ? 'bg-green-800 text-white border-green-600'
          : 'bg-blue-600 text-white border-blue-400'
      }`}
    >
      {/* Transcription Content */}
      {isTranscribing && !originalText && (
        <div className="flex items-center gap-3 mb-4">
          <Icon icon="mdi:microphone" className="w-6 h-6 animate-pulse" />
          <span className="text-xl opacity-75">Transcribing...</span>
        </div>
      )}

      {originalText && (
        <div className="mb-4">
          <div className="text-2xl leading-relaxed font-medium">
            {originalText}
            {isTranscribing && (
              <span className="inline-block w-2 h-8 bg-white bg-opacity-60 ml-1 animate-pulse"></span>
            )}
          </div>
        </div>
      )}

      {/* Translation section - only shown when languages differ */}
      {shouldShowTranslations && originalText && (
        <>
          {isTranslating && !translatedText && (
            <div className="flex items-center gap-3 pt-4 border-t border-opacity-30 border-white mb-2">
              <Icon icon="mdi:translate" className="w-6 h-6 animate-pulse" />
              <span className="text-xl opacity-75">Translating...</span>
            </div>
          )}
          {translatedText && (
            <div className="pt-4 border-t border-opacity-30 border-white">
              <div className="text-2xl leading-relaxed opacity-90">
                {translatedText}
                {isTranslating && (
                  <span className="inline-block w-2 h-8 bg-white bg-opacity-60 ml-1 animate-pulse"></span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
