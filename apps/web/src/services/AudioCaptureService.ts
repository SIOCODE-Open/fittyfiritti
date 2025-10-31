import { AudioCaptureService, AudioChunk } from '../types'

export class AudioCaptureServiceImpl implements AudioCaptureService {
  private mediaRecorder?: MediaRecorder
  private audioStream?: MediaStream
  private chunks: Blob[] = []
  private onChunkCallback?: (chunk: AudioChunk) => void
  private segmentStartTime = 0

  public isCapturing = false

  async startCapture(): Promise<void> {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus',
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

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = undefined
    }

    console.log('🛑 Audio capture stopped')
  }

  /**
   * Get all accumulated chunks and clear the buffer.
   * Useful for solo recording mode where we want all audio at once.
   */
  getAccumulatedChunks(): Blob | null {
    if (this.chunks.length === 0) {
      return null
    }

    const blob = new Blob(this.chunks, { type: 'audio/webm' })
    this.chunks = []
    return blob
  }

  completeSegment(): void {
    if (!this.isCapturing || !this.mediaRecorder) {
      return
    }

    // Stop current recording to trigger ondataavailable
    if (this.mediaRecorder.state === 'recording') {
      // Set up a temporary handler for this completion
      const originalOnStop = this.mediaRecorder.onstop

      this.mediaRecorder.onstop = () => {
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
            waveformData: [],
          }

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

  onWaveformData(_callback: (waveformData: number[]) => void): void {
    // No-op: waveform analysis removed
  }
}
