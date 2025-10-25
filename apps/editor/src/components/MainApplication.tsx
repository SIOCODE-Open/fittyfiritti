import { useCallback, useEffect, useRef, useState } from 'react'
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
  const currentLoadingCardId = useRef<string | null>(null)
  const currentSystemLoadingCardId = useRef<string | null>(null)

  // Generate unique IDs
  const generateId = useCallback(
    () => Math.random().toString(36).substr(2, 9),
    []
  )

  // Async translation helper with streaming and job deduplication
  const translateTextAsync = useCallback(
    (cardId: string, text: string) => {
      // Only translate if languages differ
      if (speakerLanguage === otherPartyLanguage) {
        return
      }

      setTranscriptionCards(prev =>
        prev.map(card =>
          card.id === cardId
            ? { ...card, isTranslating: true, textJa: '' }
            : card
        )
      )

      // Check if streaming is available, otherwise fall back to regular translation
      if (translationService.translateToTargetLanguageStreaming) {
        translationService
          .translateToTargetLanguageStreaming(text)
          .then(async stream => {
            const reader = stream.getReader()
            let accumulatedText = ''

            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                accumulatedText += value

                // Update UI with streaming text
                setTranscriptionCards(prev =>
                  prev.map(card =>
                    card.id === cardId
                      ? { ...card, textJa: accumulatedText }
                      : card
                  )
                )
              }

              // Mark translation as complete
              setTranscriptionCards(prev =>
                prev.map(card =>
                  card.id === cardId ? { ...card, isTranslating: false } : card
                )
              )
            } catch (error) {
              console.error('Streaming translation failed:', error)
              setTranscriptionCards(prev =>
                prev.map(card =>
                  card.id === cardId ? { ...card, isTranslating: false } : card
                )
              )
            }
          })
          .catch(error => {
            console.error('Failed to start streaming translation:', error)
            setTranscriptionCards(prev =>
              prev.map(card =>
                card.id === cardId ? { ...card, isTranslating: false } : card
              )
            )
          })
      } else {
        // Fallback to regular translation
        translationService
          .translateToTargetLanguage(text)
          .then(translation => {
            setTranscriptionCards(prev =>
              prev.map(card =>
                card.id === cardId
                  ? { ...card, textJa: translation, isTranslating: false }
                  : card
              )
            )
          })
          .catch(error => {
            console.error('Translation failed:', error)
            setTranscriptionCards(prev =>
              prev.map(card =>
                card.id === cardId ? { ...card, isTranslating: false } : card
              )
            )
          })
      }
    },
    [translationService, speakerLanguage, otherPartyLanguage]
  )

  // System translation helper (Japanese to English) with streaming
  const translateSystemTextAsync = useCallback(
    (cardId: string, text: string) => {
      // Only translate if languages differ
      if (speakerLanguage === otherPartyLanguage) {
        return
      }

      setSystemTranscriptionCards(prev =>
        prev.map(card =>
          card.id === cardId
            ? { ...card, isTranslating: true, textEn: '' }
            : card
        )
      )

      // Check if streaming is available, otherwise fall back to regular translation
      if (systemTranslationService.translateToEnglishStreaming) {
        systemTranslationService
          .translateToEnglishStreaming(text)
          .then(async stream => {
            const reader = stream.getReader()
            let accumulatedText = ''

            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                accumulatedText += value

                // Update UI with streaming text
                setSystemTranscriptionCards(prev =>
                  prev.map(card =>
                    card.id === cardId
                      ? { ...card, textEn: accumulatedText }
                      : card
                  )
                )
              }

              // Mark translation as complete
              setSystemTranscriptionCards(prev =>
                prev.map(card =>
                  card.id === cardId ? { ...card, isTranslating: false } : card
                )
              )
            } catch (error) {
              console.error('Streaming system translation failed:', error)
              setSystemTranscriptionCards(prev =>
                prev.map(card =>
                  card.id === cardId ? { ...card, isTranslating: false } : card
                )
              )
            }
          })
          .catch(error => {
            console.error(
              'Failed to start streaming system translation:',
              error
            )
            setSystemTranscriptionCards(prev =>
              prev.map(card =>
                card.id === cardId ? { ...card, isTranslating: false } : card
              )
            )
          })
      } else {
        // Fallback to regular translation
        systemTranslationService
          .translateToEnglish(text)
          .then(translation => {
            setSystemTranscriptionCards(prev =>
              prev.map(card =>
                card.id === cardId
                  ? { ...card, textEn: translation, isTranslating: false }
                  : card
              )
            )
          })
          .catch(error => {
            console.error('System translation failed:', error)
            setSystemTranscriptionCards(prev =>
              prev.map(card =>
                card.id === cardId ? { ...card, isTranslating: false } : card
              )
            )
          })
      }
    },
    [systemTranslationService, speakerLanguage, otherPartyLanguage]
  )

  const handleAudioChunk = useCallback(
    async (chunk: AudioChunk) => {
      try {
        // Use the ref to find the correct loading card
        const loadingCardId = currentLoadingCardId.current

        if (!loadingCardId) {
          console.warn('No loading card ID available for audio chunk')
          return
        }

        // Clear the ref since we're processing this card
        currentLoadingCardId.current = null

        // Transcribe audio
        const transcription = await transcriptionService.transcribe(chunk.blob)

        if (!transcription.trim()) {
          // If transcription is empty, remove the loading card
          setTranscriptionCards(prev =>
            prev.filter(card => card.id !== loadingCardId)
          )
          return
        }

        // Update the loading card with transcription
        setTranscriptionCards(prev =>
          prev.map(card =>
            card.id === loadingCardId
              ? {
                  ...card,
                  text: transcription,
                  isTranscribing: false,
                  isTranslating: speakerLanguage !== otherPartyLanguage,
                  waveformData: chunk.waveformData || card.waveformData,
                }
              : card
          )
        )

        // Publish completed transcription for subject analysis
        publishTranscription({
          id: loadingCardId,
          text: transcription,
          timestamp: Date.now(),
        })

        // Start async translation only if languages differ
        if (speakerLanguage !== otherPartyLanguage) {
          translateTextAsync(loadingCardId, transcription)
        }
      } catch (error) {
        console.error('Failed to process audio chunk:', error)
        setError('Failed to process audio. Please try again.')
      }
    },
    [
      transcriptionService,
      translateTextAsync,
      publishTranscription,
      speakerLanguage,
      otherPartyLanguage,
    ]
  )

  // Handle system audio chunks (Japanese transcription)
  const handleSystemAudioChunk = useCallback(
    async (chunk: AudioChunk) => {
      try {
        // Use the ref to find the correct loading card
        const loadingCardId = currentSystemLoadingCardId.current

        if (!loadingCardId) {
          console.warn('No system loading card ID available for audio chunk')
          return
        }

        // Clear the ref since we're processing this card
        currentSystemLoadingCardId.current = null

        // Transcribe audio as Japanese
        const transcription = await systemTranscriptionService.transcribe(
          chunk.blob
        )

        if (!transcription.trim()) {
          // If transcription is empty, remove the loading card
          setSystemTranscriptionCards(prev =>
            prev.filter(card => card.id !== loadingCardId)
          )
          return
        }

        // Update the loading card with Japanese transcription
        setSystemTranscriptionCards(prev =>
          prev.map(card =>
            card.id === loadingCardId
              ? {
                  ...card,
                  text: transcription,
                  isTranscribing: false,
                  isTranslating: speakerLanguage !== otherPartyLanguage,
                  waveformData: chunk.waveformData || card.waveformData,
                }
              : card
          )
        )

        // Start async translation to English only if languages differ
        if (speakerLanguage !== otherPartyLanguage) {
          translateSystemTextAsync(loadingCardId, transcription)
        }

        // Publish completed system transcription for subject analysis only if enabled
        if (includeSystemAudioInAnalysis) {
          publishTranscription({
            id: loadingCardId,
            text: transcription,
            timestamp: Date.now(),
          })
        }
      } catch (error) {
        console.error('Failed to process system audio chunk:', error)
        setError('Failed to process system audio. Please try again.')
      }
    },
    [
      systemTranscriptionService,
      translateSystemTextAsync,
      publishTranscription,
      speakerLanguage,
      otherPartyLanguage,
      includeSystemAudioInAnalysis,
    ]
  )

  // Handle VAD speech detection
  const handleSpeechEnd = useCallback(
    async (audioData: Float32Array) => {
      try {
        console.log('🗣️ Processing speech end, audio length:', audioData.length)

        // Create a loading card immediately
        const cardId = generateId()
        const newCard: TranscriptionCard = {
          id: cardId,
          timestamp: Date.now(),
          isTranscribing: true,
          waveformData: [], // We'll update this with actual waveform if needed
        }

        // Store the card ID for the audio processing
        currentLoadingCardId.current = cardId

        setTranscriptionCards(prev => [...prev, newCard])

        // Convert VAD audio to blob
        const audioBlob = convertAudioToBlob(audioData)

        // Create audio chunk compatible with existing system
        const audioChunk: AudioChunk = {
          blob: audioBlob,
          timestamp: Date.now(),
          windowStart: Date.now() - (audioData.length / 16000) * 1000, // Estimate start time
          windowEnd: Date.now(),
          waveformData: [], // Could convert audioData to waveform if needed
        }

        // Process the audio chunk
        await handleAudioChunk(audioChunk)
      } catch (error) {
        console.error('Failed to process VAD speech:', error)
        setError('Failed to process speech. Please try again.')
      }
    },
    [generateId, handleAudioChunk]
  )

  // Handle system audio segment completion
  const handleSystemAudioSegment = useCallback(
    async (audioChunk: AudioChunk) => {
      try {
        console.log('🖥️ Processing system audio segment')

        // Create a loading card immediately
        const cardId = generateId()
        const newCard: SystemTranscriptionCard = {
          id: cardId,
          timestamp: Date.now(),
          isTranscribing: true,
          waveformData: audioChunk.waveformData || [],
        }

        // Store the card ID for the audio processing
        currentSystemLoadingCardId.current = cardId

        setSystemTranscriptionCards(prev => [...prev, newCard])

        // Process the audio chunk
        await handleSystemAudioChunk(audioChunk)
      } catch (error) {
        console.error('Failed to process system audio segment:', error)
        setError('Failed to process system audio. Please try again.')
      }
    },
    [generateId, handleSystemAudioChunk]
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
      vad.start()

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
