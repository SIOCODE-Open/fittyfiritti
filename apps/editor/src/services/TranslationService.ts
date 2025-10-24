import type { LanguageModelSession } from '@diai/built-in-ai-api'
import {
  createLanguageModelSession,
  translateToJapanese,
} from '@diai/built-in-ai-api'
import { TranslationService } from '../types'

interface TranslationJob {
  text: string
  resolve: (translation: string) => void
  reject: (error: Error) => void
  jobId: string
}

export class TranslationServiceImpl implements TranslationService {
  private session?: LanguageModelSession
  private abortController?: AbortController
  private translationQueue: Array<TranslationJob> = []
  private isProcessing = false
  private activeJobs = new Map<string, Promise<string>>() // Track ongoing jobs by text

  async initialize(): Promise<void> {
    try {
      this.abortController = new AbortController()

      this.session = await createLanguageModelSession({
        temperature: 0.5,
        topK: 10,
        signal: this.abortController.signal,
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['ja'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You are a professional English to Japanese translator. 

Guidelines:
- Translate naturally and conversationally
- Maintain the original meaning and tone
- Use appropriate Japanese honorifics when needed
- For technical terms, use commonly accepted Japanese equivalents
- Keep translations concise but accurate
- Respond with only the Japanese translation, no additional text`,
          },
        ],
      })

      console.log('🌐 Translation service initialized')
    } catch (error) {
      console.error('Failed to initialize translation service:', error)
      throw error
    }
  }

  async translateToJapanese(text: string): Promise<string> {
    if (!this.session) {
      throw new Error('Translation service not initialized')
    }

    if (!text.trim()) {
      return ''
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
        if (!this.session) {
          throw new Error('Translation service not initialized')
        }

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

        const translation = await translateToJapanese(
          this.session,
          item.text,
          this.abortController?.signal
        )

        console.log(
          `🌐 Translated: "${item.text.substring(0, 30)}..." → "${translation.substring(0, 30)}..."`
        )
        item.resolve(translation)
      } catch (error) {
        console.error('Translation failed:', error)

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
        item.reject(new Error('Translation service destroyed'))
      }
    }

    // Clear active jobs
    this.activeJobs.clear()

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    if (this.session) {
      this.session.destroy()
      this.session = undefined
    }

    this.isProcessing = false

    console.log('🔄 Translation service destroyed')
  }
}
