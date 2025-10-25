import type { LanguageModelSession } from '@diai/built-in-ai-api'
import {
  createMultiModalSession,
  transcribeAudioStreaming,
} from '@diai/built-in-ai-api'
import { TranscriptionService } from '../types'

export class TranscriptionServiceImpl implements TranscriptionService {
  private session?: LanguageModelSession
  private abortController?: AbortController
  private targetLanguage: 'english' | 'spanish' | 'japanese' = 'english'

  async initialize(
    language: 'english' | 'spanish' | 'japanese'
  ): Promise<void> {
    try {
      this.targetLanguage = language
      this.abortController = new AbortController()

      // Language configuration mirrored from previous system transcription setup
      const languageConfig = {
        english: {
          code: 'en',
          name: 'English',
          prompt: `You are a precise English transcription assistant. 

Your task:
- Transcribe audio content to English text
- Assume the audio contains English speech unless clearly otherwise
- Use proper English grammar and spelling
- If the audio contains non-English speech, transcribe it phonetically or translate to English
- Respond with only the English transcription, no additional commentary
- If no clear speech is detected, respond with an empty string`,
        },
        spanish: {
          code: 'es',
          name: 'Spanish',
          prompt: `You are a precise Spanish transcription assistant. 

Your task:
- Transcribe audio content to Spanish text
- Assume the audio contains Spanish speech unless clearly otherwise
- Use proper Spanish grammar, spelling, and accents
- If the audio contains non-Spanish speech, transcribe it phonetically or translate to Spanish
- Respond with only the Spanish transcription, no additional commentary
- If no clear speech is detected, respond with an empty string`,
        },
        japanese: {
          code: 'ja',
          name: 'Japanese',
          prompt: `You are a precise Japanese transcription assistant. 

Your task:
- Transcribe audio content to Japanese text
- Assume the audio contains Japanese speech unless clearly otherwise
- Use proper Japanese characters (hiragana, katakana, kanji) as appropriate
- Maintain natural Japanese sentence structure and grammar
- If the audio contains non-Japanese speech, transcribe it phonetically in katakana
- Respond with only the Japanese transcription, no additional commentary
- If no clear speech is detected, respond with an empty string`,
        },
      }

      const config = languageConfig[language]

      this.session = await createMultiModalSession({
        temperature: 0.3,
        topK: 5,
        signal: this.abortController.signal,
        enableAudio: true,
        expectedInputs: [
          { type: 'text', languages: ['en'] },
          { type: 'audio' },
        ],
        expectedOutputs: [{ type: 'text', languages: [config.code] }],
        initialPrompts: [
          {
            role: 'system',
            content: config.prompt,
          },
        ],
      })

      console.log(`🎯 Transcription service initialized (${config.name})`)
    } catch (error) {
      console.error('Failed to initialize transcription service:', error)
      throw error
    }
  }

  async transcribeStreaming(audioBlob: Blob): Promise<ReadableStream<string>> {
    if (!this.session) {
      throw new Error('Transcription service not initialized')
    }

    try {
      console.log(
        `📝 Starting streaming transcription (expecting ${this.targetLanguage})...`
      )
      return await transcribeAudioStreaming(
        this.session,
        audioBlob,
        this.abortController?.signal
      )
    } catch (error) {
      console.error('Streaming transcription failed:', error)

      // If it's an abort error, return an empty stream
      if (error instanceof Error && error.name === 'AbortError') {
        return new ReadableStream({
          start(controller) {
            controller.close()
          },
        })
      }

      throw error
    }
  }

  destroy(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    if (this.session) {
      this.session.destroy()
      this.session = undefined
    }

    console.log('🔄 Transcription service destroyed')
  }
}
