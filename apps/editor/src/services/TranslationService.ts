import type { Translator } from '@diai/built-in-ai-api'
import {
  checkTranslatorAvailability,
  translateTextStreaming,
} from '@diai/built-in-ai-api'
import { TranslationService } from '../types'

export class TranslationServiceImpl implements TranslationService {
  private translator?: Translator
  private abortController?: AbortController
  private isInitialized = false
  private sourceLanguage: 'english' | 'spanish' | 'japanese' = 'english'
  private targetLanguage: 'english' | 'spanish' | 'japanese' = 'japanese'

  async initialize(
    sourceLanguage: 'english' | 'spanish' | 'japanese' = 'english',
    targetLanguage: 'english' | 'spanish' | 'japanese' = 'japanese'
  ): Promise<void> {
    this.sourceLanguage = sourceLanguage
    this.targetLanguage = targetLanguage

    try {
      this.abortController = new AbortController()

      // Language configuration
      const languageConfig = {
        english: { code: 'en', name: 'English' },
        spanish: { code: 'es', name: 'Spanish' },
        japanese: { code: 'ja', name: 'Japanese' },
      }

      const sourceConfig = languageConfig[sourceLanguage]
      const targetConfig = languageConfig[targetLanguage]

      // Check if Translation API is available
      const isAvailable = await checkTranslatorAvailability()
      if (isAvailable) {
        console.log(
          `🌐 Translation service initialized with Translator API (${sourceConfig.name} to ${targetConfig.name})`
        )
      } else {
        console.log(
          `🌐 Translation service initialized with fallback mode (Prompt API, ${sourceConfig.name} to ${targetConfig.name})`
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

    // Check if translation is needed (source and target languages are different)
    const needsTranslation = this.sourceLanguage !== this.targetLanguage
    if (!needsTranslation) {
      console.log(
        '📝 Source and target languages are the same, returning as-is'
      )
      return new ReadableStream({
        start(controller) {
          controller.enqueue(text)
          controller.close()
        },
      })
    }

    // Language configuration
    const languageConfig = {
      english: 'en',
      spanish: 'es',
      japanese: 'ja',
    }

    try {
      // Call streaming translation API directly
      const stream = await translateTextStreaming(
        text,
        languageConfig[this.sourceLanguage], // From source language
        languageConfig[this.targetLanguage], // To target language
        this.abortController?.signal
      )

      console.log(
        `🌐 Streaming translation started (${this.sourceLanguage.toUpperCase()}→${this.targetLanguage.toUpperCase()}): "${text.substring(0, 30)}..."`
      )

      return stream
    } catch (error) {
      console.error('Streaming translation failed:', error)

      // If it's an abort error, return empty stream
      if (error instanceof Error && error.name === 'AbortError') {
        return new ReadableStream({
          start(controller) {
            controller.close()
          },
        })
      }

      // Re-throw other errors
      throw error instanceof Error
        ? error
        : new Error('Streaming translation failed')
    }
  }

  destroy(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    if (this.translator) {
      this.translator.destroy()
      this.translator = undefined
    }

    this.isInitialized = false

    console.log('🔄 Translation service destroyed')
  }
}
