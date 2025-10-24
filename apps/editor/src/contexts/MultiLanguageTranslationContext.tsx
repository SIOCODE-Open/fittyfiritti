/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import {
  MultiLanguageTranslationService,
  MultiLanguageTranslationServiceImpl,
} from '../services/MultiLanguageTranslationService'

interface MultiLanguageTranslationContextType {
  multiLanguageTranslationService: MultiLanguageTranslationService
}

const MultiLanguageTranslationContext =
  createContext<MultiLanguageTranslationContextType | null>(null)

interface MultiLanguageTranslationProviderProps {
  children: ReactNode
}

export function MultiLanguageTranslationProvider({
  children,
}: MultiLanguageTranslationProviderProps) {
  const multiLanguageTranslationService = useMemo(
    () => new MultiLanguageTranslationServiceImpl(),
    []
  )

  const value = useMemo(
    () => ({
      multiLanguageTranslationService,
    }),
    [multiLanguageTranslationService]
  )

  return (
    <MultiLanguageTranslationContext.Provider value={value}>
      {children}
    </MultiLanguageTranslationContext.Provider>
  )
}

export function useMultiLanguageTranslation(): MultiLanguageTranslationService {
  const context = useContext(MultiLanguageTranslationContext)
  if (!context) {
    throw new Error(
      'useMultiLanguageTranslation must be used within a MultiLanguageTranslationProvider'
    )
  }
  return context.multiLanguageTranslationService
}
