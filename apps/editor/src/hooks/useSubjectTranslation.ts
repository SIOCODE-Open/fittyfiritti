import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

interface SubjectTranslationState {
  titleJa?: string
  isTranslating: boolean
}

export function useSubjectTranslation(title: string) {
  const translationService = useTranslation()
  const [state, setState] = useState<SubjectTranslationState>({
    isTranslating: false,
  })

  const translateTitle = useCallback(async () => {
    if (!title || !translationService) return

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

            accumulatedText += value

            // Update UI with streaming text
            setState(prev => ({ ...prev, titleJa: accumulatedText }))
          }

          // Mark translation as complete
          setState(prev => ({ ...prev, isTranslating: false }))
        } catch (streamError) {
          console.error('Streaming subject translation failed:', streamError)
          setState(prev => ({ ...prev, isTranslating: false }))
        }
      } else {
        // Fallback to regular translation
        const translation =
          await translationService.translateToTargetLanguage(title)

        setState({
          titleJa: translation,
          isTranslating: false,
        })
      }
    } catch (error) {
      console.error('Failed to translate subject title:', error)
      setState(prev => ({ ...prev, isTranslating: false }))
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

  return {
    titleJa: state.titleJa,
    isTranslating: state.isTranslating,
    translateTitle,
  }
}
