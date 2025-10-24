import { useBulletPointTranslation } from '../hooks/useBulletPointTranslation'
import type { BulletPointItem } from './SubjectCard'

interface BulletPointProps {
  bulletPoint: BulletPointItem
}

export function BulletPoint({ bulletPoint }: BulletPointProps) {
  const { textJa, isTranslating } = useBulletPointTranslation(bulletPoint.text)

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 text-xl leading-relaxed mb-3">
            {bulletPoint.text}
          </p>
          {isTranslating && (
            <div className="mb-3 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {textJa && (
            <p className="text-gray-800 text-xl leading-relaxed border-t border-gray-100 pt-3">
              {textJa}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
