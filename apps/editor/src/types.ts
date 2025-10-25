// Note Structure Types
export interface TranscriptionCard {
  id: string
  audioSegment: Blob
  timestamp: number
}

// System Audio Transcription Card
export interface SystemTranscriptionCard {
  id: string
  audioSegment: Blob
  timestamp: number
}

// Application State
export interface AppState {
  isRecording: boolean
  transcriptionCards: TranscriptionCard[]
  systemTranscriptionCards: SystemTranscriptionCard[]
  isSystemCapturing: boolean
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
  transcribeStreaming(audioBlob: Blob): Promise<ReadableStream<string>>
  initialize(language: 'english' | 'spanish' | 'japanese'): Promise<void>
  destroy(): void
}

export interface TranslationService {
  translateToTargetLanguageStreaming(
    text: string
  ): Promise<ReadableStream<string>>
  initialize(
    sourceLanguage?: 'english' | 'spanish' | 'japanese',
    targetLanguage?: 'english' | 'spanish' | 'japanese'
  ): Promise<void>
  destroy(): void
}
