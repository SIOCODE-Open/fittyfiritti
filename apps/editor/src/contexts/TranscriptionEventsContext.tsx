import React, { createContext, useCallback, useContext, useRef } from 'react'

export interface CompletedTranscription {
  id: string
  text: string
  timestamp: number
}

export type TranscriptionEventListener = (
  transcription: CompletedTranscription
) => void

export interface TranscriptionEventsContextValue {
  onTranscriptionComplete: (listener: TranscriptionEventListener) => () => void
  publishTranscription: (transcription: CompletedTranscription) => void
}

const TranscriptionEventsContext =
  createContext<TranscriptionEventsContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useTranscriptionEvents(): TranscriptionEventsContextValue {
  const context = useContext(TranscriptionEventsContext)
  if (!context) {
    throw new Error(
      'useTranscriptionEvents must be used within a TranscriptionEventsProvider'
    )
  }
  return context
}

interface TranscriptionEventsProviderProps {
  children: React.ReactNode
}

export function TranscriptionEventsProvider({
  children,
}: TranscriptionEventsProviderProps) {
  const listenersRef = useRef<Set<TranscriptionEventListener>>(new Set())

  const onTranscriptionComplete = useCallback(
    (listener: TranscriptionEventListener) => {
      listenersRef.current.add(listener)

      // Return cleanup function
      return () => {
        listenersRef.current.delete(listener)
      }
    },
    []
  )

  const publishTranscription = useCallback(
    (transcription: CompletedTranscription) => {
      // Notify all listeners
      listenersRef.current.forEach(listener => {
        try {
          listener(transcription)
        } catch (error) {
          console.error('Error in transcription event listener:', error)
        }
      })
    },
    []
  )

  const value: TranscriptionEventsContextValue = {
    onTranscriptionComplete,
    publishTranscription,
  }

  return (
    <TranscriptionEventsContext.Provider value={value}>
      {children}
    </TranscriptionEventsContext.Provider>
  )
}
