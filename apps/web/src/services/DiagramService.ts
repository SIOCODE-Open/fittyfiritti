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
        temperature: 0.3,
        topK: 5,
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          {
            role: 'system',
            content: `You extract diagram nodes and connections from speech. You must be smart about reusing existing nodes.

Your job:
1. Check EXISTING nodes first - if a similar concept exists, use its ID
2. Extract NEW concepts -> create "addNode" only if not already in diagram
3. Find flow/connection words -> create "addEdge"

Action types:
- addNode: Add a box (requires: id, label) - ONLY if concept doesn't exist yet
- addEdge: Connect boxes (requires: from, to) - use existing node IDs
- noOperation: Only if nothing to extract

CRITICAL RULES FOR NODE MATCHING:
1. ALWAYS check if the diagram already contains a similar concept
2. Match synonyms and related terms:
   - "database" matches "MySQL database", "DB", "data store"
   - "backend" matches "back-end", "server", "API server"
   - "frontend" matches "front-end", "UI", "client"
   - "user" matches "client", "end user", "customer"
3. If user says "the database" and "MySQL database" exists, use "mysql_database" ID
4. If user says "identity provider" and "cognito" exists, they might be the same - use context
5. Only create a NEW node if it's clearly a different concept

Node ID generation (for NEW nodes):
- Generate simple IDs: "Setup Phase" -> "setup_phase", "API" -> "api"
- Make IDs lowercase with underscores for spaces
- Remove special characters: "MySQL DB" -> "mysql_db"

Edge extraction:
- "from X to Y", "X goes to Y", "X talks to Y", "after X comes Y" = addEdge
- IMPORTANT: Use EXACT node IDs from current diagram when available
- Match natural language to existing nodes (e.g., "the backend" -> find "backend" ID)
- For edges referencing new nodes, use the IDs you just created

Examples with existing nodes:
"We have initialization" (no existing nodes) -> [{"type":"addNode","id":"initialization","label":"initialization"}]

"After setup, branch A and branch B" (no existing nodes) -> [{"type":"addNode","id":"setup","label":"setup"},{"type":"addNode","id":"branch_a","label":"branch A"},{"type":"addNode","id":"branch_b","label":"branch B"}]

"The backend talks to the database" (existing: mysql_database, backend) -> [{"type":"addEdge","from":"backend","to":"mysql_database"}]

"User connects to frontend" (existing: frontend) -> [{"type":"addNode","id":"user","label":"user"},{"type":"addEdge","from":"user","to":"frontend"}]

"Frontend calls the API, and API queries the DB" (existing: frontend, backend, mysql_database) -> [{"type":"addEdge","from":"frontend","to":"backend"},{"type":"addEdge","from":"backend","to":"mysql_database"}]

CRITICAL: Be smart about matching! Before creating a new node, check if similar concept exists. Be aggressive with matching synonyms.

Respond with JSON array of actions.`,
          },
          // Few-shot example 1 - Single node (no existing)
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
          // Few-shot example 2 - Multiple nodes (no existing)
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
          // Few-shot example 3 - Edge with existing nodes
          {
            role: 'user',
            content:
              'Extract diagram editing instructions from: "And then, from the API it goes to, um, the database"\n\nCurrent diagram state:\nExisting Nodes:\n  - "api" (label: "API")\n  - "mysql_database" (label: "MySQL database")\nExisting Edges: none\n\nIMPORTANT: "database" matches "MySQL database" - use ID "mysql_database"',
          },
          {
            role: 'assistant',
            content:
              '{"actions":[{"type":"addEdge","from":"api","to":"mysql_database"}]}',
          },
          // Few-shot example 4 - Mixed: new node + edge to existing
          {
            role: 'user',
            content:
              'Extract diagram editing instructions from: "The user connects to the frontend"\n\nCurrent diagram state:\nExisting Nodes:\n  - "frontend" (label: "frontend")\n  - "backend" (label: "backend")\nExisting Edges: none\n\nIMPORTANT: "frontend" already exists - reuse it!',
          },
          {
            role: 'assistant',
            content:
              '{"actions":[{"type":"addNode","id":"user","label":"user"},{"type":"addEdge","from":"user","to":"frontend"}]}',
          },
          // Few-shot example 5 - Complex with synonym matching
          {
            role: 'user',
            content:
              'Extract diagram editing instructions from: "The backend also talks to Cognito for authentication"\n\nCurrent diagram state:\nExisting Nodes:\n  - "backend" (label: "backend")\n  - "frontend" (label: "frontend")\n  - "mysql_database" (label: "MySQL database")\nExisting Edges:\n  - "frontend" -> "backend"\n  - "backend" -> "mysql_database"\n\nIMPORTANT: "backend" already exists - reuse it!',
          },
          {
            role: 'assistant',
            content:
              '{"actions":[{"type":"addNode","id":"cognito","label":"Cognito"},{"type":"addEdge","from":"backend","to":"cognito"}]}',
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
      // Build current diagram state context with better formatting
      let diagramStateContext = ''
      if (currentDiagramData && currentDiagramData.nodes.length > 0) {
        // Format nodes list with clear labels
        const nodesText = currentDiagramData.nodes
          .map(n => `  - "${n.id}" (label: "${n.label}")`)
          .join('\n')

        // Format edges list
        const edgesText =
          currentDiagramData.edges.length > 0
            ? currentDiagramData.edges
                .map(e => `  - "${e.from}" -> "${e.to}"`)
                .join('\n')
            : '  none'

        diagramStateContext = `

Current diagram state:
Existing Nodes:
${nodesText}
Existing Edges:
${edgesText}

IMPORTANT: Before creating a new node, check if a similar concept already exists above. Match synonyms and related terms (e.g., "database" matches "MySQL database"). Prefer reusing existing node IDs over creating duplicates.`
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
