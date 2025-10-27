import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { useTranslation } from '../contexts/TranslationContext'
import type { CardData, SubjectHistoryItem } from '../utils/downloadUtils'
import {
  downloadPresentation,
  downloadTranscriptions,
} from '../utils/downloadUtils'
import { ThemeToggleButton } from './ThemeToggleButton'
import type { Language, PresentationMode } from './WelcomeScreen'

interface MeetingSummaryScreenProps {
  summary: string
  speakerLanguage: Language
  otherPartyLanguage: Language
  transcriptionData: CardData[]
  subjectHistory: SubjectHistoryItem[]
  presentationMode: PresentationMode
  onNewMeeting: () => void
  isGeneratingSummary?: boolean
}

export function MeetingSummaryScreen({
  summary,
  speakerLanguage,
  otherPartyLanguage,
  transcriptionData,
  subjectHistory,
  presentationMode,
  onNewMeeting,
  isGeneratingSummary = false,
}: MeetingSummaryScreenProps) {
  const { speakerToOtherPartyService } = useTranslation()
  const [translatedSummary, setTranslatedSummary] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState(false)

  const shouldShowTranslation = speakerLanguage !== otherPartyLanguage

  // Translate the summary only after it's fully generated
  useEffect(() => {
    // Only start translation when summary generation is complete
    if (!shouldShowTranslation || !summary || isGeneratingSummary) {
      return
    }

    let cancelled = false
    setIsTranslating(true)
    setTranslatedSummary('') // Reset translation when starting

    const translateSummary = async () => {
      try {
        const stream =
          await speakerToOtherPartyService.translateToTargetLanguageStreaming(
            summary
          )
        const reader = stream.getReader()

        let accumulatedTranslation = ''

        while (true) {
          const { done, value } = await reader.read()

          if (cancelled) {
            break
          }

          if (done) {
            break
          }

          accumulatedTranslation += value
          setTranslatedSummary(accumulatedTranslation)
        }
      } catch (error) {
        console.error('Failed to translate summary:', error)
      } finally {
        if (!cancelled) {
          setIsTranslating(false)
        }
      }
    }

    translateSummary()

    return () => {
      cancelled = true
    }
  }, [
    summary,
    isGeneratingSummary,
    shouldShowTranslation,
    speakerToOtherPartyService,
  ])

  const handleDownloadTranscriptions = () => {
    downloadTranscriptions(
      transcriptionData,
      speakerLanguage,
      otherPartyLanguage
    )
  }

  const handleDownloadPresentation = () => {
    downloadPresentation(subjectHistory, speakerLanguage, otherPartyLanguage)
  }

  return (
    <div
      data-testid="meeting-summary-screen"
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-300"
    >
      {/* Header */}
      <div data-testid="meeting-summary-header" className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center transition-colors duration-300">
          Meeting Summary
        </h1>
      </div>

      {/* Summary Card */}
      <div
        data-testid="meeting-summary-card"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8 max-w-4xl w-full transition-colors duration-300"
      >
        {/* Summary Text */}
        <div data-testid="meeting-summary-content" className="mb-6">
          {!summary && isGeneratingSummary ? (
            <div
              data-testid="summary-generating-loader"
              className="flex items-center justify-center py-12"
            >
              <Icon
                icon="mdi:loading"
                className="w-12 h-12 text-blue-600 animate-spin"
              />
            </div>
          ) : (
            <>
              <p
                data-testid="meeting-summary-text"
                className="text-2xl leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap transition-colors duration-300"
              >
                {summary}
              </p>
              {isGeneratingSummary && (
                <div
                  data-testid="summary-streaming-indicator"
                  className="flex items-center gap-2 mt-4 text-blue-600"
                >
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Translated Summary - Only show after summary generation is complete */}
        {shouldShowTranslation && summary && !isGeneratingSummary && (
          <div
            data-testid="meeting-summary-translation-section"
            className="pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300"
          >
            {!translatedSummary && isTranslating ? (
              <div
                data-testid="translation-generating-loader"
                className="flex items-center justify-center py-12"
              >
                <Icon
                  icon="mdi:loading"
                  className="w-12 h-12 text-blue-600 animate-spin"
                />
              </div>
            ) : (
              <>
                <p
                  data-testid="meeting-summary-translated-text"
                  className="text-2xl leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap transition-colors duration-300"
                >
                  {translatedSummary}
                </p>
                {isTranslating && (
                  <div
                    data-testid="translation-streaming-indicator"
                    className="flex items-center gap-2 mt-4 text-blue-600"
                  >
                    <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - All in one row with equal sizes */}
      <div data-testid="meeting-summary-actions" className="flex gap-4 mb-8">
        {/* Download Transcriptions */}
        <button
          data-testid="download-transcriptions-button"
          onClick={handleDownloadTranscriptions}
          disabled={transcriptionData.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex-1"
          title="Transcriptions"
        >
          <Icon icon="mdi:download" className="w-5 h-5" />
          <span>Transcriptions</span>
        </button>

        {/* Download Presentation - Only show if not in transcription-only mode */}
        {presentationMode !== 'transcription-only' && (
          <button
            data-testid="download-presentation-button"
            onClick={handleDownloadPresentation}
            disabled={subjectHistory.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex-1"
            title="Presentation"
          >
            <Icon icon="mdi:download" className="w-5 h-5" />
            <span>Presentation</span>
          </button>
        )}

        {/* New Meeting Button - No text, just icon */}
        <button
          data-testid="new-meeting-button"
          onClick={onNewMeeting}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl flex-1"
          title="Start a new meeting"
        >
          <Icon icon="mdi:check-circle" className="w-5 h-5" />
          <span>Finished</span>
        </button>
      </div>

      {/* Bottom Left Buttons */}
      <div className="fixed bottom-8 left-8 flex gap-3 z-50">
        {/* Theme Toggle Button */}
        <ThemeToggleButton />

        {/* GitHub Button */}
        <a
          href="https://github.com/SIOCODE-Open/fittyfiritti"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          title="View on GitHub"
        >
          <Icon
            icon="mdi:github"
            className="w-8 h-8 group-hover:scale-110 transition-transform"
          />
        </a>
      </div>

      {/* Created by SIOCODE - Fixed to bottom-right corner */}
      <div className="fixed bottom-8 right-8 z-50">
        <a
          href="https://siocode.hu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300 group"
        >
          <span className="text-sm font-medium">Created by</span>
          <span className="text-sm font-bold group-hover:underline">
            SIOCODE
          </span>
        </a>
      </div>
    </div>
  )
}
