import { describe, it, expect } from 'vitest';
import { HierarchyRollupEngine, HierarchyTaskNode } from '../src/automations/recursive-rollup-hierarchy.js';
import { FuzzyDeduplicationEngine } from '../src/automations/deduplication-fuzzy-match.js';
import { AIFieldEnrichmentEngine } from '../src/automations/ai-field-enrichment.js';

describe('HierarchyRollupEngine', () => {
  it('recursively calculates rollups from child tasks up to root', () => {
    const tasks: HierarchyTaskNode[] = [
      {
        id: 'task-root',
        name: 'Root Epic',
        estimatedHours: 50,
        actualHours: 10,
        status: 'In Progress',
        subtaskIds: ['task-child-1', 'task-child-2'],
      },
      {
        id: 'task-child-1',
        name: 'Subtask 1',
        estimatedHours: 20,
        actualHours: 20,
        status: 'Done',
        subtaskIds: [],
        parentTaskId: 'task-root',
      },
      {
        id: 'task-child-2',
        name: 'Subtask 2',
        estimatedHours: 30,
        actualHours: 15,
        status: 'In Progress',
        subtaskIds: [],
        parentTaskId: 'task-root',
      },
    ];

    const result = HierarchyRollupEngine.calculateRollups(tasks);
    const root = result.get('task-root');

    expect(root?.rollupHours).toBe(45); // 10 + 20 + 15
    expect(root?.weightedCompletion).toBe(20); // 20 / 100 * 100
  });
});

describe('FuzzyDeduplicationEngine', () => {
  it('calculates string similarity accurately', () => {
    const s1 = 'Acme Corporation B.V.';
    const s2 = 'Acme Corporation BV';
    const score = FuzzyDeduplicationEngine.similarityScore(s1, s2);
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it('detects duplicate records exceeding threshold', () => {
    const records = [
      { id: 'rec1', value: 'Philips Healthcare Solutions' },
      { id: 'rec2', value: 'Philips Healthcare Solution' },
      { id: 'rec3', value: 'Unrelated Company Ltd' },
    ];

    const dups = FuzzyDeduplicationEngine.findDuplicates(records, 0.85);
    expect(dups).toHaveLength(1);
    expect(dups[0].primaryRecordId).toBe('rec1');
    expect(dups[0].duplicateRecordId).toBe('rec2');
  });
});

describe('AIFieldEnrichmentEngine', () => {
  it('extracts risks, tags, and action items from text', () => {
    const text = `
      The API backend integration is blocked due to rate limits.
      - [ ] Implement token bucket queue
      - [ ] Schedule follow-up with security team
    `;

    const analysis = AIFieldEnrichmentEngine.analyzeText(text);
    expect(analysis.riskLevel).toBe('HIGH');
    expect(analysis.sentiment).toBe('NEGATIVE');
    expect(analysis.tags).toContain('API / Backend');
    expect(analysis.actionItems).toContain('Implement token bucket queue');
  });
});
