/**
 * Airtable Automation: AI & LLM Field Enrichment Engine
 * 
 * Runs as a native Airtable Automation script action or external worker:
 * - Summarizes lengthy meeting transcripts, scope documents, or user feedback
 * - Extracts structured entities (action items, risks, sentiments, deadlines)
 * - Auto-assigns multi-select taxonomy tags
 * - Updates the record in place via Airtable SDK
 */

export interface AIEnrichmentResult {
  summary: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  tags: string[];
  actionItems: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class AIFieldEnrichmentEngine {
  /**
   * Deterministic entity and sentiment extractor for automated field enrichment
   */
  public static analyzeText(input: string): AIEnrichmentResult {
    const text = input.trim();
    if (!text) {
      return {
        summary: 'No content provided.',
        sentiment: 'NEUTRAL',
        tags: [],
        actionItems: [],
        riskLevel: 'LOW',
      };
    }

    const lower = text.toLowerCase();
    const hasRisk = lower.includes('block') || lower.includes('delay') || lower.includes('critical') || lower.includes('fail');
    const hasSuccess = lower.includes('deliver') || lower.includes('complete') || lower.includes('success') || lower.includes('approved');

    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (hasRisk && !hasSuccess) sentiment = 'NEGATIVE';
    else if (hasSuccess && !hasRisk) sentiment = 'POSITIVE';

    const tags: string[] = [];
    if (lower.includes('api') || lower.includes('backend')) tags.push('API / Backend');
    if (lower.includes('ui') || lower.includes('frontend') || lower.includes('design')) tags.push('UI / Frontend');
    if (lower.includes('security') || lower.includes('compliance')) tags.push('Security & Governance');
    if (lower.includes('database') || lower.includes('schema')) tags.push('Data Architecture');

    const actionItems: string[] = [];
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('TODO:') || trimmed.toLowerCase().includes('action:')) {
        actionItems.push(trimmed.replace(/^-\s*\[\s*\]\s*/, '').replace(/^TODO:\s*/i, ''));
      }
    }

    const sentences = text.split(/(?<=[.!?])\s+/);
    const summary = sentences.slice(0, 2).join(' ');

    return {
      summary,
      sentiment,
      tags,
      actionItems,
      riskLevel: hasRisk ? 'HIGH' : 'LOW',
    };
  }
}

/**
 * Airtable Native Automation Script step snippet:
 * Paste this directly into Airtable Automations -> Action "Run a script"
 */
export const AIRTABLE_AUTOMATION_SCRIPT_CODE = `
// 1. Fetch input configuration from Automation step
const inputConfig = input.config();
const recordId = inputConfig.recordId;
const rawNotes = inputConfig.rawNotes || "";

if (!recordId || !rawNotes) {
  console.log("No recordId or rawNotes provided. Exiting.");
} else {
  const table = base.getTable("Tasks & Deliverables");
  
  // Extract sentiment and tags
  const isHighRisk = rawNotes.toLowerCase().includes("block") || rawNotes.toLowerCase().includes("delay");
  const extractedSummary = rawNotes.split(". ").slice(0, 2).join(". ");
  
  await table.updateRecordAsync(recordId, {
    "Complexity": isHighRisk ? { name: "XL (> 1w)" } : { name: "M (1-2d)" },
    "Technical Notes": "[AI Summary]: " + extractedSummary + "\\n\\n[Original]:\\n" + rawNotes
  });
  
  console.log("Successfully enriched record " + recordId);
}
`;
