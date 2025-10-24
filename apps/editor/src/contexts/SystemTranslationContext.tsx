/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import {
  SystemTranslationService,
  SystemTranslationServiceImpl,
} from '../services/SystemTranslationService'

interface SystemTranslationContextType {
  systemTranslationService: SystemTranslationService
}

const SystemTranslationContext =
  createContext<SystemTranslationContextType | null>(null)

interface SystemTranslationProviderProps {
  children: ReactNode
}

export function SystemTranslationProvider({
  children,
}: SystemTranslationProviderProps) {
  const systemTranslationService = useMemo(
    () => new SystemTranslationServiceImpl(),
    []
  )

  const value = useMemo(
    () => ({
      systemTranslationService,
    }),
    [systemTranslationService]
  )

  return (
    <SystemTranslationContext.Provider value={value}>
      {children}
    </SystemTranslationContext.Provider>
  )
}

export function useSystemTranslation(): SystemTranslationService {
  const context = useContext(SystemTranslationContext)
  if (!context) {
    throw new Error(
      'useSystemTranslation must be used within a SystemTranslationProvider'
    )
  }
  return context.systemTranslationService
}
