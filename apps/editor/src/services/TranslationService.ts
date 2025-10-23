import type { LanguageModelSession } from '@diai/built-in-ai-api'
import {
  createLanguageModelSession,
  translateToJapanese,
} from '@diai/built-in-ai-api'
import { TranslationService } from '../types'

export class TranslationServiceImpl implements TranslationService {
  private session?: LanguageModelSession
  private abortController?: AbortController
  private translationQueue: Array<{
    text: string
    resolve: (translation: string) => void
    reject: (error: Error) => void
  }> = []
  private isProcessing = false

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

    return new Promise((resolve, reject) => {
      // Add to queue
      this.translationQueue.push({ text, resolve, reject })

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue()
      }
    })
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
      await new Promise(resolve => setTimeout(resolve, 100))
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
