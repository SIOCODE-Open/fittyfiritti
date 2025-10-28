import {
  createLanguageModelSession,
  JSONSchema,
  LanguageModelSession,
} from '@fittyfiritti/built-in-ai-api'

export interface SubjectChange {
  action: 'changeSubject'
  title: string
}

export interface SingleBulletPoint {
  action: 'addSingleBulletPoint'
  text: string
}

export interface MultipleBulletPoints {
  action: 'addMultipleBulletPoints'
  bulletPoints: { text: string }[]
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

export interface BeginDiagram {
  action: 'beginDiagram'
  title: string
}

export interface EndDiagram {
  action: 'endDiagram'
}

export interface DiagramAction {
  action: 'diagramAction'
  actions: Array<
    | { type: 'updateDiagramTitle'; title: string }
    | { type: 'addNode'; id: string; label: string }
    | { type: 'editNode'; id: string; label: string }
    | { type: 'removeNode'; id: string }
    | { type: 'addEdge'; from: string; to: string }
    | { type: 'removeEdge'; from: string; to: string }
    | { type: 'noOperation' }
  >
}

export type SubjectAction =
  | SubjectChange
  | SingleBulletPoint
  | MultipleBulletPoints
  | PausePresentation
  | ResumePresentation
  | NoOperation
  | BeginDiagram
  | EndDiagram
  | DiagramAction

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
        'addSingleBulletPoint',
        'addMultipleBulletPoints',
        'beginDiagram',
        'noOperation',
      ],
    },
  },
  required: ['action'],
}

const actionSchemaRunningNoDiagram: JSONSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [
        'pausePresentation',
        'changeSubject',
        'addSingleBulletPoint',
        'addMultipleBulletPoints',
        'noOperation',
      ],
    },
  },
  required: ['action'],
}

const actionSchemaDiagram: JSONSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['diagramAction', 'endDiagram', 'noOperation'],
    },
  },
  required: ['action'],
}

const diagramTitleSchema: JSONSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Descriptive title for the new diagram',
    },
  },
  required: ['title'],
}

const diagramActionsSchema: JSONSchema = {
  type: 'object',
  properties: {
    actions: {
      type: 'array',
      description: 'Array of diagram editing actions to perform',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'updateDiagramTitle',
              'addNode',
              'editNode',
              'removeNode',
              'addEdge',
              'removeEdge',
              'noOperation',
            ],
          },
          title: { type: 'string' },
          id: { type: 'string' },
          label: { type: 'string' },
          from: { type: 'string' },
          to: { type: 'string' },
        },
        required: ['type'],
      },
    },
  },
  required: ['actions'],
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

const multipleBulletPointsSchema: JSONSchema = {
  type: 'object',
  properties: {
    bulletPoints: {
      type: 'array',
      description: 'Array of bullet points to add',
      items: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Summary text for each bullet point',
          },
        },
        required: ['text'],
      },
    },
  },
  required: ['bulletPoints'],
}

const subjectChangeIntentSchema: JSONSchema = {
  type: 'object',
  properties: {
    hasSubjectChangeIntent: {
      type: 'boolean',
      description:
        'Whether the text expresses intent to change to a new topic/subject',
    },
  },
  required: ['hasSubjectChangeIntent'],
}

export class SubjectDetectionService {
  private actionSessionPaused: LanguageModelSession | null = null
  private actionSessionRunning: LanguageModelSession | null = null
  private actionSessionDiagram: LanguageModelSession | null = null
  private titleSession: LanguageModelSession | null = null
  private bulletPointSession: LanguageModelSession | null = null
  private multipleBulletPointsSession: LanguageModelSession | null = null
  private diagramTitleSession: LanguageModelSession | null = null
  private diagramActionsSession: LanguageModelSession | null = null
  private subjectChangeIntentSession: LanguageModelSession | null = null
  private isInitialized = false
  private transcriptionHistory: string[] = []
  private maxHistorySize = 10 // Keep last 10 transcriptions for context
  private isPresentationPaused = true // Start with presentation paused
  private isInDiagramMode = false // Track if we're in diagram editing mode

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
            content: `You create a single concise bullet point from a speech transcription.

Extract the key information and create a clear, factual bullet point.

Guidelines:
- Focus on the specific fact, feature, or action mentioned
- Keep text concise (5-15 words)
- Extract concrete information, not general statements

Respond only with JSON containing text.`,
          },
        ],
      })

      // Initialize multiple bullet points generation session
      this.multipleBulletPointsSession = await createLanguageModelSession({
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
        ],
      })

      // Initialize action detection session for DIAGRAM mode
      this.actionSessionDiagram = await createLanguageModelSession({
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
        ],
      })

      // Initialize diagram title generation session
      this.diagramTitleSession = await createLanguageModelSession({
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
        ],
      })

      // Initialize diagram actions generation session
      this.diagramActionsSession = await createLanguageModelSession({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You extract diagram nodes and connections from speech. Keep it simple.

Your job:
1. Find ALL nouns/concepts mentioned -> create "addNode" for each
2. Find flow/connection words -> create "addEdge"

Action types:
- addNode: Add a box (requires: id, label)
- addEdge: Connect boxes (requires: from, to)
- noOperation: Only if nothing to extract

Node extraction (MOST IMPORTANT):
- ANY noun, concept, step, or component = addNode
- Phrases like "we have X", "X is next", "there's Y" = addNode for X/Y
- Lists "A, B, and C" = addNode for each
- Generate simple IDs: "Setup Phase" -> "setup_phase", "API" -> "api"
- Make IDs lowercase with underscores for spaces

Edge extraction:
- "from X to Y", "X goes to Y", "after X comes Y" = addEdge from X to Y
- IMPORTANT: Use EXACT node IDs from the current diagram state when provided
- For edges referencing new nodes, use the IDs you just created

Examples:
"We have initialization" -> [{"type":"addNode","id":"initialization","label":"initialization"}]

"After setup, branch A and branch B" -> [{"type":"addNode","id":"setup","label":"setup"},{"type":"addNode","id":"branch_a","label":"branch a"},{"type":"addNode","id":"branch_b","label":"branch b"}]

"From VAD to transcription" (VAD already exists) -> [{"type":"addNode","id":"transcription","label":"transcription"},{"type":"addEdge","from":"vad","to":"transcription"}]

CRITICAL: Be aggressive with addNode - extract every concept! But be careful with addEdge - only when connections are explicitly mentioned.

Respond with JSON array of actions.`,
          },
        ],
      })

      // Initialize subject change intent detection session
      this.subjectChangeIntentSession = await createLanguageModelSession({
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
    hasSubject: boolean = true,
    currentDiagramData?: {
      nodes: Array<{ id: string; label: string }>
      edges: Array<{ from: string; to: string }>
    },
    diagramModeEnabled: boolean = false
  ): Promise<SubjectDetectionResult> {
    if (
      !this.actionSessionPaused ||
      !this.actionSessionRunning ||
      !this.titleSession ||
      !this.bulletPointSession
    ) {
      throw new Error('Subject Detection Service not initialized')
    }

    return this.performAnalysis(
      transcription,
      hasSubject,
      currentDiagramData,
      diagramModeEnabled
    )
  }

  setPresentationState(isPaused: boolean): void {
    this.isPresentationPaused = isPaused
  }

  getPresentationState(): boolean {
    return this.isPresentationPaused
  }

  setDiagramMode(isInDiagramMode: boolean): void {
    this.isInDiagramMode = isInDiagramMode
  }

  getDiagramMode(): boolean {
    return this.isInDiagramMode
  }

  private async performAnalysis(
    transcription: string,
    hasSubject: boolean,
    currentDiagramData?: {
      nodes: Array<{ id: string; label: string }>
      edges: Array<{ from: string; to: string }>
    },
    diagramModeEnabled: boolean = false
  ): Promise<SubjectDetectionResult> {
    // Add to transcription history
    this.transcriptionHistory.push(transcription)
    if (this.transcriptionHistory.length > this.maxHistorySize) {
      this.transcriptionHistory.shift()
    }

    console.log(`📝 Analyzing transcription: "${transcription}"`)
    console.log(
      `🔍 State: ${this.isPresentationPaused ? 'PAUSED' : this.isInDiagramMode ? 'DIAGRAM' : 'RUNNING'}, hasSubject: ${hasSubject}`
    )

    try {
      // If presentation is paused, use the paused session
      if (this.isPresentationPaused) {
        const actionResponse = await this.actionSessionPaused!.prompt(
          `Transcription: "${transcription}"`,
          {
            responseConstraint: actionSchemaPaused,
          }
        )

        const actionResult = JSON.parse(actionResponse)
        console.log('🎯 Paused mode result:', JSON.stringify(actionResult))

        if (actionResult.action === 'resumePresentation') {
          console.log('▶️ Detected: RESUME PRESENTATION')
          return {
            action: { action: 'resumePresentation' },
            confidence: 0.9,
          }
        } else {
          console.log('⏸️ Detected: NO OPERATION (paused)')
          return {
            action: { action: 'noOperation' },
            confidence: 0.9,
          }
        }
      }

      // If in diagram mode, use the diagram session
      if (this.isInDiagramMode) {
        const actionResponse = await this.actionSessionDiagram!.prompt(
          `Transcription: "${transcription}"`,
          {
            responseConstraint: actionSchemaDiagram,
          }
        )

        const actionResult = JSON.parse(actionResponse)
        console.log('📊 Diagram mode result:', JSON.stringify(actionResult))

        if (actionResult.action === 'endDiagram') {
          console.log('🏁 Detected: END DIAGRAM')
          return {
            action: { action: 'endDiagram' },
            confidence: 0.9,
          }
        } else if (actionResult.action === 'noOperation') {
          console.log('⏸️ Detected: NO OPERATION (diagram)')
          return {
            action: { action: 'noOperation' },
            confidence: 0.9,
          }
        } else if (actionResult.action === 'diagramAction') {
          // Get the diagram actions
          // Build current diagram state context
          let diagramStateContext = ''
          if (currentDiagramData && currentDiagramData.nodes.length > 0) {
            diagramStateContext = `

Current diagram state:
Nodes: ${currentDiagramData.nodes.map(n => `"${n.id}" (label: "${n.label}")`).join(', ')}
Edges: ${currentDiagramData.edges.length > 0 ? currentDiagramData.edges.map(e => `"${e.from}" -> "${e.to}"`).join(', ') : 'none'}

When referencing nodes for edges, use the exact IDs listed above.`
          }

          const actionsResponse = await this.diagramActionsSession!.prompt(
            `Extract diagram editing instructions from: "${transcription}"${diagramStateContext}`,
            {
              responseConstraint: diagramActionsSchema,
            }
          )

          const actionsResult = JSON.parse(actionsResponse)
          console.log(
            '✏️ Detected: DIAGRAM ACTIONS:',
            JSON.stringify(actionsResult.actions, null, 2)
          )

          return {
            action: {
              action: 'diagramAction',
              actions: actionsResult.actions || [{ type: 'noOperation' }],
            },
            confidence: 0.8,
          }
        }
      }

      // Create context from recent transcriptions
      const context = this.transcriptionHistory.slice(-5).join(' | ')
      const contextPrompt = `Context (recent transcriptions): ${context}

New transcription: "${transcription}"`

      // Step 1: Determine the action - use appropriate schema based on diagramModeEnabled
      const runningSchema = diagramModeEnabled
        ? actionSchemaRunning
        : actionSchemaRunningNoDiagram
      const actionResponse = await this.actionSessionRunning!.prompt(
        contextPrompt,
        {
          responseConstraint: runningSchema,
        }
      )

      const actionResult = JSON.parse(actionResponse)
      console.log('🎯 Running mode result:', JSON.stringify(actionResult))

      // Special handling when no subject exists yet
      if (!hasSubject) {
        console.log('🆕 No subject yet, validating initial action')

        // If the detected action is beginDiagram, allow it
        if (actionResult.action === 'beginDiagram') {
          const titleResponse = await this.diagramTitleSession!.prompt(
            `Create a diagram title from: "${transcription}"`,
            {
              responseConstraint: diagramTitleSchema,
            }
          )

          const titleResult = JSON.parse(titleResponse)
          console.log(
            '📊 Detected: BEGIN DIAGRAM (first subject) -',
            titleResult.title?.trim() || 'Untitled Diagram'
          )

          return {
            action: {
              action: 'beginDiagram',
              title: titleResult.title?.trim() || 'Untitled Diagram',
            },
            confidence: 0.9,
          }
        }

        // If the detected action is changeSubject, allow it
        if (actionResult.action === 'changeSubject') {
          const titleResponse = await this.titleSession!.prompt(
            `Create a title for this new topic: "${transcription}"`,
            {
              responseConstraint: titleSchema,
            }
          )

          const titleResult = JSON.parse(titleResponse)
          console.log(
            '🔄 Detected: CHANGE SUBJECT (first subject) -',
            titleResult.title?.trim() || 'General Discussion'
          )

          return {
            action: {
              action: 'changeSubject',
              title: titleResult.title?.trim() || 'General Discussion',
            },
            confidence: 0.9,
          }
        }

        // If it's a bullet point action, allow it (will be handled by SubjectDisplay to bootstrap a subject)
        if (actionResult.action === 'addSingleBulletPoint') {
          const bulletResponse = await this.bulletPointSession!.prompt(
            `Create a bullet point from: "${transcription}"`,
            {
              responseConstraint: bulletPointSchema,
            }
          )

          const bulletResult = JSON.parse(bulletResponse)
          console.log(
            '📌 Detected: ADD SINGLE BULLET POINT (will bootstrap subject) -',
            bulletResult.text || transcription
          )

          return {
            action: {
              action: 'addSingleBulletPoint',
              text: bulletResult.text || transcription,
            },
            confidence: 0.8,
          }
        }

        if (actionResult.action === 'addMultipleBulletPoints') {
          const bulletResponse = await this.multipleBulletPointsSession!.prompt(
            `Create multiple bullet points from: "${transcription}"`,
            {
              responseConstraint: multipleBulletPointsSchema,
            }
          )

          const bulletResult = JSON.parse(bulletResponse)
          console.log(
            '📌 Detected: ADD MULTIPLE BULLET POINTS (will bootstrap subject) -',
            bulletResult.bulletPoints?.length || 0,
            'points'
          )

          return {
            action: {
              action: 'addMultipleBulletPoints',
              bulletPoints: bulletResult.bulletPoints || [
                { text: transcription },
              ],
            },
            confidence: 0.8,
          }
        }

        // For any other action (noOperation, pausePresentation), just return it
        console.log(
          '⏸️ Detected: Other action (no subject) -',
          actionResult.action
        )
        return {
          action: { action: actionResult.action },
          confidence: 0.9,
        }
      }

      let action: SubjectAction

      if (actionResult.action === 'pausePresentation') {
        console.log('⏸️ Detected: PAUSE PRESENTATION')
        return {
          action: { action: 'pausePresentation' },
          confidence: 0.9,
        }
      } else if (actionResult.action === 'noOperation') {
        console.log('⏸️ Detected: NO OPERATION (running)')
        return {
          action: { action: 'noOperation' },
          confidence: 0.9,
        }
      } else if (actionResult.action === 'beginDiagram') {
        // Step 2: Get the diagram title
        const titleResponse = await this.diagramTitleSession!.prompt(
          `Create a diagram title from: "${transcription}"`,
          {
            responseConstraint: diagramTitleSchema,
          }
        )

        const titleResult = JSON.parse(titleResponse)
        console.log(
          '📊 Detected: BEGIN DIAGRAM -',
          titleResult.title?.trim() || 'Untitled Diagram'
        )

        action = {
          action: 'beginDiagram',
          title: titleResult.title?.trim() || 'Untitled Diagram',
        }
      } else if (actionResult.action === 'changeSubject') {
        // Step 2a: Get the title for subject change
        const titleResponse = await this.titleSession!.prompt(
          `Create a title for this new topic: "${transcription}"`,
          {
            responseConstraint: titleSchema,
          }
        )

        const titleResult = JSON.parse(titleResponse)

        if (!titleResult.title || titleResult.title.trim() === '') {
          console.warn(
            '⚠️ Empty title generated, falling back to single bullet point'
          )
          // Fall back to single bullet point
          const bulletResponse = await this.bulletPointSession!.prompt(
            `Create a bullet point from: "${transcription}"`,
            {
              responseConstraint: bulletPointSchema,
            }
          )
          const bulletResult = JSON.parse(bulletResponse)

          action = {
            action: 'addSingleBulletPoint',
            text: bulletResult.text || transcription,
          }
          console.log(
            '📌 Detected (fallback): ADD SINGLE BULLET POINT -',
            action.text
          )
        } else {
          action = {
            action: 'changeSubject',
            title: titleResult.title.trim(),
          }
          console.log('🔄 Detected: CHANGE SUBJECT -', action.title)
        }
      } else if (actionResult.action === 'addSingleBulletPoint') {
        // Step 2b: Get single bullet point details
        const bulletResponse = await this.bulletPointSession!.prompt(
          `Create a bullet point from: "${transcription}"`,
          {
            responseConstraint: bulletPointSchema,
          }
        )

        const bulletResult = JSON.parse(bulletResponse)

        action = {
          action: 'addSingleBulletPoint',
          text: bulletResult.text || transcription,
        }
        console.log('📌 Detected: ADD SINGLE BULLET POINT -', action.text)
      } else if (actionResult.action === 'addMultipleBulletPoints') {
        // Step 2c: Get multiple bullet points details
        const bulletResponse = await this.multipleBulletPointsSession!.prompt(
          `Create multiple bullet points from: "${transcription}"`,
          {
            responseConstraint: multipleBulletPointsSchema,
          }
        )

        const bulletResult = JSON.parse(bulletResponse)

        action = {
          action: 'addMultipleBulletPoints',
          bulletPoints: bulletResult.bulletPoints || [{ text: transcription }],
        }
        console.log(
          '📌 Detected: ADD MULTIPLE BULLET POINTS -',
          action.bulletPoints.length,
          'points'
        )
      } else {
        // Fallback to single bullet point for unknown actions
        console.warn('⚠️ Unknown action, falling back to single bullet point')
        const bulletResponse = await this.bulletPointSession!.prompt(
          `Create a bullet point from: "${transcription}"`,
          {
            responseConstraint: bulletPointSchema,
          }
        )

        const bulletResult = JSON.parse(bulletResponse)

        action = {
          action: 'addSingleBulletPoint',
          text: bulletResult.text || transcription,
        }
        console.log(
          '📌 Detected (fallback): ADD SINGLE BULLET POINT -',
          action.text
        )
      }

      console.log('✅ Final action:', JSON.stringify(action, null, 2))
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

  async detectSubjectChangeIntent(transcription: string): Promise<boolean> {
    if (!this.subjectChangeIntentSession) {
      throw new Error('Subject Detection Service not initialized')
    }

    try {
      const response = await this.subjectChangeIntentSession.prompt(
        `Transcription: "${transcription}"`,
        {
          responseConstraint: subjectChangeIntentSchema,
        }
      )

      const result = JSON.parse(response)
      const hasIntent = result.hasSubjectChangeIntent ?? false

      console.log(
        `🔍 Subject change intent detection for "${transcription}": ${hasIntent}`
      )

      return hasIntent
    } catch (error) {
      console.error('Failed to detect subject change intent:', error)
      // Default to false (don't change subject) on error
      return false
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
    if (this.actionSessionDiagram) {
      this.actionSessionDiagram.destroy()
      this.actionSessionDiagram = null
    }
    if (this.titleSession) {
      this.titleSession.destroy()
      this.titleSession = null
    }
    if (this.bulletPointSession) {
      this.bulletPointSession.destroy()
      this.bulletPointSession = null
    }
    if (this.multipleBulletPointsSession) {
      this.multipleBulletPointsSession.destroy()
      this.multipleBulletPointsSession = null
    }
    if (this.diagramTitleSession) {
      this.diagramTitleSession.destroy()
      this.diagramTitleSession = null
    }
    if (this.diagramActionsSession) {
      this.diagramActionsSession.destroy()
      this.diagramActionsSession = null
    }
    if (this.subjectChangeIntentSession) {
      this.subjectChangeIntentSession.destroy()
      this.subjectChangeIntentSession = null
    }

    this.transcriptionHistory = []
    this.isInitialized = false
  }
}
