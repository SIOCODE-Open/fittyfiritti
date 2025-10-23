/* eslint-disable react-refresh/only-export-components */
import {
  checkLanguageModelAvailability,
  createLanguageModelSession,
} from '@diai/built-in-ai-api'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

type AIProviderState =
  | 'loading'
  | 'error'
  | 'downloadable'
  | 'downloading'
  | 'loading-model'
  | 'ready'

interface AIAvailabilityContextType {
  state: AIProviderState
  error: string | null
  downloadProgress: number
  startDownload: () => void
  retry: () => void
}

const AIAvailabilityContext = createContext<AIAvailabilityContextType | null>(
  null
)

interface AIAvailabilityProviderProps {
  children: ReactNode
}

export function AIAvailabilityProvider({
  children,
}: AIAvailabilityProviderProps) {
  const [state, setState] = useState<AIProviderState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const testModelCreation = useCallback(async () => {
    try {
      console.log('Testing AI model creation...')

      // Create a test session to ensure AI is working
      const session = await createLanguageModelSession({
        temperature: 0.5,
        topK: 3,
        initialPrompts: [
          {
            role: 'system',
            content: 'You are a test assistant.',
          },
        ],
      })

      // Test with a simple prompt
      await session.prompt('Hello, respond with "AI is ready"')

      // Clean up test session
      session.destroy()

      console.log('AI model is ready!')
      setState('ready')
    } catch (err) {
      console.error('Failed to create AI model session:', err)
      setState('error')
      setError(
        'Failed to initialize AI model. The AI may not be fully ready yet.'
      )
    }
  }, [])

  const checkAvailability = useCallback(async () => {
    try {
      setState('loading')
      setError(null)

      const availability = await checkLanguageModelAvailability()
      console.log('AI Availability:', availability)

      switch (availability) {
        case 'available':
          // AI is ready, now test if we can create a session
          setState('loading-model')
          await testModelCreation()
          break

        case 'unavailable':
          setState('error')
          setError(
            'Chrome Built-in AI is not available. Please ensure you are using Chrome 128+ with AI features enabled.'
          )
          break

        case 'downloadable':
          // AI is available but needs to be downloaded first
          setState('downloadable')
          break

        case 'downloading':
          // AI is currently being downloaded
          setState('downloading')
          // Note: In a real scenario, we'd need to track the existing download
          // For now, we'll just show downloading state
          break

        default:
          setState('error')
          setError(`Unknown AI availability state: ${availability}`)
      }
    } catch (err) {
      console.error('Failed to check AI availability:', err)
      setState('error')
      setError(
        'Failed to check AI availability. Please ensure you are using Chrome with Built-in AI enabled.'
      )
    }
  }, [testModelCreation])

  const startDownload = async () => {
    try {
      setState('downloading')
      setDownloadProgress(0)
      setError(null)

      console.log('Starting AI model download...')

      // Simulate download progress for better UX
      simulateDownloadProgress()

      // Attempt to create a session with download monitor
      const session = await createLanguageModelSession({
        monitor: monitor => {
          monitor.addEventListener('downloadprogress', event => {
            console.log('Download progress:', event.loaded * 100, '%')
            setDownloadProgress(event.loaded)
          })
        },
        temperature: 0.5,
        topK: 3,
      })

      // If we reach here, download was successful
      session.destroy()
      setState('loading-model')
      await testModelCreation()
    } catch (err) {
      console.error('Failed to download AI model:', err)
      setState('error')
      setError('Failed to download AI model. Please try again.')
    }
  }

  // Simulate download progress for better UX
  const simulateDownloadProgress = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 0.02 // Increment by 2%
      setDownloadProgress(Math.min(progress, 0.95)) // Cap at 95%

      if (progress >= 0.95) {
        clearInterval(interval)
      }
    }, 100)
  }

  const retry = () => {
    checkAvailability()
  }

  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  const value = {
    state,
    error,
    downloadProgress,
    startDownload,
    retry,
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking AI availability...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            AI Not Available
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={retry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Downloadable state
  if (state === 'downloadable') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Download AI Model
          </h2>
          <p className="text-gray-600 mb-6">
            The AI model needs to be downloaded first to use this application.
            This is a one-time process.
          </p>
          <button
            onClick={startDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Download AI Model
          </button>
        </div>
      </div>
    )
  }

  // Downloading state
  if (state === 'downloading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Downloading AI Model
          </h2>
          <p className="text-gray-600 mb-6">
            Please wait while the AI model is being downloaded...
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {Math.round(downloadProgress * 100)}% complete
          </p>
        </div>
      </div>
    )
  }

  // Loading model state
  if (state === 'loading-model') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing AI model...</p>
        </div>
      </div>
    )
  }

  // Ready state - render children
  return (
    <AIAvailabilityContext.Provider value={value}>
      {children}
    </AIAvailabilityContext.Provider>
  )
}

export function useAIAvailability(): AIAvailabilityContextType {
  const context = useContext(AIAvailabilityContext)
  if (!context) {
    throw new Error(
      'useAIAvailability must be used within an AIAvailabilityProvider'
    )
  }
  return context
}
