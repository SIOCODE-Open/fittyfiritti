import { useEffect, useRef, useState } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import { useTranslation } from '../contexts/TranslationContext'
import { shouldTranslate } from '../utils/languageUtils'
import type { BulletPointItem } from './SubjectCard'
import type { Language } from './WelcomeScreen'

interface BulletPointProps {
  bulletPoint: BulletPointItem
  speakerLanguage: Language
  otherPartyLanguage: Language
}

export function BulletPoint({
  bulletPoint,
  speakerLanguage,
  otherPartyLanguage,
}: BulletPointProps) {
  const { speakerToOtherPartyService } = useTranslation()
  const { updateBulletPointTranslation } = useSubject()
  const [textJa, setTextJa] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState(false)
  const needsTranslation = shouldTranslate(speakerLanguage, otherPartyLanguage)
  const translationSavedRef = useRef(false)

  useEffect(() => {
    // Reset the saved flag when bullet point changes
    translationSavedRef.current = false
  }, [bulletPoint.id])

  useEffect(() => {
    const translateText = async () => {
      if (!bulletPoint.text || !speakerToOtherPartyService || !needsTranslation)
        return

      // Check if we already have a translation for this bullet point
      if (bulletPoint.translation) {
        // Use existing translation - no need to re-translate
        setTextJa(bulletPoint.translation)
        setIsTranslating(false)
        return
      }

      setIsTranslating(true)
      setTextJa('')

      try {
        const stream =
          await speakerToOtherPartyService.translateToTargetLanguageStreaming(
            bulletPoint.text
          )
        const reader = stream.getReader()
        let accumulatedText = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            accumulatedText += value
            setTextJa(accumulatedText)
          }

          setIsTranslating(false)
          // Update the translation in context for export - only once
          if (accumulatedText && !translationSavedRef.current) {
            translationSavedRef.current = true
            updateBulletPointTranslation(bulletPoint.id, accumulatedText)
          }
        } catch (streamError) {
          console.error(
            'Streaming bullet point translation failed:',
            streamError
          )
          setIsTranslating(false)
        }
      } catch (error) {
        console.error('Failed to translate bullet point text:', error)
        setIsTranslating(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      translateText()
    }, 100)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [
    bulletPoint.text,
    bulletPoint.id,
    bulletPoint.translation,
    speakerToOtherPartyService,
    needsTranslation,
    updateBulletPointTranslation,
  ])

  return (
    <div
      data-testid="bullet-point"
      className="mb-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 transition-colors duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p
            data-testid="bullet-point-text"
            className="text-gray-800 dark:text-gray-100 text-xl leading-relaxed mb-3 transition-colors duration-300"
          >
            {bulletPoint.text}
          </p>
          {needsTranslation && isTranslating && (
            <div
              data-testid="bullet-point-translating"
              className="mb-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 transition-colors duration-300"
            >
              <div className="w-3 h-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Translating...</span>
            </div>
          )}
          {needsTranslation && textJa && (
            <p
              data-testid="bullet-point-translated-text"
              className="text-gray-800 dark:text-gray-100 text-xl leading-relaxed border-t border-gray-100 dark:border-gray-600 pt-3 transition-colors duration-300"
            >
              {textJa}
              {isTranslating && (
                <span className="inline-block w-2 h-6 bg-blue-600 dark:bg-blue-400 ml-1 animate-pulse"></span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
