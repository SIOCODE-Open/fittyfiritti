import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

interface BulletPointTranslationState {
  textJa?: string
  isTranslating: boolean
}

export function useBulletPointTranslation(text: string) {
  const translationService = useTranslation()
  const [state, setState] = useState<BulletPointTranslationState>({
    isTranslating: false,
  })

  const translateText = useCallback(async () => {
    if (!text || !translationService) return

    setState(prev => ({ ...prev, isTranslating: true, textJa: '' }))

    try {
      const stream =
        await translationService.translateToTargetLanguageStreaming(text)
      const reader = stream.getReader()
      let accumulatedText = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          accumulatedText += value

          // Update UI with streaming text
          setState(prev => ({ ...prev, textJa: accumulatedText }))
        }

        // Mark translation as complete
        setState(prev => ({ ...prev, isTranslating: false }))
      } catch (streamError) {
        console.error('Streaming bullet point translation failed:', streamError)
        setState(prev => ({ ...prev, isTranslating: false }))
      }
    } catch (error) {
      console.error('Failed to translate bullet point text:', error)
      setState(prev => ({ ...prev, isTranslating: false }))
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

  return {
    textJa: state.textJa,
    isTranslating: state.isTranslating,
    translateText,
  }
}
