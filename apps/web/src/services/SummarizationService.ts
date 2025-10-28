import {
  checkSummarizerAvailability,
  createSummarizer,
  type Summarizer,
  type SummarizerOptions,
} from '@fittyfiritti/built-in-ai-api'

export class SummarizationService {
  private summarizer?: Summarizer
  private isInitialized = false

  async initialize(): Promise<void> {
    try {
      // Check if Summarizer API is available
      const isAvailable = await checkSummarizerAvailability()
      if (!isAvailable) {
        throw new Error(
          'Summarizer API is not available. Please ensure Chrome has the Summarizer API enabled.'
        )
      }

      console.log('📝 Summarization service initialized')
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize summarization service:', error)
      throw error
    }
  }

  async summarizeMeeting(
    transcriptions: string[],
    options?: SummarizerOptions
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Summarization service not initialized')
    }

    if (transcriptions.length === 0) {
      throw new Error('No transcriptions to summarize')
    }

    // Combine all transcriptions into a single text
    const fullText = transcriptions.join('\n\n')

    try {
      // Create summarizer with appropriate options for meeting summary
      const summarizerOptions: SummarizerOptions = {
        type: 'tldr',
        format: 'plain-text',
        length: 'long',
        sharedContext: 'This is a meeting transcription.',
        ...options,
      }

      this.summarizer = await createSummarizer(summarizerOptions)

      // Generate summary
      const summary = await this.summarizer.summarize(fullText, {
        context:
          'Summarize the key points and decisions from this meeting conversation. Do not add any commentary to your response. Your response MUST ONLY consist of the summary.',
      })

      return summary
    } catch (error) {
      console.error('Failed to summarize meeting:', error)
      throw error instanceof Error
        ? error
        : new Error('Failed to summarize meeting')
    } finally {
      if (this.summarizer) {
        this.summarizer.destroy()
        this.summarizer = undefined
      }
    }
  }

  async summarizeMeetingStreaming(
    transcriptions: string[],
    options?: SummarizerOptions
  ): Promise<ReadableStream<string>> {
    if (!this.isInitialized) {
      throw new Error('Summarization service not initialized')
    }

    if (transcriptions.length === 0) {
      throw new Error('No transcriptions to summarize')
    }

    // Combine all transcriptions into a single text
    const fullText = transcriptions.join('\n\n')

    try {
      // Create summarizer with appropriate options for meeting summary
      const summarizerOptions: SummarizerOptions = {
        type: 'tldr',
        format: 'plain-text',
        length: 'long',
        sharedContext: 'This is a meeting transcription.',
        ...options,
      }

      this.summarizer = await createSummarizer(summarizerOptions)

      // Generate streaming summary
      const stream = this.summarizer.summarizeStreaming(fullText, {
        context:
          'Summarize the key points and decisions from this meeting conversation. Do not add any commentary to your response. Your response MUST ONLY consist of the summary.',
      })

      // Wrap the stream to ensure cleanup
      return new ReadableStream({
        start: async controller => {
          const reader = stream.getReader()

          try {
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                controller.close()
                break
              }

              controller.enqueue(value)
            }
          } catch (error) {
            controller.error(error)
          } finally {
            if (this.summarizer) {
              this.summarizer.destroy()
              this.summarizer = undefined
            }
          }
        },
        cancel: () => {
          if (this.summarizer) {
            this.summarizer.destroy()
            this.summarizer = undefined
          }
        },
      })
    } catch (error) {
      if (this.summarizer) {
        this.summarizer.destroy()
        this.summarizer = undefined
      }

      console.error('Failed to start streaming summarization:', error)
      throw error instanceof Error
        ? error
        : new Error('Failed to start streaming summarization')
    }
  }

  destroy(): void {
    if (this.summarizer) {
      this.summarizer.destroy()
      this.summarizer = undefined
    }

    this.isInitialized = false
  }
}
