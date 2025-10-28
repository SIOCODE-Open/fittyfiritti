import type { Language } from '../components/WelcomeScreen'
import type { Subject } from '../contexts/SubjectContext'

export interface CardData {
  cardId: string
  timestamp: number
  original: string
  translated: string
}

export interface SubjectHistoryItem {
  subject: Subject
  subjectTranslation?: string
  bulletPoints: Array<{
    id: string
    text: string
    timestamp: number
    translation?: string
  }>
}

/**
 * Downloads transcriptions as a text file
 */
export function downloadTranscriptions(
  cardData: CardData[],
  speakerLanguage: Language,
  otherPartyLanguage: Language
): void {
  const shouldShowTranslations = speakerLanguage !== otherPartyLanguage

  // Sort by timestamp (oldest first for export)
  const sortedData = [...cardData].sort((a, b) => a.timestamp - b.timestamp)

  const content = sortedData
    .map(data => {
      if (!data.original) return null

      const lines = [data.original]
      if (shouldShowTranslations && data.translated) {
        lines.push(`  ${data.translated}`)
      }
      return lines.join('\n')
    })
    .filter(Boolean)
    .join('\n\n---\n\n')

  if (!content) {
    alert('No transcriptions to export yet!')
    return
  }

  // Create and download file
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transcriptions-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Downloads presentation/subjects as a markdown file
 */
export function downloadPresentation(
  subjectHistory: SubjectHistoryItem[],
  speakerLanguage: Language,
  otherPartyLanguage: Language
): void {
  if (subjectHistory.length === 0) {
    alert('No subjects to export yet!')
    return
  }

  const shouldShowTranslations = speakerLanguage !== otherPartyLanguage

  const content = subjectHistory
    .map(historyItem => {
      const lines: string[] = []

      // Check subject type
      if (historyItem.subject.type === 'diagram') {
        // Diagram subject
        lines.push(`# ${historyItem.subject.title} [Diagram]`)
        lines.push('')

        // Subject translation (level 2 heading) if available
        if (shouldShowTranslations && historyItem.subjectTranslation) {
          lines.push(`## ${historyItem.subjectTranslation}`)
          lines.push('')
        }

        // Export diagram as JSON code block
        lines.push('```json')
        lines.push(
          JSON.stringify(
            {
              nodes: historyItem.subject.diagramData.nodes,
              edges: historyItem.subject.diagramData.edges,
            },
            null,
            2
          )
        )
        lines.push('```')
      } else {
        // Slide subject
        lines.push(`# ${historyItem.subject.title}`)
        lines.push('')

        // Subject translation (level 2 heading) if available
        if (shouldShowTranslations && historyItem.subjectTranslation) {
          lines.push(`## ${historyItem.subjectTranslation}`)
          lines.push('')
        }

        // Bullet points
        if (historyItem.bulletPoints.length > 0) {
          historyItem.bulletPoints.forEach(bp => {
            lines.push(`- ${bp.text}`)
            if (shouldShowTranslations && bp.translation) {
              lines.push(`  - ${bp.translation}`)
            }
          })
        } else {
          lines.push('_No bullet points yet_')
        }
      }

      return lines.join('\n')
    })
    .join('\n\n---\n\n')

  // Create and download file
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `subjects-${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
