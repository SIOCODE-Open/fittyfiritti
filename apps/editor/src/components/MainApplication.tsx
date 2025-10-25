import { useCallback, useEffect, useState } from 'react'
import { useSystemAudioAnalysis } from '../contexts/SystemAudioAnalysisContext'
import { useSystemAudio } from '../contexts/SystemAudioContext'
import { useSystemTranscription } from '../contexts/SystemTranscriptionContext'
import { useSystemTranslation } from '../contexts/SystemTranslationContext'
import { useTranscription } from '../contexts/TranscriptionContext'
import { useTranscriptionEvents } from '../contexts/TranscriptionEventsContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useVAD } from '../contexts/VADContext'
import {
  AudioChunk,
  SystemTranscriptionCard,
  TranscriptionCard,
} from '../types'
import { convertAudioToBlob } from '../utils/audioUtils'
import { ErrorDisplay } from './ErrorDisplay'
import { RecordingControlPanel } from './RecordingControlPanel'
import { SubjectDisplay } from './SubjectDisplay'
import { UnifiedTranscriptionStream } from './UnifiedTranscriptionStream'
import { Language, WelcomeScreen } from './WelcomeScreen'

export function MainApplication() {
  const transcriptionService = useTranscription()
  const translationService = useTranslation()
  const systemTranscriptionService = useSystemTranscription()
  const systemTranslationService = useSystemTranslation()
  const { publishTranscription } = useTranscriptionEvents()
  const { setIncludeSystemAudioInAnalysis, includeSystemAudioInAnalysis } =
    useSystemAudioAnalysis()
  const vad = useVAD()
  const systemAudio = useSystemAudio()

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

  // Generate unique IDs
  const generateId = useCallback(
    () => Math.random().toString(36).substr(2, 9),
    []
  )

  // Callback to handle completed transcriptions for subject detection
  const handleTranscriptionComplete = useCallback(
    (cardId: string, text: string, timestamp: number) => {
      console.log('Transcription complete for card:', cardId, 'Text:', text)

      // Determine if this is a system card by checking if it exists in systemTranscriptionCards
      const isSystemCard = systemTranscriptionCards.some(
        card => card.id === cardId
      )

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
    },
    [
      publishTranscription,
      includeSystemAudioInAnalysis,
      systemTranscriptionCards,
    ]
  )

  // Callback to handle completed translations (optional, for logging or other purposes)
  const handleTranslationComplete = useCallback(
    (cardId: string, translatedText: string) => {
      console.log(
        'Translation complete for card:',
        cardId,
        'Translation:',
        translatedText
      )
    },
    []
  )

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
        console.log('🖥️ Processing system audio segment')

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
    console.log('🗣️ Speech started')
    // Could add visual feedback here
  }, [])

  // Start recording with VAD
  const handleStartRecording = async (
    selectedSpeakerLanguage: Language,
    selectedOtherPartyLanguage: Language,
    includeSystemAudioInAnalysis: boolean
  ) => {
    try {
      setIsInitializing(true)
      setError(null)

      // Set the languages
      setSpeakerLanguage(selectedSpeakerLanguage)
      setOtherPartyLanguage(selectedOtherPartyLanguage)

      // Set the system audio analysis preference
      setIncludeSystemAudioInAnalysis(includeSystemAudioInAnalysis)

      // Initialize services
      await Promise.all([
        transcriptionService.initialize(),
        translationService.initialize(selectedOtherPartyLanguage),
      ])

      // Set up VAD callbacks
      vad.onSpeechEnd(handleSpeechEnd)
      vad.onSpeechStart(handleSpeechStart)

      // Start VAD listening
      await vad.start()

      setIsRecording(true)
      setHasStartedRecording(true) // Mark that recording has been started at least once
      setIsInitializing(false)

      console.log('🎙️ VAD recording started successfully')
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

      // Initialize system services
      await Promise.all([
        systemTranscriptionService.initialize(otherPartyLanguage),
        systemTranslationService.initialize(otherPartyLanguage),
      ])

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

  // Wrapper for recording control panel (no language params needed)
  const handleStartRecordingWrapper = async () => {
    return handleStartRecording(speakerLanguage, otherPartyLanguage, true)
  }

  // Cleanup services on unmount only
  useEffect(() => {
    return () => {
      // Capture current values at cleanup time to avoid stale closures
      const currentVad = vad
      const currentSystemAudio = systemAudio
      const currentTranscriptionService = transcriptionService
      const currentTranslationService = translationService
      const currentSystemTranscriptionService = systemTranscriptionService
      const currentSystemTranslationService = systemTranslationService

      currentVad.pause()
      currentSystemAudio.stop()
      currentTranscriptionService.destroy()
      currentTranslationService.destroy()
      currentSystemTranscriptionService.destroy()
      currentSystemTranslationService.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount/unmount

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorDisplay error={error} />

      {/* Main Content Container */}
      <div className="w-full px-6 py-8">
        {/* When not recording AND never started recording: Show huge record button in center */}
        {!isRecording && !hasStartedRecording && !isSystemCapturing && (
          <WelcomeScreen
            onStartRecording={handleStartRecording}
            isInitializing={isInitializing}
          />
        )}

        {/* When recording OR has started recording OR system capturing: Show two-column layout */}
        {(isRecording || hasStartedRecording || isSystemCapturing) && (
          <div className="flex gap-6 h-[calc(100vh-12rem)]">
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
                <UnifiedTranscriptionStream
                  transcriptionCards={transcriptionCards}
                  systemTranscriptionCards={systemTranscriptionCards}
                  speakerLanguage={speakerLanguage}
                  otherPartyLanguage={otherPartyLanguage}
                  onTranscriptionComplete={handleTranscriptionComplete}
                  onTranslationComplete={handleTranslationComplete}
                />
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
                <SubjectDisplay />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Panel at Bottom - Shows when recording has been started */}
      {(hasStartedRecording || isSystemCapturing) && (
        <RecordingControlPanel
          isRecording={isRecording}
          isSystemCapturing={isSystemCapturing}
          onStartRecording={handleStartRecordingWrapper}
          onStopRecording={handleStopRecording}
          onStartSystemCapture={handleStartSystemCapture}
          onStopSystemCapture={handleStopSystemCapture}
          isInitializing={isInitializing}
          userSpeaking={vad.userSpeaking}
          hasSystemAudio={systemAudio.systemSpeaking}
        />
      )}
    </div>
  )
}
