/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import {
  SystemTranscriptionService,
  SystemTranscriptionServiceImpl,
} from '../services/SystemTranscriptionService'

interface SystemTranscriptionContextType {
  systemTranscriptionService: SystemTranscriptionService
}

const SystemTranscriptionContext =
  createContext<SystemTranscriptionContextType | null>(null)

interface SystemTranscriptionProviderProps {
  children: ReactNode
}

export function SystemTranscriptionProvider({
  children,
}: SystemTranscriptionProviderProps) {
  const systemTranscriptionService = useMemo(
    () => new SystemTranscriptionServiceImpl(),
    []
  )

  const value = useMemo(
    () => ({
      systemTranscriptionService,
    }),
    [systemTranscriptionService]
  )

  return (
    <SystemTranscriptionContext.Provider value={value}>
      {children}
    </SystemTranscriptionContext.Provider>
  )
}

export function useSystemTranscription(): SystemTranscriptionService {
  const context = useContext(SystemTranscriptionContext)
  if (!context) {
    throw new Error(
      'useSystemTranscription must be used within a SystemTranscriptionProvider'
    )
  }
  return context.systemTranscriptionService
}
