import { Icon } from '@iconify/react'
import { useCallback, useEffect, useState } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import {
  useTranscriptionEvents,
  type CompletedTranscription,
} from '../contexts/TranscriptionEventsContext'
import { SubjectDetectionService } from '../services/SubjectDetectionService'
import { SubjectCard, type BulletPointItem } from './SubjectCard'
import type { Language } from './WelcomeScreen'

// Global job tracker to prevent duplicate subject analysis
const activeAnalysisJobs = new Set<string>()

interface SubjectDisplayProps {
  speakerLanguage: Language
  otherPartyLanguage: Language
}

export function SubjectDisplay({
  speakerLanguage,
  otherPartyLanguage,
}: SubjectDisplayProps) {
  const {
    currentSubject,
    changeSubject,
    subjectHistory,
    currentHistoryIndex,
    addBulletPointToHistory,
    navigateToHistory,
    canNavigatePrevious,
    canNavigateNext,
    isPresentationPaused,
    pausePresentation,
    resumePresentation,
  } = useSubject()
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

  // Sync presentation state with service
  useEffect(() => {
    subjectDetectionService.setPresentationState(isPresentationPaused)
  }, [isPresentationPaused, subjectDetectionService])

  // Sync bullet points with current history entry
  useEffect(() => {
    if (currentHistoryIndex >= 0 && subjectHistory[currentHistoryIndex]) {
      const historyItem = subjectHistory[currentHistoryIndex]
      if (historyItem) {
        setBulletPoints(historyItem.bulletPoints)
      }
    } else {
      setBulletPoints([])
    }
  }, [currentHistoryIndex, subjectHistory])

  // Handle transcription completion events with simple state updates
  const handleTranscriptionComplete = useCallback(
    async (transcription: CompletedTranscription) => {
      // Skip analysis entirely if presentation is paused - only listen for resume command
      // This is handled by the service internally, so we still need to analyze

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

        // Handle pause/resume actions
        if (result.action.action === 'pausePresentation') {
          pausePresentation()
          return
        } else if (result.action.action === 'resumePresentation') {
          resumePresentation()
          return
        } else if (result.action.action === 'noOperation') {
          // Do nothing - just ignore this transcription
          console.log('⏭️ No operation - ignoring transcription')
          return
        }

        // Only process subject changes and bullet points when presentation is running
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
          addBulletPointToHistory(bulletPoint)
        }
      } catch (error) {
        console.error('Failed to analyze transcription:', error)
      } finally {
        // Always clean up
        activeAnalysisJobs.delete(jobKey)
        setIsAnalyzing(false)
      }
    },
    [
      subjectDetectionService,
      currentSubject,
      changeSubject,
      addBulletPointToHistory,
      pausePresentation,
      resumePresentation,
    ]
  )

  // Subscribe to transcription events
  useEffect(() => {
    const unsubscribe = onTranscriptionComplete(handleTranscriptionComplete)
    return unsubscribe
  }, [onTranscriptionComplete, handleTranscriptionComplete])

  // Export all subjects as markdown
  const handleExportMarkdown = () => {
    if (subjectHistory.length === 0) {
      alert('No subjects to export yet!')
      return
    }

    const shouldShowTranslations = speakerLanguage !== otherPartyLanguage

    const content = subjectHistory
      .map(historyItem => {
        const lines: string[] = []

        // Subject title (level 1 heading)
        lines.push(`# ${historyItem.subject.title}`)
        lines.push('')

        // Subject translation (level 2 heading) if available
        if (shouldShowTranslations && historyItem.subjectTranslation) {
          lines.push(`## ${historyItem.subjectTranslation}`)
          lines.push('')
        }

        // Bullet points
        if (historyItem.bulletPoints.length > 0) {
          historyItem.bulletPoints.forEach(bp => {
            lines.push(`- ${bp.text}`)
            if (shouldShowTranslations && bp.translation) {
              lines.push(`  - ${bp.translation}`)
            }
          })
        } else {
          lines.push('_No bullet points yet_')
        }

        return lines.join('\n')
      })
      .join('\n\n---\n\n')

    // Create and download file
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subjects-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Navigation handlers
  const handlePrevious = () => {
    if (canNavigatePrevious) {
      navigateToHistory(currentHistoryIndex - 1)
    }
  }

  const handleNext = () => {
    if (canNavigateNext) {
      navigateToHistory(currentHistoryIndex + 1)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Unified Header with Status, Navigation, and Export */}
      <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
        {/* Left: Status Icon + Navigation */}
        <div className="flex items-center gap-2">
          {/* Status Icon */}
          {isPresentationPaused ? (
            <div title="Presentation Paused">
              <Icon
                icon="mdi:pause-circle"
                className="w-6 h-6 text-amber-600"
              />
            </div>
          ) : (
            <div title="Presentation Running">
              <Icon icon="mdi:play-circle" className="w-6 h-6 text-green-600" />
            </div>
          )}

          {/* Navigation Controls */}
          {currentSubject && (
            <div className="flex gap-1 ml-2">
              <button
                onClick={handlePrevious}
                disabled={!canNavigatePrevious}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous subject"
                aria-label="Previous subject"
              >
                <Icon
                  icon="mdi:chevron-left"
                  className="w-5 h-5 text-gray-600"
                />
              </button>
              <button
                onClick={handleNext}
                disabled={!canNavigateNext}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next subject"
                aria-label="Next subject"
              >
                <Icon
                  icon="mdi:chevron-right"
                  className="w-5 h-5 text-gray-600"
                />
              </button>
              <div className="flex items-center px-2 text-sm text-gray-600">
                {currentHistoryIndex + 1} / {subjectHistory.length}
              </div>
            </div>
          )}
        </div>

        {/* Right: Export Button */}
        <button
          onClick={handleExportMarkdown}
          disabled={subjectHistory.length === 0}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Export all subjects as markdown"
          aria-label="Export all subjects as markdown"
        >
          <Icon icon="mdi:download" className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Current Subject */}
        {currentSubject && (
          <SubjectCard
            subject={currentSubject}
            bulletPoints={bulletPoints}
            speakerLanguage={speakerLanguage}
            otherPartyLanguage={otherPartyLanguage}
          />
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
