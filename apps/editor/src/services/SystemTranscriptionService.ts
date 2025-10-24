import type { LanguageModelSession } from '@diai/built-in-ai-api'
import { createMultiModalSession, transcribeAudio } from '@diai/built-in-ai-api'

export interface SystemTranscriptionService {
  transcribe(audioBlob: Blob): Promise<string>
  initialize(): Promise<void>
  destroy(): void
}

export class SystemTranscriptionServiceImpl
  implements SystemTranscriptionService
{
  private session?: LanguageModelSession
  private abortController?: AbortController

  async initialize(): Promise<void> {
    try {
      this.abortController = new AbortController()

      // Create a multi-modal session optimized for Japanese audio transcription
      this.session = await createMultiModalSession({
        temperature: 0.3, // Lower temperature for more accurate transcription
        topK: 5,
        signal: this.abortController.signal,
        enableAudio: true,
        expectedInputs: [
          { type: 'text', languages: ['en'] }, // Instructions in English
          { type: 'audio' }, // Audio input
        ],
        expectedOutputs: [
          { type: 'text', languages: ['ja'] }, // Japanese text output
        ],
        initialPrompts: [
          {
            role: 'system',
            content: `You are a precise Japanese transcription assistant. 

Your task:
- Transcribe audio content to Japanese text
- Assume the audio contains Japanese speech unless clearly otherwise
- Use proper Japanese characters (hiragana, katakana, kanji) as appropriate
- Maintain natural Japanese sentence structure and grammar
- If the audio contains non-Japanese speech, transcribe it phonetically in katakana
- Respond with only the Japanese transcription, no additional commentary
- If no clear speech is detected, respond with an empty string`,
          },
        ],
      })

      console.log('🗾 System transcription service (Japanese) initialized')
    } catch (error) {
      console.error('Failed to initialize system transcription service:', error)
      throw error
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.session) {
      throw new Error('System transcription service not initialized')
    }

    try {
      console.log('🗾 Transcribing system audio (expecting Japanese)...')

      const transcription = await transcribeAudio(
        this.session,
        audioBlob,
        this.abortController?.signal
      )

      // Clean up the transcription
      const cleanedTranscription = transcription.trim()

      if (cleanedTranscription) {
        console.log(`🗾 System transcription result: "${cleanedTranscription}"`)
      }

      return cleanedTranscription
    } catch (error) {
      console.error('System transcription failed:', error)
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

    console.log('🔄 System transcription service destroyed')
  }
}
