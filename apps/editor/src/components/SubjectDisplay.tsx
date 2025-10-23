import { useCallback, useEffect, useRef, useState } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import {
  useTranscriptionEvents,
  type CompletedTranscription,
} from '../contexts/TranscriptionEventsContext'
import { SubjectDetectionService } from '../services/SubjectDetectionService'
import { SubjectCard, SubjectCardRef } from './SubjectCard'

export function SubjectDisplay() {
  const { currentSubject, changeSubject } = useSubject()
  const { onTranscriptionComplete } = useTranscriptionEvents()
  const subjectCardRef = useRef<SubjectCardRef>(null)
  const [subjectDetectionService] = useState(
    () => new SubjectDetectionService()
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Initialize subject detection service
  useEffect(() => {
    subjectDetectionService.initialize().catch(console.error)
    return () => subjectDetectionService.destroy()
  }, [subjectDetectionService])

  // Handle transcription completion events
  const handleTranscriptionComplete = useCallback(
    async (transcription: CompletedTranscription) => {
      setIsAnalyzing(true)

      try {
        const result = await subjectDetectionService.analyzeTranscription(
          transcription.text
        )

        if (result.action.action === 'changeSubject') {
          // Create new subject
          const newSubject = {
            id: Math.random().toString(36).substr(2, 9),
            title: result.action.title,
          }

          // If we don't have a current subject, set it directly
          if (!currentSubject) {
            changeSubject(newSubject)
          } else {
            // Tell the current subject card to change subject
            subjectCardRef.current?.changeSubject(newSubject)
          }
        } else if (result.action.action === 'addBulletPoint') {
          // If we don't have a current subject, create one first
          if (!currentSubject) {
            const bootstrapSubject = {
              id: Math.random().toString(36).substr(2, 9),
              title: 'General Discussion',
            }
            changeSubject(bootstrapSubject)
          }

          // Add bullet point to current subject card
          const bulletPoint = {
            id: Math.random().toString(36).substr(2, 9),
            text: result.action.text,
            emoji: result.action.emoji,
            timestamp: Date.now(),
          }
          subjectCardRef.current?.addBulletPoint(bulletPoint)
        }
      } catch (error) {
        console.error('Failed to analyze transcription:', error)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [subjectDetectionService, currentSubject, changeSubject]
  )

  // Subscribe to transcription events
  useEffect(() => {
    const unsubscribe = onTranscriptionComplete(handleTranscriptionComplete)
    return unsubscribe
  }, [onTranscriptionComplete, handleTranscriptionComplete])

  const handleSubjectChange = (
    newSubject: NonNullable<typeof currentSubject>
  ) => {
    changeSubject(newSubject)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isAnalyzing && (
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Analyzing transcription...</span>
          </div>
        )}

        {/* Current Subject */}
        {currentSubject && (
          <SubjectCard
            ref={subjectCardRef}
            subject={currentSubject}
            onSubjectChange={handleSubjectChange}
          />
        )}

        {/* No content state */}
        {!currentSubject && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🧠</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Subject Analysis Ready
              </h3>
              <p className="text-sm text-gray-600 max-w-xs">
                Start speaking and I'll automatically detect subject changes and
                extract key bullet points.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
