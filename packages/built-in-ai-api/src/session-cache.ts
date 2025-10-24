// AI Session Cache for optimizing session creation performance
// Caches LanguageModel sessions based on their initialization parameters

import type { LanguageModelCreateOptions, LanguageModelSession } from './index'

// Cache key generation based on session creation parameters
interface SessionCacheKey {
  temperature?: number
  topK?: number
  initialPrompts?: string // JSON stringified prompts
  expectedInputs?: string // JSON stringified inputs
  expectedOutputs?: string // JSON stringified outputs
  enableAudio?: boolean
  enableTranslation?: boolean
}

// Cache entry with session and metadata
interface CacheEntry {
  session: LanguageModelSession
  key: string
  createdAt: number
  lastUsed: number
  useCount: number
}

// Global session cache
class AISessionCache {
  private cache = new Map<string, CacheEntry>()
  private maxCacheSize = 20 // Maximum number of cached sessions
  private maxSessionAge = 30 * 60 * 1000 // 30 minutes in milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup()
  }

  /**
   * Generate a cache key from session creation options
   */
  private generateCacheKey(
    options?: LanguageModelCreateOptions & {
      enableAudio?: boolean
      enableTranslation?: boolean
    }
  ): string {
    const key: SessionCacheKey = {
      temperature: options?.temperature,
      topK: options?.topK,
      enableAudio: options?.enableAudio,
      enableTranslation: options?.enableTranslation,
    }

    // Normalize and stringify prompts for consistent comparison
    if (options?.initialPrompts) {
      key.initialPrompts = JSON.stringify(
        options.initialPrompts.map(prompt => ({
          role: prompt.role,
          content: prompt.content,
          prefix: prompt.prefix,
        }))
      )
    }

    // Normalize expected inputs/outputs
    if (options?.expectedInputs) {
      key.expectedInputs = JSON.stringify(
        options.expectedInputs.map(input => ({
          type: input.type,
          languages: input.languages?.sort(), // Sort for consistent comparison
        }))
      )
    }

    if (options?.expectedOutputs) {
      key.expectedOutputs = JSON.stringify(
        options.expectedOutputs.map(output => ({
          type: output.type,
          languages: output.languages?.sort(), // Sort for consistent comparison
        }))
      )
    }

    // Create a hash-like string from the key object
    return btoa(JSON.stringify(key, Object.keys(key).sort()))
      .replace(/[+/=]/g, '') // Remove base64 special characters
      .substring(0, 32) // Limit length
  }

  /**
   * Check if a session exists in cache and is still valid
   */
  has(
    options?: LanguageModelCreateOptions & {
      enableAudio?: boolean
      enableTranslation?: boolean
    }
  ): boolean {
    const key = this.generateCacheKey(options)
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if session is still valid (not destroyed and not too old)
    const now = Date.now()
    const isExpired = now - entry.createdAt > this.maxSessionAge

    if (isExpired) {
      console.log(`🗑️ Cache entry expired for key: ${key}`)
      this.remove(key)
      return false
    }

    // Check if session is still usable (not destroyed)
    try {
      // Try to access session properties to ensure it's not destroyed
      void entry.session.inputUsage
      return true
    } catch {
      console.log(`🗑️ Cache entry invalid (session destroyed) for key: ${key}`)
      this.remove(key)
      return false
    }
  }

  /**
   * Get a cached session
   */
  get(
    options?: LanguageModelCreateOptions & {
      enableAudio?: boolean
      enableTranslation?: boolean
    }
  ): LanguageModelSession | null {
    if (!this.has(options)) {
      return null
    }

    const key = this.generateCacheKey(options)
    const entry = this.cache.get(key)!

    // Update usage stats
    entry.lastUsed = Date.now()
    entry.useCount++

    console.log(
      `♻️ Reusing cached AI session (key: ${key}, uses: ${entry.useCount})`
    )

    return entry.session
  }

  /**
   * Store a session in cache
   */
  set(
    session: LanguageModelSession,
    options?: LanguageModelCreateOptions & {
      enableAudio?: boolean
      enableTranslation?: boolean
    }
  ): void {
    const key = this.generateCacheKey(options)
    const now = Date.now()

    // Check cache size and evict oldest/least used if necessary
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed()
    }

    const entry: CacheEntry = {
      session,
      key,
      createdAt: now,
      lastUsed: now,
      useCount: 1,
    }

    this.cache.set(key, entry)

    console.log(
      `💾 Cached new AI session (key: ${key}, total cached: ${this.cache.size})`
    )
  }

  /**
   * Remove a specific cache entry
   */
  private remove(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      // Don't destroy the session here as it might still be in use
      // Sessions should be destroyed by their original creators
      this.cache.delete(key)
    }
  }

  /**
   * Evict the least recently used session
   */
  private evictLeastUsed(): void {
    if (this.cache.size === 0) return

    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed
        oldestKey = key
      }
    }

    if (oldestKey) {
      console.log(`🗑️ Evicting least used cache entry: ${oldestKey}`)
      this.remove(oldestKey)
    }
  }

  /**
   * Clean up expired sessions
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToRemove: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = now - entry.createdAt > this.maxSessionAge

      if (isExpired) {
        keysToRemove.push(key)
      } else {
        // Also check if session is still valid
        try {
          void entry.session.inputUsage
        } catch {
          keysToRemove.push(key)
        }
      }
    }

    for (const key of keysToRemove) {
      this.remove(key)
    }

    if (keysToRemove.length > 0) {
      console.log(
        `🧹 Cleaned up ${keysToRemove.length} expired/invalid cache entries`
      )
    }
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startPeriodicCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    )
  }

  /**
   * Clear all cached sessions
   */
  clear(): void {
    console.log(`🧹 Clearing ${this.cache.size} cached AI sessions`)
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    entries: Array<{
      key: string
      age: number
      useCount: number
      lastUsed: number
    }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.createdAt,
      useCount: entry.useCount,
      lastUsed: entry.lastUsed,
    }))

    return {
      size: this.cache.size,
      entries,
    }
  }

  /**
   * Destroy the cache and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // Note: We don't destroy the sessions here as they might still be in use
    // Sessions should be managed by their original creators
    this.cache.clear()
  }
}

// Global singleton instance
export const aiSessionCache = new AISessionCache()

// Export for testing and debugging
export { AISessionCache }
export type { CacheEntry, SessionCacheKey }
