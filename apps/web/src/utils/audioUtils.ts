/**
 * Convert Float32Array audio data to WAV format Blob
 * @param audioData Float32Array audio data (typically from VAD)
 * @param sampleRate Sample rate in Hz (default: 16000)
 * @returns Blob containing WAV audio data
 */
export function convertAudioToBlob(
  audioData: Float32Array,
  sampleRate = 16000
): Blob {
  // Convert Float32Array to WAV format
  const length = audioData.length
  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)

  // WAV header helper
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const numChannels = 1
  const bitsPerSample = 16

  // Write WAV header
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true)
  view.setUint16(32, (numChannels * bitsPerSample) / 8, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, length * 2, true)

  // Convert float32 samples to int16
  let offset = 44
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i] || 0))
    view.setInt16(offset, sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}
