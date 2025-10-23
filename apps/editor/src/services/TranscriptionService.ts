import type { LanguageModelSession } from '@diai/built-in-ai-api'
import { createMultiModalSession, transcribeAudio } from '@diai/built-in-ai-api'
import { TranscriptionService } from '../types'

export class TranscriptionServiceImpl implements TranscriptionService {
  private session?: LanguageModelSession
  private abortController?: AbortController

  async initialize(): Promise<void> {
    try {
      this.abortController = new AbortController()

      this.session = await createMultiModalSession({
        enableAudio: true,
        enableTranslation: false, // We'll use a separate session for translation
        signal: this.abortController.signal,
        expectedInputs: [{ type: 'audio', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content:
              'You are a professional audio transcription assistant. Transcribe the audio accurately to English text. Respond only with the transcribed text, no additional commentary.',
          },
        ],
      })

      console.log('🎯 Transcription service initialized')
    } catch (error) {
      console.error('Failed to initialize transcription service:', error)
      throw error
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.session) {
      throw new Error('Transcription service not initialized')
    }

    try {
      const transcription = await transcribeAudio(
        this.session,
        audioBlob,
        this.abortController?.signal
      )

      console.log('📝 Transcribed:', transcription.substring(0, 100) + '...')
      return transcription.trim()
    } catch (error) {
      console.error('Transcription failed:', error)

      // If it's an abort error, don't throw
      if (error instanceof Error && error.name === 'AbortError') {
        return ''
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
