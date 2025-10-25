import {
  createLanguageModelSession,
  JSONSchema,
  LanguageModelSession,
} from '@diai/built-in-ai-api'

export interface SubjectChange {
  action: 'changeSubject'
  title: string
}

export interface BulletPoint {
  action: 'addBulletPoint'
  text: string
}

export type SubjectAction = SubjectChange | BulletPoint

export interface SubjectDetectionResult {
  action: SubjectAction
  confidence: number
}

// Define the JSON schemas for structured output
const actionSchema: JSONSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['changeSubject', 'addBulletPoint'],
    },
  },
  required: ['action'],
}

const titleSchema: JSONSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Descriptive title for the new subject/topic',
    },
  },
  required: ['title'],
}

const bulletPointSchema: JSONSchema = {
  type: 'object',
  properties: {
    text: {
      type: 'string',
      description: 'Summary text for the bullet point',
    },
  },
  required: ['text'],
}

export class SubjectDetectionService {
  private actionSession: LanguageModelSession | null = null
  private titleSession: LanguageModelSession | null = null
  private bulletPointSession: LanguageModelSession | null = null
  private isInitialized = false
  private transcriptionHistory: string[] = []
  private maxHistorySize = 10 // Keep last 10 transcriptions for context
  private activeJobs = new Map<string, Promise<SubjectDetectionResult>>() // Track ongoing analyses

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize action detection session
      this.actionSession = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You are an action classifier for speech transcriptions.

Your only job is to determine if a transcription represents:
- "changeSubject": The speaker is clearly starting a NEW topic/subject
- "addBulletPoint": The speaker is continuing the current topic and providing information

Guidelines:
- HEAVILY prefer "addBulletPoint" - only use "changeSubject" for clear topic transitions
- Look for phrases like "now let's talk about", "moving on to", "next topic", "let me discuss"
- If in doubt, choose "addBulletPoint"

Respond only with JSON containing the action.`,
          },
        ],
      })

      // Initialize title generation session
      this.titleSession = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You generate concise, descriptive titles for new conversation topics.

Create a clear, specific title (2-5 words) that captures the main subject being discussed.

Examples:
- "Application Demo" 
- "Technical Implementation"
- "AI Voice Recognition"
- "Project Overview"

Respond only with JSON containing the title.`,
          },
        ],
      })

      // Initialize bullet point generation session
      this.bulletPointSession = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You create concise bullet points from speech transcriptions.

Extract the key information and create a clear, factual bullet point.

Guidelines:
- Focus on specific facts, features, or actions mentioned
- Keep text concise (5-15 words)
- Extract concrete information, not general statements

Respond only with JSON containing text.`,
          },
        ],
      })

      this.isInitialized = true
      console.log('🧠 Subject Detection Service initialized')
    } catch (error) {
      console.error('Failed to initialize Subject Detection Service:', error)
      throw new Error('Failed to initialize subject detection')
    }
  }

  async analyzeTranscription(
    transcription: string,
    hasSubject: boolean = true
  ): Promise<SubjectDetectionResult> {
    if (!this.actionSession || !this.titleSession || !this.bulletPointSession) {
      throw new Error('Subject Detection Service not initialized')
    }

    // Create a job key for deduplication
    const jobKey = transcription.trim()

    // Check if this exact transcription is already being analyzed
    const existingJob = this.activeJobs.get(jobKey)
    if (existingJob) {
      console.log(
        '🔄 Reusing existing subject analysis job for:',
        transcription.substring(0, 30) + '...'
      )
      return existingJob
    }

    // Create new analysis promise and track it
    const analysisPromise = this.performAnalysis(transcription, hasSubject)
    this.activeJobs.set(jobKey, analysisPromise)

    // Clean up tracking when job completes
    analysisPromise.finally(() => {
      this.activeJobs.delete(jobKey)
    })

    return analysisPromise
  }

  private async performAnalysis(
    transcription: string,
    hasSubject: boolean
  ): Promise<SubjectDetectionResult> {
    // Add to transcription history
    this.transcriptionHistory.push(transcription)
    if (this.transcriptionHistory.length > this.maxHistorySize) {
      this.transcriptionHistory.shift()
    }

    try {
      // If no subject exists yet, skip action detection and go straight to title generation
      if (!hasSubject) {
        console.log('🧠 No subject exists - generating initial title')
        const titleResponse = await this.titleSession!.prompt(
          `Create a title for this conversation topic based on the first message: "${transcription}"`,
          {
            responseConstraint: titleSchema,
          }
        )

        console.log('🧠 Initial title generation:', titleResponse)
        const titleResult = JSON.parse(titleResponse)

        const action: SubjectAction = {
          action: 'changeSubject',
          title: titleResult.title?.trim() || 'General Discussion',
        }

        console.log('🧠 Final action:', action)

        return {
          action,
          confidence: 0.8,
        }
      }

      // Create context from recent transcriptions
      const context = this.transcriptionHistory.slice(-5).join(' | ')
      const contextPrompt = `Context (recent transcriptions): ${context}

New transcription: "${transcription}"`

      // Step 1: Determine the action
      const actionResponse = await this.actionSession!.prompt(contextPrompt, {
        responseConstraint: actionSchema,
      })

      console.log('🧠 Step 1 - Action detection:', actionResponse)
      const actionResult = JSON.parse(actionResponse)

      let action: SubjectAction

      if (actionResult.action === 'changeSubject') {
        // Step 2a: Get the title for subject change
        const titleResponse = await this.titleSession!.prompt(
          `Create a title for this new topic: "${transcription}"`,
          {
            responseConstraint: titleSchema,
          }
        )

        console.log('🧠 Step 2a - Title generation:', titleResponse)
        const titleResult = JSON.parse(titleResponse)

        if (!titleResult.title || titleResult.title.trim() === '') {
          console.warn('⚠️ Empty title generated, falling back to bullet point')
          // Fall back to bullet point
          const bulletResponse = await this.bulletPointSession!.prompt(
            `Create a bullet point from: "${transcription}"`,
            {
              responseConstraint: bulletPointSchema,
            }
          )
          const bulletResult = JSON.parse(bulletResponse)

          action = {
            action: 'addBulletPoint',
            text: bulletResult.text || transcription,
          }
        } else {
          action = {
            action: 'changeSubject',
            title: titleResult.title.trim(),
          }
        }
      } else {
        // Step 2b: Get bullet point details
        const bulletResponse = await this.bulletPointSession!.prompt(
          `Create a bullet point from: "${transcription}"`,
          {
            responseConstraint: bulletPointSchema,
          }
        )

        console.log('🧠 Step 2b - Bullet point generation:', bulletResponse)
        const bulletResult = JSON.parse(bulletResponse)

        action = {
          action: 'addBulletPoint',
          text: bulletResult.text || transcription,
        }
      }

      console.log('🧠 Final action:', action)

      return {
        action,
        confidence: 0.8, // Higher confidence with focused prompts
      }
    } catch (error) {
      console.error('Failed to analyze transcription:', error)

      // Fallback: assume it's a bullet point if analysis fails
      return {
        action: {
          action: 'addBulletPoint',
          text: transcription,
        },
        confidence: 0.3,
      }
    }
  }

  clearHistory(): void {
    this.transcriptionHistory = []
    console.log('🧹 Subject detection history cleared')
  }

  async generateBootstrapTitle(transcription: string): Promise<string> {
    if (!this.titleSession) {
      throw new Error('Subject Detection Service not initialized')
    }

    try {
      const titleResponse = await this.titleSession.prompt(
        `Create a title for this conversation topic based on the first message: "${transcription}"`,
        {
          responseConstraint: titleSchema,
        }
      )

      console.log('🧠 Bootstrap title generation:', titleResponse)
      const titleResult = JSON.parse(titleResponse)

      if (!titleResult.title || titleResult.title.trim() === '') {
        console.warn('⚠️ Empty bootstrap title generated, using fallback')
        return 'General Discussion'
      }

      return titleResult.title.trim()
    } catch (error) {
      console.error('Failed to generate bootstrap title:', error)
      return 'General Discussion'
    }
  }

  getHistorySize(): number {
    return this.transcriptionHistory.length
  }

  destroy(): void {
    // Clear active jobs
    this.activeJobs.clear()

    // Properly destroy sessions that this service owns
    if (this.actionSession) {
      this.actionSession.destroy()
      this.actionSession = null
    }
    if (this.titleSession) {
      this.titleSession.destroy()
      this.titleSession = null
    }
    if (this.bulletPointSession) {
      this.bulletPointSession.destroy()
      this.bulletPointSession = null
    }

    this.transcriptionHistory = []
    this.isInitialized = false
    console.log('🧠 Subject Detection Service destroyed')
  }
}
