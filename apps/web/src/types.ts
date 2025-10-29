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

// Diagram Types
export interface DiagramNode {
  id: string
  label: string
  translation?: string
  width?: number
  height?: number
}

export interface DiagramEdge {
  from: string
  to: string
  id?: string
}

export interface DiagramData {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

// Rewriter API Types (Chrome Built-in AI)
export type RewriterTone = 'more-formal' | 'as-is' | 'more-casual'
export type RewriterFormat = 'as-is' | 'markdown' | 'plain-text'
export type RewriterLength = 'shorter' | 'as-is' | 'longer'

export interface RewriterOptions {
  tone?: RewriterTone
  format?: RewriterFormat
  length?: RewriterLength
  sharedContext?: string
  expectedInputLanguages?: string[]
  expectedContextLanguages?: string[]
  outputLanguage?: string
  signal?: AbortSignal
}

export interface RewriterSession {
  rewrite(
    text: string,
    options?: { context?: string; signal?: AbortSignal }
  ): Promise<string>
  rewriteStreaming(
    text: string,
    options?: { context?: string; signal?: AbortSignal }
  ): ReadableStream<string>
  destroy(): void
}

export interface RewriterAPI {
  availability(): Promise<'available' | 'downloadable' | 'unavailable'>
  create(options?: RewriterOptions): Promise<RewriterSession>
}

export interface RewriterService {
  rewriteStreaming(text: string): Promise<ReadableStream<string>>
  initialize(): Promise<void>
  destroy(): void
  isAvailable(): Promise<boolean>
}
