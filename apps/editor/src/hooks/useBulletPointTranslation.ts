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

    setState(prev => ({ ...prev, isTranslating: true }))

    try {
      const translation = await translationService.translateToJapanese(text)
      setState({
        textJa: translation,
        isTranslating: false,
      })
    } catch (error) {
      console.error('Failed to translate bullet point text:', error)
      setState(prev => ({ ...prev, isTranslating: false }))
    }
  }, [text, translationService])

  // Auto-translate when text changes
  useEffect(() => {
    if (text) {
      translateText()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translateText])

  return {
    textJa: state.textJa,
    isTranslating: state.isTranslating,
    translateText,
  }
}
