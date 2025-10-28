import { JSONSchema } from '@fittyfiritti/built-in-ai-api'

/**
 * JSON Schemas for Presentation Control Service
 *
 * This file contains all structured output schemas used by the various
 * presentation control sub-services for AI model responses.
 */

// ============================================================================
// Action Detection Schemas
// ============================================================================

export const actionSchemaPaused: JSONSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['resumePresentation', 'noOperation'],
    },
  },
  required: ['action'],
}

export const actionSchemaRunning: JSONSchema = {
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

export const actionSchemaRunningNoDiagram: JSONSchema = {
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

export const actionSchemaDiagram: JSONSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['diagramAction', 'endDiagram', 'noOperation'],
    },
  },
  required: ['action'],
}

// ============================================================================
// Title Generation Schemas
// ============================================================================

export const titleSchema: JSONSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Descriptive title for the new subject/topic',
    },
  },
  required: ['title'],
}

export const diagramTitleSchema: JSONSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Descriptive title for the new diagram',
    },
  },
  required: ['title'],
}

// ============================================================================
// Bullet Point Generation Schemas
// ============================================================================

export const bulletPointSchema: JSONSchema = {
  type: 'object',
  properties: {
    text: {
      type: 'string',
      description: 'Summary text for the bullet point',
    },
  },
  required: ['text'],
}

export const multipleBulletPointsSchema: JSONSchema = {
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

// ============================================================================
// Diagram Schemas
// ============================================================================

export const diagramActionsSchema: JSONSchema = {
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

// ============================================================================
// Intent Detection Schemas
// ============================================================================

export const subjectChangeIntentSchema: JSONSchema = {
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
