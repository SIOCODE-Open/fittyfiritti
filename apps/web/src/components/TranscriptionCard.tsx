import { Icon } from '@iconify/react'
import { useEffect, useRef, useState } from 'react'
import { useFormalization } from '../contexts/FormalizationContext'
import { useTranscription } from '../contexts/TranscriptionContext'
import { useTranslation } from '../contexts/TranslationContext'
import { TranscriptionCardData } from './TranscriptionStream'

interface TranscriptionCardProps {
  card: TranscriptionCardData
  shouldShowTranslations: boolean
  formalizationEnabled?: boolean
  onTranscriptionComplete?: (
    cardId: string,
    text: string,
    timestamp: number
  ) => void
  onTranslationComplete?: (cardId: string, translatedText: string) => void
  onTranscriptionEmpty?: (cardId: string) => void
}

export function TranscriptionCard({
  card,
  shouldShowTranslations,
  formalizationEnabled = false,
  onTranscriptionComplete,
  onTranslationComplete,
  onTranscriptionEmpty,
}: TranscriptionCardProps) {
  const [originalText, setOriginalText] = useState('')
  const [formalizedText, setFormalizedText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isFormalizing, setIsFormalizing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [transcriptionComplete, setTranscriptionComplete] = useState(false)

  const isTranscribingRef = useRef(false)
  const isFormalizingRef = useRef(false)
  const isTranslatingRef = useRef(false)

  const transcriptionService = useTranscription()
  const { rewriterService } = useFormalization()
  const { speakerToOtherPartyService, otherPartyToSpeakerService } =
    useTranslation()

  // Transcription effect
  useEffect(() => {
    if (isTranscribingRef.current) {
      return
    }

    async function runTranscription() {
      isTranscribingRef.current = true
      setIsTranscribing(true)

      try {
        const stream = await transcriptionService.transcribeStreaming(
          card.audioSegment
        )
        const reader = stream.getReader()
        let accumulated = ''

        // When formalization is enabled, don't show the streaming text
        // Only show it when formalization is disabled
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          accumulated += value

          // Only show streaming text if formalization is disabled
          if (!formalizationEnabled) {
            setOriginalText(accumulated)
          }
        }

        setIsTranscribing(false)

        // If we have text, proceed to formalization or mark as complete
        if (accumulated.trim()) {
          // Store original text always
          setOriginalText(accumulated)

          // If formalization is enabled, start the formalization process
          if (formalizationEnabled) {
            runFormalization(accumulated)
          } else {
            // No formalization, mark transcription complete
            setTranscriptionComplete(true)
            isTranscribingRef.current = false
            if (onTranscriptionComplete) {
              onTranscriptionComplete(card.id, accumulated, card.timestamp)
            }
          }
        } else {
          // Notify parent that transcription is empty so card can be removed
          isTranscribingRef.current = false
          if (onTranscriptionEmpty) {
            onTranscriptionEmpty(card.id)
          }
        }
      } catch (error) {
        console.error('❌ Transcription failed for card:', card.id, error)
        setIsTranscribing(false)
        isTranscribingRef.current = false
        // Notify parent to remove card on error
        if (onTranscriptionEmpty) {
          onTranscriptionEmpty(card.id)
        }
      }
    }

    // Formalization function
    async function runFormalization(text: string) {
      if (isFormalizingRef.current) {
        return
      }

      isFormalizingRef.current = true
      setIsFormalizing(true)

      try {
        const stream = await rewriterService.rewriteStreaming(text)
        const reader = stream.getReader()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          accumulated += value
          setFormalizedText(accumulated)
        }

        setIsFormalizing(false)
        setTranscriptionComplete(true)
        isTranscribingRef.current = false
        isFormalizingRef.current = false

        // Use the formalized text for callbacks and translation
        if (onTranscriptionComplete) {
          onTranscriptionComplete(card.id, accumulated, card.timestamp)
        }
      } catch (error) {
        console.error('❌ Formalization failed for card:', card.id, error)
        setIsFormalizing(false)
        isFormalizingRef.current = false

        // Fall back to original text if formalization fails
        setTranscriptionComplete(true)
        isTranscribingRef.current = false
        if (onTranscriptionComplete) {
          onTranscriptionComplete(card.id, text, card.timestamp)
        }
      }
    }

    runTranscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Translation effect - only runs when transcription/formalization is complete
  useEffect(() => {
    if (
      !transcriptionComplete ||
      !shouldShowTranslations ||
      (!originalText.trim() && !formalizedText.trim())
    ) {
      return
    }

    if (isTranslatingRef.current) {
      return
    }

    async function runTranslation() {
      isTranslatingRef.current = true
      setIsTranslating(true)

      try {
        // Use formalized text if available, otherwise use original
        const textToTranslate = formalizedText || originalText

        // Select the correct pre-initialized translation service based on card type
        const translationService =
          card.type === 'microphone'
            ? speakerToOtherPartyService // Microphone: speaker language -> other party language
            : otherPartyToSpeakerService // System audio: other party language -> speaker language

        // Use streaming translation (no need to re-initialize)
        const stream =
          await translationService.translateToTargetLanguageStreaming(
            textToTranslate
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
  }, [transcriptionComplete, formalizedText, originalText])

  return (
    <div
      data-testid={`transcription-card-${card.type}`}
      className={`rounded-xl p-6 shadow-lg border-2 transition-colors duration-300 ${
        card.type === 'microphone'
          ? 'bg-green-800 dark:bg-green-900 text-white border-green-600 dark:border-green-700'
          : 'bg-blue-600 dark:bg-blue-700 text-white border-blue-400 dark:border-blue-500'
      }`}
      role="article"
      aria-label={
        card.type === 'microphone'
          ? 'Microphone transcription'
          : 'System audio transcription'
      }
    >
      {/* Transcription/Formalization Content */}
      {isTranscribing && !formalizedText && !originalText && (
        <div
          data-testid="transcription-loading"
          className="flex items-center gap-3 mb-4"
          role="status"
          aria-live="polite"
          aria-label="Transcribing audio"
        >
          <Icon
            icon="mdi:microphone"
            className="w-6 h-6 animate-pulse"
            aria-hidden="true"
          />
          <span className="text-xl opacity-75">Transcribing...</span>
        </div>
      )}

      {/* Show formalization in progress when enabled */}
      {formalizationEnabled &&
        isFormalizing &&
        !formalizedText &&
        originalText && (
          <div
            data-testid="formalization-loading"
            className="flex items-center gap-3 mb-4"
            role="status"
            aria-live="polite"
            aria-label="Formalizing transcription"
          >
            <Icon
              icon="mdi:pencil-box-outline"
              className="w-6 h-6 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-xl opacity-75">Formalizing...</span>
          </div>
        )}

      {/* Display formalized text if available, otherwise original text */}
      {(formalizedText || (!formalizationEnabled && originalText)) && (
        <div data-testid="transcription-text-container" className="mb-4">
          <div
            data-testid="transcription-original-text"
            className="text-2xl leading-relaxed font-medium"
          >
            {formalizedText || originalText}
            {(isFormalizing || isTranscribing) && (
              <span className="inline-block w-2 h-8 bg-white bg-opacity-60 ml-1 animate-pulse"></span>
            )}
          </div>
        </div>
      )}

      {/* Translation section - only shown when languages differ */}
      {shouldShowTranslations && (formalizedText || originalText) && (
        <>
          {isTranslating && !translatedText && (
            <div
              data-testid="translation-loading"
              className="flex items-center gap-3 pt-4 border-t border-opacity-30 border-white mb-2"
              role="status"
              aria-live="polite"
              aria-label="Translating text"
            >
              <Icon
                icon="mdi:translate"
                className="w-6 h-6 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-xl opacity-75">Translating...</span>
            </div>
          )}
          {translatedText && (
            <div
              data-testid="translation-text-container"
              className="pt-4 border-t border-opacity-30 border-white"
            >
              <div
                data-testid="transcription-translated-text"
                className="text-2xl leading-relaxed opacity-90"
              >
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
