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

interface VADContextType {
  isListening: boolean
  userSpeaking: boolean
  loading: boolean
  errored: string | false
  start: () => void
  pause: () => void
  toggle: () => void
  onSpeechEnd: (callback: (audio: Float32Array) => void) => void
  onSpeechStart: (callback: () => void) => void
}

const VADContext = createContext<VADContextType | null>(null)

interface VADProviderProps {
  children: ReactNode
}

export function VADProvider({ children }: VADProviderProps) {
  const [isListening, setIsListening] = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState<string | false>(false)
  const [vadInstance, setVadInstance] = useState<VAD.MicVADInstance | null>(
    null
  )

  const speechEndCallbackRef = useRef<((audio: Float32Array) => void) | null>(
    null
  )
  const speechStartCallbackRef = useRef<(() => void) | null>(null)

  // Wait for VAD to load from CDN and initialize
  useEffect(() => {
    let isMounted = true
    let vadInstanceRef: VAD.MicVADInstance | null = null

    const waitForVAD = () => {
      return new Promise<void>((resolve, reject) => {
        const maxAttempts = 50 // 5 seconds max wait
        let attempts = 0

        const checkVAD = () => {
          attempts++
          if (window.VAD && window.VAD.MicVAD) {
            resolve()
          } else if (attempts >= maxAttempts) {
            reject(new Error('VAD library failed to load from CDN'))
          } else {
            setTimeout(checkVAD, 100)
          }
        }

        checkVAD()
      })
    }

    const initializeVAD = async () => {
      try {
        setLoading(true)

        // Wait for VAD to be available from CDN
        await waitForVAD()

        if (!isMounted) return

        // Create VAD instance using the global VAD object
        const vad = await window.VAD.MicVAD.new({
          // Use CDN assets
          baseAssetPath:
            'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/',
          onnxWASMBasePath:
            'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
          model: 'legacy', // Use legacy model which is more reliable
          startOnLoad: false, // Don't start automatically
          // Critical timing and sensitivity parameters
          positiveSpeechThreshold: 0.5, // Lower threshold for easier speech detection
          negativeSpeechThreshold: 0.35, // Higher threshold to avoid cutting off speech too early
          redemptionMs: 500, // Wait longer before ending speech segment (1.5 seconds)
          preSpeechPadMs: 300, // Include 300ms before speech starts
          minSpeechMs: 400, // Minimum 400ms of speech to trigger onSpeechEnd
          // Callbacks
          onSpeechStart: () => {
            setUserSpeaking(true)
            if (speechStartCallbackRef.current) {
              speechStartCallbackRef.current()
            }
          },
          onSpeechEnd: (audio: Float32Array) => {
            setUserSpeaking(false)
            if (speechEndCallbackRef.current) {
              speechEndCallbackRef.current(audio)
            }
          },
          onVADMisfire: () => {
            setUserSpeaking(false)
          },
          onSpeechRealStart: () => {
            // Speech passed minimum duration threshold
          },
        })

        if (!isMounted) {
          vad.destroy()
          return
        }

        vadInstanceRef = vad
        setVadInstance(vadInstanceRef)
        setLoading(false)
        console.log('✅ VAD initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize VAD:', error)
        if (isMounted) {
          setErrored(
            error instanceof Error ? error.message : 'Failed to initialize VAD'
          )
          setLoading(false)
        }
      }
    }

    initializeVAD()

    return () => {
      isMounted = false
      if (vadInstanceRef) {
        vadInstanceRef.destroy()
      }
    }
  }, [])

  const start = useCallback(async () => {
    if (!vadInstance || isListening) return

    try {
      // First check if we have microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop())
      } catch (permError) {
        console.error('❌ Microphone permission denied:', permError)
        setErrored('Microphone permission is required for voice detection')
        return
      }

      await vadInstance.start()
      setIsListening(true)
      console.log('🎤 VAD listening started successfully')
    } catch (error) {
      console.error('❌ Failed to start VAD:', error)
      setErrored(
        error instanceof Error ? error.message : 'Failed to start listening'
      )
    }
  }, [vadInstance, isListening])

  const pause = useCallback(() => {
    if (!vadInstance || !isListening) return

    try {
      vadInstance.pause()
      setIsListening(false)
      setUserSpeaking(false)
    } catch (error) {
      console.error('Failed to pause VAD:', error)
    }
  }, [vadInstance, isListening])

  const toggle = useCallback(() => {
    if (isListening) {
      pause()
    } else {
      start()
    }
  }, [isListening, start, pause])

  const onSpeechEnd = useCallback((callback: (audio: Float32Array) => void) => {
    speechEndCallbackRef.current = callback
  }, [])

  const onSpeechStart = useCallback((callback: () => void) => {
    speechStartCallbackRef.current = callback
  }, [])

  const value: VADContextType = {
    isListening,
    userSpeaking,
    loading,
    errored,
    start,
    pause,
    toggle,
    onSpeechEnd,
    onSpeechStart,
  }

  return <VADContext.Provider value={value}>{children}</VADContext.Provider>
}

export function useVAD(): VADContextType {
  const context = useContext(VADContext)
  if (!context) {
    throw new Error('useVAD must be used within a VADProvider')
  }
  return context
}
