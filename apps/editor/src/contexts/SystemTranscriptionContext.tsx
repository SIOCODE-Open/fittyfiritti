/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { TranscriptionServiceImpl } from '../services/TranscriptionService'
import { TranscriptionService } from '../types'

interface SystemTranscriptionContextType {
  systemTranscriptionService: TranscriptionService
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
    () => new TranscriptionServiceImpl(),
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

export function useSystemTranscription(): TranscriptionService {
  const context = useContext(SystemTranscriptionContext)
  if (!context) {
    throw new Error(
      'useSystemTranscription must be used within a SystemTranscriptionProvider'
    )
  }
  return context.systemTranscriptionService
}
