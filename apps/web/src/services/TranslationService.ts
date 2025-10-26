import {
  checkTranslatorAvailability,
  translateTextStreaming,
} from '@fittyfiritti/built-in-ai-api'
import { TranslationService } from '../types'

export class TranslationServiceImpl implements TranslationService {
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
      if (!isAvailable) {
        throw new Error(
          'Translation API is not available. Please ensure Chrome has translation support enabled.'
        )
      }

      console.log(
        `🌐 Translation service initialized (${sourceConfig.name} → ${targetConfig.name})`
      )

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize translation service:', error)
      throw error
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

    this.isInitialized = false
  }
}
