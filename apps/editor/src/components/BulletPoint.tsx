import { useEffect, useState } from 'react'
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
  const translationService = useTranslation()
  const [textJa, setTextJa] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState(false)
  const needsTranslation = shouldTranslate(speakerLanguage, otherPartyLanguage)

  useEffect(() => {
    const translateText = async () => {
      if (!bulletPoint.text || !translationService || !needsTranslation) return

      setIsTranslating(true)
      setTextJa('')

      try {
        const stream =
          await translationService.translateToTargetLanguageStreaming(
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
  }, [bulletPoint.text, translationService, needsTranslation])

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 text-xl leading-relaxed mb-3">
            {bulletPoint.text}
          </p>
          {needsTranslation && isTranslating && (
            <div className="mb-3 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Translating...</span>
            </div>
          )}
          {needsTranslation && textJa && (
            <p className="text-gray-800 text-xl leading-relaxed border-t border-gray-100 pt-3">
              {textJa}
              {isTranslating && (
                <span className="inline-block w-2 h-6 bg-blue-600 ml-1 animate-pulse"></span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
