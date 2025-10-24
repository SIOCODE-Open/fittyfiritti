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

// System Audio Transcription Card (Japanese->English)
export interface SystemTranscriptionCard {
  id: string
  text?: string // Japanese text - Optional since it starts as loading
  textEn?: string // English translation
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
  systemTranscriptionCards: SystemTranscriptionCard[]
  liveWaveformData: number[] // Live waveform for current recording
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
  initialize(): Promise<void>
  destroy(): void
}

export interface TranslationService {
  translateToJapanese(text: string): Promise<string>
  translateToJapaneseStreaming?(text: string): Promise<ReadableStream<string>>
  initialize(): Promise<void>
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
  translateStreaming?(
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
