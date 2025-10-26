import { Icon } from '@iconify/react'

interface ErrorDisplayProps {
  error: string | null
  onClose?: () => void
}

export function ErrorDisplay({ error, onClose }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div
      data-testid="error-display"
      className="fixed top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 mr-2" />
          <p data-testid="error-message" className="text-red-700">
            {error}
          </p>
        </div>
        {onClose && (
          <button
            data-testid="error-close-button"
            onClick={onClose}
            className="ml-4 p-1 hover:bg-red-100 rounded transition-colors"
            title="Close error"
            aria-label="Close error"
          >
            <Icon icon="mdi:close" className="w-5 h-5 text-red-600" />
          </button>
        )}
      </div>
    </div>
  )
}
