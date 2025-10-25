import { Icon } from '@iconify/react'
import { useCallback, useEffect, useState } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import {
  useTranscriptionEvents,
  type CompletedTranscription,
} from '../contexts/TranscriptionEventsContext'
import { SubjectDetectionService } from '../services/SubjectDetectionService'
import { SubjectCard, type BulletPointItem } from './SubjectCard'

// Global job tracker to prevent duplicate subject analysis
const activeAnalysisJobs = new Set<string>()

export function SubjectDisplay() {
  const { currentSubject, changeSubject } = useSubject()
  const { onTranscriptionComplete } = useTranscriptionEvents()
  const [subjectDetectionService] = useState(
    () => new SubjectDetectionService()
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [bulletPoints, setBulletPoints] = useState<BulletPointItem[]>([])

  // Initialize subject detection service
  useEffect(() => {
    subjectDetectionService.initialize().catch(console.error)
    return () => subjectDetectionService.destroy()
  }, [subjectDetectionService])

  // Clear bullet points when subject changes
  useEffect(() => {
    setBulletPoints([])
  }, [currentSubject?.id])

  // Handle transcription completion events with simple state updates
  const handleTranscriptionComplete = useCallback(
    async (transcription: CompletedTranscription) => {
      // Create a unique job key for this transcription
      const jobKey = `analysis-${transcription.id}-${transcription.text.substring(0, 50)}`

      // Check if this analysis is already in progress
      if (activeAnalysisJobs.has(jobKey)) {
        console.log('⏭️ Skipping duplicate subject analysis job:', jobKey)
        return
      }

      // Mark job as active
      activeAnalysisJobs.add(jobKey)
      setIsAnalyzing(true)

      try {
        // Pass whether we have a current subject to optimize the analysis
        const result = await subjectDetectionService.analyzeTranscription(
          transcription.text,
          !!currentSubject
        )

        if (result.action.action === 'changeSubject') {
          // Create new subject - this will automatically clear bullet points via useEffect
          const newSubject = {
            id: Math.random().toString(36).substr(2, 9),
            title: result.action.title,
          }
          changeSubject(newSubject)
        } else if (result.action.action === 'addBulletPoint') {
          // If we don't have a current subject, create one first
          if (!currentSubject) {
            const bootstrapTitle =
              await subjectDetectionService.generateBootstrapTitle(
                transcription.text
              )

            const bootstrapSubject = {
              id: Math.random().toString(36).substr(2, 9),
              title: bootstrapTitle,
            }
            changeSubject(bootstrapSubject)
          }

          // Add bullet point directly to state
          const bulletPoint: BulletPointItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: result.action.text,
            timestamp: Date.now(),
          }
          setBulletPoints(prev => [...prev, bulletPoint])
        }
      } catch (error) {
        console.error('Failed to analyze transcription:', error)
      } finally {
        // Always clean up
        activeAnalysisJobs.delete(jobKey)
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

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Current Subject */}
        {currentSubject && (
          <SubjectCard subject={currentSubject} bulletPoints={bulletPoints} />
        )}

        {isAnalyzing && (
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* No content state */}
        {!currentSubject && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">
                <Icon icon="mdi:brain" className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
