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

    setState(prev => ({ ...prev, isTranslating: true }))

    try {
      const translation = await translationService.translateToJapanese(title)
      setState({
        titleJa: translation,
        isTranslating: false,
      })
    } catch (error) {
      console.error('Failed to translate subject title:', error)
      setState(prev => ({ ...prev, isTranslating: false }))
    }
  }, [title, translationService])

  // Auto-translate when title changes
  useEffect(() => {
    if (title) {
      translateTitle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translateTitle])

  return {
    titleJa: state.titleJa,
    isTranslating: state.isTranslating,
    translateTitle,
  }
}
