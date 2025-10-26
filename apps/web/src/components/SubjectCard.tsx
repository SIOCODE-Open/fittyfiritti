import { useEffect, useRef, useState } from 'react'
import type { Subject } from '../contexts/SubjectContext'
import { useSubject } from '../contexts/SubjectContext'
import { useTranslation } from '../contexts/TranslationContext'
import { shouldTranslate } from '../utils/languageUtils'
import { BulletPoint } from './BulletPoint'
import type { Language } from './WelcomeScreen'

export interface BulletPointItem {
  id: string
  text: string
  timestamp: number
  translation?: string
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
  const { speakerToOtherPartyService } = useTranslation()
  const { updateSubjectTranslation, subjectHistory, currentHistoryIndex } =
    useSubject()
  const [titleJa, setTitleJa] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState(false)
  const needsTranslation = shouldTranslate(speakerLanguage, otherPartyLanguage)
  const translationSavedRef = useRef(false)

  useEffect(() => {
    // Reset the saved flag when subject changes
    translationSavedRef.current = false
  }, [subject.id])

  useEffect(() => {
    const translateTitle = async () => {
      if (!subject.title || !speakerToOtherPartyService || !needsTranslation)
        return

      // Check if we already have a translation in the history
      const currentHistory = subjectHistory[currentHistoryIndex]
      if (currentHistory?.subjectTranslation) {
        // Use existing translation - no need to re-translate
        setTitleJa(currentHistory.subjectTranslation)
        setIsTranslating(false)
        return
      }

      setIsTranslating(true)
      setTitleJa('')

      try {
        const stream =
          await speakerToOtherPartyService.translateToTargetLanguageStreaming(
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
          // Update the translation in context for export - only once
          if (accumulatedText && !translationSavedRef.current) {
            translationSavedRef.current = true
            updateSubjectTranslation(accumulatedText)
          }
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
  }, [
    subject.title,
    speakerToOtherPartyService,
    needsTranslation,
    updateSubjectTranslation,
    subjectHistory,
    currentHistoryIndex,
  ])

  return (
    <div data-testid="subject-card" className="mb-6">
      {/* Subject Title */}
      <div data-testid="subject-title-section" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2
            data-testid="subject-title-text"
            className="text-3xl font-bold text-gray-800"
          >
            {subject.title}
          </h2>
          {needsTranslation && isTranslating && (
            <div
              data-testid="subject-title-translating"
              className="flex items-center gap-1 text-xs text-blue-600"
            >
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Translating...</span>
            </div>
          )}
        </div>

        {needsTranslation && titleJa && (
          <h3
            data-testid="subject-title-translated"
            className="text-3xl text-gray-800 mb-4"
          >
            {titleJa}
            {isTranslating && (
              <span className="inline-block w-2 h-8 bg-blue-600 ml-2 animate-pulse"></span>
            )}
          </h3>
        )}
      </div>

      {/* Bullet Points */}
      <div data-testid="subject-bullet-points" className="space-y-3">
        {bulletPoints.length === 0 && (
          <div
            data-testid="subject-bullet-points-placeholder"
            className="text-lg text-gray-500 italic p-4 border-2 border-dashed border-gray-200 rounded-lg text-center"
          >
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
