/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { RewriterServiceImpl } from '../services/RewriterService'
import { RewriterService } from '../types'

interface FormalizationContextType {
  rewriterService: RewriterService
  isFormalizationEnabled: boolean
  setFormalizationEnabled: (enabled: boolean) => void
}

const FormalizationContext = createContext<FormalizationContextType | null>(
  null
)

interface FormalizationProviderProps {
  children: ReactNode
}

export function FormalizationProvider({
  children,
}: FormalizationProviderProps) {
  const [isFormalizationEnabled, setFormalizationEnabled] =
    useState<boolean>(false)

  const rewriterService = useMemo(() => new RewriterServiceImpl(), [])

  const value = useMemo(
    () => ({
      rewriterService,
      isFormalizationEnabled,
      setFormalizationEnabled,
    }),
    [rewriterService, isFormalizationEnabled]
  )

  return (
    <FormalizationContext.Provider value={value}>
      {children}
    </FormalizationContext.Provider>
  )
}

export function useFormalization() {
  const context = useContext(FormalizationContext)
  if (!context) {
    throw new Error(
      'useFormalization must be used within a FormalizationProvider'
    )
  }
  return context
}
