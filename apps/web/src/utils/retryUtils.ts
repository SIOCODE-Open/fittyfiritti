/**
 * Retry utility for AI prompt execution
 *
 * Provides retry logic with exponential backoff for AI model prompts
 * to handle transient failures and JSON parsing errors.
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffMultiplier: 2,
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retry attempts fail
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | undefined
  let delay = opts.initialDelay

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === opts.maxAttempts) {
        // Last attempt failed, throw the error
        console.error(
          `[Retry] All ${opts.maxAttempts} attempts failed:`,
          lastError.message
        )
        throw lastError
      }

      // Log retry attempt
      console.warn(
        `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed: ${lastError.message}. Retrying in ${delay}ms...`
      )

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay))

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay)
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Retry failed with unknown error')
}

/**
 * Retry an AI prompt with JSON parsing
 *
 * This is a specialized version of retryWithBackoff that handles
 * the common pattern of prompting an AI model and parsing JSON.
 *
 * @param promptFn - Function that returns the AI response string
 * @param options - Retry configuration options
 * @returns The parsed JSON result
 * @throws Error if all attempts fail or JSON parsing consistently fails
 */
export async function retryAIPromptWithJSON<T>(
  promptFn: () => Promise<string>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(async () => {
    const response = await promptFn()

    try {
      return JSON.parse(response) as T
    } catch (parseError) {
      const error =
        parseError instanceof Error ? parseError : new Error(String(parseError))
      throw new Error(
        `JSON parsing failed: ${error.message}. Response: ${response.substring(0, 100)}...`
      )
    }
  }, options)
}
