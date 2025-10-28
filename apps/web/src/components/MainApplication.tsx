import { useCallback, useEffect, useRef, useState } from 'react'
import { usePresentationControl } from '../contexts/PresentationControlContext'
import { useSubject } from '../contexts/SubjectContext'
import { useSystemAudioAnalysis } from '../contexts/SystemAudioAnalysisContext'
import { useSystemAudio } from '../contexts/SystemAudioContext'
import { useTranscription } from '../contexts/TranscriptionContext'
import { useTranscriptionEvents } from '../contexts/TranscriptionEventsContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useVAD } from '../contexts/VADContext'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { SummarizationService } from '../services/SummarizationService'
import {
  AudioChunk,
  SystemTranscriptionCard,
  TranscriptionCard,
} from '../types'
import { convertAudioToBlob } from '../utils/audioUtils'
import type { CardData } from '../utils/downloadUtils'
import { ErrorDisplay } from './ErrorDisplay'
import { HelpPage } from './HelpPage'
import { MeetingSummaryScreen } from './MeetingSummaryScreen'
import { RecordingControlPanel } from './RecordingControlPanel'
import { SubjectDisplay } from './SubjectDisplay'
import { TranscriptionStream } from './TranscriptionStream'
import { Language, PresentationMode, WelcomeScreen } from './WelcomeScreen'

export function MainApplication() {
  const transcriptionService = useTranscription()
  const { speakerToOtherPartyService, otherPartyToSpeakerService } =
    useTranslation()
  const { publishTranscription } = useTranscriptionEvents()
  const { setIncludeSystemAudioInAnalysis, includeSystemAudioInAnalysis } =
    useSystemAudioAnalysis()
  const { subjectHistory, resetSubjects } = useSubject()
  const vad = useVAD()
  const systemAudio = useSystemAudio()
  const presentationControl = usePresentationControl()

  const [isRecording, setIsRecording] = useState(false)
  const [transcriptionCards, setTranscriptionCards] = useState<
    TranscriptionCard[]
  >([])
  const [systemTranscriptionCards, setSystemTranscriptionCards] = useState<
    SystemTranscriptionCard[]
  >([])
  const [isSystemCapturing, setIsSystemCapturing] = useState(false)

  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasStartedRecording, setHasStartedRecording] = useState(false)
  const [speakerLanguage, setSpeakerLanguage] = useState<Language>('english')
  const [otherPartyLanguage, setOtherPartyLanguage] =
    useState<Language>('japanese')
  const [presentationMode, setPresentationMode] =
    useState<PresentationMode>('both-speakers')
  const [diagramModeEnabled, setDiagramModeEnabled] = useState<boolean>(false)

  // Meeting summary state
  const [showMeetingSummary, setShowMeetingSummary] = useState(false)
  const [meetingSummary, setMeetingSummary] = useState<string>('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  // Help page state
  const [showHelpPage, setShowHelpPage] = useState(false)

  // Store transcription data for downloads and summary
  const transcriptionDataRef = useRef<CardData[]>([])
  const summarizationServiceRef = useRef<SummarizationService | null>(null)

  // Generate unique IDs
  const generateId = useCallback(
    () => Math.random().toString(36).substr(2, 9),
    []
  )

  // Callback to handle completed transcriptions for subject detection
  const handleTranscriptionComplete = useCallback(
    (cardId: string, text: string, timestamp: number) => {
      // Store transcription data for summary
      const existingIndex = transcriptionDataRef.current.findIndex(
        d => d.cardId === cardId
      )
      if (existingIndex >= 0) {
        const existing = transcriptionDataRef.current[existingIndex]
        if (existing) {
          existing.original = text
        }
      } else {
        transcriptionDataRef.current.push({
          cardId,
          timestamp,
          original: text,
          translated: '',
        })
      }

      // Determine if this is a system card by checking if it exists in systemTranscriptionCards
      const isSystemCard = systemTranscriptionCards.some(
        card => card.id === cardId
      )

      // Only publish for subject analysis if we're NOT in transcription-only mode
      // When in transcription-only mode, no transcriptions should trigger subject detection
      if (presentationMode !== 'transcription-only') {
        // Only publish for subject analysis if:
        // - It's a microphone card (always include user speech), OR
        // - It's a system card AND includeSystemAudioInAnalysis is enabled
        if (!isSystemCard || includeSystemAudioInAnalysis) {
          publishTranscription({
            id: cardId,
            text: text,
            timestamp: timestamp,
          })
        }
      }
    },
    [
      publishTranscription,
      includeSystemAudioInAnalysis,
      systemTranscriptionCards,
      presentationMode,
    ]
  )

  // Callback to handle completed translations (optional, for logging or other purposes)
  const handleTranslationComplete = useCallback(
    (cardId: string, translatedText: string) => {
      // Store translation data
      const existingIndex = transcriptionDataRef.current.findIndex(
        d => d.cardId === cardId
      )
      if (existingIndex >= 0) {
        const existing = transcriptionDataRef.current[existingIndex]
        if (existing) {
          existing.translated = translatedText
        }
      } else {
        transcriptionDataRef.current.push({
          cardId,
          timestamp: Date.now(),
          original: '',
          translated: translatedText,
        })
      }
    },
    []
  )

  // Callback to handle empty transcriptions - remove the card
  const handleTranscriptionEmpty = useCallback((cardId: string) => {
    console.log('🗑️ Removing empty transcription card:', cardId)

    // Remove from transcriptionCards or systemTranscriptionCards
    setTranscriptionCards(prev => prev.filter(card => card.id !== cardId))
    setSystemTranscriptionCards(prev => prev.filter(card => card.id !== cardId))

    // Also remove from transcription data ref if it exists
    transcriptionDataRef.current = transcriptionDataRef.current.filter(
      d => d.cardId !== cardId
    )
  }, [])

  const handleAudioChunk = useCallback(
    async (chunk: AudioChunk) => {
      try {
        // Create a new transcription card with just the audio segment
        const cardId = generateId()
        const newCard: TranscriptionCard = {
          id: cardId,
          audioSegment: chunk.blob,
          timestamp: Date.now(),
        }

        // Add the card immediately - it will handle its own transcription
        setTranscriptionCards(prev => [...prev, newCard])
      } catch (error) {
        console.error('Failed to create transcription card:', error)
        setError('Failed to process audio. Please try again.')
      }
    },
    [generateId]
  )

  // Handle system audio chunks
  const handleSystemAudioChunk = useCallback(
    async (chunk: AudioChunk) => {
      try {
        // Create a new system transcription card with just the audio segment
        const cardId = generateId()
        const newCard: SystemTranscriptionCard = {
          id: cardId,
          audioSegment: chunk.blob,
          timestamp: Date.now(),
        }

        // Add the card immediately - it will handle its own transcription
        setSystemTranscriptionCards(prev => [...prev, newCard])
      } catch (error) {
        console.error('Failed to create system transcription card:', error)
        setError('Failed to process system audio. Please try again.')
      }
    },
    [generateId]
  )

  // Handle VAD speech detection
  const handleSpeechEnd = useCallback(
    async (audioData: Float32Array) => {
      try {
        console.log('🗣️ Processing speech end, audio length:', audioData.length)

        // Convert VAD audio to blob
        const audioBlob = convertAudioToBlob(audioData)

        // Create audio chunk compatible with existing system
        const audioChunk: AudioChunk = {
          blob: audioBlob,
          timestamp: Date.now(),
          windowStart: Date.now() - (audioData.length / 16000) * 1000, // Estimate start time
          windowEnd: Date.now(),
        }

        // Process the audio chunk
        await handleAudioChunk(audioChunk)
      } catch (error) {
        console.error('Failed to process VAD speech:', error)
        setError('Failed to process speech. Please try again.')
      }
    },
    [handleAudioChunk]
  )

  // Handle system audio segment completion
  const handleSystemAudioSegment = useCallback(
    async (audioChunk: AudioChunk) => {
      try {
        // Process the audio chunk - it will create a card internally
        await handleSystemAudioChunk(audioChunk)
      } catch (error) {
        console.error('Failed to process system audio segment:', error)
        setError('Failed to process system audio. Please try again.')
      }
    },
    [handleSystemAudioChunk]
  )

  const handleSpeechStart = useCallback(() => {
    // Speech started
  }, [])

  // Start recording with VAD
  const handleStartRecording = async (
    selectedSpeakerLanguage: Language,
    selectedOtherPartyLanguage: Language,
    selectedPresentationMode: PresentationMode,
    selectedDiagramModeEnabled: boolean
  ) => {
    try {
      setIsInitializing(true)
      setError(null)

      // Set the languages
      setSpeakerLanguage(selectedSpeakerLanguage)
      setOtherPartyLanguage(selectedOtherPartyLanguage)

      // Set the presentation mode
      setPresentationMode(selectedPresentationMode)

      // Set diagram mode enabled
      setDiagramModeEnabled(selectedDiagramModeEnabled)

      // Convert presentation mode to includeSystemAudioInAnalysis:
      // - 'transcription-only' or 'local-only': false (only local speaker influences presentation)
      // - 'both-speakers': true (both speakers influence presentation)
      const includeSystemAudioInAnalysis =
        selectedPresentationMode === 'both-speakers'
      setIncludeSystemAudioInAnalysis(includeSystemAudioInAnalysis)

      // Wait for all services to be ready
      // 1. VAD must be loaded
      if (vad.loading) {
        console.log('⏳ Waiting for VAD to load...')
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('VAD loading timeout after 30 seconds'))
          }, 30000) // 30 second timeout

          const checkVAD = () => {
            if (!vad.loading) {
              clearTimeout(timeout)
              resolve()
            } else {
              setTimeout(checkVAD, 100)
            }
          }
          checkVAD()
        })
      }

      // 2. PresentationControlService must be initialized
      if (!presentationControl.isInitialized) {
        console.log(
          '⏳ Waiting for PresentationControlService to initialize...'
        )
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(
              new Error(
                'PresentationControlService initialization timeout after 30 seconds'
              )
            )
          }, 30000) // 30 second timeout

          const checkPresentation = () => {
            // Check if initialization failed
            if (presentationControl.error) {
              clearTimeout(timeout)
              reject(
                new Error(
                  `PresentationControlService initialization failed: ${presentationControl.error}`
                )
              )
              return
            }

            // Check if initialized successfully
            if (presentationControl.isInitialized) {
              clearTimeout(timeout)
              resolve()
            } else {
              setTimeout(checkPresentation, 100)
            }
          }
          checkPresentation()
        })
      }

      // 3. Initialize transcription and translation services
      await Promise.all([
        transcriptionService.initialize(selectedSpeakerLanguage),
        speakerToOtherPartyService.initialize(
          selectedSpeakerLanguage,
          selectedOtherPartyLanguage
        ),
        otherPartyToSpeakerService.initialize(
          selectedOtherPartyLanguage,
          selectedSpeakerLanguage
        ),
      ])

      // Set up VAD callbacks
      vad.onSpeechEnd(handleSpeechEnd)
      vad.onSpeechStart(handleSpeechStart)

      // Start VAD listening
      await vad.start()

      setIsRecording(true)
      setHasStartedRecording(true) // Mark that recording has been started at least once
      setIsInitializing(false)

      console.log('🎙️ VAD recording started successfully - all services ready')
    } catch (error) {
      console.error('Failed to start recording:', error)
      setError(
        'Failed to start recording. Please check microphone permissions.'
      )
      setIsInitializing(false)
    }
  }

  // Start system audio capture
  const handleStartSystemCapture = async () => {
    try {
      setIsInitializing(true)
      setError(null)

      // Set up system audio callbacks
      systemAudio.onAudioSegment(handleSystemAudioSegment)

      // Start system audio capture
      await systemAudio.start()

      setIsSystemCapturing(true)
      setIsInitializing(false)

      console.log('🖥️ System audio capture started successfully')
    } catch (error) {
      console.error('Failed to start system audio capture:', error)
      setError(
        'Failed to start screen sharing. Please check permissions and ensure audio is enabled.'
      )
      setIsInitializing(false)
    }
  }

  // Handle stopping recording
  const handleStopRecording = () => {
    try {
      // Stop VAD listening
      vad.pause()

      setIsRecording(false)

      console.log('🛑 VAD recording stopped')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      setError('Failed to stop recording.')
    }
  }

  // Handle stopping system capture
  const handleStopSystemCapture = () => {
    try {
      // Stop system audio capture
      systemAudio.stop()

      setIsSystemCapturing(false)

      console.log('🛑 System audio capture stopped')
    } catch (error) {
      console.error('Failed to stop system capture:', error)
      setError('Failed to stop system capture.')
    }
  }

  // Handle ending the entire session
  const handleEndSession = async () => {
    try {
      // Stop both recording and system capture
      if (isRecording) {
        vad.pause()
        setIsRecording(false)
      }
      if (isSystemCapturing) {
        systemAudio.stop()
        setIsSystemCapturing(false)
      }

      // Show meeting summary screen immediately
      if (transcriptionDataRef.current.length > 0) {
        // Show the summary screen immediately (empty summary = loading state)
        setShowMeetingSummary(true)
        setIsGeneratingSummary(true)

        // Generate summary in the background
        try {
          // Initialize summarization service if not already initialized
          if (!summarizationServiceRef.current) {
            summarizationServiceRef.current = new SummarizationService()
            await summarizationServiceRef.current.initialize()
          }

          // Extract all transcription texts (sorted by timestamp)
          const transcriptions = transcriptionDataRef.current
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(data => data.original)
            .filter(text => text.trim().length > 0)

          if (transcriptions.length === 0) {
            throw new Error('No transcriptions available to summarize')
          }

          // Generate summary using streaming
          const stream =
            await summarizationServiceRef.current.summarizeMeetingStreaming(
              transcriptions,
              {
                expectedInputLanguages: [speakerLanguage.slice(0, 2)],
                outputLanguage: speakerLanguage.slice(0, 2),
              }
            )

          // Accumulate the summary
          const reader = stream.getReader()
          let accumulatedSummary = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              break
            }

            accumulatedSummary += value
            setMeetingSummary(accumulatedSummary)
          }
        } catch (error) {
          console.error('Failed to generate meeting summary:', error)
          setError(
            'Failed to generate meeting summary. Please try again or start a new meeting.'
          )
        } finally {
          setIsGeneratingSummary(false)
        }
      } else {
        // No transcriptions, just reset to welcome screen
        handleNewMeeting()
      }

      console.log('🛑 Session ended')
    } catch (error) {
      console.error('Failed to end session:', error)
      setError('Failed to end session.')
    }
  }

  // Handle starting a new meeting
  const handleNewMeeting = () => {
    // Reset all state
    setHasStartedRecording(false)
    setTranscriptionCards([])
    setSystemTranscriptionCards([])
    setShowMeetingSummary(false)
    setMeetingSummary('')
    transcriptionDataRef.current = []

    // Reset subject context
    resetSubjects()

    console.log('🆕 Starting new meeting')
  }

  // Wrapper for recording control panel (no language params needed)
  const handleStartRecordingWrapper = async () => {
    return handleStartRecording(
      speakerLanguage,
      otherPartyLanguage,
      presentationMode,
      diagramModeEnabled
    )
  }

  // Cleanup services on unmount only
  useEffect(() => {
    return () => {
      // Capture current values at cleanup time to avoid stale closures
      const currentVad = vad
      const currentSystemAudio = systemAudio
      const currentTranscriptionService = transcriptionService
      const currentSpeakerToOtherPartyService = speakerToOtherPartyService
      const currentOtherPartyToSpeakerService = otherPartyToSpeakerService
      const currentSummarizationService = summarizationServiceRef.current

      currentVad.pause()
      currentSystemAudio.stop()
      currentTranscriptionService.destroy()
      currentSpeakerToOtherPartyService.destroy()
      currentOtherPartyToSpeakerService.destroy()
      currentSummarizationService?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount/unmount

  // Handle closing error
  const handleCloseError = useCallback(() => {
    setError(null)
  }, [])

  // Handle opening help page
  const handleOpenHelp = useCallback(() => {
    setShowHelpPage(true)
  }, [])

  // Handle closing help page
  const handleCloseHelp = useCallback(() => {
    setShowHelpPage(false)
  }, [])

  // Keyboard shortcuts for help page and close modal
  useKeyboardShortcut(
    'OPEN_HELP',
    handleOpenHelp,
    !showHelpPage && !showMeetingSummary
  )
  useKeyboardShortcut('CLOSE_MODAL', () => {
    if (showHelpPage) {
      handleCloseHelp()
    } else if (showMeetingSummary) {
      handleNewMeeting()
    }
  })

  return (
    <div
      data-testid="main-application"
      className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 p-2 transition-colors duration-300"
      role="main"
    >
      <ErrorDisplay error={error} onClose={handleCloseError} />

      {/* Help Page */}
      {showHelpPage && !showMeetingSummary && (
        <HelpPage onBack={handleCloseHelp} initialTab="setup" />
      )}

      {/* Meeting Summary Screen */}
      {showMeetingSummary && (
        <MeetingSummaryScreen
          summary={meetingSummary}
          speakerLanguage={speakerLanguage}
          otherPartyLanguage={otherPartyLanguage}
          transcriptionData={transcriptionDataRef.current}
          subjectHistory={subjectHistory}
          presentationMode={presentationMode}
          onNewMeeting={handleNewMeeting}
          isGeneratingSummary={isGeneratingSummary}
        />
      )}

      {/* When not recording AND never started recording: Show huge record button in center */}
      {!showMeetingSummary &&
        !showHelpPage &&
        !isRecording &&
        !hasStartedRecording &&
        !isSystemCapturing && (
          <div data-testid="welcome-screen-container" className="flex-1">
            <WelcomeScreen
              onStartRecording={handleStartRecording}
              isInitializing={
                isInitializing ||
                vad.loading ||
                presentationControl.isInitializing
              }
              onOpenHelp={handleOpenHelp}
            />
          </div>
        )}

      {/* When recording OR has started recording OR system capturing: Show two-column layout */}
      {!showMeetingSummary &&
        !showHelpPage &&
        (isRecording || hasStartedRecording || isSystemCapturing) && (
          <div
            data-testid="recording-layout"
            className="flex-1 flex flex-col gap-2 min-h-0"
          >
            {/* Cards Container - Takes up all available space */}
            <div
              data-testid="cards-container"
              className="flex-1 flex gap-2 min-h-0"
            >
              <div
                data-testid="transcription-column"
                className={
                  presentationMode === 'transcription-only'
                    ? 'flex-1 min-w-0'
                    : 'flex-1 min-w-0'
                }
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full transition-colors duration-300">
                  <TranscriptionStream
                    transcriptionCards={transcriptionCards}
                    systemTranscriptionCards={systemTranscriptionCards}
                    speakerLanguage={speakerLanguage}
                    otherPartyLanguage={otherPartyLanguage}
                    onTranscriptionComplete={handleTranscriptionComplete}
                    onTranslationComplete={handleTranslationComplete}
                    onTranscriptionEmpty={handleTranscriptionEmpty}
                  />
                </div>
              </div>

              {presentationMode !== 'transcription-only' && (
                <div data-testid="subject-column" className="flex-1 min-w-0">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full transition-colors duration-300">
                    <SubjectDisplay
                      speakerLanguage={speakerLanguage}
                      otherPartyLanguage={otherPartyLanguage}
                      diagramModeEnabled={diagramModeEnabled}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Control Panel - Shrinks to content */}
            <div
              data-testid="control-panel-container"
              className="flex-shrink-0"
            >
              <RecordingControlPanel
                isRecording={isRecording}
                isSystemCapturing={isSystemCapturing}
                onStartRecording={handleStartRecordingWrapper}
                onStopRecording={handleStopRecording}
                onStartSystemCapture={handleStartSystemCapture}
                onStopSystemCapture={handleStopSystemCapture}
                onEndSession={handleEndSession}
                isInitializing={isInitializing || isGeneratingSummary}
                userSpeaking={vad.userSpeaking}
                hasSystemAudio={systemAudio.systemSpeaking}
              />
            </div>
          </div>
        )}
    </div>
  )
}
