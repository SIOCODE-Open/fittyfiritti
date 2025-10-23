/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { AudioCaptureServiceImpl } from '../services/AudioCaptureService'
import { AudioCaptureService } from '../types'

interface AudioCaptureContextType {
  audioService: AudioCaptureService
}

const AudioCaptureContext = createContext<AudioCaptureContextType | null>(null)

interface AudioCaptureProviderProps {
  children: ReactNode
}

export function AudioCaptureProvider({ children }: AudioCaptureProviderProps) {
  const audioService = useMemo(() => new AudioCaptureServiceImpl(), [])

  const value = useMemo(
    () => ({
      audioService,
    }),
    [audioService]
  )

  return (
    <AudioCaptureContext.Provider value={value}>
      {children}
    </AudioCaptureContext.Provider>
  )
}

export function useAudioCapture(): AudioCaptureService {
  const context = useContext(AudioCaptureContext)
  if (!context) {
    throw new Error(
      'useAudioCapture must be used within an AudioCaptureProvider'
    )
  }
  return context.audioService
}
