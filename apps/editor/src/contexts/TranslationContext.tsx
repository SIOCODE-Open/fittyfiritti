/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { TranslationServiceImpl } from '../services/TranslationService'
import { TranslationService } from '../types'

interface TranslationContextType {
  translationService: TranslationService
}

const TranslationContext = createContext<TranslationContextType | null>(null)

interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const translationService = useMemo(() => new TranslationServiceImpl(), [])

  const value = useMemo(
    () => ({
      translationService,
    }),
    [translationService]
  )

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation(): TranslationService {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context.translationService
}
