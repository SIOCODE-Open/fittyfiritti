import React, { useEffect, useRef } from 'react'

interface WaveformDisplayProps {
  waveformData: number[]
  width?: number
  height?: number
  isLive?: boolean
  className?: string
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  waveformData,
  width = 400,
  height = 80,
  isLive = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas with black background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    // Draw waveform
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1

    const centerY = height / 2

    ctx.beginPath()

    // For live waveform, show last N seconds of data
    const dataToShow = isLive
      ? waveformData.slice(-Math.floor(width / 2))
      : waveformData
    const actualBarWidth = width / dataToShow.length

    dataToShow.forEach((amplitude, index) => {
      const x = index * actualBarWidth
      const barHeight = amplitude * centerY * 0.8 // Scale to 80% of half height

      // Draw from center, both up and down
      ctx.moveTo(x, centerY - barHeight)
      ctx.lineTo(x, centerY + barHeight)
    })

    ctx.stroke()

    // Add a subtle glow effect for live waveform
    if (isLive && dataToShow.length > 0) {
      ctx.shadowColor = '#FFFFFF'
      ctx.shadowBlur = 3
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }, [waveformData, width, height, isLive])

  return (
    <div className={`${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded border border-gray-300"
        style={{ backgroundColor: '#000000' }}
      />
    </div>
  )
}
