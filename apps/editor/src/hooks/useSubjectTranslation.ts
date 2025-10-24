import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

interface SubjectTranslationState {
  titleJa?: string
  isTranslating: boolean
}

// Global job tracker to prevent duplicate translations
const activeJobs = new Set<string>()

export function useSubjectTranslation(title: string) {
  const translationService = useTranslation()
  const [state, setState] = useState<SubjectTranslationState>({
    isTranslating: false,
  })

  // Use ref to track the current title to avoid stale closures
  const currentTitleRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const translateTitle = useCallback(async () => {
    if (!title || !translationService) return

    // Create a unique job key for this translation
    const jobKey = `subject-${title}`

    // Check if this exact translation is already in progress
    if (activeJobs.has(jobKey)) {
      console.log('⏭️ Skipping duplicate subject translation job:', jobKey)
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
    currentTitleRef.current = title

    setState(prev => ({ ...prev, isTranslating: true, titleJa: '' }))

    try {
      // Check if streaming is available, otherwise fall back to regular translation
      if (translationService.translateToTargetLanguageStreaming) {
        const stream =
          await translationService.translateToTargetLanguageStreaming(title)
        const reader = stream.getReader()
        let accumulatedText = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Check if aborted or title changed
            if (signal.aborted || currentTitleRef.current !== title) {
              break
            }

            accumulatedText += value

            // Update UI with streaming text
            setState(prev => ({ ...prev, titleJa: accumulatedText }))
          }

          // Mark translation as complete if not aborted and title hasn't changed
          if (!signal.aborted && currentTitleRef.current === title) {
            setState(prev => ({ ...prev, isTranslating: false }))
          }
        } catch (streamError) {
          if (!signal.aborted) {
            console.error('Streaming subject translation failed:', streamError)
            setState(prev => ({ ...prev, isTranslating: false }))
          }
        }
      } else {
        // Fallback to regular translation
        const translation =
          await translationService.translateToTargetLanguage(title)

        // Only update state if this is still the current title and not aborted
        if (!signal.aborted && currentTitleRef.current === title) {
          setState({
            titleJa: translation,
            isTranslating: false,
          })
        }
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('Failed to translate subject title:', error)
        setState(prev => ({ ...prev, isTranslating: false }))
      }
    } finally {
      // Always clean up the job tracker
      activeJobs.delete(jobKey)
    }
  }, [title, translationService])

  // Auto-translate when title changes, with debouncing
  useEffect(() => {
    if (!title) return

    // Debounce translation requests to avoid rapid successive calls
    const debounceTimer = setTimeout(() => {
      translateTitle()
    }, 100)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [title, translateTitle])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    titleJa: state.titleJa,
    isTranslating: state.isTranslating,
    translateTitle,
  }
}
