import React, { createContext, useContext, useState } from 'react'

export interface Subject {
  id: string
  title: string
}

export interface SubjectContextValue {
  currentSubject: Subject | null
  changeSubject: (subject: Subject) => void
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

  const changeSubject = (subject: Subject) => {
    setCurrentSubject(subject)
  }

  const value: SubjectContextValue = {
    currentSubject,
    changeSubject,
  }

  return (
    <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>
  )
}
