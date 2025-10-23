import React from 'react'
import { WaveformDisplay } from './WaveformDisplay'

interface TranscriptionDisplayProps {
  currentTranscription: string
  isRecording: boolean
  liveWaveformData: number[]
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  currentTranscription,
  isRecording,
  liveWaveformData,
}) => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">
          Live Transcription
        </h3>
        <div className="flex items-center space-x-2">
          {isRecording && (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-400">Recording</span>
            </>
          )}
          {!isRecording && (
            <>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Stopped</span>
            </>
          )}
        </div>
      </div>

      {/* Live Waveform */}
      {isRecording && (
        <div className="mt-4">
          <WaveformDisplay
            waveformData={liveWaveformData}
            width={400}
            height={60}
            isLive={true}
            className="w-full flex justify-center"
          />
        </div>
      )}

      <div className="min-h-[60px] max-h-[120px] overflow-y-auto mt-4">
        {currentTranscription ? (
          <p className="text-white leading-relaxed">{currentTranscription}</p>
        ) : (
          <p className="text-gray-400 italic">
            {isRecording ? 'Listening...' : 'Click Start Recording to begin'}
          </p>
        )}
      </div>
    </div>
  )
}
