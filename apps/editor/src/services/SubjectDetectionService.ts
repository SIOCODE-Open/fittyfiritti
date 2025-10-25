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

export interface PausePresentation {
  action: 'pausePresentation'
}

export interface ResumePresentation {
  action: 'resumePresentation'
}

export interface NoOperation {
  action: 'noOperation'
}

export type SubjectAction =
  | SubjectChange
  | BulletPoint
  | PausePresentation
  | ResumePresentation
  | NoOperation

export interface SubjectDetectionResult {
  action: SubjectAction
  confidence: number
}

// Define the JSON schemas for structured output
const actionSchemaPaused: JSONSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['resumePresentation', 'noOperation'],
    },
  },
  required: ['action'],
}

const actionSchemaRunning: JSONSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [
        'pausePresentation',
        'changeSubject',
        'addBulletPoint',
        'noOperation',
      ],
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
  private actionSessionPaused: LanguageModelSession | null = null
  private actionSessionRunning: LanguageModelSession | null = null
  private titleSession: LanguageModelSession | null = null
  private bulletPointSession: LanguageModelSession | null = null
  private isInitialized = false
  private transcriptionHistory: string[] = []
  private maxHistorySize = 10 // Keep last 10 transcriptions for context
  private isPresentationPaused = true // Start with presentation paused

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize action detection session for PAUSED state
      this.actionSessionPaused = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You are an action classifier for speech transcriptions when the presentation is PAUSED.

Your only job is to determine if a transcription represents:
- "resumePresentation": The speaker is explicitly addressing the computer to start/resume the presentation (e.g., "Hey computer, let's start the presentation", "Computer, begin presentation")
- "noOperation": Anything else - small talk, greetings, self-introduction, casual conversation, or any other speech

Guidelines:
- ONLY detect "resumePresentation" when the speaker explicitly addresses the computer with keywords like "computer", "start", "begin", "resume", "let's start"
- Small talk like "how are you doing", "my name is", "hello", etc. should be "noOperation"
- If in doubt, choose "noOperation"

Respond only with JSON containing the action.`,
          },
        ],
      })

      // Initialize action detection session for RUNNING state
      this.actionSessionRunning = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You are an action classifier for speech transcriptions when the presentation is RUNNING.

Your only job is to determine if a transcription represents:
- "pausePresentation": The speaker is explicitly addressing the computer to pause the presentation (e.g., "Hey computer, pause the presentation", "Computer, stop")
- "changeSubject": The speaker is clearly starting a NEW topic/subject
- "addBulletPoint": The speaker is continuing the current topic and providing information
- "noOperation": Small talk, greetings, or unrelated casual conversation

Guidelines:
- ONLY detect "pausePresentation" when the speaker explicitly addresses the computer with keywords like "computer", "pause", "stop", "halt"
- HEAVILY prefer "addBulletPoint" over "changeSubject" - only use "changeSubject" for clear topic transitions
- Look for phrases like "now let's talk about", "moving on to", "next topic" for "changeSubject"
- Small talk should be "noOperation"
- If in doubt between "addBulletPoint" and "changeSubject", choose "addBulletPoint"

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
    if (
      !this.actionSessionPaused ||
      !this.actionSessionRunning ||
      !this.titleSession ||
      !this.bulletPointSession
    ) {
      throw new Error('Subject Detection Service not initialized')
    }

    return this.performAnalysis(transcription, hasSubject)
  }

  setPresentationState(isPaused: boolean): void {
    this.isPresentationPaused = isPaused
    console.log(
      `🎤 Presentation state changed to: ${isPaused ? 'PAUSED' : 'RUNNING'}`
    )
  }

  getPresentationState(): boolean {
    return this.isPresentationPaused
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
      // If presentation is paused, use the paused session
      if (this.isPresentationPaused) {
        console.log('🛑 Presentation is PAUSED - checking for resume command')
        const actionResponse = await this.actionSessionPaused!.prompt(
          `Transcription: "${transcription}"`,
          {
            responseConstraint: actionSchemaPaused,
          }
        )

        console.log('🧠 Paused action detection:', actionResponse)
        const actionResult = JSON.parse(actionResponse)

        if (actionResult.action === 'resumePresentation') {
          return {
            action: { action: 'resumePresentation' },
            confidence: 0.9,
          }
        } else {
          return {
            action: { action: 'noOperation' },
            confidence: 0.9,
          }
        }
      }

      // If presentation is running, use the running session
      console.log('▶️ Presentation is RUNNING - analyzing for actions')

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
      const actionResponse = await this.actionSessionRunning!.prompt(
        contextPrompt,
        {
          responseConstraint: actionSchemaRunning,
        }
      )

      console.log('🧠 Step 1 - Action detection:', actionResponse)
      const actionResult = JSON.parse(actionResponse)

      let action: SubjectAction

      if (actionResult.action === 'pausePresentation') {
        return {
          action: { action: 'pausePresentation' },
          confidence: 0.9,
        }
      } else if (actionResult.action === 'noOperation') {
        return {
          action: { action: 'noOperation' },
          confidence: 0.9,
        }
      } else if (actionResult.action === 'changeSubject') {
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

      // Fallback: assume it's a no-op if analysis fails
      return {
        action: {
          action: 'noOperation',
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
    // Properly destroy sessions that this service owns
    if (this.actionSessionPaused) {
      this.actionSessionPaused.destroy()
      this.actionSessionPaused = null
    }
    if (this.actionSessionRunning) {
      this.actionSessionRunning.destroy()
      this.actionSessionRunning = null
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
