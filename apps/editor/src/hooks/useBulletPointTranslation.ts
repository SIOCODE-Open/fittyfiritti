import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

interface BulletPointTranslationState {
  textJa?: string
  isTranslating: boolean
}

// Global job tracker to prevent duplicate translations
const activeJobs = new Set<string>()

export function useBulletPointTranslation(text: string) {
  const translationService = useTranslation()
  const [state, setState] = useState<BulletPointTranslationState>({
    isTranslating: false,
  })

  // Use ref to track the current text to avoid stale closures
  const currentTextRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const translateText = useCallback(async () => {
    if (!text || !translationService) return

    // Create a unique job key for this translation
    const jobKey = `bullet-${text}`

    // Check if this exact translation is already in progress
    if (activeJobs.has(jobKey)) {
      console.log('⏭️ Skipping duplicate bullet point translation job:', jobKey)
      return
    }

    // Cancel any previous translation for this hook
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this translation
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Mark job as active
    activeJobs.add(jobKey)
    currentTextRef.current = text

    setState(prev => ({ ...prev, isTranslating: true, textJa: '' }))

    try {
      // Check if streaming is available, otherwise fall back to regular translation
      if (translationService.translateToJapaneseStreaming) {
        const stream =
          await translationService.translateToJapaneseStreaming(text)
        const reader = stream.getReader()
        let accumulatedText = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Check if aborted or text changed
            if (signal.aborted || currentTextRef.current !== text) {
              break
            }

            accumulatedText += value

            // Update UI with streaming text
            setState(prev => ({ ...prev, textJa: accumulatedText }))
          }

          // Mark translation as complete if not aborted and text hasn't changed
          if (!signal.aborted && currentTextRef.current === text) {
            setState(prev => ({ ...prev, isTranslating: false }))
          }
        } catch (streamError) {
          if (!signal.aborted) {
            console.error(
              'Streaming bullet point translation failed:',
              streamError
            )
            setState(prev => ({ ...prev, isTranslating: false }))
          }
        }
      } else {
        // Fallback to regular translation
        const translation = await translationService.translateToJapanese(text)

        // Only update state if this is still the current text and not aborted
        if (!signal.aborted && currentTextRef.current === text) {
          setState({
            textJa: translation,
            isTranslating: false,
          })
        }
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('Failed to translate bullet point text:', error)
        setState(prev => ({ ...prev, isTranslating: false }))
      }
    } finally {
      // Always clean up the job tracker
      activeJobs.delete(jobKey)
    }
  }, [text, translationService])

  // Auto-translate when text changes, with debouncing
  useEffect(() => {
    if (!text) return

    // Debounce translation requests to avoid rapid successive calls
    const debounceTimer = setTimeout(() => {
      translateText()
    }, 100)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [text, translateText])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    textJa: state.textJa,
    isTranslating: state.isTranslating,
    translateText,
  }
}
