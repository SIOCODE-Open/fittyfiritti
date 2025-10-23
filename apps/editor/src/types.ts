// Note Structure Types
export interface TranscriptionCard {
  id: string
  text?: string // Optional since it starts as loading
  textJa?: string
  timestamp: number
  isTranscribing?: boolean
  isTranslating?: boolean
  waveformData?: number[] // Waveform amplitude data
}

// Application State
export interface AppState {
  isRecording: boolean
  currentTranscription: string
  transcriptionCards: TranscriptionCard[]
  liveWaveformData: number[] // Live waveform for current recording
}

// Audio Processing
export interface AudioChunk {
  blob: Blob
  timestamp: number
  windowStart: number
  windowEnd: number
  waveformData?: number[] // Waveform amplitude data for this chunk
}

// Service Interfaces
export interface AudioCaptureService {
  startCapture(): Promise<void>
  stopCapture(): void
  completeSegment(): void
  onAudioChunk(callback: (chunk: AudioChunk) => void): void
  onWaveformData(callback: (waveformData: number[]) => void): void
  isCapturing: boolean
}

export interface TranscriptionService {
  transcribe(audioBlob: Blob): Promise<string>
  initialize(): Promise<void>
  destroy(): void
}

export interface TranslationService {
  translateToJapanese(text: string): Promise<string>
  initialize(): Promise<void>
  destroy(): void
}
