import {
  createLanguageModelSession,
  LanguageModelSession,
} from '@fittyfiritti/built-in-ai-api'
import { retryAIPromptWithJSON } from '../utils/retryUtils'
import { diagramActionsSchema } from './PresentationControlSchemas'

export interface DiagramData {
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ from: string; to: string }>
}

export type DiagramActionType =
  | { type: 'updateDiagramTitle'; title: string }
  | { type: 'addNode'; id: string; label: string }
  | { type: 'editNode'; id: string; label: string }
  | { type: 'removeNode'; id: string }
  | { type: 'addEdge'; from: string; to: string }
  | { type: 'removeEdge'; from: string; to: string }
  | { type: 'noOperation' }

/**
 * DiagramService
 *
 * Responsible for extracting diagram editing actions from speech transcriptions.
 * Uses session cloning with few-shot prompting to parse diagram instructions.
 */
export class DiagramService {
  private baseSessionDiagramActions: LanguageModelSession | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize base session for diagram actions with few-shot examples
      this.baseSessionDiagramActions = await createLanguageModelSession({
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
          // Few-shot example 1 - Single node
          {
            role: 'user',
            content:
              'Extract diagram editing instructions from: "So, um, we have initialization at the start, you know, where everything begins"',
          },
          {
            role: 'assistant',
            content:
              '{"actions":[{"type":"addNode","id":"initialization","label":"initialization"}]}',
          },
          // Few-shot example 2 - Multiple nodes
          {
            role: 'user',
            content:
              'Extract diagram editing instructions from: "Okay, then we have, uh, processing, validation, and, um, storage at the end"',
          },
          {
            role: 'assistant',
            content:
              '{"actions":[{"type":"addNode","id":"processing","label":"processing"},{"type":"addNode","id":"validation","label":"validation"},{"type":"addNode","id":"storage","label":"storage"}]}',
          },
          // Few-shot example 3 - Node with edge
          {
            role: 'user',
            content:
              'Extract diagram editing instructions from: "And then, from the API it goes to, um, the database"\n\nCurrent diagram state:\nNodes: "api" (label: "API")\nEdges: none\n\nWhen referencing nodes for edges, use the exact IDs listed above.',
          },
          {
            role: 'assistant',
            content:
              '{"actions":[{"type":"addNode","id":"database","label":"database"},{"type":"addEdge","from":"api","to":"database"}]}',
          },
        ],
      })

      this.isInitialized = true
      console.log('📊 Diagram Service initialized')
    } catch (error) {
      console.error('Failed to initialize Diagram Service:', error)
      throw new Error('Failed to initialize diagram service')
    }
  }

  /**
   * Extract diagram actions from a transcription
   */
  async extractDiagramActions(
    transcription: string,
    currentDiagramData?: DiagramData
  ): Promise<DiagramActionType[]> {
    if (!this.baseSessionDiagramActions) {
      throw new Error('Diagram Service not initialized')
    }

    const clonedSession = await this.baseSessionDiagramActions.clone()
    try {
      // Build current diagram state context
      let diagramStateContext = ''
      if (currentDiagramData && currentDiagramData.nodes.length > 0) {
        diagramStateContext = `

Current diagram state:
Nodes: ${currentDiagramData.nodes.map(n => `"${n.id}" (label: "${n.label}")`).join(', ')}
Edges: ${currentDiagramData.edges.length > 0 ? currentDiagramData.edges.map(e => `"${e.from}" -> "${e.to}"`).join(', ') : 'none'}

When referencing nodes for edges, use the exact IDs listed above.`
      }

      const actionsResult = await retryAIPromptWithJSON<{
        actions: DiagramActionType[]
      }>(
        async () =>
          await clonedSession.prompt(
            `Extract diagram editing instructions from: "${transcription}"${diagramStateContext}`,
            {
              responseConstraint: diagramActionsSchema,
            }
          )
      )

      return actionsResult.actions || [{ type: 'noOperation' }]
    } catch (error) {
      console.error('Failed to extract diagram actions after retries:', error)
      throw new Error(
        `Diagram actions extraction failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  destroy(): void {
    if (this.baseSessionDiagramActions) {
      this.baseSessionDiagramActions.destroy()
      this.baseSessionDiagramActions = null
    }
    this.isInitialized = false
  }
}
