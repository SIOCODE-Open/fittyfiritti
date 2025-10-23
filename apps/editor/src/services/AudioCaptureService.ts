import { AudioCaptureService, AudioChunk } from '../types'

export class AudioCaptureServiceImpl implements AudioCaptureService {
  private mediaRecorder?: MediaRecorder
  private audioStream?: MediaStream
  private chunks: Blob[] = []
  private onChunkCallback?: (chunk: AudioChunk) => void
  private onWaveformCallback?: (waveformData: number[]) => void
  private segmentStartTime = 0
  private audioContext?: AudioContext
  private analyser?: AnalyserNode
  private microphone?: MediaStreamAudioSourceNode
  private waveformData: number[] = []
  private waveformInterval?: number

  public isCapturing = false

  async startCapture(): Promise<void> {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Good for speech recognition
        },
      })

      // Set up audio analysis for waveform
      this.audioContext = new AudioContext()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.microphone = this.audioContext.createMediaStreamSource(
        this.audioStream
      )
      this.microphone.connect(this.analyser)

      // Start waveform analysis
      this.startWaveformAnalysis()

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus', // Good compression for speech
      })

      this.chunks = []
      this.isCapturing = true
      this.segmentStartTime = Date.now()

      // Handle data available
      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
      }

      // Start recording continuously
      this.mediaRecorder.start()

      console.log('🎙️ Audio capture started')
    } catch (error) {
      console.error('Failed to start audio capture:', error)
      this.isCapturing = false
      throw error
    }
  }

  stopCapture(): void {
    this.isCapturing = false

    // Stop waveform analysis
    this.stopWaveformAnalysis()

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = undefined
    }

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = undefined
    }

    console.log('🛑 Audio capture stopped')
  }

  private startWaveformAnalysis(): void {
    if (!this.analyser) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const updateWaveform = () => {
      if (!this.analyser || !this.isCapturing) return

      this.analyser.getByteFrequencyData(dataArray)

      // Convert to normalized amplitudes (0-1)
      const normalizedData = Array.from(dataArray).map(value => value / 255)

      // Add to waveform data (keep last 5 seconds worth)
      this.waveformData.push(...normalizedData.slice(0, 8)) // Take first 8 frequency bins

      // Keep only last 5 seconds of data (assuming ~60fps updates)
      const maxDataPoints = 300 * 8 // 5 seconds * 60fps * 8 data points
      if (this.waveformData.length > maxDataPoints) {
        this.waveformData = this.waveformData.slice(-maxDataPoints)
      }

      // Call the callback with current waveform data
      if (this.onWaveformCallback) {
        this.onWaveformCallback([...this.waveformData])
      }
    }

    // Update waveform at ~60fps
    this.waveformInterval = window.setInterval(updateWaveform, 16)
  }

  private stopWaveformAnalysis(): void {
    if (this.waveformInterval) {
      clearInterval(this.waveformInterval)
      this.waveformInterval = undefined
    }
    this.waveformData = []
  }

  completeSegment(): void {
    if (!this.isCapturing || !this.mediaRecorder) {
      console.log('Cannot complete segment: not capturing or no recorder')
      return
    }

    console.log('Completing segment...')

    // Stop current recording to trigger ondataavailable
    if (this.mediaRecorder.state === 'recording') {
      // Set up a temporary handler for this completion
      const originalOnStop = this.mediaRecorder.onstop

      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, processing chunks...')

        if (this.chunks.length > 0) {
          const blob = new Blob(this.chunks, { type: 'audio/webm' })
          const timestamp = Date.now()
          const windowStart = this.segmentStartTime
          const windowEnd = timestamp

          const audioChunk: AudioChunk = {
            blob,
            timestamp,
            windowStart,
            windowEnd,
            waveformData: [...this.waveformData], // Include current waveform
          }

          console.log('Created audio chunk, calling callback')
          this.onChunkCallback?.(audioChunk)

          // Clear chunks for next segment
          this.chunks = []
          this.segmentStartTime = timestamp
        }

        // Restore original handler and restart recording
        this.mediaRecorder!.onstop = originalOnStop

        // Start new recording for next segment
        if (this.isCapturing) {
          setTimeout(() => {
            if (this.mediaRecorder && this.isCapturing) {
              this.mediaRecorder.start()
              console.log('Started new recording for next segment')
            }
          }, 100)
        }
      }

      this.mediaRecorder.stop()
    }
  }

  onAudioChunk(callback: (chunk: AudioChunk) => void): void {
    this.onChunkCallback = callback
  }

  onWaveformData(callback: (waveformData: number[]) => void): void {
    this.onWaveformCallback = callback
  }
}
