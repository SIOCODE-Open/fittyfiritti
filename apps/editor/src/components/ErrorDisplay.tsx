import { Icon } from '@iconify/react'

interface ErrorDisplayProps {
  error: string | null
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 mr-2" />
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  )
}
