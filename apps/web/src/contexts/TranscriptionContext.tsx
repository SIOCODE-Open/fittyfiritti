/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { TranscriptionServiceImpl } from '../services/TranscriptionService'
import { TranscriptionService } from '../types'

interface TranscriptionContextType {
  transcriptionService: TranscriptionService
}

const TranscriptionContext = createContext<TranscriptionContextType | null>(
  null
)

interface TranscriptionProviderProps {
  children: ReactNode
}

export function TranscriptionProvider({
  children,
}: TranscriptionProviderProps) {
  const transcriptionService = useMemo(() => new TranscriptionServiceImpl(), [])

  const value = useMemo(
    () => ({
      transcriptionService,
    }),
    [transcriptionService]
  )

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  )
}

export function useTranscription(): TranscriptionService {
  const context = useContext(TranscriptionContext)
  if (!context) {
    throw new Error(
      'useTranscription must be used within a TranscriptionProvider'
    )
  }
  return context.transcriptionService
}
