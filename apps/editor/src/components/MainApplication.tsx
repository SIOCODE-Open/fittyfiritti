import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioCapture } from '../contexts/AudioCaptureContext'
import { useTranscription } from '../contexts/TranscriptionContext'
import { useTranslation } from '../contexts/TranslationContext'
import { AppState, AudioChunk, TranscriptionCard } from '../types'
import { ControlPanel } from './ControlPanel'
import { TranscriptionDisplay } from './TranscriptionDisplay'
import { WaveformDisplay } from './WaveformDisplay'

export function MainApplication() {
  const audioService = useAudioCapture()
  const transcriptionService = useTranscription()
  const translationService = useTranslation()

  const [appState, setAppState] = useState<AppState>({
    isRecording: false,
    currentTranscription: '',
    transcriptionCards: [],
    liveWaveformData: [],
  })

  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentLoadingCardId = useRef<string | null>(null)

  // Generate unique IDs
  const generateId = useCallback(
    () => Math.random().toString(36).substr(2, 9),
    []
  )

  // Async translation helper
  const translateTextAsync = useCallback(
    (cardId: string, text: string) => {
      setAppState(prev => ({
        ...prev,
        transcriptionCards: prev.transcriptionCards.map(card =>
          card.id === cardId ? { ...card, isTranslating: true } : card
        ),
      }))

      translationService
        .translateToJapanese(text)
        .then(translation => {
          setAppState(prev => ({
            ...prev,
            transcriptionCards: prev.transcriptionCards.map(card =>
              card.id === cardId
                ? { ...card, textJa: translation, isTranslating: false }
                : card
            ),
          }))
        })
        .catch(error => {
          console.error('Translation failed:', error)
          setAppState(prev => ({
            ...prev,
            transcriptionCards: prev.transcriptionCards.map(card =>
              card.id === cardId ? { ...card, isTranslating: false } : card
            ),
          }))
        })
    },
    [translationService]
  )

  // Handle live waveform data updates
  const handleWaveformData = useCallback((waveformData: number[]) => {
    setAppState(prev => ({
      ...prev,
      liveWaveformData: waveformData,
    }))
  }, [])

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
          setAppState(prev => ({
            ...prev,
            transcriptionCards: prev.transcriptionCards.filter(
              card => card.id !== loadingCardId
            ),
          }))
          return
        }

        // Update the loading card with transcription
        setAppState(prev => ({
          ...prev,
          transcriptionCards: prev.transcriptionCards.map(card =>
            card.id === loadingCardId
              ? {
                  ...card,
                  text: transcription,
                  isTranscribing: false,
                  isTranslating: true,
                  waveformData: chunk.waveformData || card.waveformData,
                }
              : card
          ),
        }))

        // Start async translation
        translateTextAsync(loadingCardId, transcription)
      } catch (error) {
        console.error('Failed to process audio chunk:', error)
        setError('Failed to process audio. Please try again.')
      }
    },
    [transcriptionService, translateTextAsync]
  )

  // Start recording
  const handleStartRecording = async () => {
    try {
      setIsInitializing(true)
      setError(null)

      // Initialize services
      await Promise.all([
        transcriptionService.initialize(),
        translationService.initialize(),
      ])

      // Set up audio chunk handler
      audioService.onAudioChunk(handleAudioChunk)
      audioService.onWaveformData(handleWaveformData)

      // Start audio capture
      await audioService.startCapture()

      setAppState(prev => ({ ...prev, isRecording: true }))
      setIsInitializing(false)

      console.log('🎙️ Recording started successfully')
    } catch (error) {
      console.error('Failed to start recording:', error)
      setError(
        'Failed to start recording. Please check microphone permissions.'
      )
      setIsInitializing(false)
    }
  }

  // Handle stopping recording
  const handleStopRecording = () => {
    try {
      audioService.stopCapture()

      setAppState(prev => ({
        ...prev,
        isRecording: false,
        currentTranscription: '',
      }))

      console.log('🛑 Recording stopped')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      setError('Failed to stop recording.')
    }
  }

  // Handle segment completion (manual trigger)
  const handleCompleteSegment = useCallback(() => {
    if (appState.isRecording) {
      // Create a loading card immediately
      const cardId = generateId()
      const newCard: TranscriptionCard = {
        id: cardId,
        timestamp: Date.now(),
        isTranscribing: true,
        waveformData: [...appState.liveWaveformData], // Copy current waveform data
      }

      // Store the card ID for the audio processing
      currentLoadingCardId.current = cardId

      setAppState(prev => ({
        ...prev,
        transcriptionCards: [...prev.transcriptionCards, newCard],
        liveWaveformData: [], // Reset live waveform for next segment
      }))

      // Trigger the audio service to complete the segment
      audioService.completeSegment()
    }
  }, [
    appState.isRecording,
    appState.liveWaveformData,
    audioService,
    generateId,
  ])

  // Space key listener for segment completion
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && appState.isRecording) {
        event.preventDefault()
        handleCompleteSegment()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [appState.isRecording, handleCompleteSegment])

  // Cleanup services on unmount
  useEffect(() => {
    return () => {
      audioService.stopCapture()
      transcriptionService.destroy()
      translationService.destroy()
    }
  }, [audioService, transcriptionService, translationService])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">DiAI</h1>
        <p className="text-gray-600">
          Real-time AI Transcription & Note-Taking
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <ControlPanel
        isRecording={appState.isRecording}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onCompleteSegment={handleCompleteSegment}
        isInitializing={isInitializing}
      />

      {/* Live Transcription */}
      <TranscriptionDisplay
        currentTranscription={appState.currentTranscription}
        isRecording={appState.isRecording}
        liveWaveformData={appState.liveWaveformData}
      />

      {/* Transcription Cards */}
      <div className="space-y-4">
        {appState.transcriptionCards.map(card => (
          <div
            key={card.id}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            {/* Waveform for this card */}
            {card.waveformData && card.waveformData.length > 0 && (
              <div className="mb-4">
                <WaveformDisplay
                  waveformData={card.waveformData}
                  width={400}
                  height={50}
                  isLive={false}
                  className="w-full flex justify-center"
                />
              </div>
            )}

            {/* Transcription content */}
            {card.isTranscribing && (
              <div className="text-blue-600 flex items-center gap-2 mb-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Transcribing audio...</span>
              </div>
            )}

            {card.text && (
              <div className="text-gray-900 mb-3 leading-relaxed">
                {card.text}
              </div>
            )}

            {/* Translation section */}
            {card.isTranslating && (
              <div className="text-sm text-blue-600 flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                Translating...
              </div>
            )}
            {card.textJa && !card.isTranslating && (
              <div className="text-gray-600 text-sm pt-3 border-t border-gray-100">
                <span className="font-medium text-gray-700">日本語:</span>{' '}
                {card.textJa}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-3">
              {new Date(card.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {appState.transcriptionCards.length === 0 && !appState.isRecording && (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Start
            </h3>
            <p className="text-gray-600 mb-4">
              Click "Start Recording" to begin transcribing your speech. Press{' '}
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Space</kbd>{' '}
              to complete a segment.
            </p>
          </div>
        )}

        {appState.isRecording && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-blue-800 font-medium">Recording...</span>
              <span className="text-blue-600 text-sm">
                Press{' '}
                <kbd className="px-1 py-0.5 bg-white rounded text-xs">
                  Space
                </kbd>{' '}
                to complete segment
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
