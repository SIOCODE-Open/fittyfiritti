import {
  createLanguageModelSession,
  LanguageModelSession,
} from '@fittyfiritti/built-in-ai-api'
import { retryAIPromptWithJSON } from '../utils/retryUtils'
import {
  actionSchemaDiagram,
  actionSchemaPaused,
  actionSchemaRunning,
  actionSchemaRunningNoDiagram,
  subjectChangeIntentSchema,
} from './PresentationControlSchemas'

export type PresentationAction =
  | 'resumePresentation'
  | 'pausePresentation'
  | 'changeSubject'
  | 'addSingleBulletPoint'
  | 'addMultipleBulletPoints'
  | 'beginDiagram'
  | 'diagramAction'
  | 'endDiagram'
  | 'noOperation'

/**
 * ActionDetectionService
 *
 * Responsible for detecting user intent and classifying transcriptions into actions.
 * Handles different presentation states: PAUSED, RUNNING, and DIAGRAM mode.
 * Uses session cloning with few-shot prompting to prevent conversation history buildup.
 */
export class ActionDetectionService {
  private baseSessionPaused: LanguageModelSession | null = null
  private baseSessionRunning: LanguageModelSession | null = null
  private baseSessionDiagram: LanguageModelSession | null = null
  private baseSessionSubjectChangeIntent: LanguageModelSession | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize base session for PAUSED state with few-shot examples
      this.baseSessionPaused = await createLanguageModelSession({
        temperature: 0.3,
        topK: 5,
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
          // Few-shot example 1 - Simple command
          {
            role: 'user',
            content:
              'Transcription: "Hey computer, let\'s start the presentation"',
          },
          {
            role: 'assistant',
            content: '{"action":"resumePresentation"}',
          },
          // Few-shot example 2 - Small talk with filler words
          {
            role: 'user',
            content:
              'Transcription: "Uh, hello everyone, um, my name is John and, uh, I\'m really excited to be here today"',
          },
          {
            role: 'assistant',
            content: '{"action":"noOperation"}',
          },
          // Few-shot example 3 - Command with filler words
          {
            role: 'user',
            content:
              'Transcription: "Okay so, um, computer, let\'s begin the presentation now"',
          },
          {
            role: 'assistant',
            content: '{"action":"resumePresentation"}',
          },
        ],
      })

      // Initialize base session for RUNNING state with few-shot examples
      this.baseSessionRunning = await createLanguageModelSession({
        temperature: 0.3,
        topK: 5,
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You are an action classifier for speech transcriptions when the presentation is RUNNING.

Your only job is to determine if a transcription represents:
- "pausePresentation": The speaker is explicitly addressing the computer to pause the presentation (e.g., "Hey computer, pause the presentation", "Computer, stop")
- "beginDiagram": The speaker explicitly wants to create or start editing a diagram (e.g., "let's create a diagram", "I want to make a diagram", "start diagram")
- "changeSubject": The speaker is clearly starting a NEW topic/subject
- "addSingleBulletPoint": The speaker is providing a SINGLE piece of information or making ONE point
- "addMultipleBulletPoints": The speaker is providing MULTIPLE distinct pieces of information or making SEVERAL separate points in one transcription
- "noOperation": Small talk, greetings, or unrelated casual conversation

Guidelines:
- ONLY detect "pausePresentation" when the speaker explicitly addresses the computer with keywords like "computer", "pause", "stop", "halt"
- ONLY detect "beginDiagram" when the speaker explicitly mentions creating or starting a diagram
- HEAVILY prefer "addSingleBulletPoint" or "addMultipleBulletPoints" over "changeSubject" - only use "changeSubject" for clear topic transitions
- Look for phrases like "now let's talk about", "moving on to", "next topic" for "changeSubject"
- Choose "addMultipleBulletPoints" when the transcription contains multiple distinct facts, items, or points (e.g., lists, enumerations, multiple statements)
- Choose "addSingleBulletPoint" when the transcription contains a single coherent idea or fact
- Small talk should be "noOperation"
- If in doubt between bullet point actions and "changeSubject", choose a bullet point action

Respond only with JSON containing the action.`,
          },
          // Few-shot example 1 - Topic change
          {
            role: 'user',
            content:
              'Context (recent transcriptions): Previous discussion | Earlier point\n\nNew transcription: "Alright, so um, now let\'s move on to, uh, the technical implementation details"',
          },
          {
            role: 'assistant',
            content: '{"action":"changeSubject"}',
          },
          // Few-shot example 2 - Single bullet point with filler words
          {
            role: 'user',
            content:
              'Context (recent transcriptions): Discussing features | Main topic\n\nNew transcription: "So, uh, this feature uses, um, real-time audio processing with, you know, WebRTC technology"',
          },
          {
            role: 'assistant',
            content: '{"action":"addSingleBulletPoint"}',
          },
          // Few-shot example 3 - Multiple bullet points with natural speech
          {
            role: 'user',
            content:
              'Context (recent transcriptions): Technical details | Implementation notes\n\nNew transcription: "Okay, so we have, um, three main components here. First, there\'s the audio capture service, then we have, uh, the transcription engine, and finally, um, the AI processor that handles everything"',
          },
          {
            role: 'assistant',
            content: '{"action":"addMultipleBulletPoints"}',
          },
        ],
      })

      // Initialize base session for DIAGRAM mode with few-shot examples
      this.baseSessionDiagram = await createLanguageModelSession({
        temperature: 0.3,
        topK: 5,
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You are an action classifier for speech transcriptions when in DIAGRAM EDITING mode.

Your job is to classify transcriptions into ONE of these actions:
1. "diagramAction" - The speaker is describing parts of the diagram (DEFAULT - use this most of the time)
2. "endDiagram" - The speaker EXPLICITLY says they want to stop/exit/finish the diagram
3. "noOperation" - Completely unrelated small talk

Rules for "diagramAction" (USE THIS MOST):
- ANY description of components, elements, steps, or flow
- Phrases like "we have", "there is", "next is", "then", "after that"
- Mentioning names of things, features, or concepts
- Describing connections like "goes to", "connects to", "from X to Y"
- When in doubt, ALWAYS choose "diagramAction"

Rules for "endDiagram" (USE THIS RARELY):
- ONLY when speaker explicitly says: "done", "finished", "that's it", "exit diagram", "stop diagram", "let's move on"
- Mentioning topics like "meeting", "summary" does NOT mean exit diagram - that could be a diagram node!
- If unsure, choose "diagramAction" instead

Rules for "noOperation":
- Pure off-topic conversation (weather, personal chat)
- Complete filler words with no content

CRITICAL: When editing a diagram, assume the user wants to add content unless they explicitly say they're done. Most transcriptions should be "diagramAction".

Respond only with JSON containing the action.`,
          },
          // Few-shot example 1 - Diagram content with filler words
          {
            role: 'user',
            content:
              'Transcription: "So, um, we have initialization at the start, you know, where everything begins"',
          },
          {
            role: 'assistant',
            content: '{"action":"diagramAction"}',
          },
          // Few-shot example 2 - Diagram connections
          {
            role: 'user',
            content:
              'Transcription: "And then, uh, from the API it goes to, um, the database where we store everything"',
          },
          {
            role: 'assistant',
            content: '{"action":"diagramAction"}',
          },
          // Few-shot example 3 - Explicit end
          {
            role: 'user',
            content:
              'Transcription: "Alright, um, I think that\'s it for the diagram. We\'re done here"',
          },
          {
            role: 'assistant',
            content: '{"action":"endDiagram"}',
          },
        ],
      })

      // Initialize base session for subject change intent detection with few-shot examples
      this.baseSessionSubjectChangeIntent = await createLanguageModelSession({
        temperature: 0.3,
        topK: 5,
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You detect whether a transcription expresses an intent to CHANGE TO A NEW TOPIC/SUBJECT.

Your job is to determine if the speaker is:
1. Moving on to a completely different topic/subject (return true)
2. Just finishing the current activity without changing topics (return false)

Examples that SHOULD trigger subject change (true):
- "Alright, let's move on to the technical details"
- "Now let's talk about the implementation"
- "Next topic is performance optimization"
- "Moving on to the next section"
- "Let's switch to discussing the backend"

Examples that should NOT trigger subject change (false):
- "Alright, I think that diagram is finished"
- "That's done, let's continue"
- "Okay, diagram complete"
- "That looks good"
- "Finished with this"

Key indicators for subject change:
- Explicit transition phrases: "moving on to", "next topic", "let's talk about", "switch to"
- Mentioning a specific new topic name
- Clear topic boundaries

Respond with JSON containing hasSubjectChangeIntent (boolean).`,
          },
          // Few-shot example 1 - Clear topic transition
          {
            role: 'user',
            content:
              'Transcription: "Alright, so um, let\'s move on to the technical details now"',
          },
          {
            role: 'assistant',
            content: '{"hasSubjectChangeIntent":true}',
          },
          // Few-shot example 2 - Just finishing without topic change
          {
            role: 'user',
            content:
              'Transcription: "Okay, um, I think that diagram is finished. That looks good"',
          },
          {
            role: 'assistant',
            content: '{"hasSubjectChangeIntent":false}',
          },
          // Few-shot example 3 - Explicit new topic mention
          {
            role: 'user',
            content:
              'Transcription: "So, uh, now let\'s talk about, um, performance optimization and how we can improve things"',
          },
          {
            role: 'assistant',
            content: '{"hasSubjectChangeIntent":true}',
          },
        ],
      })

      this.isInitialized = true
      console.log('🎯 Action Detection Service initialized')
    } catch (error) {
      console.error('Failed to initialize Action Detection Service:', error)
      throw new Error('Failed to initialize action detection')
    }
  }

  /**
   * Detect action when presentation is paused
   */
  async detectActionPaused(transcription: string): Promise<PresentationAction> {
    if (!this.baseSessionPaused) {
      throw new Error('Action Detection Service not initialized')
    }

    console.log('🚧 Detecting action (paused) ...')

    const clonedSession = await this.baseSessionPaused.clone()

    console.log(
      'Session input',
      clonedSession,
      clonedSession.inputQuota,
      clonedSession.inputUsage
    )
    try {
      const actionResult = await retryAIPromptWithJSON<{ action: string }>(
        async () =>
          await clonedSession.prompt(`Transcription: "${transcription}"`, {
            responseConstraint: actionSchemaPaused,
          })
      )

      console.log(
        '🚧 Detected action (paused):',
        typeof actionResult,
        actionResult
      )

      return actionResult.action as PresentationAction
    } catch (error) {
      console.error('Failed to detect action (paused) after retries:', error)
      throw new Error(
        `Action detection failed (paused): ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Detect action when presentation is running
   */
  async detectActionRunning(
    transcription: string,
    context: string,
    diagramModeEnabled: boolean
  ): Promise<PresentationAction> {
    if (!this.baseSessionRunning) {
      throw new Error('Action Detection Service not initialized')
    }

    const clonedSession = await this.baseSessionRunning.clone()
    try {
      const contextPrompt = `Context (recent transcriptions): ${context}

New transcription: "${transcription}"`

      const schema = diagramModeEnabled
        ? actionSchemaRunning
        : actionSchemaRunningNoDiagram

      const actionResult = await retryAIPromptWithJSON<{ action: string }>(
        async () =>
          await clonedSession.prompt(contextPrompt, {
            responseConstraint: schema,
          })
      )

      return actionResult.action as PresentationAction
    } catch (error) {
      console.error('Failed to detect action (running) after retries:', error)
      throw new Error(
        `Action detection failed (running): ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Detect action when in diagram mode
   */
  async detectActionDiagram(
    transcription: string
  ): Promise<PresentationAction> {
    if (!this.baseSessionDiagram) {
      throw new Error('Action Detection Service not initialized')
    }

    const clonedSession = await this.baseSessionDiagram.clone()
    try {
      const actionResult = await retryAIPromptWithJSON<{ action: string }>(
        async () =>
          await clonedSession.prompt(`Transcription: "${transcription}"`, {
            responseConstraint: actionSchemaDiagram,
          })
      )

      return actionResult.action as PresentationAction
    } catch (error) {
      console.error('Failed to detect action (diagram) after retries:', error)
      throw new Error(
        `Action detection failed (diagram): ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Detect if transcription expresses intent to change subject
   */
  async detectSubjectChangeIntent(transcription: string): Promise<boolean> {
    if (!this.baseSessionSubjectChangeIntent) {
      throw new Error('Action Detection Service not initialized')
    }

    const clonedSession = await this.baseSessionSubjectChangeIntent.clone()
    try {
      const result = await retryAIPromptWithJSON<{
        hasSubjectChangeIntent: boolean
      }>(
        async () =>
          await clonedSession.prompt(`Transcription: "${transcription}"`, {
            responseConstraint: subjectChangeIntentSchema,
          })
      )

      return result.hasSubjectChangeIntent ?? false
    } catch (error) {
      console.error(
        'Failed to detect subject change intent after retries:',
        error
      )
      throw new Error(
        `Subject change intent detection failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  destroy(): void {
    if (this.baseSessionPaused) {
      this.baseSessionPaused.destroy()
      this.baseSessionPaused = null
    }
    if (this.baseSessionRunning) {
      this.baseSessionRunning.destroy()
      this.baseSessionRunning = null
    }
    if (this.baseSessionDiagram) {
      this.baseSessionDiagram.destroy()
      this.baseSessionDiagram = null
    }
    if (this.baseSessionSubjectChangeIntent) {
      this.baseSessionSubjectChangeIntent.destroy()
      this.baseSessionSubjectChangeIntent = null
    }
    this.isInitialized = false
  }
}
