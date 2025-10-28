import { Icon } from '@iconify/react'
import { useCallback, useEffect, useState } from 'react'
import { useSubject } from '../contexts/SubjectContext'
import {
  useTranscriptionEvents,
  type CompletedTranscription,
} from '../contexts/TranscriptionEventsContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcut'
import { SubjectDetectionService } from '../services/SubjectDetectionService'
import type { DiagramData } from '../types'
import { Diagram } from './Diagram'
import { SubjectCard, type BulletPointItem } from './SubjectCard'
import type { Language } from './WelcomeScreen'

// Global job tracker to prevent duplicate subject analysis
const activeAnalysisJobs = new Set<string>()

interface SubjectDisplayProps {
  speakerLanguage: Language
  otherPartyLanguage: Language
  diagramModeEnabled: boolean
}

export function SubjectDisplay({
  speakerLanguage,
  otherPartyLanguage,
  diagramModeEnabled,
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
    updateDiagramData,
    isInDiagramMode,
    exitDiagramEditingMode,
  } = useSubject()
  const { onTranscriptionComplete } = useTranscriptionEvents()
  const { speakerToOtherPartyService } = useTranslation()
  const [subjectDetectionService] = useState(
    () => new SubjectDetectionService()
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [bulletPoints, setBulletPoints] = useState<BulletPointItem[]>([])

  // Helper to translate text if languages differ
  const translateText = useCallback(
    async (text: string): Promise<string> => {
      if (speakerLanguage === otherPartyLanguage) {
        return text // No translation needed
      }

      try {
        // Initialize if needed
        await speakerToOtherPartyService.initialize(
          speakerLanguage,
          otherPartyLanguage
        )

        // Get translation stream
        const stream =
          await speakerToOtherPartyService.translateToTargetLanguageStreaming(
            text
          )

        // Read entire stream
        const reader = stream.getReader()
        let result = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          result += value
        }

        return result || text
      } catch (error) {
        console.error('Translation failed:', error)
        return text // Return original on error
      }
    },
    [speakerLanguage, otherPartyLanguage, speakerToOtherPartyService]
  )

  // Initialize subject detection service
  useEffect(() => {
    subjectDetectionService.initialize().catch(console.error)
    return () => subjectDetectionService.destroy()
  }, [subjectDetectionService])

  // Sync presentation state with service
  useEffect(() => {
    subjectDetectionService.setPresentationState(isPresentationPaused)
  }, [isPresentationPaused, subjectDetectionService])

  // Sync diagram mode with service
  useEffect(() => {
    subjectDetectionService.setDiagramMode(isInDiagramMode)
  }, [isInDiagramMode, subjectDetectionService])

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
        return
      }

      // Mark job as active
      activeAnalysisJobs.add(jobKey)
      setIsAnalyzing(true)

      try {
        // Pass whether we have a current subject to optimize the analysis
        // Also pass current diagram data if we're in diagram mode
        const diagramData =
          currentSubject?.type === 'diagram'
            ? currentSubject.diagramData
            : undefined

        const result = await subjectDetectionService.analyzeTranscription(
          transcription.text,
          !!currentSubject,
          diagramData,
          diagramModeEnabled
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
          return
        }

        // Only process subject changes and bullet points when presentation is running
        if (result.action.action === 'changeSubject') {
          // Create new slide subject - this will automatically clear bullet points via useEffect
          const newSubject = {
            id: Math.random().toString(36).substr(2, 9),
            title: result.action.title,
            type: 'slide' as const,
          }
          changeSubject(newSubject)
        } else if (result.action.action === 'beginDiagram') {
          // Create new diagram subject with empty diagram data
          const diagramTitle = result.action.title

          // Translate the diagram title if needed
          let titleTranslation: string | undefined
          if (speakerLanguage !== otherPartyLanguage) {
            console.log('🌍 Translating diagram title:', diagramTitle)
            titleTranslation = await translateText(diagramTitle)
            console.log('🌍 Translation result:', titleTranslation)
            // Only use translation if it's different from original
            if (titleTranslation === diagramTitle) {
              titleTranslation = undefined
            }
          }

          const newDiagramSubject = {
            id: Math.random().toString(36).substr(2, 9),
            title: diagramTitle,
            type: 'diagram' as const,
            diagramData: {
              nodes: [],
              edges: [],
            },
          }

          // Pass translation directly when creating subject
          changeSubject(newDiagramSubject, titleTranslation)

          return
        } else if (result.action.action === 'endDiagram') {
          // Check if the speaker wants to change subjects or just exit diagram mode
          const hasSubjectChangeIntent =
            await subjectDetectionService.detectSubjectChangeIntent(
              transcription.text
            )

          if (hasSubjectChangeIntent) {
            // Generate a title for the new subject from the transcription
            const bootstrapTitle =
              await subjectDetectionService.generateBootstrapTitle(
                transcription.text
              )

            const newSlideSubject = {
              id: Math.random().toString(36).substr(2, 9),
              title: bootstrapTitle,
              type: 'slide' as const,
            }
            changeSubject(newSlideSubject)
            console.log(
              '🔄 Exited diagram mode with subject change to:',
              bootstrapTitle
            )
          } else {
            // Just exit diagram editing mode without changing subject
            exitDiagramEditingMode()
            console.log(
              '✅ Exited diagram editing mode, staying on current diagram'
            )
          }

          return
        } else if (result.action.action === 'diagramAction') {
          // Apply diagram actions to current diagram
          if (currentSubject?.type === 'diagram') {
            const currentDiagram = currentSubject.diagramData
            let updatedDiagram: DiagramData = { ...currentDiagram }

            // Process all actions in the array
            for (const action of result.action.actions) {
              if (action.type === 'updateDiagramTitle') {
                // Update the subject title (not part of diagram data)
                changeSubject({
                  ...currentSubject,
                  title: action.title || currentSubject.title,
                })
              } else if (action.type === 'addNode') {
                // Add a new node if it doesn't exist
                if (!updatedDiagram.nodes.find(n => n.id === action.id)) {
                  const label = action.label || ''
                  const translation = await translateText(label)

                  updatedDiagram = {
                    ...updatedDiagram,
                    nodes: [
                      ...updatedDiagram.nodes,
                      {
                        id: action.id || '',
                        label,
                        translation:
                          translation !== label ? translation : undefined,
                      },
                    ],
                  }
                }
              } else if (action.type === 'editNode') {
                // Update node label and translation
                const label = action.label || ''
                const translation = await translateText(label)

                updatedDiagram = {
                  ...updatedDiagram,
                  nodes: updatedDiagram.nodes.map(n =>
                    n.id === action.id
                      ? {
                          ...n,
                          label,
                          translation:
                            translation !== label ? translation : undefined,
                        }
                      : n
                  ),
                }
              } else if (action.type === 'removeNode') {
                // Remove node and all connected edges
                updatedDiagram = {
                  ...updatedDiagram,
                  nodes: updatedDiagram.nodes.filter(n => n.id !== action.id),
                  edges: updatedDiagram.edges.filter(
                    e => e.from !== action.id && e.to !== action.id
                  ),
                }
              } else if (action.type === 'addEdge') {
                // Add edge if it doesn't exist AND both nodes exist
                const fromExists = updatedDiagram.nodes.some(
                  n => n.id === action.from
                )
                const toExists = updatedDiagram.nodes.some(
                  n => n.id === action.to
                )
                const edgeExists = updatedDiagram.edges.find(
                  e => e.from === action.from && e.to === action.to
                )

                if (fromExists && toExists && !edgeExists) {
                  updatedDiagram = {
                    ...updatedDiagram,
                    edges: [
                      ...updatedDiagram.edges,
                      {
                        from: action.from || '',
                        to: action.to || '',
                      },
                    ],
                  }
                } else if (!fromExists || !toExists) {
                  console.warn(
                    `⚠️ Cannot add edge from "${action.from}" to "${action.to}" - one or both nodes don't exist`
                  )
                }
              } else if (action.type === 'removeEdge') {
                // Remove edge
                updatedDiagram = {
                  ...updatedDiagram,
                  edges: updatedDiagram.edges.filter(
                    e => !(e.from === action.from && e.to === action.to)
                  ),
                }
              }
            }

            // Update the diagram data
            updateDiagramData(updatedDiagram)
          }
          return
        } else if (
          result.action.action === 'addSingleBulletPoint' ||
          result.action.action === 'addMultipleBulletPoints'
        ) {
          // If we don't have a current subject, create one first
          if (!currentSubject) {
            const bootstrapTitle =
              await subjectDetectionService.generateBootstrapTitle(
                transcription.text
              )

            const bootstrapSubject = {
              id: Math.random().toString(36).substr(2, 9),
              title: bootstrapTitle,
              type: 'slide' as const,
            }
            changeSubject(bootstrapSubject)
          }

          // Handle single bullet point
          if (result.action.action === 'addSingleBulletPoint') {
            const bulletPoint: BulletPointItem = {
              id: Math.random().toString(36).substr(2, 9),
              text: result.action.text,
              timestamp: Date.now(),
            }
            setBulletPoints(prev => [...prev, bulletPoint])
            addBulletPointToHistory(bulletPoint)
          }
          // Handle multiple bullet points
          else if (result.action.action === 'addMultipleBulletPoints') {
            const newBulletPoints: BulletPointItem[] =
              result.action.bulletPoints.map(bp => ({
                id: Math.random().toString(36).substr(2, 9),
                text: bp.text,
                timestamp: Date.now(),
              }))

            setBulletPoints(prev => [...prev, ...newBulletPoints])

            // Add each bullet point to history
            newBulletPoints.forEach(bulletPoint => {
              addBulletPointToHistory(bulletPoint)
            })
          }
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
      updateDiagramData,
      exitDiagramEditingMode,
      speakerLanguage,
      otherPartyLanguage,
      translateText,
      diagramModeEnabled,
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

  const handleTogglePause = () => {
    if (isPresentationPaused) {
      resumePresentation()
    } else {
      pausePresentation()
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    NAVIGATE_PREVIOUS: handlePrevious,
    NAVIGATE_NEXT: handleNext,
    PAUSE_PRESENTATION: handleTogglePause,
    EXPORT_PRESENTATION: handleExportMarkdown,
  })

  return (
    <div
      data-testid="subject-display"
      className="h-full flex flex-col"
      role="region"
      aria-label="Presentation subjects and bullet points"
    >
      {/* Unified Header with Status, Navigation, and Export */}
      <div
        data-testid="subject-display-header"
        className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors duration-300"
        role="toolbar"
        aria-label="Presentation controls"
      >
        {/* Left: Status Icon + Navigation */}
        <div
          data-testid="subject-display-status-nav"
          className="flex items-center gap-2"
        >
          {/* Status Icon */}
          {isPresentationPaused ? (
            <div
              data-testid="presentation-paused-indicator"
              title="Presentation Paused"
              role="status"
              aria-label="Presentation paused"
            >
              <Icon
                icon="mdi:pause-circle"
                className="w-6 h-6 text-amber-600 dark:text-amber-500"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div
              data-testid="presentation-running-indicator"
              title="Presentation Running"
              role="status"
              aria-label="Presentation running"
            >
              <Icon
                icon="mdi:play-circle"
                className="w-6 h-6 text-green-600 dark:text-green-500"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Navigation Controls */}
          {currentSubject && (
            <div
              data-testid="subject-navigation-controls"
              className="flex gap-1 ml-2"
              role="group"
              aria-label="Subject navigation"
            >
              <button
                data-testid="subject-previous-button"
                onClick={handlePrevious}
                disabled={!canNavigatePrevious}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous subject"
                aria-label="Navigate to previous subject - Keyboard shortcut: Ctrl+Left Arrow"
                aria-disabled={!canNavigatePrevious}
              >
                <Icon
                  icon="mdi:chevron-left"
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  aria-hidden="true"
                />
              </button>
              <button
                data-testid="subject-next-button"
                onClick={handleNext}
                disabled={!canNavigateNext}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next subject"
                aria-label="Navigate to next subject - Keyboard shortcut: Ctrl+Right Arrow"
                aria-disabled={!canNavigateNext}
              >
                <Icon
                  icon="mdi:chevron-right"
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  aria-hidden="true"
                />
              </button>
              <div
                data-testid="subject-navigation-counter"
                className="flex items-center px-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300"
                role="status"
                aria-label={`Subject ${currentHistoryIndex + 1} of ${subjectHistory.length}`}
              >
                {currentHistoryIndex + 1} / {subjectHistory.length}
              </div>
            </div>
          )}
        </div>

        {/* Right: Export Button */}
        <button
          data-testid="export-subjects-button"
          onClick={handleExportMarkdown}
          disabled={subjectHistory.length === 0}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Export all subjects as markdown"
          aria-label="Export all subjects as markdown - Keyboard shortcut: Ctrl+Shift+D"
          aria-disabled={subjectHistory.length === 0}
        >
          <Icon
            icon="mdi:download"
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Content */}
      <div
        data-testid="subject-display-content"
        className="flex-1 overflow-y-auto p-4"
        role="region"
        aria-live="polite"
        aria-label="Current subject content"
      >
        {/* Current Subject */}
        {currentSubject && currentSubject.type === 'slide' && (
          <SubjectCard
            subject={currentSubject}
            bulletPoints={bulletPoints}
            speakerLanguage={speakerLanguage}
            otherPartyLanguage={otherPartyLanguage}
          />
        )}

        {/* Current Diagram */}
        {currentSubject && currentSubject.type === 'diagram' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  {currentSubject.title}
                </h2>
                {/* Show translation if available */}
                {speakerLanguage !== otherPartyLanguage &&
                  currentHistoryIndex >= 0 &&
                  subjectHistory[currentHistoryIndex]?.subjectTranslation && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 transition-colors duration-300 mt-1">
                      {subjectHistory[currentHistoryIndex].subjectTranslation}
                    </p>
                  )}
              </div>
              {isInDiagramMode && (
                <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full transition-colors duration-300">
                  Editing Mode
                </span>
              )}
            </div>
            {currentSubject.diagramData.nodes.length > 0 ? (
              <Diagram data={currentSubject.diagramData} />
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                <Icon
                  icon="mdi:graph-outline"
                  className="w-16 h-16 mx-auto mb-4"
                />
                <p>No nodes added yet. Start describing your diagram.</p>
              </div>
            )}
          </div>
        )}

        {isAnalyzing && (
          <div
            data-testid="subject-analyzing-indicator"
            className="mb-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 transition-colors duration-300"
            role="status"
            aria-live="polite"
            aria-label="Analyzing transcription"
          >
            <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* No content state */}
        {!currentSubject && (
          <div
            data-testid="subject-display-empty"
            className="h-full flex items-center justify-center"
            role="status"
          >
            <div className="text-center p-8">
              <div className="text-6xl mb-4">
                <Icon
                  icon="mdi:brain"
                  className="w-12 h-12 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                />
              </div>
              <p className="sr-only">No subject selected yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
