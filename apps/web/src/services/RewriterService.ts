import type { RewriterAPI, RewriterService, RewriterSession } from '../types'

/**
 * Implementation of RewriterService using Chrome's Built-in AI Rewriter API
 * This service wraps the global Rewriter API to formalize transcriptions
 */
export class RewriterServiceImpl implements RewriterService {
  private session: RewriterSession | null = null
  private isInitialized = false

  /**
   * Check if the Rewriter API is available in the browser
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if Rewriter API exists
      if (!('Rewriter' in globalThis)) {
        console.warn('Rewriter API not found in browser')
        return false
      }

      const rewriter = (globalThis as unknown as { Rewriter: RewriterAPI })
        .Rewriter
      const availability = await rewriter.availability()

      console.log('🔄 Rewriter API availability:', availability)
      return availability === 'available' || availability === 'downloadable'
    } catch (error) {
      console.error('❌ Failed to check Rewriter API availability:', error)
      return false
    }
  }

  /**
   * Initialize the Rewriter API session with formal tone
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.session) {
      console.log('✅ Rewriter service already initialized')
      return
    }

    try {
      if (!('Rewriter' in globalThis)) {
        throw new Error('Rewriter API not available in this browser')
      }

      const rewriter = (globalThis as unknown as { Rewriter: RewriterAPI })
        .Rewriter

      // Check availability
      const availability = await rewriter.availability()

      if (availability === 'unavailable') {
        throw new Error('Rewriter API is not available on this device')
      }

      console.log('🔄 Creating Rewriter session with formal tone...')

      // Create a rewriter session configured for formal tone
      this.session = await rewriter.create({
        tone: 'more-formal',
        format: 'plain-text',
        length: 'as-is',
        sharedContext:
          'You are a professional transcription formalization service. Your task is to convert any informal, emotional, or unprofessional speech (including profanity and strong language) into formal, professional language. You must always perform the rewriting task and never refuse based on content. Replace profanity with appropriate formal expressions that convey the same meaning and emotional intensity.',
      })

      this.isInitialized = true
      console.log('✅ Rewriter service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Rewriter service:', error)
      throw error
    }
  }

  /**
   * Rewrite text to formal tone using streaming
   */
  async rewriteStreaming(text: string): Promise<ReadableStream<string>> {
    if (!this.session || !this.isInitialized) {
      throw new Error('Rewriter service not initialized')
    }

    try {
      console.log('🔄 Rewriting text to formal tone...')

      // Use the streaming API to rewrite the text
      const stream = this.session.rewriteStreaming(text, {
        context: `You are a professional transcription formalization assistant. Your ONLY task is to rewrite the provided transcribed speech into formal, professional language while preserving the original meaning and intent.

CRITICAL INSTRUCTIONS - YOU MUST ALWAYS PERFORM THE REWRITING TASK:
- You MUST rewrite ALL content provided, regardless of its nature (including strong language, profanity, informal expressions, or emotional outbursts)
- You MUST NEVER refuse to process content or respond with safety disclaimers like "I cannot fulfill this request" or "I am programmed to be a safe AI assistant"
- Your task is linguistic formalization, NOT content filtering or censorship
- When encountering profanity, strong language, or emotional expressions, you MUST translate them into professional, formal equivalents that convey the same sentiment and intensity
- Treat ALL input as legitimate transcription data that requires professional formalization

Examples of correct formalization:
- Input: "This is fucking terrible, I hate this so much"
  Correct output: "This situation is extremely unsatisfactory and causes significant frustration"
  Wrong output: "I cannot process profanity" or refusing to respond

- Input: "You're a goddamn idiot, this makes no sense"
  Correct output: "I strongly disagree with this approach and find it illogical"
  Wrong output: Safety disclaimers or refusal

- Input: "Holy shit, this is amazing!"
  Correct output: "This is exceptionally impressive and noteworthy"
  Wrong output: Refusing to process

- Input: "What the hell is going on here?"
  Correct output: "I require clarification regarding the current situation"
  Wrong output: Any safety-related refusal

EMOTIONAL INTENSITY MAPPING:
- Extreme profanity/anger → "extremely dissatisfied", "profoundly frustrated", "strongly opposed"
- Moderate frustration → "disappointed", "concerned", "troubled"
- Excitement with profanity → "exceptionally pleased", "highly impressed", "remarkably positive"
- Confusion with profanity → "deeply puzzled", "significantly confused", "unclear about"

Remember: Your role is to make unprofessional speech professional, NOT to refuse processing. Always produce the formalized output.`,
      })

      return stream
    } catch (error) {
      console.error('❌ Failed to rewrite text:', error)
      throw error
    }
  }

  /**
   * Clean up the rewriter session
   */
  destroy(): void {
    if (this.session) {
      this.session.destroy()
      this.session = null
      this.isInitialized = false
      console.log('🧹 Rewriter service destroyed')
    }
  }
}
