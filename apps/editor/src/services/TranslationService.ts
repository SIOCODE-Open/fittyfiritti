import type { Translator } from '@diai/built-in-ai-api'
import {
  checkTranslatorAvailability,
  translateTextStreaming,
} from '@diai/built-in-ai-api'
import { TranslationService } from '../types'

interface StreamingTranslationJob {
  text: string
  resolve: (stream: ReadableStream<string>) => void
  reject: (error: Error) => void
  jobId: string
}

export class TranslationServiceImpl implements TranslationService {
  private translator?: Translator
  private abortController?: AbortController
  private streamingQueue: Array<StreamingTranslationJob> = []
  private isStreamingProcessing = false
  private activeStreamingJobs = new Map<
    string,
    Promise<ReadableStream<string>>
  >() // Track ongoing streaming jobs
  private isInitialized = false
  private targetLanguage: 'english' | 'spanish' | 'japanese' = 'japanese'

  async initialize(
    targetLanguage: 'english' | 'spanish' | 'japanese' = 'japanese'
  ): Promise<void> {
    this.targetLanguage = targetLanguage

    try {
      this.abortController = new AbortController()

      // Language configuration
      const languageConfig = {
        english: { code: 'en', name: 'English' },
        spanish: { code: 'es', name: 'Spanish' },
        japanese: { code: 'ja', name: 'Japanese' },
      }

      const config = languageConfig[targetLanguage]

      // Check if Translation API is available
      const isAvailable = await checkTranslatorAvailability()
      if (isAvailable) {
        console.log(
          `🌐 Translation service initialized with Translator API (English to ${config.name})`
        )
      } else {
        console.log(
          `🌐 Translation service initialized with fallback mode (Prompt API, English to ${config.name})`
        )
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize translation service:', error)
      // Don't throw error - fallback will be used automatically
      this.isInitialized = true
    }
  }

  async translateToTargetLanguageStreaming(
    text: string
  ): Promise<ReadableStream<string>> {
    if (!this.isInitialized) {
      throw new Error('Translation service not initialized')
    }

    if (!text.trim()) {
      return new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
    }

    // Check if this exact text is already being translated
    const existingJob = this.activeStreamingJobs.get(text)
    if (existingJob) {
      console.log(
        '🔄 Reusing existing streaming translation job for:',
        text.substring(0, 30) + '...'
      )
      return existingJob
    }

    // Create a new streaming translation promise and track it
    const translationPromise = new Promise<ReadableStream<string>>(
      (resolve, reject) => {
        const jobId = Math.random().toString(36).substr(2, 9)

        // Add to queue
        this.streamingQueue.push({ text, resolve, reject, jobId })

        // Process queue if not already processing
        if (!this.isStreamingProcessing) {
          this.processStreamingQueue()
        }
      }
    )

    // Track this job
    this.activeStreamingJobs.set(text, translationPromise)

    // Clean up tracking when job completes
    translationPromise.finally(() => {
      this.activeStreamingJobs.delete(text)
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

      try {
        // Check if we should skip this job (duplicate text already processed)
        const isDuplicate = this.streamingQueue.some(
          queuedItem => queuedItem.text === item.text
        )
        if (isDuplicate) {
          console.log(
            '⏭️ Skipping duplicate streaming translation in queue:',
            item.text.substring(0, 30) + '...'
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
        const languageConfig = {
          english: 'en',
          spanish: 'es',
          japanese: 'ja',
        }

        const stream = await translateTextStreaming(
          item.text,
          'en', // From English
          languageConfig[this.targetLanguage], // To target language
          this.abortController?.signal
        )

        console.log(
          `🌐 Streaming translation started: "${item.text.substring(0, 30)}..."`
        )
        item.resolve(stream)
      } catch (error) {
        console.error('Streaming translation failed:', error)

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

  destroy(): void {
    // Reject all pending streaming translations
    while (this.streamingQueue.length > 0) {
      const item = this.streamingQueue.shift()
      if (item) {
        item.reject(new Error('Translation service destroyed'))
      }
    }

    // Clear active jobs
    this.activeStreamingJobs.clear()

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    if (this.translator) {
      this.translator.destroy()
      this.translator = undefined
    }

    this.isStreamingProcessing = false
    this.isInitialized = false

    console.log('🔄 Translation service destroyed')
  }
}
