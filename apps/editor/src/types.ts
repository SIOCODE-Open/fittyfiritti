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
  transcribe(audioBlob: Blob): Promise<string>
  transcribeStreaming(audioBlob: Blob): Promise<ReadableStream<string>>
  initialize(): Promise<void>
  destroy(): void
}

export interface TranslationService {
  translateToTargetLanguage(text: string): Promise<string>
  translateToTargetLanguageStreaming(
    text: string
  ): Promise<ReadableStream<string>>
  initialize(targetLanguage?: 'english' | 'spanish' | 'japanese'): Promise<void>
  destroy(): void
}

// Multi-language translation types
export interface LanguagePair {
  source: string
  target: string
  name: string
}

export interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
}

export interface MultiLanguageTranslationService {
  translate(request: TranslationRequest): Promise<string>
  translateStreaming(
    request: TranslationRequest
  ): Promise<ReadableStream<string>>
  getAvailableLanguagePairs(): Promise<LanguagePair[]>
  isLanguagePairSupported(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean>
  initialize(): Promise<void>
  destroy(): void
}
