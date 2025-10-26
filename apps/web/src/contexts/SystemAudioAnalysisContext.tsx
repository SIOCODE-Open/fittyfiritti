import React, { createContext, useContext, useState } from 'react'

export interface SystemAudioAnalysisContextValue {
  includeSystemAudioInAnalysis: boolean
  setIncludeSystemAudioInAnalysis: (include: boolean) => void
}

const SystemAudioAnalysisContext =
  createContext<SystemAudioAnalysisContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useSystemAudioAnalysis(): SystemAudioAnalysisContextValue {
  const context = useContext(SystemAudioAnalysisContext)
  if (!context) {
    throw new Error(
      'useSystemAudioAnalysis must be used within a SystemAudioAnalysisProvider'
    )
  }
  return context
}

interface SystemAudioAnalysisProviderProps {
  children: React.ReactNode
  initialValue?: boolean
}

export function SystemAudioAnalysisProvider({
  children,
  initialValue = true,
}: SystemAudioAnalysisProviderProps) {
  const [includeSystemAudioInAnalysis, setIncludeSystemAudioInAnalysis] =
    useState<boolean>(initialValue)

  const value: SystemAudioAnalysisContextValue = {
    includeSystemAudioInAnalysis,
    setIncludeSystemAudioInAnalysis,
  }

  return (
    <SystemAudioAnalysisContext.Provider value={value}>
      {children}
    </SystemAudioAnalysisContext.Provider>
  )
}
