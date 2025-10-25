import { useEffect, useState } from 'react'
import type { Subject } from '../contexts/SubjectContext'
import { useTranslation } from '../contexts/TranslationContext'
import { shouldTranslate } from '../utils/languageUtils'
import { BulletPoint } from './BulletPoint'
import type { Language } from './WelcomeScreen'

export interface BulletPointItem {
  id: string
  text: string
  timestamp: number
}

interface SubjectCardProps {
  subject: Subject
  bulletPoints: BulletPointItem[]
  speakerLanguage: Language
  otherPartyLanguage: Language
}

export const SubjectCard = ({
  subject,
  bulletPoints,
  speakerLanguage,
  otherPartyLanguage,
}: SubjectCardProps) => {
  const translationService = useTranslation()
  const [titleJa, setTitleJa] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState(false)
  const needsTranslation = shouldTranslate(speakerLanguage, otherPartyLanguage)

  useEffect(() => {
    const translateTitle = async () => {
      if (!subject.title || !translationService || !needsTranslation) return

      setIsTranslating(true)
      setTitleJa('')

      try {
        const stream =
          await translationService.translateToTargetLanguageStreaming(
            subject.title
          )
        const reader = stream.getReader()
        let accumulatedText = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            accumulatedText += value
            setTitleJa(accumulatedText)
          }

          setIsTranslating(false)
        } catch (streamError) {
          console.error('Streaming subject translation failed:', streamError)
          setIsTranslating(false)
        }
      } catch (error) {
        console.error('Failed to translate subject title:', error)
        setIsTranslating(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      translateTitle()
    }, 100)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [subject.title, translationService, needsTranslation])

  return (
    <div className="mb-6">
      {/* Subject Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-3xl font-bold text-gray-800">{subject.title}</h2>
          {needsTranslation && isTranslating && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Translating...</span>
            </div>
          )}
        </div>

        {needsTranslation && titleJa && (
          <h3 className="text-3xl text-gray-800 mb-4">
            {titleJa}
            {isTranslating && (
              <span className="inline-block w-2 h-8 bg-blue-600 ml-2 animate-pulse"></span>
            )}
          </h3>
        )}
      </div>

      {/* Bullet Points */}
      <div className="space-y-3">
        {bulletPoints.length === 0 && (
          <div className="text-lg text-gray-500 italic p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
            Bullet points will appear here as you speak...
          </div>
        )}
        {bulletPoints.map(bulletPoint => (
          <BulletPoint
            key={bulletPoint.id}
            bulletPoint={bulletPoint}
            speakerLanguage={speakerLanguage}
            otherPartyLanguage={otherPartyLanguage}
          />
        ))}
      </div>
    </div>
  )
}
