/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type SoloParticipant = 'user' | 'system'

interface SoloRecordingContextType {
  isSoloMode: boolean
  soloParticipant: SoloParticipant | null
  recordingStartTime: number | null
  recordingDuration: number
  startSoloRecording: (participant: SoloParticipant) => void
  cancelSoloRecording: () => void
  submitSoloRecording: () => void
}

const SoloRecordingContext = createContext<SoloRecordingContextType | null>(
  null
)

interface SoloRecordingProviderProps {
  children: ReactNode
  onSoloRecordingSubmitted?: (participant: SoloParticipant) => void
  onSoloRecordingCancelled?: () => void
}

export function SoloRecordingProvider({
  children,
  onSoloRecordingSubmitted,
  onSoloRecordingCancelled,
}: SoloRecordingProviderProps) {
  const [isSoloMode, setIsSoloMode] = useState(false)
  const [soloParticipant, setSoloParticipant] =
    useState<SoloParticipant | null>(null)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null
  )
  const [recordingDuration, setRecordingDuration] = useState(0)

  // Update duration every 100ms when recording
  useEffect(() => {
    if (!isSoloMode || recordingStartTime === null) {
      return
    }

    const interval = setInterval(() => {
      const now = Date.now()
      const duration = Math.floor((now - recordingStartTime) / 1000)
      setRecordingDuration(duration)
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [isSoloMode, recordingStartTime])

  const startSoloRecording = useCallback((participant: SoloParticipant) => {
    console.log(`🎙️ Starting solo recording for ${participant}`)
    setIsSoloMode(true)
    setSoloParticipant(participant)
    setRecordingStartTime(Date.now())
    setRecordingDuration(0)
  }, [])

  const cancelSoloRecording = useCallback(() => {
    console.log('❌ Cancelling solo recording')
    setIsSoloMode(false)
    setSoloParticipant(null)
    setRecordingStartTime(null)
    setRecordingDuration(0)

    if (onSoloRecordingCancelled) {
      onSoloRecordingCancelled()
    }
  }, [onSoloRecordingCancelled])

  const submitSoloRecording = useCallback(() => {
    console.log(`✅ Submitting solo recording for ${soloParticipant}`)

    if (!soloParticipant) {
      console.error('❌ Cannot submit solo recording without a participant')
      return
    }

    const participant = soloParticipant

    // Call callback BEFORE resetting state so the handler knows what to do
    if (onSoloRecordingSubmitted) {
      onSoloRecordingSubmitted(participant)
    }

    // Reset state after callback
    setIsSoloMode(false)
    setSoloParticipant(null)
    setRecordingStartTime(null)
    setRecordingDuration(0)
  }, [soloParticipant, onSoloRecordingSubmitted])

  const value: SoloRecordingContextType = {
    isSoloMode,
    soloParticipant,
    recordingStartTime,
    recordingDuration,
    startSoloRecording,
    cancelSoloRecording,
    submitSoloRecording,
  }

  return (
    <SoloRecordingContext.Provider value={value}>
      {children}
    </SoloRecordingContext.Provider>
  )
}

export function useSoloRecording(): SoloRecordingContextType {
  const context = useContext(SoloRecordingContext)
  if (!context) {
    throw new Error(
      'useSoloRecording must be used within a SoloRecordingProvider'
    )
  }
  return context
}
