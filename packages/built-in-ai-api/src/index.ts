// Chrome Built-in AI API Type Definitions
// Based on: https://developer.chrome.com/docs/ai/prompt-api

// Language Model Availability States
export type LanguageModelAvailability =
  | 'available'
  | 'downloadable'
  | 'downloading'
  | 'unavailable'

// Language Model Parameters
export interface LanguageModelParams {
  defaultTopK: number
  maxTopK: number
  defaultTemperature: number
  maxTemperature: number
}

// Session Creation Options
export interface LanguageModelCreateOptions {
  temperature?: number
  topK?: number
  signal?: AbortSignal
  monitor?: (monitor: DownloadMonitor) => void
  initialPrompts?: PromptMessage[]
  expectedInputs?: ExpectedInput[]
  expectedOutputs?: ExpectedOutput[]
}

// Expected Input/Output Types
export interface ExpectedInput {
  type: 'text' | 'image' | 'audio'
  languages?: string[] // e.g., ['en', 'ja', 'es']
}

export interface ExpectedOutput {
  type: 'text'
  languages?: string[] // e.g., ['en', 'ja', 'es']
}

// Prompt Message Types
export interface PromptMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | PromptContent[]
  prefix?: boolean // Only for assistant role to constrain responses
}

export interface PromptContent {
  type: 'text' | 'image' | 'audio'
  value: string | File | Blob
}

// Session Clone Options
export interface LanguageModelCloneOptions {
  signal?: AbortSignal
}

// Prompt Options
export interface PromptOptions {
  signal?: AbortSignal
  responseConstraint?: JSONSchema
  omitResponseConstraintInput?: boolean
}

// JSON Schema Type for structured output
export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  properties?: Record<string, JSONSchema>
  items?: JSONSchema
  required?: string[]
  enum?: unknown[]
  [key: string]: unknown
}

// Download Monitor for tracking model downloads
export interface DownloadMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void
  removeEventListener?(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void
}

export interface DownloadProgressEvent {
  type: 'downloadprogress'
  loaded: number // Progress as a percentage (0-1)
}

// Language Model Session Interface
export interface LanguageModelSession {
  // Session properties
  readonly inputUsage: number
  readonly inputQuota: number

  // Core methods
  prompt(
    input: string | PromptMessage[],
    options?: PromptOptions
  ): Promise<string>
  promptStreaming(
    input: string | PromptMessage[],
    options?: PromptOptions
  ): ReadableStream<string>

  // Session management
  append(messages: PromptMessage[]): Promise<void>
  clone(options?: LanguageModelCloneOptions): Promise<LanguageModelSession>
  destroy(): void

  // Utility methods
  measureInputUsage(
    input: string | PromptMessage[],
    options?: PromptOptions
  ): number
}

// Main Language Model Interface
export interface LanguageModel {
  // Static methods
  availability(
    options?: Partial<LanguageModelCreateOptions>
  ): Promise<LanguageModelAvailability>
  params(): Promise<LanguageModelParams>
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>
}

// Window AI Interface Extension
declare global {
  interface Window {
    ai?: {
      languageModel?: LanguageModel
    }
    // Global LanguageModel API (the actual implementation in Chrome)
    LanguageModel?: LanguageModel
  }

  // Global LanguageModel for direct access
  const LanguageModel: LanguageModel | undefined
}

// Error Types
export class AIModelUnavailableError extends Error {
  constructor(message: string = 'AI model is not available') {
    super(message)
    this.name = 'AIModelUnavailableError'
  }
}

export class AISessionDestroyedError extends Error {
  constructor(message: string = 'AI session has been destroyed') {
    super(message)
    this.name = 'AISessionDestroyedError'
  }
}

export class AIQuotaExceededError extends Error {
  constructor(message: string = 'AI input quota exceeded') {
    super(message)
    this.name = 'AIQuotaExceededError'
  }
}

export class AINotSupportedError extends Error {
  constructor(message: string = 'AI feature not supported') {
    super(message)
    this.name = 'AINotSupportedError'
  }
}

// Utility Functions
export async function checkLanguageModelAvailability(): Promise<LanguageModelAvailability> {
  // Try global LanguageModel first (Chrome 141+)
  if (typeof window !== 'undefined' && window.LanguageModel) {
    return await window.LanguageModel.availability()
  }
  // Fallback to window.ai.languageModel
  if (typeof window !== 'undefined' && window.ai?.languageModel) {
    return await window.ai.languageModel.availability()
  }
  return 'unavailable'
}

export async function getLanguageModelParams(): Promise<LanguageModelParams | null> {
  // Try global LanguageModel first (Chrome 141+)
  if (typeof window !== 'undefined' && window.LanguageModel) {
    const availability = await window.LanguageModel.availability()
    if (availability === 'unavailable') {
      return null
    }
    return await window.LanguageModel.params()
  }
  // Fallback to window.ai.languageModel
  if (typeof window !== 'undefined' && window.ai?.languageModel) {
    const availability = await window.ai.languageModel.availability()
    if (availability === 'unavailable') {
      return null
    }
    return await window.ai.languageModel.params()
  }
  return null
}

export async function createLanguageModelSession(
  options?: LanguageModelCreateOptions
): Promise<LanguageModelSession> {
  // TEMPORARILY DISABLE CACHING to fix application issues
  // TODO: Implement proper caching that doesn't interfere with service lifecycle

  let languageModelAPI: LanguageModel | undefined

  // Try global LanguageModel first (Chrome 141+)
  if (typeof window !== 'undefined' && window.LanguageModel) {
    languageModelAPI = window.LanguageModel
  }
  // Fallback to window.ai.languageModel
  else if (typeof window !== 'undefined' && window.ai?.languageModel) {
    languageModelAPI = window.ai.languageModel
  }

  if (!languageModelAPI) {
    throw new AIModelUnavailableError('Language model is not available')
  }

  const availability = await languageModelAPI.availability(options)
  if (availability === 'unavailable') {
    throw new AIModelUnavailableError(
      'Language model is not available on this device'
    )
  }

  const session = await languageModelAPI.create(options)

  return session
}

// Export session cache utilities
export async function getSessionCacheStats() {
  const { aiSessionCache } = await import('./session-cache')
  return aiSessionCache.getStats()
}

export async function clearSessionCache() {
  const { aiSessionCache } = await import('./session-cache')
  aiSessionCache.clear()
}

// Multi-modal session creation with audio support
export async function createMultiModalSession(
  options?: LanguageModelCreateOptions & {
    enableAudio?: boolean
    enableTranslation?: boolean
  }
): Promise<LanguageModelSession> {
  // TEMPORARILY DISABLE CACHING to fix application issues
  // TODO: Implement proper caching that doesn't interfere with service lifecycle

  // Prepare standard LanguageModelCreateOptions
  const defaultOptions: LanguageModelCreateOptions = {
    temperature: 0.8,
    topK: 3,
    expectedInputs: [
      { type: 'text', languages: ['en'] },
      ...(options?.enableAudio ? [{ type: 'audio' as const }] : []),
    ],
    expectedOutputs: [
      {
        type: 'text' as const,
        languages: options?.enableTranslation ? ['en', 'ja'] : ['en'],
      },
    ],
  }

  const mergedOptions = { ...defaultOptions, ...options }

  // Extract the custom flags for caching but not for the API call
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { enableAudio, enableTranslation, ...apiOptions } = mergedOptions

  // Create new session directly
  let languageModelAPI: LanguageModel | undefined

  // Try global LanguageModel first (Chrome 141+)
  if (typeof window !== 'undefined' && window.LanguageModel) {
    languageModelAPI = window.LanguageModel
  }
  // Fallback to window.ai.languageModel
  else if (typeof window !== 'undefined' && window.ai?.languageModel) {
    languageModelAPI = window.ai.languageModel
  }

  if (!languageModelAPI) {
    throw new AIModelUnavailableError('Language model is not available')
  }

  const availability = await languageModelAPI.availability(apiOptions)
  if (availability === 'unavailable') {
    throw new AIModelUnavailableError(
      'Language model is not available on this device'
    )
  }

  const session = await languageModelAPI.create(apiOptions)

  return session
}

// Audio transcription with streaming
export async function transcribeAudioStreaming(
  session: LanguageModelSession,
  audioBlob: Blob,
  signal?: AbortSignal
): Promise<ReadableStream<string>> {
  const prompt: PromptMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          value: 'Please transcribe this audio:',
        },
        {
          type: 'audio',
          value: audioBlob,
        },
      ],
    },
  ]

  const clonedSession = await session.clone({ signal })

  return clonedSession.promptStreaming(prompt, { signal })
}

// Chrome Translation API Types
export type TranslatorAvailability = 'available' | 'downloadable' | 'no'

export interface TranslatorCapabilities {
  available: TranslatorAvailability
}

export interface TranslatorCreateOptions {
  sourceLanguage: string
  targetLanguage: string
  monitor?: (monitor: DownloadMonitor) => void
}

export interface Translator {
  translate(text: string): Promise<string>
  translateStreaming(text: string): ReadableStream<string>
  destroy(): void
}

// Main Translator Interface
export interface TranslatorAPI {
  availability(options: {
    sourceLanguage: string
    targetLanguage: string
  }): Promise<TranslatorCapabilities>
  create(options: TranslatorCreateOptions): Promise<Translator>
}

// Global Translator API Declaration
declare global {
  interface Window {
    Translator?: TranslatorAPI
  }
  const Translator: TranslatorAPI | undefined
}

// Chrome Summarizer API Types
export type SummarizerAvailability =
  | 'available'
  | 'downloadable'
  | 'unavailable'

export type SummarizerType = 'key-points' | 'tldr' | 'teaser' | 'headline'
export type SummarizerFormat = 'markdown' | 'plain-text'
export type SummarizerLength = 'short' | 'medium' | 'long'

export interface SummarizerOptions {
  sharedContext?: string
  type?: SummarizerType
  format?: SummarizerFormat
  length?: SummarizerLength
  expectedInputLanguages?: string[]
  expectedContextLanguages?: string[]
  outputLanguage?: string
  monitor?: (monitor: DownloadMonitor) => void
}

export interface SummarizeOptions {
  context?: string
}

export interface Summarizer {
  summarize(text: string, options?: SummarizeOptions): Promise<string>
  summarizeStreaming(
    text: string,
    options?: SummarizeOptions
  ): ReadableStream<string>
  destroy(): void
}

// Main Summarizer Interface
export interface SummarizerAPI {
  availability(): Promise<SummarizerAvailability>
  create(options?: SummarizerOptions): Promise<Summarizer>
}

// Global Summarizer API Declaration
declare global {
  interface Window {
    Summarizer?: SummarizerAPI
  }
  const Summarizer: SummarizerAPI | undefined
}

// Translation API Utility Functions
export async function checkTranslatorAvailability(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.Translator) {
    return false
  }
  return true
}

export async function checkLanguagePairAvailability(
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslatorCapabilities> {
  if (!checkTranslatorAvailability() || !window.Translator) {
    return { available: 'no' }
  }

  try {
    return await window.Translator.availability({
      sourceLanguage,
      targetLanguage,
    })
  } catch (error) {
    console.error('Failed to check language pair availability:', error)
    return { available: 'no' }
  }
}

export async function createTranslator(
  sourceLanguage: string,
  targetLanguage: string,
  monitor?: (monitor: DownloadMonitor) => void
): Promise<Translator> {
  if (!window.Translator) {
    throw new AINotSupportedError('Translation API is not available')
  }

  const availability = await window.Translator.availability({
    sourceLanguage,
    targetLanguage,
  })

  if (availability.available === 'no') {
    throw new AIModelUnavailableError(
      `Translation from ${sourceLanguage} to ${targetLanguage} is not available`
    )
  }

  return await window.Translator.create({
    sourceLanguage,
    targetLanguage,
    monitor,
  })
}

// Fallback streaming translation helper using LanguageModel sessions
async function fallbackTranslateTextStreaming(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  signal?: AbortSignal
): Promise<ReadableStream<string>> {
  const session = await createLanguageModelSession({
    temperature: 0.5,
    topK: 10,
    signal,
    expectedInputs: [{ type: 'text', languages: [sourceLanguage] }],
    expectedOutputs: [{ type: 'text', languages: [targetLanguage] }],
  })

  const prompt = `Translate this text from ${sourceLanguage} to ${targetLanguage} (natural, conversational style):

"${text}"

Respond with only the translation, no additional text.`

  const stream = session.promptStreaming(prompt, { signal })

  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader()

      const pump = async (): Promise<void> => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }
            controller.enqueue(value)
          }
        } catch (error) {
          controller.error(error)
        }
      }

      pump()
    },
    cancel() {
      // Session cleanup handled by pump completion
    },
  })
}

// Streaming translation functions
export async function translateTextStreaming(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  signal?: AbortSignal
): Promise<ReadableStream<string>> {
  try {
    const translator = await createTranslator(sourceLanguage, targetLanguage)
    const stream = translator.translateStreaming(text)

    return new ReadableStream({
      start(controller) {
        const reader = stream.getReader()

        const pump = async (): Promise<void> => {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                translator.destroy()
                controller.close()
                break
              }
              controller.enqueue(value)
            }
          } catch (error) {
            translator.destroy()
            controller.error(error)
          }
        }

        pump()
      },
      cancel() {
        translator.destroy()
      },
    })
  } catch (error) {
    console.warn(
      `Translation API not available for ${sourceLanguage} to ${targetLanguage}, falling back to prompt-based streaming translation:`,
      error
    )
    return fallbackTranslateTextStreaming(
      text,
      sourceLanguage,
      targetLanguage,
      signal
    )
  }
}

// Summarizer API Utility Functions
export async function checkSummarizerAvailability(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.Summarizer) {
    return false
  }
  return true
}

export async function getSummarizerAvailability(): Promise<SummarizerAvailability> {
  if (!checkSummarizerAvailability() || !window.Summarizer) {
    return 'unavailable'
  }

  try {
    return await window.Summarizer.availability()
  } catch (error) {
    console.error('Failed to check summarizer availability:', error)
    return 'unavailable'
  }
}

export async function createSummarizer(
  options?: SummarizerOptions
): Promise<Summarizer> {
  if (!window.Summarizer) {
    throw new AINotSupportedError('Summarizer API is not available')
  }

  const availability = await window.Summarizer.availability()

  if (availability === 'unavailable') {
    throw new AIModelUnavailableError('Summarizer is not available')
  }

  return await window.Summarizer.create(options)
}

export async function summarizeText(
  text: string,
  options?: SummarizerOptions & SummarizeOptions
): Promise<string> {
  const { context, ...summarizerOptions } = options || {}
  const summarizer = await createSummarizer(summarizerOptions)

  try {
    return await summarizer.summarize(text, { context })
  } finally {
    summarizer.destroy()
  }
}

export async function summarizeTextStreaming(
  text: string,
  options?: SummarizerOptions & SummarizeOptions
): Promise<ReadableStream<string>> {
  const { context, ...summarizerOptions } = options || {}
  const summarizer = await createSummarizer(summarizerOptions)

  const stream = summarizer.summarizeStreaming(text, { context })

  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader()

      const pump = async (): Promise<void> => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              summarizer.destroy()
              controller.close()
              break
            }
            controller.enqueue(value)
          }
        } catch (error) {
          summarizer.destroy()
          controller.error(error)
        }
      }

      pump()
    },
    cancel() {
      summarizer.destroy()
    },
  })
}
