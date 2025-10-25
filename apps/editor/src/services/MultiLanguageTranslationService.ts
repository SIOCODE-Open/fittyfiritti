import type { Translator } from '@diai/built-in-ai-api'
import {
  checkLanguagePairAvailability,
  checkTranslatorAvailability,
  translateText,
  translateTextStreaming,
} from '@diai/built-in-ai-api'

// Supported language pairs configuration
export interface LanguagePair {
  source: string
  target: string
  name: string
}

export const SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = [
  { source: 'en', target: 'ja', name: 'English to Japanese' },
  { source: 'ja', target: 'en', name: 'Japanese to English' },
  { source: 'en', target: 'es', name: 'English to Spanish' },
  { source: 'es', target: 'en', name: 'Spanish to English' },
  { source: 'ja', target: 'es', name: 'Japanese to Spanish' },
  { source: 'es', target: 'ja', name: 'Spanish to Japanese' },
]

export interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
}

export interface TranslationJob {
  request: TranslationRequest
  resolve: (translation: string) => void
  reject: (error: Error) => void
  jobId: string
}

export interface StreamingTranslationJob {
  request: TranslationRequest
  resolve: (stream: ReadableStream<string>) => void
  reject: (error: Error) => void
  jobId: string
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

export class MultiLanguageTranslationServiceImpl
  implements MultiLanguageTranslationService
{
  private translators = new Map<string, Translator>()
  private abortController?: AbortController
  private translationQueue: Array<TranslationJob> = []
  private streamingQueue: Array<StreamingTranslationJob> = []
  private isProcessing = false
  private isStreamingProcessing = false
  private activeJobs = new Map<string, Promise<string>>()
  private activeStreamingJobs = new Map<
    string,
    Promise<ReadableStream<string>>
  >()
  private isInitialized = false
  private availableLanguagePairs: LanguagePair[] = []

  async initialize(): Promise<void> {
    try {
      this.abortController = new AbortController()

      // Check if Translation API is available
      const isAvailable = await checkTranslatorAvailability()
      if (!isAvailable) {
        console.log(
          '🌐 Multi-language translation service initialized with fallback mode (Prompt API)'
        )
        this.availableLanguagePairs = [...SUPPORTED_LANGUAGE_PAIRS] // Assume all pairs work with fallback
        this.isInitialized = true
        return
      }

      // Check which language pairs are actually available
      const availabilityChecks = await Promise.allSettled(
        SUPPORTED_LANGUAGE_PAIRS.map(async pair => {
          const availability = await checkLanguagePairAvailability(
            pair.source,
            pair.target
          )
          return { pair, available: availability.available !== 'no' }
        })
      )

      this.availableLanguagePairs = availabilityChecks
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{
            pair: LanguagePair
            available: boolean
          }> => result.status === 'fulfilled' && result.value.available
        )
        .map(result => result.value.pair)

      console.log(
        `🌐 Multi-language translation service initialized with Translator API. Available pairs: ${this.availableLanguagePairs.length}/${SUPPORTED_LANGUAGE_PAIRS.length}`
      )
      console.log(
        'Available language pairs:',
        this.availableLanguagePairs.map(p => p.name).join(', ')
      )

      this.isInitialized = true
    } catch (error) {
      console.error(
        'Failed to initialize multi-language translation service:',
        error
      )
      // Don't throw error - fallback will be used automatically
      this.availableLanguagePairs = [...SUPPORTED_LANGUAGE_PAIRS]
      this.isInitialized = true
    }
  }

  async getAvailableLanguagePairs(): Promise<LanguagePair[]> {
    return [...this.availableLanguagePairs]
  }

  async isLanguagePairSupported(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean> {
    return this.availableLanguagePairs.some(
      pair => pair.source === sourceLanguage && pair.target === targetLanguage
    )
  }

  async translateStreaming(
    request: TranslationRequest
  ): Promise<ReadableStream<string>> {
    if (!this.isInitialized) {
      throw new Error('Multi-language translation service not initialized')
    }

    const { text, sourceLanguage, targetLanguage } = request

    if (!text.trim()) {
      return new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
    }

    // Check if this language pair is supported
    const isSupported = await this.isLanguagePairSupported(
      sourceLanguage,
      targetLanguage
    )
    if (!isSupported) {
      throw new Error(
        `Translation from ${sourceLanguage} to ${targetLanguage} is not supported`
      )
    }

    // Generate a unique key for this streaming translation job
    const jobKey = `stream-${sourceLanguage}-${targetLanguage}-${text}`

    // Check if this exact streaming translation is already being processed
    const existingJob = this.activeStreamingJobs.get(jobKey)
    if (existingJob) {
      console.log(
        `🔄 Reusing existing streaming translation job for ${sourceLanguage}→${targetLanguage}:`,
        text.substring(0, 30) + '...'
      )
      return existingJob
    }

    // Create a new streaming translation promise and track it
    const translationPromise = new Promise<ReadableStream<string>>(
      (resolve, reject) => {
        const jobId = Math.random().toString(36).substr(2, 9)

        // Add to queue
        this.streamingQueue.push({ request, resolve, reject, jobId })

        // Process queue if not already processing
        if (!this.isStreamingProcessing) {
          this.processStreamingQueue()
        }
      }
    )

    // Track this job
    this.activeStreamingJobs.set(jobKey, translationPromise)

    // Clean up tracking when job completes
    translationPromise.finally(() => {
      this.activeStreamingJobs.delete(jobKey)
    })

    return translationPromise
  }

  private async processStreamingQueue(): Promise<void> {
    if (this.streamingQueue.length === 0 || this.isStreamingProcessing) {
      return
    }

    this.isStreamingProcessing = true

    while (this.streamingQueue.length > 0) {
      const item = this.streamingQueue.shift()
      if (!item) continue

      const { request } = item
      const { text, sourceLanguage, targetLanguage } = request

      try {
        // Check if we should skip this job (duplicate text already processed)
        const isDuplicate = this.streamingQueue.some(
          queuedItem =>
            queuedItem.request.text === text &&
            queuedItem.request.sourceLanguage === sourceLanguage &&
            queuedItem.request.targetLanguage === targetLanguage
        )
        if (isDuplicate) {
          console.log(
            `⏭️ Skipping duplicate streaming translation in queue (${sourceLanguage}→${targetLanguage}):`,
            text.substring(0, 30) + '...'
          )
          item.resolve(
            new ReadableStream({
              start(controller) {
                controller.close()
              },
            })
          )
          continue
        }

        // Use the new streaming Translation API function
        const stream = await translateTextStreaming(
          text,
          sourceLanguage,
          targetLanguage,
          this.abortController?.signal
        )

        console.log(
          `🌐 Streaming translation started (${sourceLanguage}→${targetLanguage}): "${text.substring(0, 30)}..."`
        )
        item.resolve(stream)
      } catch (error) {
        console.error(
          `Streaming translation failed (${sourceLanguage}→${targetLanguage}):`,
          error
        )

        // If it's an abort error, resolve with empty stream
        if (error instanceof Error && error.name === 'AbortError') {
          item.resolve(
            new ReadableStream({
              start(controller) {
                controller.close()
              },
            })
          )
        } else {
          item.reject(
            error instanceof Error
              ? error
              : new Error('Streaming translation failed')
          )
        }
      }

      // Small delay between translations to avoid overwhelming the AI
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    this.isStreamingProcessing = false
  }

  async translate(request: TranslationRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Multi-language translation service not initialized')
    }

    const { text, sourceLanguage, targetLanguage } = request

    if (!text.trim()) {
      return ''
    }

    // Check if this language pair is supported
    const isSupported = await this.isLanguagePairSupported(
      sourceLanguage,
      targetLanguage
    )
    if (!isSupported) {
      throw new Error(
        `Translation from ${sourceLanguage} to ${targetLanguage} is not supported`
      )
    }

    // Generate a unique key for this translation job
    const jobKey = `${sourceLanguage}-${targetLanguage}-${text}`

    // Check if this exact translation is already being processed
    const existingJob = this.activeJobs.get(jobKey)
    if (existingJob) {
      console.log(
        `🔄 Reusing existing translation job for ${sourceLanguage}→${targetLanguage}:`,
        text.substring(0, 30) + '...'
      )
      return existingJob
    }

    // Create a new translation promise and track it
    const translationPromise = new Promise<string>((resolve, reject) => {
      const jobId = Math.random().toString(36).substr(2, 9)

      // Add to queue
      this.translationQueue.push({ request, resolve, reject, jobId })

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue()
      }
    })

    // Track this job
    this.activeJobs.set(jobKey, translationPromise)

    // Clean up tracking when job completes
    translationPromise.finally(() => {
      this.activeJobs.delete(jobKey)
    })

    return translationPromise
  }

  private async processQueue(): Promise<void> {
    if (this.translationQueue.length === 0 || this.isProcessing) {
      return
    }

    this.isProcessing = true

    while (this.translationQueue.length > 0) {
      const item = this.translationQueue.shift()
      if (!item) continue

      const { request } = item
      const { text, sourceLanguage, targetLanguage } = request

      try {
        // Check if we should skip this job (duplicate text already processed)
        const isDuplicate = this.translationQueue.some(
          queuedItem =>
            queuedItem.request.text === text &&
            queuedItem.request.sourceLanguage === sourceLanguage &&
            queuedItem.request.targetLanguage === targetLanguage
        )
        if (isDuplicate) {
          console.log(
            `⏭️ Skipping duplicate translation in queue (${sourceLanguage}→${targetLanguage}):`,
            text.substring(0, 30) + '...'
          )
          item.resolve('') // Resolve with empty string for duplicates
          continue
        }

        // Use the new Translation API function which handles fallback automatically
        const translation = await translateText(
          text,
          sourceLanguage,
          targetLanguage,
          this.abortController?.signal
        )

        console.log(
          `🌐 Translated (${sourceLanguage}→${targetLanguage}): "${text.substring(0, 30)}..." → "${translation.substring(0, 30)}..."`
        )
        item.resolve(translation)
      } catch (error) {
        console.error(
          `Translation failed (${sourceLanguage}→${targetLanguage}):`,
          error
        )

        // If it's an abort error, resolve with empty string
        if (error instanceof Error && error.name === 'AbortError') {
          item.resolve('')
        } else {
          item.reject(
            error instanceof Error ? error : new Error('Translation failed')
          )
        }
      }

      // Small delay between translations to avoid overwhelming the AI
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    this.isProcessing = false
  }

  destroy(): void {
    // Reject all pending translations
    while (this.translationQueue.length > 0) {
      const item = this.translationQueue.shift()
      if (item) {
        item.reject(new Error('Multi-language translation service destroyed'))
      }
    }

    // Reject all pending streaming translations
    while (this.streamingQueue.length > 0) {
      const item = this.streamingQueue.shift()
      if (item) {
        item.reject(new Error('Multi-language translation service destroyed'))
      }
    }

    // Clear active jobs
    this.activeJobs.clear()
    this.activeStreamingJobs.clear()

    // Destroy all translators
    for (const translator of this.translators.values()) {
      translator.destroy()
    }
    this.translators.clear()

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    this.isProcessing = false
    this.isStreamingProcessing = false
    this.isInitialized = false
    this.availableLanguagePairs = []

    console.log('🔄 Multi-language translation service destroyed')
  }
}
