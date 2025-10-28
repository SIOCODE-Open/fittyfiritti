/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { PresentationControlService } from '../services/PresentationControlService'

interface PresentationControlContextType {
  service: PresentationControlService
  isInitialized: boolean
  isInitializing: boolean
  error: string | null
}

const PresentationControlContext =
  createContext<PresentationControlContextType | null>(null)

interface PresentationControlProviderProps {
  children: ReactNode
}

export function PresentationControlProvider({
  children,
}: PresentationControlProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<PresentationControlService>(
    new PresentationControlService()
  )

  useEffect(() => {
    let isMounted = true
    const service = serviceRef.current

    const initializeService = async () => {
      try {
        setIsInitializing(true)
        setError(null)

        await service.initialize()

        if (isMounted) {
          setIsInitialized(true)
          setIsInitializing(false)
          console.log('✅ PresentationControlService initialized successfully')
        }
      } catch (err) {
        console.error(
          '❌ Failed to initialize PresentationControlService:',
          err
        )
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize presentation control service'
          )
          setIsInitializing(false)
        }
      }
    }

    initializeService()

    return () => {
      isMounted = false
      service.destroy()
    }
  }, [])

  const value: PresentationControlContextType = {
    service: serviceRef.current,
    isInitialized,
    isInitializing,
    error,
  }

  return (
    <PresentationControlContext.Provider value={value}>
      {children}
    </PresentationControlContext.Provider>
  )
}

export function usePresentationControl(): PresentationControlContextType {
  const context = useContext(PresentationControlContext)
  if (!context) {
    throw new Error(
      'usePresentationControl must be used within a PresentationControlProvider'
    )
  }
  return context
}
