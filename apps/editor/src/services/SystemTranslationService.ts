import type { Translator } from '@diai/built-in-ai-api'
import {
  checkTranslatorAvailability,
  createTranslator,
  translateToEnglish,
} from '@diai/built-in-ai-api'

interface SystemTranslationJob {
  text: string
  resolve: (translation: string) => void
  reject: (error: Error) => void
  jobId: string
}

export interface SystemTranslationService {
  translateToEnglish(text: string): Promise<string>
  initialize(): Promise<void>
  destroy(): void
}

export class SystemTranslationServiceImpl implements SystemTranslationService {
  private translator?: Translator
  private abortController?: AbortController
  private translationQueue: Array<SystemTranslationJob> = []
  private isProcessing = false
  private activeJobs = new Map<string, Promise<string>>() // Track ongoing jobs by text
  private isInitialized = false

  async initialize(): Promise<void> {
    try {
      this.abortController = new AbortController()

      // Check if Translation API is available
      const isAvailable = await checkTranslatorAvailability()
      if (isAvailable) {
        // Pre-create translator for Japanese to English
        this.translator = await createTranslator('ja', 'en')
        console.log(
          '🌐 System translation service initialized with Translator API (Japanese to English)'
        )
      } else {
        console.log(
          '🌐 System translation service initialized with fallback mode (Prompt API)'
        )
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize system translation service:', error)
      // Don't throw error - fallback will be used automatically
      this.isInitialized = true
    }
  }

  async translateToEnglish(text: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('System translation service not initialized')
    }

    if (!text.trim()) {
      return ''
    }

    // Quick check if text is already primarily English (heuristic)
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
    if (!hasJapanese) {
      console.log('📝 Text appears to be English already, returning as-is')
      return text
    }

    // Check if this exact text is already being translated
    const existingJob = this.activeJobs.get(text)
    if (existingJob) {
      console.log(
        '🔄 Reusing existing translation job for:',
        text.substring(0, 30) + '...'
      )
      return existingJob
    }

    // Create a new translation promise and track it
    const translationPromise = new Promise<string>((resolve, reject) => {
      const jobId = Math.random().toString(36).substr(2, 9)

      // Add to queue
      this.translationQueue.push({ text, resolve, reject, jobId })

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue()
      }
    })

    // Track this job
    this.activeJobs.set(text, translationPromise)

    // Clean up tracking when job completes
    translationPromise.finally(() => {
      this.activeJobs.delete(text)
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

      try {
        // Check if we should skip this job (duplicate text already processed)
        const isDuplicate = this.translationQueue.some(
          queuedItem => queuedItem.text === item.text
        )
        if (isDuplicate) {
          console.log(
            '⏭️ Skipping duplicate translation in queue:',
            item.text.substring(0, 30) + '...'
          )
          item.resolve('') // Resolve with empty string for duplicates
          continue
        }

        // Use the new Translation API function which handles fallback automatically
        const translation = await translateToEnglish(
          item.text,
          this.abortController?.signal
        )

        console.log(
          `🌐 Translated (JA→EN): "${item.text.substring(0, 30)}..." → "${translation.substring(0, 30)}..."`
        )
        item.resolve(translation)
      } catch (error) {
        console.error('System translation failed:', error)

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
        item.reject(new Error('System translation service destroyed'))
      }
    }

    // Clear active jobs
    this.activeJobs.clear()

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    if (this.translator) {
      this.translator.destroy()
      this.translator = undefined
    }

    this.isProcessing = false
    this.isInitialized = false

    console.log('🔄 System translation service destroyed')
  }
}
