/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { TranslationServiceImpl } from '../services/TranslationService'
import { TranslationService } from '../types'

interface TranslationContextType {
  // Service for translating from speaker language to other party language (microphone cards)
  speakerToOtherPartyService: TranslationService
  // Service for translating from other party language to speaker language (system audio cards)
  otherPartyToSpeakerService: TranslationService
}

const TranslationContext = createContext<TranslationContextType | null>(null)

interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const speakerToOtherPartyService = useMemo(
    () => new TranslationServiceImpl(),
    []
  )
  const otherPartyToSpeakerService = useMemo(
    () => new TranslationServiceImpl(),
    []
  )

  const value = useMemo(
    () => ({
      speakerToOtherPartyService,
      otherPartyToSpeakerService,
    }),
    [speakerToOtherPartyService, otherPartyToSpeakerService]
  )

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
