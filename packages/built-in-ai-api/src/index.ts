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

  return await languageModelAPI.create(options)
}

// Multi-modal session creation with audio support
export async function createMultiModalSession(
  options?: LanguageModelCreateOptions & {
    enableAudio?: boolean
    enableTranslation?: boolean
  }
): Promise<LanguageModelSession> {
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
  return await createLanguageModelSession(mergedOptions)
}

// Audio transcription helper
export async function transcribeAudio(
  session: LanguageModelSession,
  audioBlob: Blob,
  signal?: AbortSignal
): Promise<string> {
  const prompt: PromptMessage[] = [
    {
      role: 'system',
      content:
        'You are a precise transcription assistant. Transcribe the audio accurately without any additional commentary.',
    },
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

  return await session.prompt(prompt, { signal })
}

// Intent recognition for note organization
export async function recognizeIntent(
  session: LanguageModelSession,
  transcription: string,
  context?: string,
  signal?: AbortSignal
): Promise<{
  level: 1 | 2 | 3 | 'transition'
  title?: string
  content: string
  isTransition?: boolean
  transitionMessage?: string
}> {
  const schema: JSONSchema = {
    type: 'object',
    properties: {
      level: {
        type: 'number',
        enum: [1, 2, 3, 4], // 4 = transition
      },
      title: {
        type: 'string',
      },
      content: {
        type: 'string',
      },
      isTransition: {
        type: 'boolean',
      },
      transitionMessage: {
        type: 'string',
      },
    },
    required: ['level', 'content'],
  }

  const prompt = `Analyze this transcription and classify the intent:

Context: ${context || 'None'}
Transcription: "${transcription}"

Classification levels:
- Level 1: Complete subject change (new topic) - clears previous content
- Level 2: New aspect of current subject (new card with title)  
- Level 3: Continue current discussion (bullet point)
- Level 4: Transitional phrase (moving between topics)

For Level 1 & 2: Provide a concise title
For Level 3: Summarize as a bullet point
For Level 4: Provide a transition message like "Moving on..." or "Continuing..."

Respond with structured JSON.`

  const response = await session.prompt(prompt, {
    responseConstraint: schema,
    signal,
  })

  const result = JSON.parse(response)

  // Convert level 4 (transition) to 'transition' type
  if (result.level === 4) {
    return {
      level: 'transition',
      content: result.content,
      isTransition: true,
      transitionMessage: result.transitionMessage || 'Moving on...',
    }
  }

  return {
    level: result.level as 1 | 2 | 3,
    title: result.title,
    content: result.content,
  }
}

// Translation helper
export async function translateToJapanese(
  session: LanguageModelSession,
  text: string,
  signal?: AbortSignal
): Promise<string> {
  const prompt = `Translate this text to Japanese (natural, conversational style):

"${text}"

Respond with only the Japanese translation, no additional text.`

  return await session.prompt(prompt, { signal })
}
