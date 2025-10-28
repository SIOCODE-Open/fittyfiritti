import React, { createContext, useCallback, useContext, useState } from 'react'
import type { DiagramData } from '../types'

// Base Subject types
export interface SlideSubject {
  id: string
  title: string
  type: 'slide'
}

export interface DiagramSubject {
  id: string
  title: string
  type: 'diagram'
  diagramData: DiagramData
}

export type Subject = SlideSubject | DiagramSubject

export interface BulletPointItem {
  id: string
  text: string
  timestamp: number
  translation?: string
}

export interface SubjectHistory {
  subject: Subject
  bulletPoints: BulletPointItem[]
  subjectTranslation?: string
}

export interface SubjectContextValue {
  currentSubject: Subject | null
  changeSubject: (subject: Subject, subjectTranslation?: string) => void
  subjectHistory: SubjectHistory[]
  currentHistoryIndex: number
  addBulletPointToHistory: (bulletPoint: BulletPointItem) => void
  navigateToHistory: (index: number) => void
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  updateSubjectTranslation: (translation: string) => void
  updateBulletPointTranslation: (
    bulletPointId: string,
    translation: string
  ) => void
  isPresentationPaused: boolean
  pausePresentation: () => void
  resumePresentation: () => void
  resetSubjects: () => void
  // Diagram-specific methods
  updateDiagramData: (diagramData: DiagramData) => void
  isInDiagramMode: boolean
}

const SubjectContext = createContext<SubjectContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useSubject(): SubjectContextValue {
  const context = useContext(SubjectContext)
  if (!context) {
    throw new Error('useSubject must be used within a SubjectProvider')
  }
  return context
}

interface SubjectProviderProps {
  children: React.ReactNode
}

export function SubjectProvider({ children }: SubjectProviderProps) {
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null)
  const [subjectHistory, setSubjectHistory] = useState<SubjectHistory[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1)
  const [isPresentationPaused, setIsPresentationPaused] =
    useState<boolean>(true) // Start paused

  const changeSubject = (subject: Subject, subjectTranslation?: string) => {
    setCurrentSubject(subject)

    // Add new subject to history with optional translation
    setSubjectHistory(prev => [
      ...prev,
      { subject, bulletPoints: [], subjectTranslation },
    ])
    setCurrentHistoryIndex(prev => prev + 1)
  }

  const addBulletPointToHistory = (bulletPoint: BulletPointItem) => {
    if (currentHistoryIndex >= 0) {
      setSubjectHistory(prev => {
        const updated = [...prev]
        const current = updated[currentHistoryIndex]
        if (current) {
          updated[currentHistoryIndex] = {
            ...current,
            bulletPoints: [...current.bulletPoints, bulletPoint],
          }
        }
        return updated
      })
    }
  }

  const navigateToHistory = (index: number) => {
    if (index >= 0 && index < subjectHistory.length) {
      const historyItem = subjectHistory[index]
      if (historyItem) {
        setCurrentHistoryIndex(index)
        setCurrentSubject(historyItem.subject)
      }
    }
  }

  const canNavigatePrevious = currentHistoryIndex > 0
  const canNavigateNext = currentHistoryIndex < subjectHistory.length - 1

  const updateSubjectTranslation = useCallback(
    (translation: string) => {
      if (currentHistoryIndex >= 0) {
        setSubjectHistory(prev => {
          const updated = [...prev]
          const current = updated[currentHistoryIndex]
          if (current) {
            updated[currentHistoryIndex] = {
              ...current,
              subjectTranslation: translation,
            }
          }
          return updated
        })
      }
    },
    [currentHistoryIndex]
  )

  const updateBulletPointTranslation = useCallback(
    (bulletPointId: string, translation: string) => {
      if (currentHistoryIndex >= 0) {
        setSubjectHistory(prev => {
          const updated = [...prev]
          const current = updated[currentHistoryIndex]
          if (current) {
            updated[currentHistoryIndex] = {
              ...current,
              bulletPoints: current.bulletPoints.map(bp =>
                bp.id === bulletPointId ? { ...bp, translation } : bp
              ),
            }
          }
          return updated
        })
      }
    },
    [currentHistoryIndex]
  )

  const pausePresentation = useCallback(() => {
    setIsPresentationPaused(true)
    console.log('🛑 Presentation paused')
  }, [])

  const resumePresentation = useCallback(() => {
    setIsPresentationPaused(false)
    console.log('▶️ Presentation resumed')
  }, [])

  const resetSubjects = useCallback(() => {
    setCurrentSubject(null)
    setSubjectHistory([])
    setCurrentHistoryIndex(-1)
    setIsPresentationPaused(true)
    console.log('🔄 Subjects reset')
  }, [])

  const updateDiagramData = useCallback(
    (diagramData: DiagramData) => {
      if (currentHistoryIndex >= 0 && currentSubject?.type === 'diagram') {
        setSubjectHistory(prev => {
          const updated = [...prev]
          const current = updated[currentHistoryIndex]
          if (current && current.subject.type === 'diagram') {
            updated[currentHistoryIndex] = {
              ...current,
              subject: {
                ...current.subject,
                diagramData,
              },
            }
          }
          return updated
        })

        // Also update current subject
        setCurrentSubject(prev => {
          if (prev?.type === 'diagram') {
            return {
              ...prev,
              diagramData,
            }
          }
          return prev
        })
      }
    },
    [currentHistoryIndex, currentSubject]
  )

  const isInDiagramMode = currentSubject?.type === 'diagram'

  const value: SubjectContextValue = {
    currentSubject,
    changeSubject,
    subjectHistory,
    currentHistoryIndex,
    addBulletPointToHistory,
    navigateToHistory,
    canNavigatePrevious,
    canNavigateNext,
    updateSubjectTranslation,
    updateBulletPointTranslation,
    isPresentationPaused,
    pausePresentation,
    resumePresentation,
    resetSubjects,
    updateDiagramData,
    isInDiagramMode,
  }

  return (
    <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>
  )
}
