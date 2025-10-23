import { Icon } from '@iconify/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranscription } from '../contexts/TranscriptionContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useVAD } from '../contexts/VADContext'
import { AppState, AudioChunk, TranscriptionCard } from '../types'

export function MainApplication() {
  const transcriptionService = useTranscription()
  const translationService = useTranslation()
  const vad = useVAD()

  const [appState, setAppState] = useState<AppState>({
    isRecording: false,
    currentTranscription: '',
    transcriptionCards: [],
    liveWaveformData: [],
  })

  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasStartedRecording, setHasStartedRecording] = useState(false)
  const currentLoadingCardId = useRef<string | null>(null)

  // Generate unique IDs
  const generateId = useCallback(
    () => Math.random().toString(36).substr(2, 9),
    []
  )

  // Convert Float32Array to Blob for transcription
  const convertAudioToBlob = useCallback((audioData: Float32Array): Blob => {
    // Convert Float32Array to WAV format
    const length = audioData.length
    const buffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    const sampleRate = 16000 // VAD uses 16kHz
    const numChannels = 1
    const bitsPerSample = 16

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true)
    view.setUint16(32, (numChannels * bitsPerSample) / 8, true)
    view.setUint16(34, bitsPerSample, true)
    writeString(36, 'data')
    view.setUint32(40, length * 2, true)

    // Convert float32 samples to int16
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i] || 0))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }

    return new Blob([buffer], { type: 'audio/wav' })
  }, [])

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

        setAppState(prev => ({
          ...prev,
          transcriptionCards: [...prev.transcriptionCards, newCard],
        }))

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
    [generateId, convertAudioToBlob, handleAudioChunk]
  )

  const handleSpeechStart = useCallback(() => {
    console.log('🗣️ Speech started')
    // Could add visual feedback here
  }, [])

  // Start recording with VAD
  const handleStartRecording = async () => {
    try {
      setIsInitializing(true)
      setError(null)

      // Initialize services
      await Promise.all([
        transcriptionService.initialize(),
        translationService.initialize(),
      ])

      // Set up VAD callbacks
      vad.onSpeechEnd(handleSpeechEnd)
      vad.onSpeechStart(handleSpeechStart)

      // Start VAD listening
      vad.start()

      setAppState(prev => ({ ...prev, isRecording: true }))
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

  // Handle stopping recording
  const handleStopRecording = () => {
    try {
      // Stop VAD listening
      vad.pause()

      setAppState(prev => ({
        ...prev,
        isRecording: false,
        currentTranscription: '',
      }))

      console.log('🛑 VAD recording stopped')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      setError('Failed to stop recording.')
    }
  }

  // Cleanup services on unmount only
  useEffect(() => {
    return () => {
      // Capture current values at cleanup time to avoid stale closures
      const currentVad = vad
      const currentTranscriptionService = transcriptionService
      const currentTranslationService = translationService

      currentVad.pause()
      currentTranscriptionService.destroy()
      currentTranslationService.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount/unmount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icon
              icon="mdi:alert-circle"
              className="w-5 h-5 text-red-600 mr-2"
            />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* When not recording AND never started recording: Show huge record button in center */}
        {!appState.isRecording && !hasStartedRecording && (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">DiAI</h1>
              <p className="text-xl text-gray-600">
                Real-time AI Transcription & Note-Taking
              </p>
            </div>

            <button
              onClick={handleStartRecording}
              disabled={isInitializing}
              className="w-32 h-32 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center group"
            >
              {isInitializing ? (
                <Icon icon="mdi:loading" className="w-12 h-12 animate-spin" />
              ) : (
                <Icon
                  icon="mdi:microphone"
                  className="w-16 h-16 group-hover:scale-110 transition-transform"
                />
              )}
            </button>
          </div>
        )}

        {/* When recording OR has started recording: Show messages layout */}
        {(appState.isRecording || hasStartedRecording) && (
          <div className="pt-8 pb-32">
            {/* Transcription Cards - Newest First */}
            <div className="space-y-6">
              {appState.transcriptionCards
                .slice()
                .reverse()
                .map(card => (
                  <div
                    key={card.id}
                    className="bg-white rounded-xl p-8 shadow-lg border border-gray-200"
                  >
                    {/* Transcription content */}
                    {card.isTranscribing && (
                      <div className="text-blue-600 flex items-center gap-3 mb-6">
                        <Icon
                          icon="mdi:microphone"
                          className="w-12 h-12 animate-pulse"
                        />
                      </div>
                    )}

                    {card.text && (
                      <div className="text-gray-900 mb-6 text-2xl leading-relaxed font-medium">
                        {card.text}
                      </div>
                    )}

                    {/* Translation section */}
                    {card.isTranslating && (
                      <div className="text-green-600 flex items-center gap-3">
                        <Icon
                          icon="mdi:translate"
                          className="w-12 h-12 animate-pulse"
                        />
                      </div>
                    )}
                    {card.textJa && !card.isTranslating && (
                      <div className="text-green-700 text-2xl pt-4 border-t border-gray-200 leading-relaxed">
                        {card.textJa}
                      </div>
                    )}
                  </div>
                ))}

              {appState.transcriptionCards.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Icon
                      icon={
                        appState.isRecording
                          ? 'mdi:microphone'
                          : 'mdi:microphone-off'
                      }
                      className={`w-10 h-10 ${appState.isRecording ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Panel at Bottom - Shows when recording has been started */}
      {hasStartedRecording && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {appState.isRecording ? (
                  <>
                    <Icon
                      icon="mdi:microphone"
                      className="w-8 h-8 text-red-500 animate-pulse"
                    />
                    <Icon
                      icon="mdi:account-voice"
                      className={`w-6 h-6 ${vad.userSpeaking ? 'text-green-500' : 'text-gray-400'}`}
                    />
                  </>
                ) : (
                  <Icon
                    icon="mdi:microphone-off"
                    className="w-8 h-8 text-gray-400"
                  />
                )}
              </div>

              {appState.isRecording ? (
                <button
                  onClick={handleStopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors shadow-lg hover:shadow-xl"
                >
                  <Icon icon="mdi:stop" className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={isInitializing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-4 rounded-full transition-colors shadow-lg hover:shadow-xl"
                >
                  {isInitializing ? (
                    <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
                  ) : (
                    <Icon icon="mdi:play" className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
