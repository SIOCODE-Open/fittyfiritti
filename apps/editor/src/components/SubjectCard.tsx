import { forwardRef, useImperativeHandle, useState } from 'react'
import type { Subject } from '../contexts/SubjectContext'
import { useSubjectTranslation } from '../hooks/useSubjectTranslation'
import { BulletPoint } from './BulletPoint'

export interface BulletPointItem {
  id: string
  text: string
  emoji?: string
  timestamp: number
}

interface SubjectCardProps {
  subject: Subject
  onSubjectChange: (newSubject: Subject) => void
}

export interface SubjectCardRef {
  addBulletPoint: (bulletPoint: BulletPointItem) => void
  changeSubject: (newSubject: Subject) => void
}

export const SubjectCard = forwardRef<SubjectCardRef, SubjectCardProps>(
  ({ subject, onSubjectChange }, ref) => {
    const [bulletPoints, setBulletPoints] = useState<BulletPointItem[]>([])
    const { titleJa, isTranslating } = useSubjectTranslation(subject.title)

    const addBulletPoint = (bulletPoint: BulletPointItem) => {
      setBulletPoints(prev => [...prev, bulletPoint])
    }

    const changeSubject = (newSubject: Subject) => {
      setBulletPoints([]) // Clear bullet points when subject changes
      onSubjectChange(newSubject)
    }

    useImperativeHandle(ref, () => ({
      addBulletPoint,
      changeSubject,
    }))

    return (
      <div className="mb-6">
        {/* Subject Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-3xl font-bold text-gray-800">
              {subject.title}
            </h2>
            {isTranslating && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {titleJa && (
            <h3 className="text-3xl text-gray-800 mb-4">{titleJa}</h3>
          )}
        </div>

        {/* Bullet Points */}
        <div className="space-y-3">
          {bulletPoints.length === 0 && (
            <div className="text-lg text-gray-500 italic p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
              Bullet points will appear here as you speak...
            </div>
          )}
          {bulletPoints.map(bulletPoint => (
            <BulletPoint key={bulletPoint.id} bulletPoint={bulletPoint} />
          ))}
        </div>
      </div>
    )
  }
)
