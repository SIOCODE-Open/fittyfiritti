// Global TypeScript declarations for VAD library loaded via CDN

declare global {
  interface Window {
    VAD: any
    vad: any
  }

  // Define the VAD interfaces based on the library documentation
  namespace VAD {
    interface SpeechProbabilities {
      isSpeech: number
      notSpeech: number
    }

    interface RealTimeVADCallbacks {
      onFrameProcessed?: (
        probabilities: SpeechProbabilities,
        frame: Float32Array
      ) => void
      onVADMisfire?: () => void
      onSpeechStart?: () => void
      onSpeechEnd?: (audio: Float32Array) => void
      onSpeechRealStart?: () => void
    }

    interface RealTimeVADOptions extends RealTimeVADCallbacks {
      positiveSpeechThreshold?: number
      negativeSpeechThreshold?: number
      redemptionMs?: number
      preSpeechPadMs?: number
      minSpeechMs?: number
      baseAssetPath?: string
      onnxWASMBasePath?: string
      model?: 'v5' | 'legacy'
      startOnLoad?: boolean
    }

    interface MicVADInstance {
      start(): Promise<void>
      pause(): void
      destroy(): void
      listening?: boolean
      loading?: boolean
      errored?: string | false
    }
  }
}

export {}
