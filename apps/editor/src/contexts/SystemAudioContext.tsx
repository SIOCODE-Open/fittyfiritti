/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AudioChunk } from '../types'
import { convertAudioToBlob } from '../utils/audioUtils'

interface SystemAudioContextType {
  isCapturing: boolean
  systemSpeaking: boolean
  loading: boolean
  errored: string | false
  start: () => void
  stop: () => void
  toggle: () => void
  onAudioSegment: (callback: (chunk: AudioChunk) => void) => void
}

const SystemAudioContext = createContext<SystemAudioContextType | null>(null)

interface SystemAudioProviderProps {
  children: ReactNode
}

export function SystemAudioProvider({ children }: SystemAudioProviderProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [systemSpeaking, setSystemSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState<string | false>(false)

  const displayStreamRef = useRef<MediaStream | null>(null)
  const vadInstanceRef = useRef<VAD.MicVADInstance | null>(null)
  const audioSegmentCallbackRef = useRef<((chunk: AudioChunk) => void) | null>(
    null
  )

  // Handle VAD speech detection
  const handleSystemSpeechEnd = useCallback(async (audioData: Float32Array) => {
    try {
      console.log('🖥️ System VAD speech ended, audio length:', audioData.length)

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

      // Call the callback with the audio chunk
      if (audioSegmentCallbackRef.current) {
        audioSegmentCallbackRef.current(audioChunk)
      }
    } catch (error) {
      console.error('Failed to process system VAD speech:', error)
    }
  }, [])

  const handleSystemSpeechStart = useCallback(() => {
    console.log('🖥️ System VAD speech started')
    setSystemSpeaking(true)
  }, [])

  const handleSystemSpeechEndCallback = useCallback(() => {
    console.log('🖥️ System VAD speech ended callback')
    setSystemSpeaking(false)
  }, [])

  // Wait for VAD to load from CDN and initialize
  const initializeSystemVAD = useCallback(async () => {
    try {
      if (!window.VAD || !window.VAD.MicVAD) {
        throw new Error('VAD library not available')
      }

      console.log(
        '🖥️ Initializing System VAD with custom system audio stream...'
      )

      // Create VAD instance using custom stream from system audio
      const vad = await window.VAD.MicVAD.new({
        // Use CDN assets
        baseAssetPath:
          'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/',
        onnxWASMBasePath:
          'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
        model: 'legacy', // Use legacy model which is more reliable
        startOnLoad: false, // Don't start automatically
        // CRITICAL: Use custom stream function to provide system audio
        getStream: async () => {
          if (!displayStreamRef.current) {
            throw new Error('System audio stream not available')
          }
          console.log('🖥️ Providing system audio stream to VAD')
          return displayStreamRef.current
        },
        // Critical timing and sensitivity parameters
        positiveSpeechThreshold: 0.5, // Lower threshold for easier speech detection
        negativeSpeechThreshold: 0.35, // Higher threshold to avoid cutting off speech too early
        redemptionMs: 500, // Wait longer before ending speech segment
        preSpeechPadMs: 300, // Include 300ms before speech starts
        minSpeechMs: 400, // Minimum 400ms of speech to trigger onSpeechEnd
        // Callbacks
        onSpeechStart: () => {
          console.log('🖥️ System VAD Speech started')
          handleSystemSpeechStart()
        },
        onSpeechEnd: (audio: Float32Array) => {
          console.log('🖥️ System VAD Speech ended, audio length:', audio.length)
          handleSystemSpeechEndCallback()
          handleSystemSpeechEnd(audio)
        },
        onVADMisfire: () => {
          console.log('⚠️ System VAD misfire (speech too short)')
          setSystemSpeaking(false)
        },
        onFrameProcessed: (probabilities: VAD.SpeechProbabilities) => {
          // Add debug logging to see if frames are being processed
          if (probabilities.isSpeech > 0.2) {
            console.log(
              '🔊 System VAD Frame processed - speech probability:',
              probabilities.isSpeech.toFixed(3)
            )
          }
        },
        onSpeechRealStart: () => {
          console.log(
            '🖥️ System VAD Speech real start (passed minimum duration)'
          )
        },
      })

      vadInstanceRef.current = vad
      console.log('✅ System VAD initialized successfully')

      return vad
    } catch (error) {
      console.error('❌ Failed to initialize System VAD:', error)
      throw error
    }
  }, [
    handleSystemSpeechStart,
    handleSystemSpeechEndCallback,
    handleSystemSpeechEnd,
  ])

  const start = useCallback(async () => {
    if (isCapturing) return

    try {
      setLoading(true)
      setErrored(false)
      console.log('🖥️ Starting system audio capture with VAD...')

      // First: Request screen sharing with system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Required for screen sharing
        audio: {
          echoCancellation: false, // Don't suppress system audio
          noiseSuppression: false, // Keep original system audio
          sampleRate: 16000, // Good for speech recognition
        },
      })

      // Extract audio tracks
      const audioTracks = displayStream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error(
          'No audio track available in system capture. Please ensure system audio is enabled.'
        )
      }

      console.log('🖥️ Screen sharing with audio tracks:', audioTracks.length)

      // Handle stream ending (user stops screen sharing)
      const videoTracks = displayStream.getVideoTracks()
      if (videoTracks.length > 0) {
        videoTracks[0]!.onended = () => {
          console.log('🖥️ Screen sharing ended by user')
          // Call stop directly here instead of the function reference
          // to avoid circular dependency
          if (vadInstanceRef.current) {
            vadInstanceRef.current.pause()
            vadInstanceRef.current.destroy()
            vadInstanceRef.current = null
          }
          if (displayStreamRef.current) {
            displayStreamRef.current.getTracks().forEach(track => track.stop())
            displayStreamRef.current = null
          }
          setIsCapturing(false)
          setSystemSpeaking(false)
        }
      }

      // Store the stream so VAD can access it
      displayStreamRef.current = displayStream

      // Second: Initialize VAD with the captured stream
      const vad = await initializeSystemVAD()

      // Third: Start VAD listening to the system audio stream
      await vad.start()

      setIsCapturing(true)
      setLoading(false)
      console.log('✅ System audio capture with VAD started successfully')
    } catch (error) {
      console.error('❌ Failed to start system audio capture:', error)
      setErrored(
        error instanceof Error
          ? error.message
          : 'Failed to start screen sharing with audio'
      )
      setLoading(false)
      setIsCapturing(false)
    }
  }, [isCapturing, initializeSystemVAD])

  const stop = useCallback(() => {
    if (!isCapturing) return

    try {
      console.log('🛑 Stopping system audio capture...')

      // Stop VAD
      if (vadInstanceRef.current) {
        vadInstanceRef.current.pause()
        vadInstanceRef.current.destroy()
        vadInstanceRef.current = null
      }

      // Stop display stream
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach(track => track.stop())
        displayStreamRef.current = null
      }

      setIsCapturing(false)
      setSystemSpeaking(false)

      console.log('✅ System audio capture stopped')
    } catch (error) {
      console.error('Failed to stop system audio capture:', error)
      setErrored('Failed to stop screen sharing')
    }
  }, [isCapturing])

  const toggle = useCallback(() => {
    if (isCapturing) {
      stop()
    } else {
      start()
    }
  }, [isCapturing, start, stop])

  const onAudioSegment = useCallback(
    (callback: (chunk: AudioChunk) => void) => {
      audioSegmentCallbackRef.current = callback
    },
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vadInstanceRef.current) {
        vadInstanceRef.current.destroy()
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const value: SystemAudioContextType = {
    isCapturing,
    systemSpeaking,
    loading,
    errored,
    start,
    stop,
    toggle,
    onAudioSegment,
  }

  return (
    <SystemAudioContext.Provider value={value}>
      {children}
    </SystemAudioContext.Provider>
  )
}

export function useSystemAudio(): SystemAudioContextType {
  const context = useContext(SystemAudioContext)
  if (!context) {
    throw new Error('useSystemAudio must be used within a SystemAudioProvider')
  }
  return context
}
