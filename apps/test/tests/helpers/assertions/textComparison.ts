/**
 * Text comparison utilities for validating transcription and translation results
 * 
 * These utilities normalize and compare text to account for variations in
 * transcription output while still validating accuracy.
 */

/**
 * Normalizes text for comparison by:
 * - Converting to lowercase
 * - Removing special characters and punctuation
 * - Collapsing multiple spaces to single space
 * - Trimming whitespace
 * 
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation and special characters
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Calculates the similarity ratio between two strings using character-level comparison
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity ratio between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  // Use Levenshtein distance for similarity
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    if (matrix[0]) {
      matrix[0][j] = j;
    }
  }

  // Fill matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const currentRow = matrix[i];
      const prevRow = matrix[i - 1];
      
      if (!currentRow || !prevRow) continue;
      
      if (str1[i - 1] === str2[j - 1]) {
        const value = prevRow[j - 1];
        if (value !== undefined) {
          currentRow[j] = value;
        }
      } else {
        const sub = prevRow[j - 1];
        const ins = currentRow[j - 1];
        const del = prevRow[j];
        
        if (sub !== undefined && ins !== undefined && del !== undefined) {
          currentRow[j] = Math.min(
            sub + 1, // substitution
            ins + 1, // insertion
            del + 1 // deletion
          );
        }
      }
    }
  }

  const lastRow = matrix[str1.length];
  const result = lastRow ? lastRow[str2.length] : undefined;
  
  return result ?? str2.length;
}

/**
 * Checks if transcription matches expected text within an acceptable similarity threshold
 * 
 * @param transcribed - The transcribed text
 * @param expected - The expected text
 * @param threshold - Minimum similarity ratio (default: 0.8)
 * @returns Object with match result and details
 */
export function validateTranscription(
  transcribed: string,
  expected: string,
  threshold = 0.8
): {
  matches: boolean;
  similarity: number;
  normalizedTranscribed: string;
  normalizedExpected: string;
  message: string;
} {
  const normalizedTranscribed = normalizeText(transcribed);
  const normalizedExpected = normalizeText(expected);
  const similarity = calculateSimilarity(transcribed, expected);
  const matches = similarity >= threshold;

  const message = matches
    ? `✓ Transcription matches (similarity: ${(similarity * 100).toFixed(1)}%)`
    : `✗ Transcription does not match (similarity: ${(similarity * 100).toFixed(1)}%, threshold: ${(threshold * 100).toFixed(1)}%)
       Expected: "${normalizedExpected}"
       Got:      "${normalizedTranscribed}"`;

  return {
    matches,
    similarity,
    normalizedTranscribed,
    normalizedExpected,
    message,
  };
}

/**
 * Checks if text contains specific keywords (useful for translation validation)
 * 
 * @param text - Text to check
 * @param keywords - Keywords to look for
 * @returns Whether all keywords are found
 */
export function containsKeywords(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.every((keyword) => normalized.includes(normalizeText(keyword)));
}
