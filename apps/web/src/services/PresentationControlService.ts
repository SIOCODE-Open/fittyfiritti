import { ActionDetectionService } from './ActionDetectionService'
import { BulletPointGenerationService } from './BulletPointGenerationService'
import { DiagramData, DiagramService } from './DiagramService'
import { TitleGenerationService } from './TitleGenerationService'

// Re-export types from SubjectDetectionService for backward compatibility
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

/**
 * PresentationControlService
 *
 * Main orchestrator service that delegates to specialized sub-services.
 * This is a drop-in replacement for SubjectDetectionService with improved
 * architecture using session cloning and few-shot prompting.
 *
 * Sub-services:
 * - ActionDetectionService: Detects user intent and classifies actions
 * - TitleGenerationService: Generates titles for subjects and diagrams
 * - BulletPointGenerationService: Generates single and multiple bullet points
 * - DiagramService: Extracts diagram editing actions
 */
export class PresentationControlService {
  private actionDetectionService: ActionDetectionService
  private titleGenerationService: TitleGenerationService
  private bulletPointGenerationService: BulletPointGenerationService
  private diagramService: DiagramService

  private isInitialized = false
  private isInitializing = false
  private transcriptionHistory: string[] = []
  private maxHistorySize = 10 // Keep last 10 transcriptions for context
  private isPresentationPaused = true // Start with presentation paused
  private isInDiagramMode = false // Track if we're in diagram editing mode

  constructor() {
    this.actionDetectionService = new ActionDetectionService()
    this.titleGenerationService = new TitleGenerationService()
    this.bulletPointGenerationService = new BulletPointGenerationService()
    this.diagramService = new DiagramService()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }
    if (this.isInitializing) {
      return
    }

    this.isInitializing = true

    try {
      // Initialize all sub-services in parallel for faster startup
      await Promise.all([
        this.actionDetectionService.initialize(),
        this.titleGenerationService.initialize(),
        this.bulletPointGenerationService.initialize(),
        this.diagramService.initialize(),
      ])

      this.isInitialized = true
      this.isInitializing = false
      console.log('🎮 Presentation Control Service initialized')
    } catch (error) {
      console.error('Failed to initialize Presentation Control Service:', error)
      throw new Error('Failed to initialize presentation control')
    }
  }

  async analyzeTranscription(
    transcription: string,
    hasSubject: boolean = true,
    currentDiagramData?: DiagramData,
    diagramModeEnabled: boolean = false
  ): Promise<SubjectDetectionResult> {
    if (!this.isInitialized) {
      throw new Error('Presentation Control Service not initialized')
    }

    while (this.isInitializing) {
      console.log('Waiting for initialization to complete ...')
      await new Promise(resolve => setTimeout(resolve, 100))
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
    currentDiagramData?: DiagramData,
    diagramModeEnabled: boolean = false
  ): Promise<SubjectDetectionResult> {
    // Add to transcription history
    this.transcriptionHistory.push(transcription)
    if (this.transcriptionHistory.length > this.maxHistorySize) {
      this.transcriptionHistory.shift()
    }

    console.log(`📝 [PCS] Analyzing transcription: "${transcription}"`)
    console.log(
      `🔍 [PCS] State: ${this.isPresentationPaused ? 'PAUSED' : this.isInDiagramMode ? 'DIAGRAM' : 'RUNNING'}, hasSubject: ${hasSubject}`
    )

    try {
      // Handle PAUSED state
      if (this.isPresentationPaused) {
        const action =
          await this.actionDetectionService.detectActionPaused(transcription)

        console.log('🎯 [PCS] Paused mode result:', action)

        if (action === 'resumePresentation') {
          console.log('▶️ [PCS] Detected: RESUME PRESENTATION')
          return {
            action: { action: 'resumePresentation' },
            confidence: 0.9,
          }
        } else {
          console.log('⏸️ [PCS] Detected: NO OPERATION (paused)')
          return {
            action: { action: 'noOperation' },
            confidence: 0.9,
          }
        }
      }

      // Handle DIAGRAM mode
      if (this.isInDiagramMode) {
        const action =
          await this.actionDetectionService.detectActionDiagram(transcription)

        console.log('📊 [PCS] Diagram mode result:', action)

        if (action === 'endDiagram') {
          console.log('🏁 [PCS] Detected: END DIAGRAM')
          return {
            action: { action: 'endDiagram' },
            confidence: 0.9,
          }
        } else if (action === 'noOperation') {
          console.log('⏸️ [PCS] Detected: NO OPERATION (diagram)')
          return {
            action: { action: 'noOperation' },
            confidence: 0.9,
          }
        } else if (action === 'diagramAction') {
          // Extract diagram actions
          const actions = await this.diagramService.extractDiagramActions(
            transcription,
            currentDiagramData
          )

          console.log(
            '✏️ [PCS] Detected: DIAGRAM ACTIONS:',
            JSON.stringify(actions, null, 2)
          )

          return {
            action: {
              action: 'diagramAction',
              actions,
            },
            confidence: 0.8,
          }
        }
      }

      // Handle RUNNING mode
      const context = this.transcriptionHistory.slice(-5).join(' | ')
      const action = await this.actionDetectionService.detectActionRunning(
        transcription,
        context,
        diagramModeEnabled
      )

      console.log('🎯 [PCS] Running mode result:', action)

      // Handle special case when no subject exists yet
      if (!hasSubject) {
        console.log('🆕 [PCS] No subject yet, validating initial action')

        if (action === 'beginDiagram') {
          const title =
            await this.titleGenerationService.generateDiagramTitle(
              transcription
            )
          console.log(
            '📊 [PCS] Detected: BEGIN DIAGRAM (first subject) -',
            title
          )

          return {
            action: {
              action: 'beginDiagram',
              title,
            },
            confidence: 0.9,
          }
        }

        if (action === 'changeSubject') {
          const title =
            await this.titleGenerationService.generateSubjectTitle(
              transcription
            )
          console.log(
            '🔄 [PCS] Detected: CHANGE SUBJECT (first subject) -',
            title
          )

          return {
            action: {
              action: 'changeSubject',
              title,
            },
            confidence: 0.9,
          }
        }

        if (action === 'addSingleBulletPoint') {
          const text =
            await this.bulletPointGenerationService.generateSingleBulletPoint(
              transcription
            )
          console.log(
            '📌 [PCS] Detected: ADD SINGLE BULLET POINT (will bootstrap subject) -',
            text
          )

          return {
            action: {
              action: 'addSingleBulletPoint',
              text,
            },
            confidence: 0.8,
          }
        }

        if (action === 'addMultipleBulletPoints') {
          const bulletPoints =
            await this.bulletPointGenerationService.generateMultipleBulletPoints(
              transcription
            )
          console.log(
            '📌 [PCS] Detected: ADD MULTIPLE BULLET POINTS (will bootstrap subject) -',
            bulletPoints.length,
            'points'
          )

          return {
            action: {
              action: 'addMultipleBulletPoints',
              bulletPoints,
            },
            confidence: 0.8,
          }
        }

        // For any other action (noOperation, pausePresentation), just return it
        console.log('⏸️ [PCS] Detected: Other action (no subject) -', action)
        return {
          action: { action: action as 'noOperation' | 'pausePresentation' },
          confidence: 0.9,
        }
      }

      // Handle actions when subject exists
      if (action === 'pausePresentation') {
        console.log('⏸️ [PCS] Detected: PAUSE PRESENTATION')
        return {
          action: { action: 'pausePresentation' },
          confidence: 0.9,
        }
      }

      if (action === 'noOperation') {
        console.log('⏸️ [PCS] Detected: NO OPERATION (running)')
        return {
          action: { action: 'noOperation' },
          confidence: 0.9,
        }
      }

      if (action === 'beginDiagram') {
        const title =
          await this.titleGenerationService.generateDiagramTitle(transcription)
        console.log('📊 [PCS] Detected: BEGIN DIAGRAM -', title)

        return {
          action: {
            action: 'beginDiagram',
            title,
          },
          confidence: 0.9,
        }
      }

      if (action === 'changeSubject') {
        const title =
          await this.titleGenerationService.generateSubjectTitle(transcription)

        if (!title || title === 'General Discussion') {
          console.warn(
            '⚠️ [PCS] Empty title generated, falling back to single bullet point'
          )
          // Fall back to single bullet point
          const text =
            await this.bulletPointGenerationService.generateSingleBulletPoint(
              transcription
            )

          console.log(
            '📌 [PCS] Detected (fallback): ADD SINGLE BULLET POINT -',
            text
          )
          return {
            action: {
              action: 'addSingleBulletPoint',
              text,
            },
            confidence: 0.8,
          }
        }

        console.log('🔄 [PCS] Detected: CHANGE SUBJECT -', title)
        return {
          action: {
            action: 'changeSubject',
            title,
          },
          confidence: 0.9,
        }
      }

      if (action === 'addSingleBulletPoint') {
        const text =
          await this.bulletPointGenerationService.generateSingleBulletPoint(
            transcription
          )
        console.log('📌 [PCS] Detected: ADD SINGLE BULLET POINT -', text)

        return {
          action: {
            action: 'addSingleBulletPoint',
            text,
          },
          confidence: 0.8,
        }
      }

      if (action === 'addMultipleBulletPoints') {
        const bulletPoints =
          await this.bulletPointGenerationService.generateMultipleBulletPoints(
            transcription
          )
        console.log(
          '📌 [PCS] Detected: ADD MULTIPLE BULLET POINTS -',
          bulletPoints.length,
          'points'
        )

        return {
          action: {
            action: 'addMultipleBulletPoints',
            bulletPoints,
          },
          confidence: 0.8,
        }
      }

      // Fallback to single bullet point for unknown actions
      console.warn(
        '⚠️ [PCS] Unknown action, falling back to single bullet point'
      )
      const text =
        await this.bulletPointGenerationService.generateSingleBulletPoint(
          transcription
        )

      console.log(
        '📌 [PCS] Detected (fallback): ADD SINGLE BULLET POINT -',
        text
      )
      return {
        action: {
          action: 'addSingleBulletPoint',
          text,
        },
        confidence: 0.8,
      }
    } catch (error) {
      console.error('[PCS] Failed to analyze transcription:', error)

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
    if (!this.isInitialized) {
      throw new Error('Presentation Control Service not initialized')
    }

    return this.titleGenerationService.generateBootstrapTitle(transcription)
  }

  async detectSubjectChangeIntent(transcription: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Presentation Control Service not initialized')
    }

    const hasIntent =
      await this.actionDetectionService.detectSubjectChangeIntent(transcription)

    console.log(
      `🔍 [PCS] Subject change intent detection for "${transcription}": ${hasIntent}`
    )

    return hasIntent
  }

  getHistorySize(): number {
    return this.transcriptionHistory.length
  }

  destroy(): void {
    // Destroy all sub-services
    this.actionDetectionService.destroy()
    this.titleGenerationService.destroy()
    this.bulletPointGenerationService.destroy()
    this.diagramService.destroy()

    this.transcriptionHistory = []
    this.isInitialized = false
  }
}
