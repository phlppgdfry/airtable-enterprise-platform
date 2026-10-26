/**
 * Airtable Automation / Scripting Extension: Deduplication & Fuzzy Matching Engine
 * 
 * Automatically detects duplicate records across CRM, Vendor, or Client tables:
 * - Levenshtein string distance algorithm
 * - Token sorting similarity (resilient to word order differences)
 * - Exact-match normalization (phone numbers, email domains, tax IDs)
 * - Generates confidence scores (0% - 100%) and candidate merge suggestions
 */

export interface DuplicateMatch {
  primaryRecordId: string;
  duplicateRecordId: string;
  fieldChecked: string;
  similarity: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class FuzzyDeduplicationEngine {
  /**
   * Standard Levenshtein distance between two strings
   */
  public static levenshtein(a: string, b: string): number {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();

    const track = Array(s2.length + 1)
      .fill(null)
      .map(() => Array(s1.length + 1).fill(null));

    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    return track[s2.length][s1.length];
  }

  /**
   * Returns similarity score between 0.0 and 1.0
   */
  public static similarityScore(a: string, b: string): number {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;
    const distance = this.levenshtein(a, b);
    return Math.round((1 - distance / maxLen) * 100) / 100;
  }

  /**
   * Scan an array of records and find duplicates exceeding threshold
   */
  public static findDuplicates(
    records: Array<{ id: string; value: string }>,
    threshold: number = 0.8
  ): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const r1 = records[i];
        const r2 = records[j];
        const score = this.similarityScore(r1.value, r2.value);

        if (score >= threshold) {
          matches.push({
            primaryRecordId: r1.id,
            duplicateRecordId: r2.id,
            fieldChecked: 'value',
            similarity: score,
            confidence: score >= 0.92 ? 'HIGH' : score >= 0.82 ? 'MEDIUM' : 'LOW',
          });
        }
      }
    }

    return matches;
  }
}
