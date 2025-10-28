import {
  createLanguageModelSession,
  LanguageModelSession,
} from '@fittyfiritti/built-in-ai-api'
import { retryAIPromptWithJSON } from '../utils/retryUtils'
import {
  bulletPointSchema,
  multipleBulletPointsSchema,
} from './PresentationControlSchemas'

/**
 * BulletPointGenerationService
 *
 * Responsible for generating bullet points from transcriptions.
 * Handles both single and multiple bullet point generation.
 * Uses session cloning with few-shot prompting to prevent conversation history buildup.
 */
export class BulletPointGenerationService {
  private baseSessionSingleBulletPoint: LanguageModelSession | null = null
  private baseSessionMultipleBulletPoints: LanguageModelSession | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize base session for single bullet point with few-shot examples
      this.baseSessionSingleBulletPoint = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You create a single concise bullet point from a speech transcription.

Extract the key information and create a clear, factual bullet point.

Guidelines:
- Focus on the specific fact, feature, or action mentioned
- Keep text concise (5-15 words)
- Extract concrete information, not general statements

Respond only with JSON containing text.`,
          },
          // Few-shot example 1 - Technical feature with filler words
          {
            role: 'user',
            content:
              'Create a bullet point from: "So, uh, this feature uses real-time audio processing with, um, WebRTC technology and it works really well"',
          },
          {
            role: 'assistant',
            content: '{"text":"Real-time audio processing with WebRTC"}',
          },
          // Few-shot example 2 - System capability
          {
            role: 'user',
            content:
              'Create a bullet point from: "The system, you know, automatically detects when you change topics. It\'s pretty smart about that"',
          },
          {
            role: 'assistant',
            content: '{"text":"Automatic topic change detection"}',
          },
          // Few-shot example 3 - Multi-language support
          {
            role: 'user',
            content:
              'Create a bullet point from: "Okay so, um, we support multiple languages including, uh, English and Japanese, which is great for international users"',
          },
          {
            role: 'assistant',
            content: '{"text":"Multi-language support (English, Japanese)"}',
          },
        ],
      })

      // Initialize base session for multiple bullet points with few-shot examples
      this.baseSessionMultipleBulletPoints = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You create multiple concise bullet points from a speech transcription that contains several distinct pieces of information.

Extract each separate piece of information and create clear, factual bullet points.

Guidelines:
- Identify each distinct fact, feature, or action mentioned
- Create a separate bullet point for each piece of information
- Keep each bullet point concise (5-15 words)
- Extract concrete information, not general statements
- Maintain the logical order presented in the transcription

Respond only with JSON containing an array of bulletPoints, each with a text property.`,
          },
          // Few-shot example 1 - System components
          {
            role: 'user',
            content:
              'Create multiple bullet points from: "Okay so, um, we have three main components here. First there\'s the audio capture service, then we have, uh, the transcription engine, and finally, the AI processor that handles everything"',
          },
          {
            role: 'assistant',
            content:
              '{"bulletPoints":[{"text":"Audio capture service"},{"text":"Transcription engine"},{"text":"AI processor"}]}',
          },
          // Few-shot example 2 - App features
          {
            role: 'user',
            content:
              'Create multiple bullet points from: "The app supports, you know, English and Japanese translation, um, real-time synchronization, and, uh, offline mode as well"',
          },
          {
            role: 'assistant',
            content:
              '{"bulletPoints":[{"text":"English and Japanese translation"},{"text":"Real-time synchronization"},{"text":"Offline mode support"}]}',
          },
          // Few-shot example 3 - Key features list
          {
            role: 'user',
            content:
              'Create multiple bullet points from: "So the key features include, uh, voice commands which are really cool, automatic note organization that works great, and, um, cloud backup for all your data"',
          },
          {
            role: 'assistant',
            content:
              '{"bulletPoints":[{"text":"Voice commands"},{"text":"Automatic note organization"},{"text":"Cloud backup"}]}',
          },
        ],
      })

      this.isInitialized = true
      console.log('📌 Bullet Point Generation Service initialized')
    } catch (error) {
      console.error(
        'Failed to initialize Bullet Point Generation Service:',
        error
      )
      throw new Error('Failed to initialize bullet point generation')
    }
  }

  /**
   * Generate a single bullet point from a transcription
   */
  async generateSingleBulletPoint(transcription: string): Promise<string> {
    if (!this.baseSessionSingleBulletPoint) {
      throw new Error('Bullet Point Generation Service not initialized')
    }

    const clonedSession = await this.baseSessionSingleBulletPoint.clone()
    try {
      const bulletResult = await retryAIPromptWithJSON<{ text: string }>(
        async () =>
          await clonedSession.prompt(
            `Create a bullet point from: "${transcription}"`,
            {
              responseConstraint: bulletPointSchema,
            }
          )
      )

      return bulletResult.text || transcription
    } catch (error) {
      console.error(
        'Failed to generate single bullet point after retries:',
        error
      )
      throw new Error(
        `Single bullet point generation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Generate multiple bullet points from a transcription
   */
  async generateMultipleBulletPoints(
    transcription: string
  ): Promise<Array<{ text: string }>> {
    if (!this.baseSessionMultipleBulletPoints) {
      throw new Error('Bullet Point Generation Service not initialized')
    }

    const clonedSession = await this.baseSessionMultipleBulletPoints.clone()
    try {
      const bulletResult = await retryAIPromptWithJSON<{
        bulletPoints: Array<{ text: string }>
      }>(
        async () =>
          await clonedSession.prompt(
            `Create multiple bullet points from: "${transcription}"`,
            {
              responseConstraint: multipleBulletPointsSchema,
            }
          )
      )

      return bulletResult.bulletPoints || [{ text: transcription }]
    } catch (error) {
      console.error(
        'Failed to generate multiple bullet points after retries:',
        error
      )
      throw new Error(
        `Multiple bullet points generation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  destroy(): void {
    if (this.baseSessionSingleBulletPoint) {
      this.baseSessionSingleBulletPoint.destroy()
      this.baseSessionSingleBulletPoint = null
    }
    if (this.baseSessionMultipleBulletPoints) {
      this.baseSessionMultipleBulletPoints.destroy()
      this.baseSessionMultipleBulletPoints = null
    }
    this.isInitialized = false
  }
}
