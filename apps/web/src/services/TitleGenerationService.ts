import {
  createLanguageModelSession,
  LanguageModelSession,
} from '@fittyfiritti/built-in-ai-api'
import { retryAIPromptWithJSON } from '../utils/retryUtils'
import { diagramTitleSchema, titleSchema } from './PresentationControlSchemas'

/**
 * TitleGenerationService
 *
 * Responsible for generating titles for subjects and diagrams using AI.
 * Uses session cloning with few-shot prompting to ensure consistent,
 * high-quality title generation without conversation history buildup.
 */
export class TitleGenerationService {
  private baseSessionSubjectTitle: LanguageModelSession | null = null
  private baseSessionDiagramTitle: LanguageModelSession | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize base session for subject titles with few-shot examples
      this.baseSessionSubjectTitle = await createLanguageModelSession({
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
          // Few-shot example 1 - System topic
          {
            role: 'user',
            content:
              'Create a title for this new topic: "So, um, now let\'s talk about the overall architecture of the system and how everything connects"',
          },
          {
            role: 'assistant',
            content: '{"title":"System Architecture"}',
          },
          // Few-shot example 2 - Performance topic
          {
            role: 'user',
            content:
              'Create a title for this new topic: "Alright, uh, moving on to performance optimization strategies and, you know, how we can make things faster"',
          },
          {
            role: 'assistant',
            content: '{"title":"Performance Optimization"}',
          },
          // Few-shot example 3 - UI demo
          {
            role: 'user',
            content:
              'Create a title for this new topic: "Okay so, um, let me show you how the user interface works. It\'s pretty straightforward"',
          },
          {
            role: 'assistant',
            content: '{"title":"User Interface Demo"}',
          },
        ],
      })

      // Initialize base session for diagram titles with few-shot examples
      this.baseSessionDiagramTitle = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You generate concise, descriptive titles for diagrams based on the initial request.

Create a clear, specific title (2-5 words) that captures what the diagram will represent.

Examples:
- "System Architecture"
- "Data Flow"
- "User Journey"
- "Component Structure"

Respond only with JSON containing the title.`,
          },
          // Few-shot example 1 - Data flow diagram
          {
            role: 'user',
            content:
              'Create a diagram title from: "Okay so, um, let\'s create a diagram showing the data flow through our system"',
          },
          {
            role: 'assistant',
            content: '{"title":"Data Flow"}',
          },
          // Few-shot example 2 - Architecture diagram
          {
            role: 'user',
            content:
              'Create a diagram title from: "Alright, I want to make, uh, a diagram of the system architecture and how components interact"',
          },
          {
            role: 'assistant',
            content: '{"title":"System Architecture"}',
          },
          // Few-shot example 3 - Process diagram
          {
            role: 'user',
            content:
              'Create a diagram title from: "So, um, let\'s diagram the user authentication process, you know, from login to session"',
          },
          {
            role: 'assistant',
            content: '{"title":"Authentication Process"}',
          },
        ],
      })

      this.isInitialized = true
      console.log('📝 Title Generation Service initialized')
    } catch (error) {
      console.error('Failed to initialize Title Generation Service:', error)
      throw new Error('Failed to initialize title generation')
    }
  }

  /**
   * Generate a title for a new subject/topic
   */
  async generateSubjectTitle(transcription: string): Promise<string> {
    if (!this.baseSessionSubjectTitle) {
      throw new Error('Title Generation Service not initialized')
    }

    const clonedSession = await this.baseSessionSubjectTitle.clone()
    try {
      const titleResult = await retryAIPromptWithJSON<{ title: string }>(
        async () =>
          await clonedSession.prompt(
            `Create a title for this new topic: "${transcription}"`,
            {
              responseConstraint: titleSchema,
            }
          )
      )

      if (!titleResult.title || titleResult.title.trim() === '') {
        console.warn('⚠️ Empty subject title generated, using fallback')
        return 'General Discussion'
      }

      return titleResult.title.trim()
    } catch (error) {
      console.error('Failed to generate subject title after retries:', error)
      throw new Error(
        `Subject title generation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Generate a title for a new diagram
   */
  async generateDiagramTitle(transcription: string): Promise<string> {
    if (!this.baseSessionDiagramTitle) {
      throw new Error('Title Generation Service not initialized')
    }

    const clonedSession = await this.baseSessionDiagramTitle.clone()
    try {
      const titleResult = await retryAIPromptWithJSON<{ title: string }>(
        async () =>
          await clonedSession.prompt(
            `Create a diagram title from: "${transcription}"`,
            {
              responseConstraint: diagramTitleSchema,
            }
          )
      )

      if (!titleResult.title || titleResult.title.trim() === '') {
        console.warn('⚠️ Empty diagram title generated, using fallback')
        return 'Untitled Diagram'
      }

      return titleResult.title.trim()
    } catch (error) {
      console.error('Failed to generate diagram title after retries:', error)
      throw new Error(
        `Diagram title generation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      clonedSession.destroy()
    }
  }

  /**
   * Generate a bootstrap title based on the first transcription
   */
  async generateBootstrapTitle(transcription: string): Promise<string> {
    if (!this.baseSessionSubjectTitle) {
      throw new Error('Title Generation Service not initialized')
    }

    const clonedSession = await this.baseSessionSubjectTitle.clone()
    try {
      const titleResult = await retryAIPromptWithJSON<{ title: string }>(
        async () =>
          await clonedSession.prompt(
            `Create a title for this conversation topic based on the first message: "${transcription}"`,
            {
              responseConstraint: titleSchema,
            }
          )
      )

      if (!titleResult.title || titleResult.title.trim() === '') {
        console.warn('⚠️ Empty bootstrap title generated, using fallback')
        return 'General Discussion'
      }

      return titleResult.title.trim()
    } catch (error) {
      console.error('Failed to generate bootstrap title after retries:', error)
      throw new Error(
        `Bootstrap title generation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  destroy(): void {
    if (this.baseSessionSubjectTitle) {
      this.baseSessionSubjectTitle.destroy()
      this.baseSessionSubjectTitle = null
    }
    if (this.baseSessionDiagramTitle) {
      this.baseSessionDiagramTitle.destroy()
      this.baseSessionDiagramTitle = null
    }
    this.isInitialized = false
  }
}
