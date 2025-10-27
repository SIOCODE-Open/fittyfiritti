/* eslint-disable react-refresh/only-export-components */
import {
  checkLanguageModelAvailability,
  createLanguageModelSession,
} from '@fittyfiritti/built-in-ai-api'
import { Icon } from '@iconify/react'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { HelpPage } from '../components/HelpPage'
import { ThemeToggleButton } from '../components/ThemeToggleButton'

type AIProviderState =
  | 'loading'
  | 'error'
  | 'downloadable'
  | 'downloading'
  | 'loading-model'
  | 'loading-vad'
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
  const [showHelpPage, setShowHelpPage] = useState(false)

  const preloadVAD = useCallback(async () => {
    try {
      // Wait for VAD to be available from CDN but don't create an instance
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

      await waitForVAD()
      console.log('VAD is available from CDN!')
    } catch (err) {
      console.error('Failed to check VAD availability:', err)
      // Don't fail completely if VAD check fails, just warn
      console.warn('VAD check failed, but continuing anyway')
    }
  }, [])

  const testModelCreation = useCallback(async () => {
    try {
      // Create a test session to ensure AI is working
      const session = await createLanguageModelSession({
        temperature: 0.5,
        topK: 3,
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
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

      // Now check VAD availability
      setState('loading-vad')
      await preloadVAD()

      setState('ready')
    } catch (err) {
      console.error('Failed to create AI model session:', err)
      setState('error')
      setError(
        'Failed to initialize AI model. The AI may not be fully ready yet.'
      )
    }
  }, [preloadVAD])

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
            setDownloadProgress(event.loaded)
          })
        },
        temperature: 0.5,
        topK: 3,
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center transition-colors duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Checking AI availability...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (state === 'error') {
    // If help page is open, show it
    if (showHelpPage) {
      return (
        <HelpPage onBack={() => setShowHelpPage(false)} initialTab="setup" />
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center max-w-md transition-colors duration-300">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400 transition-colors duration-300"
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
            AI Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">
            {error}
          </p>
          <button
            onClick={retry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>

        {/* Bottom Left Buttons */}
        <div className="fixed bottom-8 left-8 flex gap-3 z-50">
          {/* Theme Toggle Button */}
          <ThemeToggleButton />

          {/* Help Button */}
          <button
            onClick={() => setShowHelpPage(true)}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            title="Help & Setup Guide"
          >
            <Icon
              icon="mdi:help-circle"
              className="w-8 h-8 group-hover:scale-110 transition-transform"
            />
          </button>

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

  // Downloadable state
  if (state === 'downloadable') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center max-w-md transition-colors duration-300">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-colors duration-300"
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
            Download AI Model
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center max-w-md transition-colors duration-300">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-bounce transition-colors duration-300"
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
            Downloading AI Model
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">
            Please wait while the AI model is being downloaded...
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 transition-colors duration-300">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            {Math.round(downloadProgress * 100)}% complete
          </p>
        </div>
      </div>
    )
  }

  // Loading model state
  if (state === 'loading-model') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center transition-colors duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Initializing AI model...
          </p>
        </div>
      </div>
    )
  }

  // Loading VAD state
  if (state === 'loading-vad') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center transition-colors duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Loading voice detection...
          </p>
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
